/**
 * Codex — общий справочник Третьего Горизонта.
 *
 * Отдельная страница, доступная и ведущему, и игрокам. Объединяет встроенный
 * каталог из корбука (`BUILTIN_CODEX`) с пользовательскими записями из
 * `CodexRepository` в один поисковый список. Поддерживает фильтрацию по типу,
 * подгруппе, уровню технологии и лицензии, полнотекстовый поиск и добавление
 * записей любого из шести типов. Пользовательские записи можно удалять.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodexRepository } from "../../data";
import {
  BUILTIN_CODEX,
  CATEGORY_LABELS,
  CODEX_CATEGORIES,
  TECH_LABELS,
  countByCategory,
  groupsForCategory,
  searchCodex,
  type CodexCategory,
  type CodexEntry,
  type CodexStat,
  type TechLevel,
} from "../../domain/coriolis";
import { Badge, Button, Card, Dialog, Input, Select, Tag, Textarea } from "../../design-system";
import "./Codex.css";

export interface CodexProps {
  codex: CodexRepository;
}

const TECH_LEVELS: readonly TechLevel[] = ["А", "С", "П", "З"];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `custom:${crypto.randomUUID()}`;
  return `custom:${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function Codex({ codex }: CodexProps) {
  const [custom, setCustom] = useState<CodexEntry[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<CodexCategory | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [tech, setTech] = useState<TechLevel | null>(null);
  const [licensedOnly, setLicensedOnly] = useState(false);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    setCustom(await codex.list());
  }, [codex]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Встроенные + пользовательские записи в одном каталоге.
  const all = useMemo<CodexEntry[]>(() => [...BUILTIN_CODEX, ...custom], [custom]);
  const counts = useMemo(() => countByCategory(all), [all]);

  // Список подгрупп меняется вместе с выбранным типом.
  const groups = useMemo(
    () => (category ? groupsForCategory(all, category) : []),
    [all, category],
  );

  const results = useMemo(
    () => searchCodex(all, { text, category, group, tech, licensedOnly }),
    [all, text, category, group, tech, licensedOnly],
  );

  const selectCategory = (c: CodexCategory | null) => {
    setCategory(c);
    setGroup(null); // подгруппы относятся к конкретному типу
  };

  const handleSave = async (entry: CodexEntry) => {
    await codex.save(entry);
    await refresh();
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await codex.delete(id);
    await refresh();
  };

  return (
    <div className="cdx">
      <header className="cdx__head">
        <div>
          <span className="crl-eyebrow">Справочник · الفهرس</span>
          <h2 className="cdx__title crl-title">Кодекс</h2>
          <p className="cdx__sub crl-flavor">
            Оружие, броня, взрывчатка, снаряжение, достоинства, мистические силы и корабли Третьего Горизонта.
          </p>
        </div>
        <Button onClick={() => setAdding(true)} iconLeft="＋">
          Добавить запись
        </Button>
      </header>

      {/* Вкладки типов */}
      <div className="cdx__tabs" role="tablist" aria-label="Типы записей">
        <button
          type="button"
          role="tab"
          aria-selected={category === null}
          className={`cdx__tab${category === null ? " cdx__tab--active" : ""}`}
          onClick={() => selectCategory(null)}
        >
          Все <span className="cdx__tab-count">{all.length}</span>
        </button>
        {CODEX_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            className={`cdx__tab${category === c ? " cdx__tab--active" : ""}`}
            onClick={() => selectCategory(c)}
          >
            <span aria-hidden>{CATEGORY_LABELS[c].icon}</span> {CATEGORY_LABELS[c].many}{" "}
            <span className="cdx__tab-count">{counts[c]}</span>
          </button>
        ))}
      </div>

      {/* Поиск и фильтры */}
      <div className="cdx__filters">
        <Input
          iconLeft="🔍"
          placeholder="Поиск по названию, описанию, свойствам…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          wrapStyle={{ flex: "2 1 240px" }}
        />
        {category && groups.length > 0 && (
          <Select
            aria-label="Подгруппа"
            value={group ?? ""}
            onChange={(e) => setGroup(e.target.value || null)}
            wrapStyle={{ flex: "1 1 160px" }}
          >
            <option value="">Все группы</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        )}
        <Select
          aria-label="Уровень технологии"
          value={tech ?? ""}
          onChange={(e) => setTech((e.target.value || null) as TechLevel | null)}
          wrapStyle={{ flex: "1 1 150px" }}
        >
          <option value="">Любой уровень</option>
          {TECH_LEVELS.map((t) => (
            <option key={t} value={t}>
              {TECH_LABELS[t]} ({t})
            </option>
          ))}
        </Select>
        <label className="cdx__check">
          <input
            type="checkbox"
            checked={licensedOnly}
            onChange={(e) => setLicensedOnly(e.target.checked)}
          />
          Только по лицензии
        </label>
      </div>

      <p className="cdx__count">
        Найдено записей: {results.length}
        {(text || category || group || tech || licensedOnly) && (
          <button
            type="button"
            className="cdx__reset"
            onClick={() => {
              setText("");
              selectCategory(null);
              setTech(null);
              setLicensedOnly(false);
            }}
          >
            Сбросить фильтры
          </button>
        )}
      </p>

      {results.length === 0 ? (
        <p className="cdx__empty">Ничего не найдено. Измени запрос или добавь свою запись.</p>
      ) : (
        <ul className="cdx__grid">
          {results.map((e) => (
            <li key={e.id}>
              <CodexCard entry={e} onDelete={e.custom ? () => handleDelete(e.id) : undefined} />
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <AddEntryDialog open={adding} onClose={() => setAdding(false)} onSave={handleSave} />
      )}
    </div>
  );
}

// ── Карточка записи ──────────────────────────────────────────────────────────

function CodexCard({ entry, onDelete }: { entry: CodexEntry; onDelete?: () => void }) {
  const cat = CATEGORY_LABELS[entry.category];
  return (
    <Card>
      <div className="cdx__card-head">
        <div className="cdx__card-titles">
          <span className="cdx__card-cat" aria-hidden>
            {cat.icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="cdx__card-name">{entry.name}</div>
            {entry.group && <div className="cdx__card-group">{entry.group}</div>}
          </div>
        </div>
        <div className="cdx__card-badges">
          {entry.tech && <Badge tone="neutral">{entry.tech}</Badge>}
          {entry.licensed && (
            <Badge tone="warning" title="Требуется лицензия">
              Лицензия
            </Badge>
          )}
          {entry.custom && <Badge tone="info">Своя</Badge>}
        </div>
      </div>

      {entry.stats && entry.stats.length > 0 && (
        <div className="cdx__stats">
          {entry.stats.map((s, i) => (
            <div key={i} className="cdx__stat">
              <span className="cdx__stat-label">{s.label}</span>
              <span className="cdx__stat-value">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <p className="cdx__card-summary">{entry.summary}</p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="cdx__tags">
          {entry.tags.map((t, i) => (
            <Tag key={i}>{t}</Tag>
          ))}
        </div>
      )}

      <div className="cdx__card-foot">
        <div className="cdx__card-meta">
          {entry.price != null && entry.price !== "" && (
            <span className="cdx__price">{entry.price} б.</span>
          )}
          {entry.weight && <span className="cdx__weight">{entry.weight}</span>}
        </div>
        {onDelete && (
          <button
            type="button"
            className="cdx__delete"
            onClick={onDelete}
            aria-label={`Удалить запись «${entry.name}»`}
          >
            Удалить
          </button>
        )}
      </div>
    </Card>
  );
}

// ── Диалог добавления записи ─────────────────────────────────────────────────

interface DraftStat {
  label: string;
  value: string;
}

function AddEntryDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (entry: CodexEntry) => void | Promise<void>;
}) {
  const [category, setCategory] = useState<CodexCategory>("gear");
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [summary, setSummary] = useState("");
  const [tech, setTech] = useState<TechLevel | "">("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [licensed, setLicensed] = useState(false);
  const [tagsText, setTagsText] = useState("");
  const [stats, setStats] = useState<DraftStat[]>([{ label: "", value: "" }]);

  const canSave = name.trim() !== "" && summary.trim() !== "";

  const submit = () => {
    if (!canSave) return;
    const cleanStats: CodexStat[] = stats
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label || s.value);
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const entry: CodexEntry = {
      id: newId(),
      category,
      name: name.trim(),
      group: group.trim() || undefined,
      summary: summary.trim(),
      stats: cleanStats.length ? cleanStats : undefined,
      tags: tags.length ? tags : undefined,
      tech: tech || undefined,
      price: price.trim() || undefined,
      weight: weight.trim() || undefined,
      licensed: licensed || undefined,
      custom: true,
    };
    void onSave(entry);
  };

  const setStat = (i: number, patch: Partial<DraftStat>) =>
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Кодекс"
      title="Новая запись"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={!canSave}>
            Сохранить
          </Button>
        </>
      }
    >
      <div className="cdx__form">
        <div className="cdx__form-row">
          <Select
            label="Тип"
            value={category}
            onChange={(e) => setCategory(e.target.value as CodexCategory)}
            wrapStyle={{ flex: "1 1 200px" }}
          >
            {CODEX_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].one}
              </option>
            ))}
          </Select>
          <Input
            label="Группа (необязательно)"
            placeholder="Напр. Пистолеты"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            wrapStyle={{ flex: "1 1 200px" }}
          />
        </div>

        <Input
          label="Название"
          placeholder="Название записи"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Описание"
          placeholder="Что это и как работает"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
        />

        <div className="cdx__form-row">
          <Select
            label="Уровень технологии"
            value={tech}
            onChange={(e) => setTech(e.target.value as TechLevel | "")}
            wrapStyle={{ flex: "1 1 160px" }}
          >
            <option value="">—</option>
            {TECH_LEVELS.map((t) => (
              <option key={t} value={t}>
                {TECH_LABELS[t]} ({t})
              </option>
            ))}
          </Select>
          <Input
            label="Цена, бирры"
            placeholder="Напр. 500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            wrapStyle={{ flex: "1 1 120px" }}
          />
          <Input
            label="Вес / нагрузка"
            placeholder="Напр. Лёгкий"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            wrapStyle={{ flex: "1 1 140px" }}
          />
        </div>

        {/* Характеристики (label/value) */}
        <div className="cdx__form-block">
          <div className="cdx__form-block-label">Характеристики</div>
          {stats.map((s, i) => (
            <div key={i} className="cdx__stat-row">
              <Input
                placeholder="Название (напр. Урон)"
                value={s.label}
                onChange={(e) => setStat(i, { label: e.target.value })}
                wrapStyle={{ flex: "1 1 140px" }}
              />
              <Input
                placeholder="Значение (напр. 2)"
                value={s.value}
                onChange={(e) => setStat(i, { value: e.target.value })}
                wrapStyle={{ flex: "1 1 100px" }}
              />
              <button
                type="button"
                className="cdx__stat-remove"
                aria-label="Убрать характеристику"
                onClick={() => setStats((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStats((prev) => [...prev, { label: "", value: "" }])}
          >
            ＋ Ещё характеристика
          </Button>
        </div>

        <Input
          label="Метки (через запятую)"
          placeholder="Напр. Лёгкое, Бесшумное"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />

        <label className="cdx__check">
          <input type="checkbox" checked={licensed} onChange={(e) => setLicensed(e.target.checked)} />
          Требуется лицензия
        </label>
      </div>
    </Dialog>
  );
}

export default Codex;
