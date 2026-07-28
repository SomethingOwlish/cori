/**
 * CharacterBuilder — пошаговый мастер создания персонажа «Кориолиса».
 *
 * Шаги повторяют порядок создания героя из корбука (гл. 2, стр. 21). Сначала вся
 * команда определяется с амплуа команды, затем каждый игрок по порядку:
 * биография → амплуа и роль → имя и внешность → характеристики → здоровье и
 * рассудок → навыки → достоинство → Лик-покровитель → личная проблема и
 * взаимоотношения → снаряжение → корабельная должность.
 *
 * Новый герой создаётся ПУСТЫМ: никакие значения не выбраны заранее. Пока выбор
 * не сделан, зависящая от него информация не показывается. Каждое изменение
 * проходит через `builderReducer` (границы соблюдаются там) и непрерывно
 * проверяется `assessCharacter` — игрок видит живой подсчёт пунктов и нарушения
 * правил.
 */

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import {
  ADVANCED_SKILL_KEYS,
  ATTRIBUTES,
  ATTRIBUTE_KEYS,
  CONCEPTS,
  CONCEPT_KEYS,
  GENERAL_SKILL_KEYS,
  ICONS,
  ICON_KEYS,
  PARENTAGES,
  SHIP_POSITIONS,
  SHIP_POSITION_KEYS,
  SKILLS,
  SKILL_LEVEL_NAMES,
  TALENTS,
  TEAM_ARCHETYPES,
  TEAM_ARCHETYPE_KEYS,
  UPBRINGINGS,
  UPBRINGING_KEYS,
  BIRTH_PLANETS,
  LINEAGES,
  assessCharacter,
  attributePointsSpent,
  attributeCreationCap,
  createBlankCharacter,
  keySkillsOf,
  maxHitPoints,
  maxMindPoints,
  skillCreationCap,
  createRng,
  rollD66,
  iconForD66Roll,
  type Character,
  type ConceptKey,
  type SkillKey,
} from "../../domain/coriolis";
import type { CharacterRepository } from "../../data";
import { PlayerCard } from "../PlayerCard";
import { builderReducer } from "./builderState";
import "./CharacterBuilder.css";

export interface CharacterBuilderProps {
  repository: CharacterRepository;
  initialCharacter?: Character;
  /** Кампания, к которой привязывается создаваемый герой. */
  campaignId?: string;
  /** Имя игрока по умолчанию (из сессии). */
  defaultPlayerName?: string;
  /** Кнопка возврата (к списку кампаний / панели мастера). */
  onBack?: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `char-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Привязывает героя к кампании и игроку. */
function scoped(character: Character, campaignId?: string, playerName?: string): Character {
  return {
    ...character,
    ...(campaignId !== undefined ? { campaignId } : {}),
    ...(playerName && !character.playerName ? { playerName } : {}),
  };
}

const STEP_TITLES = [
  "Амплуа команды",
  "Биография",
  "Амплуа и роль",
  "Имя и внешность",
  "Характеристики",
  "Навыки",
  "Достоинства",
  "Лик-покровитель",
  "Личность и связи",
  "Снаряжение",
  "Должность",
  "Итог",
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export function CharacterBuilder({
  repository,
  initialCharacter,
  campaignId,
  defaultPlayerName,
  onBack,
}: CharacterBuilderProps) {
  const [character, dispatch] = useReducer(
    builderReducer,
    scoped(initialCharacter ?? createBlankCharacter(newId()), campaignId, defaultPlayerName),
  );
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(2);
  const [saved, setSaved] = useState<Character[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const assessment = useMemo(() => assessCharacter(character), [character]);
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  const profile = character.biography.upbringing
    ? UPBRINGINGS[character.biography.upbringing]
    : undefined;

  const refreshList = useCallback(async () => {
    try {
      const all = await repository.list();
      const list = campaignId !== undefined ? all.filter((c) => c.campaignId === campaignId) : all;
      list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, "ru"));
      setSaved(list);
    } catch {
      /* список необязателен */
    }
  }, [repository, campaignId]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      await repository.save(scoped(character, campaignId));
      setSaveState("saved");
      await refreshList();
    } catch {
      setSaveState("error");
    }
  }, [character, repository, refreshList, campaignId]);

  // ── Снаряжение: выбор одного предмета из каждой строки ────────────────────
  const [gearChoice, setGearChoice] = useState<number[]>([]);
  useEffect(() => {
    // При смене амплуа сбрасываем выбор снаряжения на первый вариант каждой строки.
    setGearChoice((concept?.gear ?? []).map(() => 0));
  }, [character.concept, concept?.gear]);
  const applyGear = useCallback(
    (choice: number[]) => {
      if (!concept) return;
      const gear = concept.gear.map((row, i) => ({ name: row[choice[i] ?? 0] }));
      dispatch({ type: "patch", patch: { gear } });
    },
    [concept],
  );

  const spentAttr = attributePointsSpent(character.attributes);
  const spentSkill = ADVANCED_SKILL_KEYS.concat(GENERAL_SKILL_KEYS as never).reduce(
    (s, k) => s + character.skills[k as SkillKey],
    0,
  );

  return (
    <div className="cb">
      <div className="cb__main">
        {onBack ? (
          <button type="button" className="cb__back" onClick={onBack}>
            ← К списку
          </button>
        ) : null}
        {/* Навигация по шагам */}
        <nav className="cb__steps" aria-label="Шаги создания">
          {STEP_TITLES.map((title, i) => (
            <button
              key={title}
              type="button"
              className={`cb__step${i === step ? " cb__step--active" : ""}`}
              onClick={() => setStep(i)}
            >
              <span className="cb__step-num">{i + 1}</span>
              {title}
            </button>
          ))}
        </nav>

        <section className="cb__panel">
          {step === 0 && <StepTeamArchetype character={character} dispatch={dispatch} />}
          {step === 1 && <StepBiography character={character} dispatch={dispatch} />}
          {step === 2 && <StepConcept character={character} dispatch={dispatch} />}
          {step === 3 && <StepIdentity character={character} dispatch={dispatch} />}
          {step === 4 && (
            <StepAttributes character={character} dispatch={dispatch} spent={spentAttr} pool={profile?.attributePoints} />
          )}
          {step === 5 && (
            <StepSkills character={character} dispatch={dispatch} spent={spentSkill} pool={profile?.skillPoints} />
          )}
          {step === 6 && <StepTalents character={character} dispatch={dispatch} />}
          {step === 7 && <StepIcon character={character} dispatch={dispatch} />}
          {step === 8 && <StepPersonality character={character} dispatch={dispatch} />}
          {step === 9 && (
            <StepGear character={character} gearChoice={gearChoice} setGearChoice={setGearChoice} applyGear={applyGear} />
          )}
          {step === 10 && <StepShipPosition character={character} dispatch={dispatch} />}
          {step === 11 && (
            <StepSummary character={character} save={save} saveState={saveState} valid={assessment.valid} />
          )}

          <div className="cb__nav">
            <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              ← Назад
            </button>
            <div className="cb__reroll">
              <label>
                Семя{" "}
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  style={{ width: 64 }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "reroll", seed });
                  setSeed((s) => s + 1);
                }}
              >
                🎲 Случайный герой
              </button>
            </div>
            <button type="button" disabled={step === STEP_TITLES.length - 1} onClick={() => setStep((s) => s + 1)}>
              Далее →
            </button>
          </div>
        </section>
      </div>

      {/* Правая колонка: живой ассесмент и карточка */}
      <aside className="cb__side">
        <div className="cb__assessment">
          <h3>Ассесмент</h3>
          <p className={assessment.valid ? "cb__ok" : "cb__bad"}>
            {assessment.valid ? "✓ Сборка корректна" : "✗ Есть ошибки"}
          </p>
          <p className="cb__tally">
            Характеристики: {assessment.attributePointsSpent} / {assessment.attributePointsAllowed}
          </p>
          <p className="cb__tally">
            Навыки: {assessment.skillPointsSpent} / {assessment.skillPointsAllowed}
          </p>
          {assessment.issues.length > 0 && (
            <ul className="cb__issues">
              {assessment.issues.map((iss, i) => (
                <li key={i} className={`cb__issue cb__issue--${iss.severity}`}>
                  {iss.severity === "error" ? "✗" : "⚠"} {iss.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        <PlayerCard character={character} />
        {saved.length > 0 && (
          <div className="cb__saved">
            <h3>Сохранённые</h3>
            <ul>
              {saved.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => dispatch({ type: "load", character: c })}>
                    {c.name || "Без имени"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Тип диспетчера ──────────────────────────────────────────────────────────
type D = React.Dispatch<Parameters<typeof builderReducer>[1]>;

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="cb__hint">{children}</p>;
}

/** Подсказка «сначала выберите …» для шагов, зависящих от предыдущего выбора. */
function Prerequisite({ children }: { children: React.ReactNode }) {
  return <p className="cb__prereq">↩ {children}</p>;
}

// ── Шаг 1: Амплуа команды ───────────────────────────────────────────────────
function StepTeamArchetype({ character, dispatch }: { character: Character; dispatch: D }) {
  return (
    <div>
      <h2>1. Амплуа команды</h2>
      <Hint>
        Прежде всего вся команда вместе решает, что вас объединяет. Амплуа команды задаёт общий
        настрой кампании и открывает список <b>командных достоинств</b> — по одному из них возьмёт
        каждый герой на шаге «Достоинства».
      </Hint>
      <div className="cb__choices">
        {TEAM_ARCHETYPE_KEYS.map((key) => {
          const t = TEAM_ARCHETYPES[key];
          return (
            <button
              key={key}
              type="button"
              className={`cb__choice${character.teamArchetype === key ? " cb__choice--on" : ""}`}
              onClick={() => dispatch({ type: "setTeamArchetype", team: key })}
            >
              <b>{t.name}</b>
              <span>{t.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Шаг 2: Биография ────────────────────────────────────────────────────────
function StepBiography({ character, dispatch }: { character: Character; dispatch: D }) {
  const bio = character.biography;
  return (
    <div>
      <h2>2. Биография</h2>
      <Hint>
        Определись с биографией героя. Происхождение (планета и линия) на механику не влияет и нужно
        только для отправной точки. А вот <b>воспитание</b> — ключевой выбор: оно задаёт пункты
        характеристик и навыков, стартовую репутацию и богатство.
      </Hint>

      <label className="cb__field">
        Родная планета
        <select
          value={character.biography.homeworld ?? ""}
          onChange={(e) => dispatch({ type: "setBioText", field: "homeworld", value: e.target.value })}
        >
          <option value="">— не выбрано —</option>
          {BIRTH_PLANETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.roll}. {p.name}
            </option>
          ))}
        </select>
      </label>
      {character.biography.homeworld && (
        <Hint>{BIRTH_PLANETS.find((p) => p.name === character.biography.homeworld)?.description}</Hint>
      )}

      <h3>Линия происхождения</h3>
      <div className="cb__choices">
        {LINEAGES.map((l) => (
          <button
            key={l.key}
            type="button"
            className={`cb__choice${character.biography.lineage === l.name ? " cb__choice--on" : ""}`}
            onClick={() => dispatch({ type: "setBioText", field: "lineage", value: l.name })}
            title={l.description}
          >
            <b>{l.name}</b>
            <span>{l.description}</span>
          </button>
        ))}
      </div>

      <h3>Воспитание</h3>
      <div className="cb__choices">
        {UPBRINGING_KEYS.map((key) => {
          const u = UPBRINGINGS[key];
          const disabled = bio.parentage === "stray" && key === "privileged";
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              className={`cb__choice${bio.upbringing === key ? " cb__choice--on" : ""}`}
              onClick={() => dispatch({ type: "setUpbringing", upbringing: key })}
            >
              <b>{u.name}</b>
              <span>{u.description}</span>
              <span className="cb__stat-line">
                Хар.: {u.attributePoints} · Навыки: {u.skillPoints} · Репутация: {u.reputation} · {u.birr} бирр
              </span>
            </button>
          );
        })}
      </div>

      <h3>Происхождение</h3>
      <div className="cb__choices">
        {(["human", "stray"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`cb__choice${bio.parentage === p ? " cb__choice--on" : ""}`}
            onClick={() => dispatch({ type: "setParentage", parentage: p })}
          >
            <b>{PARENTAGES[p].name}</b>
            <span>{PARENTAGES[p].description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Шаг 3: Амплуа и роль ────────────────────────────────────────────────────
function StepConcept({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  return (
    <div>
      <h2>3. Амплуа и роль</h2>
      <Hint>
        Амплуа определяет, чем герой зарабатывал на жизнь. Оно задаёт ключевую характеристику
        (её можно поднять до 5), достоинства, снаряжение и модификатор репутации. Каждая из трёх
        <b> ролей</b> уточняет прошлое и даёт четыре ключевых навыка (в них при создании можно
        вложить до 3 пунктов; в прочие — по 1).
      </Hint>

      <label className="cb__field">
        Амплуа
        <select
          value={character.concept ?? ""}
          onChange={(e) => dispatch({ type: "setConcept", concept: e.target.value as ConceptKey })}
        >
          <option value="">— не выбрано —</option>
          {CONCEPT_KEYS.map((k) => (
            <option key={k} value={k}>
              {CONCEPTS[k].name}
            </option>
          ))}
        </select>
      </label>

      {concept ? (
        <>
          <Hint>{concept.description}</Hint>
          <p className="cb__stat-line">
            Ключевая характеристика: <b>{ATTRIBUTES[concept.keyAttribute].name}</b> · Репутация:{" "}
            {concept.reputationModifier >= 0 ? `+${concept.reputationModifier}` : concept.reputationModifier}
          </p>

          <h3>Роль</h3>
          <div className="cb__choices">
            {concept.roles.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`cb__choice${character.role === r.key ? " cb__choice--on" : ""}`}
                onClick={() => dispatch({ type: "setRole", role: r.key })}
              >
                <b>{r.name}</b>
                <span>{r.description}</span>
                <span className="cb__stat-line">
                  Ключевые навыки: {r.keySkills.map((s) => SKILLS[s].name).join(", ")}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <Prerequisite>Выбери амплуа, чтобы увидеть роли и ключевые навыки.</Prerequisite>
      )}
    </div>
  );
}

// ── Шаг 4: Имя и внешность ──────────────────────────────────────────────────
function StepIdentity({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  return (
    <div>
      <h2>4. Имя и внешность</h2>
      <Hint>
        Имя и внешность не влияют на механику — они оживляют героя. В описании амплуа есть примеры
        имён, черт лица и одежды.
      </Hint>
      <label className="cb__field">
        Имя героя
        <input
          value={character.name}
          onChange={(e) => dispatch({ type: "setText", field: "name", value: e.target.value })}
          placeholder="Введите имя"
        />
      </label>
      {concept && <p className="cb__stat-line">Примеры имён: {concept.names.join(", ")}</p>}
      <label className="cb__field">
        Имя игрока
        <input
          value={character.playerName ?? ""}
          onChange={(e) => dispatch({ type: "setText", field: "playerName", value: e.target.value })}
        />
      </label>
      <label className="cb__field">
        Внешность
        <input
          value={character.appearance ?? ""}
          onChange={(e) => dispatch({ type: "setText", field: "appearance", value: e.target.value })}
        />
      </label>
      {concept && (
        <p className="cb__stat-line">
          Лицо: {concept.appearanceFace.join(", ")}. Одежда: {concept.appearanceClothing.join(", ")}.
        </p>
      )}
    </div>
  );
}

// ── Шаг 5: Характеристики ───────────────────────────────────────────────────
function StepAttributes({
  character,
  dispatch,
  spent,
  pool,
}: {
  character: Character;
  dispatch: D;
  spent: number;
  pool: number | undefined;
}) {
  if (pool === undefined) {
    return (
      <div>
        <h2>5. Характеристики</h2>
        <Prerequisite>Сначала выбери воспитание на шаге «Биография» — оно задаёт пул пунктов.</Prerequisite>
      </div>
    );
  }
  const remaining = pool - spent;
  const keyAttr = character.concept ? CONCEPTS[character.concept].keyAttribute : undefined;
  return (
    <div>
      <h2>5. Характеристики</h2>
      <Hint>
        Распредели пункты характеристик: сумма всех четырёх значений должна равняться <b>{pool}</b>{" "}
        (по воспитанию). В каждую — от 2 до 4
        {keyAttr ? (
          <>
            , и только в ключевую характеристику амплуа — <b>{ATTRIBUTES[keyAttr].name}</b> — можно вложить до 5
          </>
        ) : null}
        .
      </Hint>
      <p className={`cb__pool${remaining === 0 ? " cb__pool--ok" : ""}`}>
        Распределено: {spent} / {pool} (осталось {remaining})
      </p>
      {ATTRIBUTE_KEYS.map((key) => {
        const cap = attributeCreationCap(character.concept, key);
        const isKey = key === keyAttr;
        return (
          <div key={key} className="cb__row">
            <span className="cb__row-name">
              {ATTRIBUTES[key].name}
              {isKey ? " ★" : ""}
            </span>
            <span className="cb__row-desc">{ATTRIBUTES[key].description}</span>
            <div className="cb__stepper">
              <button type="button" onClick={() => dispatch({ type: "adjustAttribute", key, delta: -1 })}>
                −
              </button>
              <span className="cb__row-value">{character.attributes[key]}</span>
              <button
                type="button"
                disabled={character.attributes[key] >= cap || remaining <= 0}
                onClick={() => dispatch({ type: "adjustAttribute", key, delta: 1 })}
              >
                +
              </button>
            </div>
            <span className="cb__row-cap">макс {cap}</span>
          </div>
        );
      })}
      <p className="cb__stat-line">
        Здоровье = телосложение + ловкость = <b>{maxHitPoints(character.attributes)}</b> · Рассудок =
        смекалка + эмпатия = <b>{maxMindPoints(character.attributes)}</b>
      </p>
    </div>
  );
}

// ── Шаг 6: Навыки ───────────────────────────────────────────────────────────
function StepSkills({
  character,
  dispatch,
  spent,
  pool,
}: {
  character: Character;
  dispatch: D;
  spent: number;
  pool: number | undefined;
}) {
  if (pool === undefined) {
    return (
      <div>
        <h2>6. Навыки</h2>
        <Prerequisite>Сначала выбери воспитание на шаге «Биография» — оно задаёт пул пунктов.</Prerequisite>
      </div>
    );
  }
  if (!character.concept || !character.role) {
    return (
      <div>
        <h2>6. Навыки</h2>
        <Prerequisite>Сначала выбери амплуа и роль — от роли зависят ключевые навыки.</Prerequisite>
      </div>
    );
  }
  const remaining = pool - spent;
  const keySkills = keySkillsOf(character.concept, character.role);
  const renderRow = (key: SkillKey) => {
    const cap = skillCreationCap(character.concept, character.role, key);
    const isKey = keySkills.has(key);
    return (
      <div key={key} className={`cb__row${isKey ? " cb__row--key" : ""}`}>
        <span className="cb__row-name" title={SKILLS[key].description}>
          {SKILLS[key].name}
          {isKey ? " ★" : ""} <em>({ATTRIBUTES[SKILLS[key].attribute].abbreviation})</em>
        </span>
        <div className="cb__stepper">
          <button type="button" onClick={() => dispatch({ type: "adjustSkill", key, delta: -1 })}>
            −
          </button>
          <span className="cb__row-value">{character.skills[key]}</span>
          <button
            type="button"
            disabled={character.skills[key] >= cap || remaining <= 0}
            onClick={() => dispatch({ type: "adjustSkill", key, delta: 1 })}
          >
            +
          </button>
        </div>
        <span className="cb__row-cap">макс {cap}</span>
      </div>
    );
  };
  return (
    <div>
      <h2>6. Навыки</h2>
      <Hint>
        Распредели <b>{pool}</b> пунктов навыков (по воспитанию). В ключевые навыки роли (отмечены
        ★) можно вложить до 3; в остальные — максимум по 1. Общими навыками можно пользоваться даже
        при 0, специальными — только если значение выше 0.
      </Hint>
      <p className={`cb__pool${remaining === 0 ? " cb__pool--ok" : ""}`}>
        Распределено: {spent} / {pool} (осталось {remaining})
      </p>
      <div className="cb__skills-grid">
        <div>
          <h3>Общие навыки</h3>
          {GENERAL_SKILL_KEYS.map(renderRow)}
        </div>
        <div>
          <h3>Специальные навыки</h3>
          {ADVANCED_SKILL_KEYS.map(renderRow)}
        </div>
      </div>
    </div>
  );
}

// ── Шаг 7: Достоинства ──────────────────────────────────────────────────────
function StepTalents({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  const team = character.teamArchetype ? TEAM_ARCHETYPES[character.teamArchetype] : undefined;
  return (
    <div>
      <h2>7. Достоинства</h2>
      <Hint>
        В начале игры герой получает три достоинства: <b>личное</b> (из амплуа), <b>командное</b>{" "}
        (из амплуа команды) и <b>дар Лика</b>-покровителя (определяется на следующем шаге). Пасынок
        получает ещё и стигму. В каждом списке можно выбрать <b>только одно</b> достоинство.
      </Hint>

      <h3>Личное достоинство {concept ? `(амплуа «${concept.name}»)` : ""}</h3>
      {concept ? (
        <div className="cb__choices">
          {concept.talentChoices.map((key) => {
            const t = TALENTS[key];
            const on = character.talents.includes(key);
            return (
              <button
                key={key}
                type="button"
                className={`cb__choice${on ? " cb__choice--on" : ""}`}
                onClick={() => dispatch({ type: "chooseTalent", key, options: concept.talentChoices })}
              >
                <b>{t?.name ?? key}</b>
                <span>{t?.summary}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <Prerequisite>Выбери амплуа на шаге «Амплуа и роль», чтобы взять личное достоинство.</Prerequisite>
      )}

      <h3>Достоинство команды {team ? `(«${team.name}»)` : ""}</h3>
      {team ? (
        <div className="cb__choices">
          {team.talentChoices.map((key) => {
            const t = TALENTS[key];
            const on = character.talents.includes(key);
            return (
              <button
                key={key}
                type="button"
                className={`cb__choice${on ? " cb__choice--on" : ""}`}
                onClick={() => dispatch({ type: "chooseTalent", key, options: team.talentChoices })}
              >
                <b>{t?.name ?? key}</b>
                <span>{t?.summary}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <Prerequisite>Выбери амплуа команды на шаге 1, чтобы взять командное достоинство.</Prerequisite>
      )}
    </div>
  );
}

// ── Шаг 8: Лик-покровитель ──────────────────────────────────────────────────
function StepIcon({ character, dispatch }: { character: Character; dispatch: D }) {
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const rollIcon = () => {
    const rng = createRng(Math.floor(Date.now() % 2147483647) ^ character.name.length ^ 0x5f3a);
    const r = rollD66(rng);
    setLastRoll(r);
    dispatch({ type: "setIcon", icon: iconForD66Roll(r) });
  };
  return (
    <div>
      <h2>8. Лик-покровитель</h2>
      <Hint>
        Каждый герой рождается под знаком одного из девяти Ликов и получает его дар. По правилам
        Лик определяется случайно броском d66 (табл. 2.5), но при желании выбери вручную.
      </Hint>
      <button type="button" className="cb__roll" onClick={rollIcon}>
        🎲 Бросить d66{lastRoll !== null ? ` — выпало ${lastRoll}` : ""}
      </button>
      <div className="cb__choices">
        {ICON_KEYS.map((key) => {
          const ic = ICONS[key];
          return (
            <button
              key={key}
              type="button"
              className={`cb__choice${character.icon === key ? " cb__choice--on" : ""}`}
              onClick={() => dispatch({ type: "setIcon", icon: key })}
            >
              <b>
                {ic.name} <em>({ic.symbol})</em>
              </b>
              <span>{ic.description}</span>
              <span className="cb__stat-line">Дар: {ic.gift}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Шаг 9: Личная проблема и взаимоотношения ─────────────────────────────────
function StepPersonality({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  if (!concept) {
    return (
      <div>
        <h2>9. Личность и связи</h2>
        <Prerequisite>Личные проблемы и примеры связей зависят от амплуа — выбери его сначала.</Prerequisite>
      </div>
    );
  }
  return (
    <div>
      <h2>9. Личность и связи</h2>
      <Hint>
        Личная проблема — инструмент ведущего для создания историй; столкнувшись с ней, ты можешь
        заработать пункты опыта. Взаимоотношения связывают тебя с другими персонажами игроков.
      </Hint>

      <h3>Личная проблема</h3>
      <div className="cb__choices">
        {concept.personalProblems.map((p) => (
          <button
            key={p}
            type="button"
            className={`cb__choice${character.personalProblem === p ? " cb__choice--on" : ""}`}
            onClick={() =>
              dispatch({
                type: "setText",
                field: "personalProblem",
                value: character.personalProblem === p ? "" : p,
              })
            }
          >
            <span>{p}</span>
          </button>
        ))}
      </div>

      <h3>Взаимоотношения (примеры для амплуа «{concept.name}»)</h3>
      <div className="cb__choices">
        {concept.relationships.map((r, i) => {
          const has = character.relationships.some((x) => x.description === r);
          return (
            <button
              key={i}
              type="button"
              className={`cb__choice${has ? " cb__choice--on" : ""}`}
              onClick={() =>
                dispatch({
                  type: "patch",
                  patch: {
                    relationships: has
                      ? character.relationships.filter((x) => x.description !== r)
                      : [...character.relationships, { name: "Товарищ", description: r }],
                  },
                })
              }
            >
              <span>{r}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Шаг 10: Снаряжение ──────────────────────────────────────────────────────
function StepGear({
  character,
  gearChoice,
  setGearChoice,
  applyGear,
}: {
  character: Character;
  gearChoice: number[];
  setGearChoice: (c: number[]) => void;
  applyGear: (c: number[]) => void;
}) {
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  if (!concept) {
    return (
      <div>
        <h2>10. Снаряжение</h2>
        <Prerequisite>Начальное снаряжение зависит от амплуа — выбери его сначала.</Prerequisite>
      </div>
    );
  }
  const choose = (row: number, opt: number) => {
    const next = concept.gear.map((_, i) => (i === row ? opt : gearChoice[i] ?? 0));
    setGearChoice(next);
    applyGear(next);
  };
  return (
    <div>
      <h2>10. Снаряжение</h2>
      <Hint>
        Начальное снаряжение достаётся герою бесплатно. Выбери по одному предмету из каждой строки.
        Стартовое богатство: <b>{character.birr.toLocaleString("ru-RU")}</b> бирр — на них можно
        докупить снаряжение в игре.
      </Hint>
      {concept.gear.map((row, i) => (
        <div key={i} className="cb__gear-row">
          {row.map((item, opt) => (
            <button
              key={opt}
              type="button"
              className={`cb__choice${(gearChoice[i] ?? 0) === opt ? " cb__choice--on" : ""}`}
              onClick={() => choose(i, opt)}
            >
              <span>{item}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Шаг 11: Корабельная должность ────────────────────────────────────────────
function StepShipPosition({ character, dispatch }: { character: Character; dispatch: D }) {
  return (
    <div>
      <h2>11. Должность на корабле</h2>
      <Hint>
        В последнюю очередь команда распределяет корабельные должности. У каждого героя — одна
        должность.
      </Hint>
      <div className="cb__choices">
        {SHIP_POSITION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`cb__choice${character.shipPosition === key ? " cb__choice--on" : ""}`}
            onClick={() => dispatch({ type: "setShipPosition", position: key })}
          >
            <b>{SHIP_POSITIONS[key]}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Шаг 12: Итог ────────────────────────────────────────────────────────────
function StepSummary({
  character,
  save,
  saveState,
  valid,
}: {
  character: Character;
  save: () => void;
  saveState: SaveState;
  valid: boolean;
}) {
  return (
    <div>
      <h2>12. Итог</h2>
      <Hint>
        Проверь готовую карточку справа. Уровни навыка: {Object.entries(SKILL_LEVEL_NAMES)
          .filter(([n]) => Number(n) > 0)
          .map(([n, name]) => `${n} — ${name}`)
          .join(", ")}
        .
      </Hint>
      <p className={valid ? "cb__ok" : "cb__bad"}>
        {valid
          ? "Сборка соответствует правилам — можно сохранять."
          : "В сборке есть ошибки (см. ассесмент справа)."}
      </p>
      <button type="button" className="cb__save" onClick={save} disabled={saveState === "saving" || !valid}>
        {saveState === "saving" ? "Сохранение…" : "💾 Сохранить героя"}
      </button>
      {saveState === "saved" && <span className="cb__ok"> Сохранено!</span>}
      {saveState === "error" && <span className="cb__bad"> Ошибка сохранения.</span>}
      <p className="cb__stat-line">Герой «{character.name || "Без имени"}» готов к приключениям в Третьем Горизонте.</p>
    </div>
  );
}

export default CharacterBuilder;
