/**
 * Создание и оценка (ассесмент) персонажа.
 *
 * Здесь живут ПРАВИЛА сборки героя «Кориолиса»:
 *   - сколько пунктов характеристик и навыков доступно (зависит от воспитания);
 *   - какие ограничения действуют при создании;
 *   - детерминированный генератор случайного героя;
 *   - «ассесмент» — проверка готовой сборки на соответствие правилам;
 *   - прокачка (трата пунктов опыта).
 *
 * Источник: ST3001 «Кориолис», гл. 2 (стр. 21–27), гл. 4 (стр. 28).
 */

import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  ATTRIBUTES,
  KEY_ATTRIBUTE_MAX,
  baseAttributeScores,
  type AttributeKey,
  type AttributeScores,
} from "./attributes";
import {
  SKILLS,
  SKILL_KEYS,
  SKILL_MAX,
  SKILL_MIN,
  baseSkillScores,
  type SkillKey,
  type SkillScores,
} from "./skills";
import {
  CONCEPTS,
  CONCEPT_KEYS,
  TEAM_ARCHETYPES,
  TEAM_ARCHETYPE_KEYS,
  findRole,
  type ConceptKey,
  type TeamArchetypeKey,
} from "./concepts";
import { iconForD66Roll, type IconKey } from "./icons";
import { UPBRINGINGS, UPBRINGING_KEYS, type Upbringing, type Parentage } from "./upbringing";
import { TALENTS } from "./talents";
import {
  attributePointsSpent,
  createBlankCharacter,
  maxHitPoints,
  maxMindPoints,
  type Character,
} from "./character";

// Ограничения на этапе создания.
/** Максимум ключевого навыка роли при создании. */
export const KEY_SKILL_CREATION_MAX = 3;
/** Максимум прочих навыков при создании. */
export const OTHER_SKILL_CREATION_MAX = 1;
/** Стоимость одного улучшения при прокачке (пункты опыта). */
export const EXPERIENCE_PER_ADVANCE = 5;

/** Итоговая базовая репутация: воспитание (пасынок вдвое) + модификатор амплуа. */
export function startingReputation(
  upbringing: Upbringing,
  parentage: Parentage,
  concept: ConceptKey,
): number {
  let base = UPBRINGINGS[upbringing].reputation;
  if (parentage === "stray") base = Math.floor(base / 2);
  return Math.max(0, base + CONCEPTS[concept].reputationModifier);
}

/** Максимум характеристики при создании: ключевая — 5, остальные — 4. */
export function attributeCreationCap(concept: ConceptKey, key: AttributeKey): number {
  return key === CONCEPTS[concept].keyAttribute ? KEY_ATTRIBUTE_MAX : ATTRIBUTE_MAX;
}

/** Множество ключевых навыков выбранной роли. */
export function keySkillsOf(concept: ConceptKey, role: string): Set<SkillKey> {
  const r = findRole(concept, role);
  return new Set(r ? r.keySkills : []);
}

/** Максимум навыка при создании: ключевой роли — 3, остальные — 1. */
export function skillCreationCap(concept: ConceptKey, role: string, key: SkillKey): number {
  return keySkillsOf(concept, role).has(key) ? KEY_SKILL_CREATION_MAX : OTHER_SKILL_CREATION_MAX;
}

// ---------------------------------------------------------------------------
// Детерминированный ГПСЧ (mulberry32) — воспроизводимая генерация по семени.
// ---------------------------------------------------------------------------

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
  };
}

/** Бросок d66 (два d6): 11..66. */
export function rollD66(rng: Rng): number {
  return rng.int(1, 6) * 10 + rng.int(1, 6);
}

// ---------------------------------------------------------------------------
// Распределение пунктов
// ---------------------------------------------------------------------------

/**
 * Распределяет пункты характеристик так, что сумма четырёх значений равна
 * `pool` (по воспитанию), каждое значение 2..4, а ключевая — до 5. Приоритет
 * отдаётся ключевой характеристике.
 */
export function allocateAttributes(
  concept: ConceptKey,
  pool: number,
  rng: Rng,
): AttributeScores {
  const scores = baseAttributeScores();
  const keyAttr = CONCEPTS[concept].keyAttribute;
  let remaining = pool - attributePointsSpent(scores); // pool минус стартовые 8

  // Сначала немного вкладываем в ключевую характеристику.
  while (remaining > 0 && scores[keyAttr] < KEY_ATTRIBUTE_MAX && rng.next() < 0.75) {
    scores[keyAttr] += 1;
    remaining -= 1;
  }

  let guard = 1000;
  while (remaining > 0 && guard-- > 0) {
    const candidates = ATTRIBUTE_KEYS.filter(
      (k) => scores[k] < attributeCreationCap(concept, k),
    );
    if (candidates.length === 0) break;
    const key = rng.pick(candidates);
    scores[key] += 1;
    remaining -= 1;
  }

  return scores;
}

/**
 * Распределяет пункты навыков (по воспитанию), отдавая приоритет ключевым
 * навыкам роли. Ключевые навыки — до 3, прочие — до 1.
 */
export function allocateSkills(
  concept: ConceptKey,
  role: string,
  pool: number,
  rng: Rng,
): SkillScores {
  const scores = baseSkillScores();
  const keySkills = [...keySkillsOf(concept, role)];
  let remaining = pool;

  const raise = (key: SkillKey) => {
    if (scores[key] < skillCreationCap(concept, role, key) && remaining > 0) {
      scores[key] += 1;
      remaining -= 1;
      return true;
    }
    return false;
  };

  // Сначала вкладываем в ключевые навыки роли.
  for (const key of keySkills) {
    const target = rng.int(1, KEY_SKILL_CREATION_MAX);
    while (scores[key] < target && raise(key)) {
      /* поднимаем до цели */
    }
  }

  // Остаток раскидываем по любым навыкам с оставшимся запасом.
  let guard = 1000;
  while (remaining > 0 && guard-- > 0) {
    const candidates = SKILL_KEYS.filter(
      (k) => scores[k] < skillCreationCap(concept, role, k),
    );
    if (candidates.length === 0) break;
    const pref = rng.next() < 0.6 && keySkills.some((k) => scores[k] < KEY_SKILL_CREATION_MAX)
      ? keySkills
      : candidates;
    raise(rng.pick(pref.length ? pref : candidates));
  }

  return scores;
}

// ---------------------------------------------------------------------------
// Генерация
// ---------------------------------------------------------------------------

export interface GenerationInput {
  id: string;
  seed: number;
  name?: string;
  playerName?: string;
  concept?: ConceptKey;
  role?: string;
  upbringing?: Upbringing;
  parentage?: Parentage;
  icon?: IconKey;
  teamArchetype?: TeamArchetypeKey;
}

/**
 * Производит полного, соответствующего правилам персонажа. Одинаковые семя и
 * вход всегда дают одного и того же героя.
 */
export function generateCharacter(input: GenerationInput): Character {
  const rng = createRng(input.seed);

  const concept: ConceptKey = input.concept ?? rng.pick(CONCEPT_KEYS);
  const role: string = input.role ?? rng.pick(CONCEPTS[concept].roles).key;
  const parentage: Parentage = input.parentage ?? (rng.next() < 0.85 ? "human" : "stray");
  // Пасынок не может быть аристократом.
  let upbringing: Upbringing =
    input.upbringing ?? rng.pick(UPBRINGING_KEYS);
  if (parentage === "stray" && upbringing === "privileged") upbringing = "stationary";

  const icon: IconKey = input.icon ?? iconForD66Roll(rollD66(rng));
  const teamArchetype: TeamArchetypeKey = input.teamArchetype ?? rng.pick(TEAM_ARCHETYPE_KEYS);
  const profile = UPBRINGINGS[upbringing];

  const attributes = allocateAttributes(concept, profile.attributePoints, rng);
  const skills = allocateSkills(concept, role, profile.skillPoints, rng);

  // Достоинства: личное (из амплуа) + командное (из амплуа команды) + стигма (пасынок).
  const talents: string[] = [
    rng.pick(CONCEPTS[concept].talentChoices),
    rng.pick(TEAM_ARCHETYPES[teamArchetype].talentChoices),
  ];
  if (parentage === "stray") {
    talents.push(rng.pick(["underwaterBreathingStigma", "resilience", "pheromones"]));
  }

  const character = createBlankCharacter(input.id);
  character.name = input.name ?? rng.pick(CONCEPTS[concept].names);
  character.playerName = input.playerName;
  character.biography = { upbringing, parentage };
  character.concept = concept;
  character.role = role;
  character.icon = icon;
  character.attributes = attributes;
  character.skills = skills;
  character.talents = talents;
  character.teamArchetype = teamArchetype;
  character.reputation = startingReputation(upbringing, parentage, concept);
  character.birr = profile.birr;
  const face = rng.pick(CONCEPTS[concept].appearanceFace);
  const clothing = rng.pick(CONCEPTS[concept].appearanceClothing);
  character.appearanceFace = face;
  character.appearanceClothing = clothing;
  character.appearance = [face, clothing].join(", ");
  character.personalProblem = rng.pick(CONCEPTS[concept].personalProblems);
  // Начальное снаряжение — по одному предмету из каждой строки амплуа.
  character.gear = CONCEPTS[concept].gear.map((row) => ({ name: rng.pick(row) }));
  character.hitPointsCurrent = maxHitPoints(attributes);
  character.mindPointsCurrent = maxMindPoints(attributes);

  return character;
}

// ---------------------------------------------------------------------------
// Ассесмент — проверка готовой сборки на соответствие правилам.
// ---------------------------------------------------------------------------

export type IssueSeverity = "error" | "warning";

export interface AssessmentIssue {
  severity: IssueSeverity;
  area: "attributes" | "skills" | "talents" | "derived" | "biography";
  message: string;
}

export interface CharacterAssessment {
  valid: boolean;
  attributePointsSpent: number;
  attributePointsAllowed: number;
  skillPointsSpent: number;
  skillPointsAllowed: number;
  issues: AssessmentIssue[];
}

/**
 * Оценивает сборку: пулы пунктов, ограничения на значения, достоинства и
 * производные показатели. Жёсткие нарушения — `error`, советы — `warning`.
 * Сборка `valid`, если в ней нет ошибок.
 */
export function assessCharacter(character: Character): CharacterAssessment {
  const issues: AssessmentIssue[] = [];
  const { upbringing, parentage } = character.biography;
  const profile = UPBRINGINGS[upbringing];
  const concept = character.concept;

  // Биография: пасынок не может быть аристократом.
  if (parentage === "stray" && upbringing === "privileged") {
    issues.push({
      severity: "error",
      area: "biography",
      message: "Пасынок по воспитанию может быть только плебеем или орбиталом.",
    });
  }

  // Характеристики: сумма значений равна пулу воспитания.
  const attrSpent = attributePointsSpent(character.attributes);
  if (attrSpent !== profile.attributePoints) {
    issues.push({
      severity: "error",
      area: "attributes",
      message: `Сумма характеристик (${attrSpent}) должна равняться ${profile.attributePoints} для воспитания «${profile.name}».`,
    });
  }
  for (const key of ATTRIBUTE_KEYS) {
    const value = character.attributes[key];
    const max = attributeCreationCap(concept, key);
    if (value < ATTRIBUTE_MIN) {
      issues.push({ severity: "error", area: "attributes", message: `${ATTRIBUTES[key].name}: значение ${value} ниже минимума ${ATTRIBUTE_MIN}.` });
    }
    if (value > max) {
      issues.push({ severity: "error", area: "attributes", message: `${ATTRIBUTES[key].name}: значение ${value} выше максимума ${max}.` });
    }
  }

  // Навыки: общий пул и ограничения на ключевые/прочие навыки.
  let skillSpent = 0;
  for (const key of SKILL_KEYS) {
    const value = character.skills[key];
    skillSpent += value;
    const max = skillCreationCap(concept, character.role, key);
    if (value < SKILL_MIN) {
      issues.push({ severity: "error", area: "skills", message: `${SKILLS[key].name}: значение ${value} ниже минимума ${SKILL_MIN}.` });
    }
    if (value > max) {
      const kind = max === KEY_SKILL_CREATION_MAX ? "ключевого" : "неключевого";
      issues.push({ severity: "error", area: "skills", message: `${SKILLS[key].name} (${value}) превышает предел ${kind} навыка при создании (${max}).` });
    }
  }
  if (skillSpent !== profile.skillPoints) {
    issues.push({
      severity: "error",
      area: "skills",
      message: `Сумма навыков (${skillSpent}) должна равняться ${profile.skillPoints} для воспитания «${profile.name}».`,
    });
  }

  // Достоинства: личное из амплуа, командное из амплуа команды, стигма у пасынка.
  const conceptChoices = new Set(CONCEPTS[concept].talentChoices);
  const hasPersonal = character.talents.some((t) => conceptChoices.has(t));
  if (!hasPersonal) {
    issues.push({ severity: "warning", area: "talents", message: "Не выбрано личное достоинство из списка амплуа." });
  }
  if (character.teamArchetype) {
    const teamChoices = new Set(TEAM_ARCHETYPES[character.teamArchetype].talentChoices);
    if (!character.talents.some((t) => teamChoices.has(t))) {
      issues.push({ severity: "warning", area: "talents", message: "Не выбрано достоинство команды из списка амплуа команды." });
    }
  }
  if (parentage === "stray") {
    const hasStigma = character.talents.some((t) => TALENTS[t]?.kind === "stigma");
    if (!hasStigma) {
      issues.push({ severity: "warning", area: "talents", message: "Пасынок должен получить стигму." });
    }
  }
  // Мистик обязан взять мистическую практику.
  if (character.role === "mystic" && !character.talents.some((t) => TALENTS[t]?.kind === "mystic")) {
    issues.push({ severity: "warning", area: "talents", message: "Мистик обязан взять мистическую практику как личное достоинство." });
  }

  // Производные показатели.
  const hpMax = maxHitPoints(character.attributes);
  const mpMax = maxMindPoints(character.attributes);
  if (character.hitPointsCurrent > hpMax) {
    issues.push({ severity: "warning", area: "derived", message: `Текущее здоровье (${character.hitPointsCurrent}) превышает максимум ${hpMax}.` });
  }
  if (character.mindPointsCurrent > mpMax) {
    issues.push({ severity: "warning", area: "derived", message: `Текущий рассудок (${character.mindPointsCurrent}) превышает максимум ${mpMax}.` });
  }

  return {
    valid: issues.every((i) => i.severity !== "error"),
    attributePointsSpent: attrSpent,
    attributePointsAllowed: profile.attributePoints,
    skillPointsSpent: skillSpent,
    skillPointsAllowed: profile.skillPoints,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Прокачка — трата пунктов опыта (5 → +1 навык или новое достоинство).
// ---------------------------------------------------------------------------

/** Можно ли поднять навык на прокачке (есть опыт и значение < 5). */
export function canRaiseSkill(character: Character, key: SkillKey): boolean {
  return character.experience >= EXPERIENCE_PER_ADVANCE && character.skills[key] < SKILL_MAX;
}

/** Поднимает навык на 1 за 5 пунктов опыта. Возвращает нового персонажа (или того же, если нельзя). */
export function raiseSkillWithExperience(character: Character, key: SkillKey): Character {
  if (!canRaiseSkill(character, key)) return character;
  return {
    ...character,
    experience: character.experience - EXPERIENCE_PER_ADVANCE,
    skills: { ...character.skills, [key]: character.skills[key] + 1 },
  };
}

/** Можно ли приобрести достоинство за опыт (есть опыт, ещё не куплено, не стигма). */
export function canAcquireTalent(character: Character, key: string): boolean {
  const t = TALENTS[key];
  return (
    character.experience >= EXPERIENCE_PER_ADVANCE &&
    !!t &&
    t.kind !== "stigma" &&
    !character.talents.includes(key)
  );
}

/** Приобретает достоинство за 5 пунктов опыта. */
export function acquireTalentWithExperience(character: Character, key: string): Character {
  if (!canAcquireTalent(character, key)) return character;
  return {
    ...character,
    experience: character.experience - EXPERIENCE_PER_ADVANCE,
    talents: [...character.talents, key],
  };
}
