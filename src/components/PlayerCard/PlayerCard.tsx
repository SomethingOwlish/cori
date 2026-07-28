/**
 * PlayerCard — лист персонажа «Кориолиса», воссозданный по печатному бланку
 * ST3099 (эталон из дизайн-системы). По умолчанию — только для чтения.
 *
 * Права на правку задаёт `editMode`:
 *   - "none"   — только отображение;
 *   - "self"   — игрок правит своё «ровно как прокачку»: навыки (за опыт),
 *                бирры, внешность и взаимоотношения;
 *   - "master" — мастер правит всё прямо в карточке.
 *
 * Каждая правка отдаётся наружу через `onChange` — карточка не хранит копию
 * персонажа. Клик по навыку показывает пул проверки (характеристика + навык);
 * сам бросок пока не выполняется — только вывод пула.
 */

import { useState } from "react";
import {
  ATTRIBUTES,
  ATTRIBUTE_KEYS,
  CONCEPTS,
  GENERAL_SKILL_KEYS,
  ADVANCED_SKILL_KEYS,
  ICONS,
  SKILLS,
  SKILL_MAX,
  TALENTS,
  UPBRINGINGS,
  PARENTAGES,
  TEAM_ARCHETYPES,
  SHIP_POSITIONS,
  currentEncumbrance,
  encumbranceLimit,
  findRole,
  maxHitPoints,
  maxMindPoints,
  canRaiseSkill,
  raiseSkillWithExperience,
  EXPERIENCE_PER_ADVANCE,
  type Character,
  type SkillKey,
  type Weapon,
  type Injury,
  type Relationship,
} from "../../domain/coriolis";
import { Card, Dialog, DicePool, IconButton, Button } from "../../design-system";
import "./PlayerCard.css";

export type CardEditMode = "none" | "self" | "master";

export interface PlayerCardProps {
  character: Character;
  /** Права на правку прямо в карточке. */
  editMode?: CardEditMode;
  /** Сохранить изменения. Обязателен для любой правки. */
  onChange?: (next: Character) => void;
  /** Совместимость: включает режим прокачки (эквивалент editMode="self"). */
  canLevelUp?: boolean;
  /** Совместимость: поднять навык за опыт. */
  onRaiseSkill?: (key: SkillKey) => void;
}

// ── мелкие помощники правки ──────────────────────────────────────────────────
function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <span className="pcard-stepper">
      <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Убавить">
        −
      </button>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, minWidth: 18, textAlign: "center", color: "var(--gold-bright)" }}>{value}</span>
      <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Прибавить">
        +
      </button>
    </span>
  );
}

function pips(value: number, hi = false) {
  return (
    <span className="pcard-skill__pips">
      {Array.from({ length: SKILL_MAX }).map((_, i) => (
        <i key={i} className={`pip${i < value ? (hi ? " pip--hi" : " pip--on") : ""}`} />
      ))}
    </span>
  );
}

const TEXT: React.CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--parchment)" };
const MICRO_LABEL = "pcard-micro";

export function PlayerCard({ character, editMode, onChange, canLevelUp, onRaiseSkill }: PlayerCardProps) {
  const mode: CardEditMode = editMode ?? (canLevelUp ? "self" : "none");
  const canEdit = mode !== "none" && !!onChange;
  const isMaster = mode === "master";
  const [editing, setEditing] = useState(false);
  const [rollSkill, setRollSkill] = useState<SkillKey | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [newTalent, setNewTalent] = useState("");

  const active = canEdit && editing;

  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  const role = findRole(character.concept, character.role);
  const icon = character.icon ? ICONS[character.icon] : undefined;
  const { upbringing, parentage } = character.biography;

  const hpMax = maxHitPoints(character.attributes);
  const mpMax = maxMindPoints(character.attributes);
  const encMax = encumbranceLimit(character.attributes);
  const encUsed = currentEncumbrance(character.gear);

  const face = character.appearanceFace ?? character.appearance?.split(",")[0]?.trim() ?? "";
  const clothing =
    character.appearanceClothing ?? character.appearance?.split(",").slice(1).join(",").trim() ?? "";

  const patch = (partial: Partial<Character>) => onChange?.({ ...character, ...partial });

  // ── правка навыка ──────────────────────────────────────────────────────────
  const raiseSkill = (key: SkillKey) => {
    if (!onChange) return;
    if (isMaster) {
      patch({ skills: { ...character.skills, [key]: Math.min(SKILL_MAX, character.skills[key] + 1) } });
    } else if (canRaiseSkill(character, key)) {
      onRaiseSkill ? onRaiseSkill(key) : onChange(raiseSkillWithExperience(character, key));
    }
  };
  // ── прокачка: новое достоинство ─────────────────────────────────────────────
  // Мастер добавляет свободно; игрок тратит опыт (как и на навык). Пока это поле
  // свободного ввода — любое достоинство из книги правил вписывается вручную.
  const canAddTalent = isMaster || character.experience >= EXPERIENCE_PER_ADVANCE;
  const addTalent = () => {
    const name = newTalent.trim();
    if (!onChange || !name || character.talents.includes(name)) return;
    if (isMaster) {
      patch({ talents: [...character.talents, name] });
    } else {
      if (character.experience < EXPERIENCE_PER_ADVANCE) return;
      onChange({
        ...character,
        experience: character.experience - EXPERIENCE_PER_ADVANCE,
        talents: [...character.talents, name],
      });
    }
    setNewTalent("");
  };
  const roll = rollSkill ? { skill: SKILLS[rollSkill], attrVal: character.attributes[SKILLS[rollSkill].attribute], val: character.skills[rollSkill] } : null;
  const pool = roll ? roll.attrVal + roll.val : 0;

  // ── строка навыка ──────────────────────────────────────────────────────────
  const SkillRow = ({ skillKey }: { skillKey: SkillKey }) => {
    const skill = SKILLS[skillKey];
    const val = character.skills[skillKey];
    const clickable = !active; // в режиме правки строка не «кидается», а редактируется
    return (
      <div
        className={`pcard-skill${val > 0 ? "" : " pcard-skill--untrained"} crl-skillrow${clickable ? " crl-skillrow--clickable" : ""}`}
        onClick={clickable ? () => setRollSkill(skillKey) : undefined}
        title={skill.description}
      >
        <span className="pcard-skill__name">
          {skill.name} <span className="pcard-skill__attr">({ATTRIBUTES[skill.attribute].abbreviation})</span>
        </span>
        {active && isMaster ? (
          <Stepper value={val} min={0} max={SKILL_MAX} onChange={(v) => patch({ skills: { ...character.skills, [skillKey]: v } })} />
        ) : (
          <>
            {pips(val, val >= 4)}
            <span className={`pcard-skill__val${val === 0 ? " pcard-skill__val--zero" : ""}`}>{val}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <article className="pcard" aria-label={`Лист персонажа ${character.name || "без имени"}`}>
      {/* Тулбар правки */}
      {canEdit ? (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          <span className={MICRO_LABEL} style={{ color: isMaster ? "var(--gold)" : "var(--astral-dim)" }}>
            {isMaster ? "Режим мастера" : "Моя карточка · правка"}
          </span>
          <Button size="sm" variant={editing ? "primary" : "secondary"} onClick={() => setEditing((e) => !e)}>
            {editing ? "Готово" : "Править"}
          </Button>
        </div>
      ) : null}

      {/* Шапка */}
      <header className="pcard__header">
        <div style={{ minWidth: 0 }}>
          <span className="pcard__eyebrow">Третий Горизонт · Бланк персонажа</span>
          {active ? (
            <input
              className="pcard-edit"
              style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 6, maxWidth: 460 }}
              value={character.name}
              placeholder="Имя героя"
              onChange={(e) => patch({ name: e.target.value })}
            />
          ) : (
            <h1 className="pcard__name">{character.name || "Без имени"}</h1>
          )}
          <p className="pcard__concept">
            {[
              concept?.name,
              role?.name,
              upbringing ? UPBRINGINGS[upbringing].name : undefined,
              parentage === "stray" ? PARENTAGES.stray.name : undefined,
              character.teamArchetype ? TEAM_ARCHETYPES[character.teamArchetype].name : undefined,
              character.shipPosition ? SHIP_POSITIONS[character.shipPosition].name : undefined,
            ]
              .filter(Boolean)
              .join(" · ") || "Черновик героя"}
          </p>
        </div>
        {icon ? (
          <div className="pcard__icon" title={icon.description}>
            <span className="pcard__icon-ar" aria-hidden>الأيقونات</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span className="pcard__icon-label">Лик</span>
              <span className="pcard__icon-name">{icon.name}</span>
            </div>
          </div>
        ) : null}
      </header>

      <div className="pcard__grid">
        {/* ── Левая колонка ─────────────────────────────────────────────────── */}
        <div className="pcard__col">
          {/* Портрет */}
          <Card padding={10}>
            <div style={{ position: "relative", width: "100%", height: 296, border: "1px solid var(--border-gold)", borderRadius: "var(--radius-sm)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--void)" }}>
              {character.portraitUrl ? (
                <img src={character.portraitUrl} alt="Портрет персонажа" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "var(--sand-faint)", fontSize: 13, textAlign: "center", padding: 16 }}>
                  Портрет персонажа
                </span>
              )}
            </div>
            {active ? (
              <div style={{ marginTop: 10 }}>
                <input
                  className="pcard-edit"
                  placeholder="Ссылка на портрет (URL)"
                  value={character.portraitUrl ?? ""}
                  onChange={(e) => patch({ portraitUrl: e.target.value || undefined })}
                />
              </div>
            ) : null}
          </Card>

          {/* Характеристики */}
          <Card variant="gilt" eyebrow="Профиль" title="Характеристики">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {ATTRIBUTE_KEYS.map((key) => {
                const isKey = !!concept && key === concept.keyAttribute;
                return (
                  <div key={key} className="pcard-well" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 10px", borderColor: isKey ? "var(--border-gold)" : undefined }}>
                    <span className={MICRO_LABEL}>{ATTRIBUTES[key].name}</span>
                    {active && isMaster ? (
                      <Stepper value={character.attributes[key]} min={1} max={5} onChange={(v) => patch({ attributes: { ...character.attributes, [key]: v } })} />
                    ) : (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color: isKey ? "var(--gold-bright)" : "var(--ivory)", lineHeight: 1 }}>
                        {character.attributes[key]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Метры */}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <MeterTile label="Здоровье" value={character.hitPointsCurrent} max={hpMax} tone="garnet" editable={active} onChange={(v) => patch({ hitPointsCurrent: v })} />
              <MeterTile label="Рассудок" value={character.mindPointsCurrent} max={mpMax} tone="astral" editable={active} onChange={(v) => patch({ mindPointsCurrent: v })} />
              <MeterTile label="Радиация" value={character.radiation} max={10} tone="amber" editable={active} onChange={(v) => patch({ radiation: v })} />
              <MeterTile label="Репутация" value={character.reputation} max={10} tone="gold" gold editable={active} onChange={(v) => patch({ reputation: v })} />
            </div>

            {/* Опыт и бирры */}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="pcard-well" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span className={MICRO_LABEL}>Опыт</span>
                  {canEdit ? (
                    <IconButton size="sm" variant="ghost" label="Прокачать навык" onClick={() => setLevelUpOpen(true)}>
                      +
                    </IconButton>
                  ) : null}
                </div>
                {active && isMaster ? (
                  <Stepper value={character.experience} min={0} max={999} onChange={(v) => patch({ experience: v })} />
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, color: "var(--gold)" }}>{character.experience}</span>
                )}
              </div>
              <div className="pcard-well" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={MICRO_LABEL}>Бирры</span>
                {active ? (
                  <input
                    className="pcard-edit"
                    type="number"
                    style={{ fontFamily: "var(--font-mono)" }}
                    value={character.birr}
                    onChange={(e) => patch({ birr: Math.max(0, Number(e.target.value) || 0) })}
                  />
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, color: "var(--gold)" }}>{character.birr.toLocaleString("ru-RU")}</span>
                )}
              </div>
            </div>
          </Card>

          {/* Внешний вид */}
          <Card title="Внешний вид" action={canEdit ? <IconButton size="sm" variant="ghost" label="Редактировать внешний вид" onClick={() => setEditing(true)}>✎</IconButton> : undefined}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AppearanceField label="Лицо" value={face} editable={active} onChange={(v) => patch({ appearanceFace: v, appearance: [v, clothing].filter(Boolean).join(", ") })} />
              <AppearanceField label="Одежда" value={clothing} editable={active} onChange={(v) => patch({ appearanceClothing: v, appearance: [face, v].filter(Boolean).join(", ") })} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
                <span className={MICRO_LABEL} style={{ color: "var(--garnet)" }}>Личная проблема</span>
                {active ? (
                  <textarea className="pcard-edit" rows={2} value={character.personalProblem ?? ""} onChange={(e) => patch({ personalProblem: e.target.value })} />
                ) : (
                  <p style={TEXT}>{character.personalProblem || "—"}</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Правая колонка ────────────────────────────────────────────────── */}
        <div className="pcard__col">
          {/* Навыки */}
          <Card variant="gilt" eyebrow="Броски" title="Навыки">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "0 28px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="pcard-subhead">Общие</span>
                {GENERAL_SKILL_KEYS.map((k) => (
                  <SkillRow key={k} skillKey={k} />
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="pcard-subhead">Специальные</span>
                {ADVANCED_SKILL_KEYS.map((k) => (
                  <SkillRow key={k} skillKey={k} />
                ))}
              </div>
            </div>
            {!active ? (
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--sand-faint)" }}>Клик по навыку — пул проверки (характеристика + навык). Шестёрки — успехи.</p>
            ) : null}
          </Card>

          {/* Достоинства */}
          <Card title="Достоинства">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {icon ? <TalentRow name={`Дар · ${icon.name}`} summary={icon.gift} astral /> : null}
              {character.talents.map((key) => {
                const t = TALENTS[key];
                return <TalentRow key={key} name={t ? t.name : key} summary={t?.summary ?? ""} onRemove={active && isMaster ? () => patch({ talents: character.talents.filter((x) => x !== key) }) : undefined} />;
              })}
              {character.talents.length === 0 ? <p style={{ ...TEXT, color: "var(--sand-faint)" }}>Достоинства не выбраны.</p> : null}
            </div>
          </Card>

          {/* Взаимоотношения */}
          <Card
            title="Взаимоотношения"
            action={canEdit ? <IconButton size="sm" variant="ghost" label="Редактировать взаимоотношения" onClick={() => setEditing(true)}>✎</IconButton> : undefined}
          >
            <Relationships character={character} active={active} patch={patch} />
          </Card>
        </div>
      </div>

      {/* ── Нижний ряд ───────────────────────────────────────────────────────── */}
      <div className="pcard__bottom">
        {/* Снаряжение */}
        <Card
          title="Снаряжение"
          action={
            <span style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.14em", color: encUsed > encMax ? "var(--garnet)" : "var(--sand-faint)" }}>
              ГРУЗ {encUsed}/{encMax}
            </span>
          }
        >
          <GearList character={character} active={active} patch={patch} />
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-gold)", display: "flex", flexDirection: "column", gap: 4 }}>
            <span className={MICRO_LABEL}>Моя каюта</span>
            {active ? (
              <textarea className="pcard-edit" rows={2} value={character.quarters ?? ""} onChange={(e) => patch({ quarters: e.target.value })} />
            ) : (
              <p style={{ ...TEXT, fontSize: 12, color: "var(--sand)" }}>{character.quarters || "—"}</p>
            )}
          </div>
        </Card>

        {/* Оружие */}
        <Card eyebrow="Бой" title="Оружие">
          <Weapons character={character} active={active} patch={patch} />
        </Card>

        {/* Травмы */}
        <Card eyebrow="Состояние" title="Травмы">
          <Injuries character={character} active={active} patch={patch} />
        </Card>

        {/* Примечания */}
        <Card title="Примечания">
          {active ? (
            <textarea className="pcard-edit" rows={4} value={character.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} />
          ) : (
            <p style={{ ...TEXT, fontSize: 13, color: "var(--sand)" }}>{character.notes || "—"}</p>
          )}
        </Card>
      </div>

      {/* ── Диалог: пул проверки навыка ──────────────────────────────────────── */}
      <Dialog open={rollSkill !== null} onClose={() => setRollSkill(null)} eyebrow="Проверка навыка" title={roll ? roll.skill.name : ""} width={470}>
        {roll ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <PoolTile label="Характеристика" value={`${ATTRIBUTES[roll.skill.attribute].abbreviation} ${roll.attrVal}`} />
              <PoolTile label="Навык" value={String(roll.val)} />
              <PoolTile label="Пул" value={String(pool)} gold />
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--sand)" }}>{roll.skill.description}</p>
            <DicePool count={pool} showResult={false} dieSize={34} />
            <span style={{ fontSize: 12, color: "var(--sand-faint)" }}>Пул — сколько шестигранников бросить: {roll.attrVal} + {roll.val} = {pool}. Шестёрки — успехи.</span>
          </div>
        ) : null}
      </Dialog>

      {/* ── Диалог: прокачка ─────────────────────────────────────────────────── */}
      <Dialog
        open={levelUpOpen}
        onClose={() => setLevelUpOpen(false)}
        eyebrow="Развитие"
        title="Прокачка"
        width={480}
        footer={<Button variant="ghost" onClick={() => setLevelUpOpen(false)}>Закрыть</Button>}
      >
        <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55, color: "var(--sand)" }}>
          {isMaster
            ? "Мастер поднимает навыки и выдаёт достоинства свободно."
            : `Опыт тратится между сессиями: ${EXPERIENCE_PER_ADVANCE} очков за шаг навыка или новое достоинство. Доступно ${character.experience} очков.`}
        </p>

        <span className="pcard-subhead">Навыки</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[...GENERAL_SKILL_KEYS, ...ADVANCED_SKILL_KEYS].map((k) => {
            const val = character.skills[k];
            const can = isMaster ? val < SKILL_MAX : canRaiseSkill(character, k);
            return (
              <div key={k} className="pcard-listrow">
                <span style={{ fontSize: 13, color: "var(--parchment)" }}>
                  {SKILLS[k].name} <span style={{ color: "var(--sand-faint)", fontFamily: "var(--font-mono)" }}>{val} → {Math.min(SKILL_MAX, val + 1)}</span>
                </span>
                <IconButton size="sm" variant="solid" label="Поднять навык" disabled={!can} onClick={() => raiseSkill(k)}>
                  +
                </IconButton>
              </div>
            );
          })}
        </div>

        {/* Достоинства — свободный ввод (любое из книги правил) */}
        <span className="pcard-subhead" style={{ marginTop: 16 }}>Достоинства</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {character.talents.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {character.talents.map((key) => {
                const t = TALENTS[key];
                return (
                  <span key={key} style={{ fontSize: 12, padding: "3px 8px", borderRadius: "var(--radius-xs)", border: "1px solid var(--line)", color: "var(--parchment)" }}>
                    {t ? t.name : key}
                  </span>
                );
              })}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="pcard-edit"
              style={{ flex: 1 }}
              placeholder="Название достоинства"
              value={newTalent}
              onChange={(e) => setNewTalent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTalent();
                }
              }}
            />
            <Button size="sm" variant="primary" disabled={!canAddTalent || newTalent.trim() === ""} onClick={addTalent}>
              Взять
            </Button>
          </div>
          {!isMaster && !canAddTalent ? (
            <span style={{ fontSize: 12, color: "var(--sand-faint)" }}>
              Недостаточно опыта: нужно {EXPERIENCE_PER_ADVANCE} очков.
            </span>
          ) : null}
        </div>
      </Dialog>
    </article>
  );
}

// ── подкомпоненты ─────────────────────────────────────────────────────────────
function MeterTile({
  label,
  value,
  max,
  tone,
  gold,
  editable,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  tone: "garnet" | "astral" | "amber" | "gold";
  gold?: boolean;
  editable?: boolean;
  onChange: (v: number) => void;
}) {
  const segs = Math.max(1, Math.min(12, max));
  return (
    <div className={`pcard-well${gold ? " pcard-well--gold" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="pcard-micro">{label}</span>
        {editable ? (
          <Stepper value={value} min={0} max={max} onChange={onChange} />
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--parchment)" }}>
            {value}/{max}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: segs }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--line-soft)",
              background:
                i < Math.round((value / max) * segs)
                  ? tone === "gold"
                    ? "linear-gradient(90deg, var(--gold-deep), var(--gold-bright))"
                    : `var(--${tone})`
                  : "var(--void)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PoolTile({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{ flex: 1, background: gold ? "var(--gold-12)" : "var(--void)", border: `1px solid ${gold ? "var(--border-gold)" : "var(--line)"}`, borderRadius: "var(--radius-sm)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: gold ? "var(--gold)" : "var(--sand-faint)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: gold ? "var(--gold-bright)" : "var(--parchment)" }}>{value}</span>
    </div>
  );
}

function AppearanceField({ label, value, editable, onChange }: { label: string; value: string; editable?: boolean; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="pcard-micro">{label}</span>
      {editable ? (
        <input className="pcard-edit" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--parchment)" }}>{value || "—"}</p>
      )}
    </div>
  );
}

function TalentRow({ name, summary, astral, onRemove }: { name: string; summary: string; astral?: boolean; onRemove?: () => void }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline", paddingBottom: 10, borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ minWidth: 150, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: astral ? "var(--astral)" : "var(--gold)" }}>{name}</span>
      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: "var(--sand)" }}>{summary}</span>
      {onRemove ? <button type="button" className="pcard-del" onClick={onRemove} title="Убрать">×</button> : null}
    </div>
  );
}

function Relationships({ character, active, patch }: { character: Character; active: boolean; patch: (p: Partial<Character>) => void }) {
  const rels = character.relationships;
  const update = (i: number, r: Partial<Relationship>) => patch({ relationships: rels.map((x, j) => (j === i ? { ...x, ...r } : x)) });
  if (active) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rels.map((r, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--line-soft)", paddingBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="pcard-edit" style={{ flex: 1 }} placeholder="Имя" value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
              <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11, color: "var(--verdant)" }}>
                <input type="checkbox" checked={!!r.isFriend} onChange={(e) => update(i, { isFriend: e.target.checked })} /> друг
              </label>
              <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11, color: "var(--garnet)" }}>
                <input type="checkbox" checked={!!r.isDebt} onChange={(e) => update(i, { isDebt: e.target.checked })} /> долг
              </label>
              <button type="button" className="pcard-del" onClick={() => patch({ relationships: rels.filter((_, j) => j !== i) })}>×</button>
            </div>
            <input className="pcard-edit" placeholder="Описание связи" value={r.description} onChange={(e) => update(i, { description: e.target.value })} />
          </div>
        ))}
        <button type="button" className="pcard-addbtn" onClick={() => patch({ relationships: [...rels, { name: "", description: "" }] })}>+ Связь</button>
      </div>
    );
  }
  if (rels.length === 0) return <p style={{ margin: 0, fontSize: 13, color: "var(--sand-faint)" }}>Связи не записаны.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
      {rels.map((r, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ivory)" }}>
            {r.name || "—"}
            {r.isFriend ? <span style={{ fontSize: 11, fontWeight: 400, color: "var(--verdant)" }}> · друг</span> : null}
            {r.isDebt ? <span style={{ fontSize: 11, fontWeight: 400, color: "var(--garnet)" }}> · долг</span> : null}
          </span>
          <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--sand)" }}>{r.description}</span>
        </div>
      ))}
    </div>
  );
}

function GearList({ character, active, patch }: { character: Character; active: boolean; patch: (p: Partial<Character>) => void }) {
  const gear = character.gear;
  if (active) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {gear.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="pcard-edit" style={{ flex: 1 }} value={g.name} placeholder="Предмет" onChange={(e) => patch({ gear: gear.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <input className="pcard-edit" style={{ width: 56, fontFamily: "var(--font-mono)" }} type="number" step="0.5" value={g.weight ?? 1} onChange={(e) => patch({ gear: gear.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} />
            <button type="button" className="pcard-del" onClick={() => patch({ gear: gear.filter((_, j) => j !== i) })}>×</button>
          </div>
        ))}
        <button type="button" className="pcard-addbtn" onClick={() => patch({ gear: [...gear, { name: "" }] })}>+ Предмет</button>
      </div>
    );
  }
  if (gear.length === 0) return <p style={{ margin: 0, fontSize: 13, color: "var(--sand-faint)" }}>Снаряжение не записано.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {gear.map((g, i) => (
        <div key={i} className="pcard-listrow">
          <span style={{ fontSize: 13, color: "var(--parchment)" }}>{g.name}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--sand-faint)" }}>{g.weight != null ? g.weight : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function Weapons({ character, active, patch }: { character: Character; active: boolean; patch: (p: Partial<Character>) => void }) {
  const weapons = character.weapons ?? [];
  const armor = character.armor;
  const stat = (label: string, v: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--sand-faint)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--parchment)" }}>{v}</span>
    </div>
  );
  const upd = (i: number, w: Partial<Weapon>) => patch({ weapons: weapons.map((x, j) => (j === i ? { ...x, ...w } : x)) });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {weapons.map((w, i) =>
        active ? (
          <div key={i} className="pcard-well" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="pcard-edit" style={{ flex: 1 }} placeholder="Оружие" value={w.name} onChange={(e) => upd(i, { name: e.target.value })} />
              <input className="pcard-edit" style={{ width: 96 }} placeholder="Дистанция" value={w.range ?? ""} onChange={(e) => upd(i, { range: e.target.value })} />
              <button type="button" className="pcard-del" onClick={() => patch({ weapons: weapons.filter((_, j) => j !== i) })}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              <input className="pcard-edit" type="number" placeholder="Иниц." value={w.initiative ?? 0} onChange={(e) => upd(i, { initiative: Number(e.target.value) })} />
              <input className="pcard-edit" type="number" placeholder="Урон" value={w.damage ?? 0} onChange={(e) => upd(i, { damage: Number(e.target.value) })} />
              <input className="pcard-edit" type="number" placeholder="Порог" value={w.crit ?? 0} onChange={(e) => upd(i, { crit: Number(e.target.value) })} />
              <input className="pcard-edit" type="number" placeholder="Заряды" value={w.ammo ?? 0} onChange={(e) => upd(i, { ammo: Number(e.target.value) })} />
            </div>
            <input className="pcard-edit" placeholder="Свойства" value={w.features ?? ""} onChange={(e) => upd(i, { features: e.target.value })} />
          </div>
        ) : (
          <div key={i} className="pcard-well" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--ivory)" }}>{w.name}</span>
              {w.range ? <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--gold)" }}>{w.range.toUpperCase()}</span> : null}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {stat("Иниц.", w.initiative != null ? (w.initiative >= 0 ? `+${w.initiative}` : w.initiative) : "—")}
              {stat("Урон", w.damage ?? "—")}
              {stat("Порог", w.crit ?? "—")}
              {stat("Заряды", w.ammo ?? "—")}
            </div>
            {w.features ? <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--sand)" }}>Свойства: {w.features}</span> : null}
          </div>
        ),
      )}
      {weapons.length === 0 && !active ? <p style={{ margin: 0, fontSize: 13, color: "var(--sand-faint)" }}>Оружие не записано.</p> : null}
      {active ? <button type="button" className="pcard-addbtn" onClick={() => patch({ weapons: [...weapons, { name: "" }] })}>+ Оружие</button> : null}

      {/* Броня */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
        <span className="pcard-micro">Броня · класс защиты</span>
        {active ? (
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input className="pcard-edit" type="number" style={{ width: 56, fontFamily: "var(--font-mono)" }} value={armor?.rating ?? 0} onChange={(e) => patch({ armor: { rating: Number(e.target.value), name: armor?.name } })} />
            <input className="pcard-edit" style={{ width: 130 }} placeholder="Название" value={armor?.name ?? ""} onChange={(e) => patch({ armor: { rating: armor?.rating ?? 0, name: e.target.value } })} />
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, color: "var(--gold)" }}>{armor?.rating ?? "—"}</span>
            {armor?.name ? <span style={{ fontSize: 12, color: "var(--sand)" }}>{armor.name}</span> : null}
          </span>
        )}
      </div>
    </div>
  );
}

function Injuries({ character, active, patch }: { character: Character; active: boolean; patch: (p: Partial<Character>) => void }) {
  const injuries = character.injuries ?? [];
  const upd = (i: number, v: Partial<Injury>) => patch({ injuries: injuries.map((x, j) => (j === i ? { ...x, ...v } : x)) });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {injuries.map((inj, i) =>
        active ? (
          <div key={i} style={{ background: "var(--garnet-12)", border: "1px solid rgba(212,96,90,0.45)", borderRadius: "var(--radius-sm)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="pcard-edit" style={{ flex: 1 }} placeholder="Травма" value={inj.name} onChange={(e) => upd(i, { name: e.target.value })} />
              <input className="pcard-edit" style={{ width: 80 }} placeholder="−1 куб." value={inj.effect ?? ""} onChange={(e) => upd(i, { effect: e.target.value })} />
              <button type="button" className="pcard-del" onClick={() => patch({ injuries: injuries.filter((_, j) => j !== i) })}>×</button>
            </div>
            <textarea className="pcard-edit" rows={2} placeholder="Описание" value={inj.description ?? ""} onChange={(e) => upd(i, { description: e.target.value })} />
          </div>
        ) : (
          <div key={i} style={{ background: "var(--garnet-12)", border: "1px solid rgba(212,96,90,0.45)", borderRadius: "var(--radius-sm)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, color: "var(--garnet)" }}>{inj.name}</span>
              {inj.effect ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--garnet)" }}>{inj.effect}</span> : null}
            </div>
            {inj.description ? <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--parchment)" }}>{inj.description}</span> : null}
          </div>
        ),
      )}
      {injuries.length === 0 && !active ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="pcard-micro">Критические</span>
          <span style={{ fontSize: 12, color: "var(--sand-faint)" }}>нет</span>
        </div>
      ) : null}
      {active ? <button type="button" className="pcard-addbtn" onClick={() => patch({ injuries: [...injuries, { name: "" }] })}>+ Травма</button> : null}
    </div>
  );
}

export default PlayerCard;
