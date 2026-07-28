/**
 * CharacterBuilder — пошаговый мастер создания персонажа «Кориолиса».
 *
 * Шаги повторяют порядок создания героя из корбука (гл. 2, стр. 21): биография,
 * амплуа и роль, характеристики, здоровье/рассудок, навыки, достоинства,
 * Лик-покровитель, личность, снаряжение, взаимоотношения и должность. Каждое
 * изменение проходит через `builderReducer` (границы соблюдаются там) и
 * непрерывно проверяется `assessCharacter` — игрок видит живой подсчёт пунктов и
 * нарушения правил. Каждый шаг сопровождается пояснением по материалам.
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
  keySkillsOf,
  maxHitPoints,
  maxMindPoints,
  skillCreationCap,
  generateCharacter,
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
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `char-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

const STEP_TITLES = [
  "Биография",
  "Амплуа и роль",
  "Характеристики",
  "Навыки",
  "Достоинства",
  "Лик-покровитель",
  "Личность",
  "Снаряжение",
  "Команда",
  "Итог",
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export function CharacterBuilder({ repository, initialCharacter }: CharacterBuilderProps) {
  const [character, dispatch] = useReducer(
    builderReducer,
    initialCharacter ?? generateCharacter({ id: newId(), seed: 1 }),
  );
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(2);
  const [saved, setSaved] = useState<Character[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const assessment = useMemo(() => assessCharacter(character), [character]);
  const concept = CONCEPTS[character.concept];
  const profile = UPBRINGINGS[character.biography.upbringing];

  const refreshList = useCallback(async () => {
    try {
      setSaved(await repository.list());
    } catch {
      /* список необязателен */
    }
  }, [repository]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      await repository.save(character);
      setSaveState("saved");
      await refreshList();
    } catch {
      setSaveState("error");
    }
  }, [character, repository, refreshList]);

  // ── Снаряжение: выбор одного предмета из каждой строки ────────────────────
  const [gearChoice, setGearChoice] = useState<number[]>([]);
  useEffect(() => {
    // При смене амплуа сбрасываем выбор снаряжения на первый вариант каждой строки.
    setGearChoice(concept.gear.map(() => 0));
  }, [character.concept, concept.gear]);
  const applyGear = useCallback(
    (choice: number[]) => {
      const gear = concept.gear.map((row, i) => ({ name: row[choice[i] ?? 0] }));
      dispatch({ type: "patch", patch: { gear } });
    },
    [concept.gear],
  );

  const spentAttr = attributePointsSpent(character.attributes);
  const spentSkill = ADVANCED_SKILL_KEYS.concat(GENERAL_SKILL_KEYS as never).reduce(
    (s, k) => s + character.skills[k as SkillKey],
    0,
  );

  return (
    <div className="cb">
      <div className="cb__main">
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
          {step === 0 && (
            <StepBiography character={character} dispatch={dispatch} />
          )}
          {step === 1 && <StepConcept character={character} dispatch={dispatch} />}
          {step === 2 && (
            <StepAttributes character={character} dispatch={dispatch} spent={spentAttr} pool={profile.attributePoints} />
          )}
          {step === 3 && (
            <StepSkills character={character} dispatch={dispatch} spent={spentSkill} pool={profile.skillPoints} />
          )}
          {step === 4 && <StepTalents character={character} dispatch={dispatch} />}
          {step === 5 && <StepIcon character={character} dispatch={dispatch} />}
          {step === 6 && <StepIdentity character={character} dispatch={dispatch} />}
          {step === 7 && (
            <StepGear character={character} gearChoice={gearChoice} setGearChoice={setGearChoice} applyGear={applyGear} />
          )}
          {step === 8 && <StepTeam character={character} dispatch={dispatch} />}
          {step === 9 && (
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

// ── Шаг 1: Биография ────────────────────────────────────────────────────────
function StepBiography({ character, dispatch }: { character: Character; dispatch: D }) {
  const bio = character.biography;
  return (
    <div>
      <h2>1. Биография</h2>
      <Hint>
        Первое — определись с биографией героя. Происхождение (планета и линия) на механику не
        влияет и нужно только для отправной точки. А вот <b>воспитание</b> — ключевой выбор: оно
        задаёт пункты характеристик и навыков, стартовую репутацию и богатство.
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

// ── Шаг 2: Амплуа и роль ────────────────────────────────────────────────────
function StepConcept({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = CONCEPTS[character.concept];
  return (
    <div>
      <h2>2. Амплуа и роль</h2>
      <Hint>
        Амплуа определяет, чем герой зарабатывал на жизнь. Оно задаёт ключевую характеристику
        (её можно поднять до 5), достоинства, снаряжение и модификатор репутации. Каждая из трёх
        <b> ролей</b> уточняет прошлое и даёт четыре ключевых навыка (в них при создании можно
        вложить до 3 пунктов; в прочие — по 1).
      </Hint>

      <label className="cb__field">
        Амплуа
        <select
          value={character.concept}
          onChange={(e) => dispatch({ type: "setConcept", concept: e.target.value as ConceptKey })}
        >
          {CONCEPT_KEYS.map((k) => (
            <option key={k} value={k}>
              {CONCEPTS[k].name}
            </option>
          ))}
        </select>
      </label>
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
    </div>
  );
}

// ── Шаг 3: Характеристики ───────────────────────────────────────────────────
function StepAttributes({
  character,
  dispatch,
  spent,
  pool,
}: {
  character: Character;
  dispatch: D;
  spent: number;
  pool: number;
}) {
  const remaining = pool - spent;
  return (
    <div>
      <h2>3. Характеристики</h2>
      <Hint>
        Распредели пункты характеристик: сумма всех четырёх значений должна равняться <b>{pool}</b>{" "}
        (по воспитанию). В каждую — от 2 до 4, и только в ключевую характеристику амплуа —{" "}
        <b>{ATTRIBUTES[CONCEPTS[character.concept].keyAttribute].name}</b> — можно вложить до 5.
      </Hint>
      <p className={`cb__pool${remaining === 0 ? " cb__pool--ok" : ""}`}>
        Распределено: {spent} / {pool} (осталось {remaining})
      </p>
      {ATTRIBUTE_KEYS.map((key) => {
        const cap = attributeCreationCap(character.concept, key);
        const isKey = key === CONCEPTS[character.concept].keyAttribute;
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

// ── Шаг 4: Навыки ───────────────────────────────────────────────────────────
function StepSkills({
  character,
  dispatch,
  spent,
  pool,
}: {
  character: Character;
  dispatch: D;
  spent: number;
  pool: number;
}) {
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
      <h2>4. Навыки</h2>
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

// ── Шаг 5: Достоинства ──────────────────────────────────────────────────────
function StepTalents({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = CONCEPTS[character.concept];
  const team = character.teamArchetype ? TEAM_ARCHETYPES[character.teamArchetype] : undefined;
  const icon = ICONS[character.icon];
  return (
    <div>
      <h2>5. Достоинства</h2>
      <Hint>
        В начале игры герой получает три достоинства: <b>личное</b> (из амплуа), <b>командное</b>{" "}
        (из амплуа команды) и <b>дар Лика</b>-покровителя. Пасынок получает ещё и стигму. Мистик
        обязан взять мистическую практику как личное достоинство.
      </Hint>

      <h3>Личное достоинство (амплуа «{concept.name}»)</h3>
      <div className="cb__choices">
        {concept.talentChoices.map((key) => {
          const t = TALENTS[key];
          const on = character.talents.includes(key);
          return (
            <button
              key={key}
              type="button"
              className={`cb__choice${on ? " cb__choice--on" : ""}`}
              onClick={() => dispatch({ type: "toggleTalent", key })}
            >
              <b>{t?.name ?? key}</b>
              <span>{t?.summary}</span>
            </button>
          );
        })}
      </div>

      <h3>Достоинство команды {team ? `(«${team.name}»)` : "(выбери амплуа команды на шаге «Команда»)"}</h3>
      {team && (
        <div className="cb__choices">
          {team.talentChoices.map((key) => {
            const t = TALENTS[key];
            const on = character.talents.includes(key);
            return (
              <button
                key={key}
                type="button"
                className={`cb__choice${on ? " cb__choice--on" : ""}`}
                onClick={() => dispatch({ type: "toggleTalent", key })}
              >
                <b>{t?.name ?? key}</b>
                <span>{t?.summary}</span>
              </button>
            );
          })}
        </div>
      )}

      <h3>Дар Лика — {icon.name}</h3>
      <p className="cb__hint">{icon.gift}</p>
    </div>
  );
}

// ── Шаг 6: Лик-покровитель ──────────────────────────────────────────────────
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
      <h2>6. Лик-покровитель</h2>
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

// ── Шаг 7: Личность ─────────────────────────────────────────────────────────
function StepIdentity({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = CONCEPTS[character.concept];
  return (
    <div>
      <h2>7. Личность</h2>
      <Hint>
        Имя, внешность и личная проблема оживляют героя. Личная проблема — инструмент ведущего для
        создания историй; столкнувшись с ней, ты можешь заработать пункты опыта.
      </Hint>
      <label className="cb__field">
        Имя героя
        <input
          value={character.name}
          onChange={(e) => dispatch({ type: "setText", field: "name", value: e.target.value })}
          placeholder="Введите имя"
        />
      </label>
      <p className="cb__stat-line">Примеры имён: {concept.names.join(", ")}</p>
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
      <p className="cb__stat-line">
        Лицо: {concept.appearanceFace.join(", ")}. Одежда: {concept.appearanceClothing.join(", ")}.
      </p>
      <h3>Личная проблема</h3>
      <div className="cb__choices">
        {concept.personalProblems.map((p) => (
          <button
            key={p}
            type="button"
            className={`cb__choice${character.personalProblem === p ? " cb__choice--on" : ""}`}
            onClick={() => dispatch({ type: "setText", field: "personalProblem", value: p })}
          >
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Шаг 8: Снаряжение ───────────────────────────────────────────────────────
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
  const concept = CONCEPTS[character.concept];
  const choose = (row: number, opt: number) => {
    const next = concept.gear.map((_, i) => (i === row ? opt : gearChoice[i] ?? 0));
    setGearChoice(next);
    applyGear(next);
  };
  return (
    <div>
      <h2>8. Снаряжение</h2>
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

// ── Шаг 9: Команда и должность ──────────────────────────────────────────────
function StepTeam({ character, dispatch }: { character: Character; dispatch: D }) {
  const concept = CONCEPTS[character.concept];
  return (
    <div>
      <h2>9. Команда</h2>
      <Hint>
        Определитесь с амплуа команды (оно даёт командное достоинство на шаге 5) и распределите
        корабельные должности. Также запишите взаимоотношения с другими персонажами игроков.
      </Hint>
      <h3>Амплуа команды</h3>
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

      <h3>Корабельная должность</h3>
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

// ── Шаг 10: Итог ────────────────────────────────────────────────────────────
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
      <h2>10. Итог</h2>
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
      <button type="button" className="cb__save" onClick={save} disabled={saveState === "saving"}>
        {saveState === "saving" ? "Сохранение…" : "💾 Сохранить героя"}
      </button>
      {saveState === "saved" && <span className="cb__ok"> Сохранено!</span>}
      {saveState === "error" && <span className="cb__bad"> Ошибка сохранения.</span>}
      <p className="cb__stat-line">Герой «{character.name || "Без имени"}» готов к приключениям в Третьем Горизонте.</p>
    </div>
  );
}

export default CharacterBuilder;
