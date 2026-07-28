/**
 * ShipBuilder — пошаговый конструктор корабля «Кориолиса» (ST3001, гл. 7).
 *
 * Шаги: класс → верфь → модули → усовершенствования → орудия → проблема →
 * экипаж → итог. Живая панель `assessShip` показывает характеристики, занятые
 * отсеки, полную цену и долг с проверкой правил. Модули, усовершенствования,
 * орудия и изъяны выбираются ПОИСКОМ ПО КОДЕКСУ: результат ссылается на запись
 * кодекса (`codexId`), а числовые данные берутся из структурных таблиц
 * `codexShips.ts`. Можно стартовать с готового типа и донастроить.
 */

import { useMemo, useState } from "react";
import {
  assessShip,
  createBlankShip,
  searchCodex,
  SHIP_CLASSES,
  SHIP_FLAWS,
  SHIP_MODULES,
  SHIP_TYPES,
  SHIP_UPGRADES,
  SHIP_WEAPONS_DATA,
  SHIPYARDS,
  type CodexEntry,
  type Ship,
  type ShipModule,
  type ShipUpgrade,
  type ShipWeapon,
} from "../../domain/coriolis";
import type { ShipRepository } from "../../data";
import { Badge, Button, Card, Input, Select, Textarea } from "../../design-system";

export interface ShipBuilderProps {
  repository: ShipRepository;
  campaignId: string;
  /** Все записи кодекса категории «Корабль» (встроенные + пользовательские). */
  shipCodex: CodexEntry[];
  createdBy?: string;
  onBack: () => void;
  onSaved: (ship: Ship) => void;
}

const STEPS = ["Класс", "Верфь", "Модули", "Усовершенствования", "Орудия", "Проблема", "Экипаж", "Итог"] as const;

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ship-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function parseMoney(price?: string): number {
  if (!price) return 0;
  const digits = price.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// ── Преобразование записи кодекса в элемент сборки (данные из таблиц по codexId) ─

function toModule(entry: CodexEntry): ShipModule {
  const def = SHIP_MODULES.find((m) => m.codexId === entry.id);
  if (def) {
    return { codexId: def.codexId, name: def.name, slots: def.slots ?? 1, price: def.price ?? 0, builtIn: def.builtIn };
  }
  return { codexId: entry.id, name: entry.name, slots: 1, price: parseMoney(entry.price) };
}

function toUpgrade(entry: CodexEntry): ShipUpgrade {
  const def = SHIP_UPGRADES.find((u) => u.codexId === entry.id);
  if (def) return { codexId: def.codexId, name: def.name, costPercent: def.costPercent, mods: def.mods };
  const pct = parseInt((entry.stats?.find((s) => /стоимост/i.test(s.label))?.value ?? "0").replace(/[^\d]/g, ""), 10);
  return { codexId: entry.id, name: entry.name, costPercent: Number.isFinite(pct) ? pct : 0 };
}

function toWeapon(entry: CodexEntry): ShipWeapon {
  const def = SHIP_WEAPONS_DATA.find((w) => w.codexId === entry.id);
  if (def) {
    return { codexId: def.codexId, name: def.name, bonus: def.bonus, damage: def.damage, crit: def.crit, range: def.range, notes: def.features, price: def.price ?? 0 };
  }
  const get = (re: RegExp) => entry.stats?.find((s) => re.test(s.label))?.value ?? "—";
  return { codexId: entry.id, name: entry.name, bonus: get(/мод/i), damage: get(/урон/i), crit: get(/порог/i), range: get(/дистан/i), price: parseMoney(entry.price) };
}

/** Поиск по кодексу внутри одной группы; выбор добавляет элемент. */
function CodexPicker({
  entries,
  group,
  placeholder,
  onPick,
}: {
  entries: CodexEntry[];
  group: string | string[];
  placeholder: string;
  onPick: (entry: CodexEntry) => void;
}) {
  const [text, setText] = useState("");
  const groups = Array.isArray(group) ? group : [group];
  const pool = useMemo(() => entries.filter((e) => e.group && groups.includes(e.group)), [entries, groups]);
  const results = useMemo(() => searchCodex(pool, { text }).slice(0, 40), [pool, text]);

  return (
    <div className="shb__picker">
      <Input iconLeft="🔍" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
      <ul className="shb__picker-list">
        {results.map((e) => (
          <li key={e.id}>
            <button type="button" className="shb__picker-item" onClick={() => onPick(e)}>
              <span className="shb__picker-name">{e.name}</span>
              <span className="shb__picker-meta">
                {e.price ? `${e.price} б.` : ""} {e.licensed ? "· лиц." : ""}
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="shb__picker-empty">Ничего не найдено</li>}
      </ul>
    </div>
  );
}

export function ShipBuilder({ repository, campaignId, shipCodex, createdBy, onBack, onSaved }: ShipBuilderProps) {
  const [ship, setShip] = useState<Ship>(() => createBlankShip(newId(), campaignId, createdBy));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const a = useMemo(() => assessShip(ship), [ship]);

  const patch = (p: Partial<Ship>) => setShip((s) => ({ ...s, ...p }));

  const startFromType = (typeName: string) => {
    const t = SHIP_TYPES.find((x) => x.name === typeName);
    if (!t) return;
    patch({ classId: t.cls, typeName: t.name, name: ship.name || t.name });
  };

  const addModule = (entry: CodexEntry) => patch({ modules: [...ship.modules, toModule(entry)] });
  const removeModule = (i: number) =>
    patch({ modules: ship.modules.filter((_, idx) => idx !== i) });
  const addUpgrade = (entry: CodexEntry) => {
    const up = toUpgrade(entry);
    const def = SHIP_UPGRADES.find((u) => u.codexId === up.codexId);
    const count = ship.upgrades.filter((u) => u.codexId === up.codexId).length;
    if (def?.maxCount && count >= def.maxCount) return;
    patch({ upgrades: [...ship.upgrades, up] });
  };
  const removeUpgrade = (i: number) => patch({ upgrades: ship.upgrades.filter((_, idx) => idx !== i) });
  const addWeapon = (entry: CodexEntry) => patch({ weapons: [...ship.weapons, toWeapon(entry)] });
  const removeWeapon = (i: number) => patch({ weapons: ship.weapons.filter((_, idx) => idx !== i) });

  const canSave = ship.classId !== "" && ship.name.trim() !== "";

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const finalShip: Ship = { ...ship, name: ship.name.trim(), createdAt: Date.now(), archived: false };
    await repository.save(finalShip);
    setSaving(false);
    onSaved(finalShip);
  };

  return (
    <div className="shb">
      <div className="shb__crumbs">
        <Button variant="ghost" size="sm" onClick={onBack}>← Назад</Button>
        <span className="shb__title crl-title">Сборка корабля</span>
      </div>

      <div className="shb__layout">
        <div className="shb__main">
          <nav className="shb__steps" aria-label="Шаги">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`shb__step${i === step ? " shb__step--active" : ""}`}
                onClick={() => setStep(i)}
              >
                <span className="shb__step-n">{i + 1}</span> {s}
              </button>
            ))}
          </nav>

          <Card className="shb__panel">
            {step === 0 && (
              <>
                <h3 className="shb__h">Класс корабля</h3>
                <p className="shb__hint">Класс задаёт базовые характеристики, число отсеков и цену.</p>
                <div className="shb__classes">
                  {SHIP_CLASSES.map((c) => (
                    <button
                      key={c.cls}
                      type="button"
                      className={`shb__class${ship.classId === c.cls ? " shb__class--active" : ""}`}
                      onClick={() => patch({ classId: c.cls })}
                    >
                      <span className="shb__class-name">{c.cls} класс</span>
                      <span className="shb__class-meta">
                        энергия {c.energy} · прочн. {c.hull} · отсеков {c.slots}
                      </span>
                      <span className="shb__class-price">{money(c.price)} б.</span>
                    </button>
                  ))}
                </div>
                <div className="shb__field">
                  <Select
                    label="Или начать с готового типа"
                    value={ship.typeName ?? ""}
                    onChange={(e) => startFromType(e.target.value)}
                  >
                    <option value="">— своя сборка —</option>
                    {SHIP_TYPES.map((t) => (
                      <option key={t.name} value={t.name}>{t.name} ({t.cls})</option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="shb__h">Верфь</h3>
                <p className="shb__hint">Верфь меняет характеристики и базовую цену. Необязательно.</p>
                <div className="shb__yards">
                  <button
                    type="button"
                    className={`shb__yard${!ship.shipyardId ? " shb__yard--active" : ""}`}
                    onClick={() => patch({ shipyardId: undefined })}
                  >
                    Без верфи
                  </button>
                  {SHIPYARDS.map((y) => (
                    <button
                      key={y.codexId}
                      type="button"
                      className={`shb__yard${ship.shipyardId === y.codexId ? " shb__yard--active" : ""}`}
                      onClick={() => patch({ shipyardId: y.codexId })}
                    >
                      <span className="shb__yard-name">{y.name}</span>
                      <span className="shb__yard-meta">{y.summary}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="shb__h">Модули <span className="shb__count">{a.slotsUsed} / {a.slotsTotal} отсеков</span></h3>
                <ul className="shb__chosen">
                  {ship.modules.map((m, i) => (
                    <li key={i}>
                      <span>{m.name} {m.builtIn ? <Badge tone="neutral">встроен</Badge> : <span className="shb__chosen-meta">{m.slots} отс. · {money(m.price)} б.</span>}</span>
                      {!m.builtIn && <button type="button" className="shb__remove" onClick={() => removeModule(i)}>×</button>}
                    </li>
                  ))}
                </ul>
                <CodexPicker entries={shipCodex} group="Корабль · Модули" placeholder="Найти модуль…" onPick={addModule} />
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="shb__h">Усовершенствования</h3>
                <ul className="shb__chosen">
                  {ship.upgrades.map((u, i) => (
                    <li key={i}>
                      <span>{u.name} <span className="shb__chosen-meta">{u.costPercent}% цены{u.mod ? ` · ${u.mod}` : ""}</span></span>
                      <button type="button" className="shb__remove" onClick={() => removeUpgrade(i)}>×</button>
                    </li>
                  ))}
                  {ship.upgrades.length === 0 && <li className="shb__chosen-empty">Пока нет</li>}
                </ul>
                <CodexPicker entries={shipCodex} group="Корабль · Достоинства" placeholder="Найти усовершенствование…" onPick={addUpgrade} />
              </>
            )}

            {step === 4 && (
              <>
                <h3 className="shb__h">Орудия <span className="shb__count">каждое занимает 1 отсек</span></h3>
                <ul className="shb__chosen">
                  {ship.weapons.map((w, i) => (
                    <li key={i}>
                      <span>{w.name} <span className="shb__chosen-meta">урон {w.damage} · порог {w.crit} · {money(w.price)} б.</span></span>
                      <button type="button" className="shb__remove" onClick={() => removeWeapon(i)}>×</button>
                    </li>
                  ))}
                  {ship.weapons.length === 0 && <li className="shb__chosen-empty">Пока нет</li>}
                </ul>
                <CodexPicker entries={shipCodex} group={["Корабль · Орудия", "Корабль · Торпеды и мины"]} placeholder="Найти орудие или торпеду…" onPick={addWeapon} />
              </>
            )}

            {step === 5 && (
              <>
                <h3 className="shb__h">Проблема (изъян)</h3>
                <p className="shb__hint">У корабля обычно один изъян. Необязательно.</p>
                <div className="shb__flaws">
                  <button
                    type="button"
                    className={`shb__flaw${!ship.problem ? " shb__flaw--active" : ""}`}
                    onClick={() => patch({ problem: undefined })}
                  >
                    Без изъяна
                  </button>
                  {SHIP_FLAWS.map((f) => (
                    <button
                      key={f.codexId}
                      type="button"
                      className={`shb__flaw${ship.problem?.codexId === f.codexId ? " shb__flaw--active" : ""}`}
                      onClick={() => patch({ problem: { codexId: f.codexId, name: f.name, summary: f.summary } })}
                    >
                      <span className="shb__flaw-name">{f.name}</span>
                      <span className="shb__flaw-meta">{f.summary}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <h3 className="shb__h">Экипаж и название</h3>
                <div className="shb__field">
                  <Input label="Название корабля" value={ship.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Напр. «Северный ветер»" />
                </div>
                <div className="shb__crew-grid">
                  <Input label="Капитан" value={ship.crew.captain ?? ""} onChange={(e) => patch({ crew: { ...ship.crew, captain: e.target.value } })} />
                  <Input label="Пилот" value={ship.crew.pilot ?? ""} onChange={(e) => patch({ crew: { ...ship.crew, pilot: e.target.value } })} />
                  <Input label="Штурман-оператор" value={ship.crew.sensorOp ?? ""} onChange={(e) => patch({ crew: { ...ship.crew, sensorOp: e.target.value } })} />
                  <Input label="Бортстрелок" value={ship.crew.gunner ?? ""} onChange={(e) => patch({ crew: { ...ship.crew, gunner: e.target.value } })} />
                  <Input label="Бортинженер" value={ship.crew.engineer ?? ""} onChange={(e) => patch({ crew: { ...ship.crew, engineer: e.target.value } })} />
                </div>
                <div className="shb__field">
                  <Textarea label="Груз, оборудование и снаряжение" rows={2} value={ship.cargo ?? ""} onChange={(e) => patch({ cargo: e.target.value })} />
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <h3 className="shb__h">Итог</h3>
                <p className="shb__hint">Проверьте сборку. Долг по умолчанию равен полной цене корабля.</p>
                <div className="shb__field">
                  <Input
                    label="Долг (бирры) — можно скорректировать"
                    type="number"
                    value={ship.debtOverride ?? a.totalPrice}
                    onChange={(e) => {
                      const v = e.target.value;
                      patch({ debtOverride: v === "" ? undefined : Number(v) });
                    }}
                  />
                </div>
                {!canSave && <p className="shb__warn">Укажите класс и название корабля, чтобы сохранить.</p>}
                <Button onClick={handleSave} disabled={!canSave || saving}>
                  {saving ? "Сохранение…" : "Создать корабль"}
                </Button>
              </>
            )}

            <div className="shb__nav">
              <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                ← Назад
              </Button>
              <Button variant="ghost" size="sm" disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Далее →
              </Button>
            </div>
          </Card>
        </div>

        {/* Живая панель ассесмента */}
        <aside className="shb__assess">
          <Card variant="gilt">
            <h4 className="shb__assess-h">Ассесмент сборки</h4>
            <div className="shb__assess-stats">
              <div><span>Манёвр.</span><b>{sign(a.stats.maneuver)}</b></div>
              <div><span>Заметность</span><b>{sign(a.stats.signature)}</b></div>
              <div><span>Скорость</span><b>{a.stats.speed}</b></div>
              <div><span>Броня</span><b>{a.stats.armor}</b></div>
              <div><span>Энергия</span><b>{a.stats.energy}</b></div>
              <div><span>Прочность</span><b>{a.stats.hull}</b></div>
            </div>
            <div className="shb__assess-line">
              <span>Отсеки</span>
              <b className={a.slotsUsed > a.slotsTotal ? "shb__over" : ""}>{a.slotsUsed} / {a.slotsTotal}</b>
            </div>
            <div className="shb__assess-line"><span>Базовая цена</span><b>{money(a.basePrice)} б.</b></div>
            <div className="shb__assess-line"><span>Модули</span><b>{money(a.modulesPrice)} б.</b></div>
            <div className="shb__assess-line"><span>Орудия</span><b>{money(a.weaponsPrice)} б.</b></div>
            <div className="shb__assess-line"><span>Усоверш.</span><b>{money(a.upgradesPrice)} б.</b></div>
            <div className="shb__assess-line shb__assess-total"><span>Полная цена</span><b>{money(a.totalPrice)} б.</b></div>
            <div className="shb__assess-line shb__assess-debt"><span>Долг</span><b>{money(a.debt)} б.</b></div>
            {a.violations.length > 0 && (
              <ul className="shb__violations">
                {a.violations.map((v, i) => (
                  <li key={i}><Badge tone="danger">!</Badge> {v}</li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default ShipBuilder;
