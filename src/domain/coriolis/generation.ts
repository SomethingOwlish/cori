/**
 * Character generation and assessment.
 *
 * This module owns the *rules* of building a Coriolis character:
 *   - how many attribute and skill points are available,
 *   - the caps that apply at creation,
 *   - a deterministic random generator, and
 *   - an "assessment" pass that validates a finished build against the rules.
 *
 * The point pools and caps below are the tunable rule constants. They reflect a
 * standard human character and are grouped here so they can be checked against
 * the rulebook printing in one place and adjusted without touching logic.
 */

import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  KEY_ATTRIBUTE_MAX,
  baseAttributeScores,
  type AttributeKey,
  type AttributeScores,
} from "./attributes";
import {
  SKILL_KEYS,
  SKILL_MIN,
  baseSkillScores,
  type SkillKey,
  type SkillScores,
} from "./skills";
import { CONCEPTS, type ConceptKey } from "./concepts";
import { ICON_KEYS, type IconKey } from "./icons";
import {
  attributePointsSpent,
  createBlankCharacter,
  maxHitPoints,
  maxMindPoints,
  type AgeGroup,
  type Character,
  type Upbringing,
} from "./character";

/** Points a player distributes across attributes, on top of the minimum. */
export const ATTRIBUTE_POINT_POOL = 6;

/** Per-age-group generation profile. */
export interface AgeProfile {
  ageGroup: AgeGroup;
  label: string;
  /** Total skill points to distribute. */
  skillPoints: number;
  /** Highest value any single skill may reach at creation. */
  maxSkillValue: number;
  /** Number of starting talents. */
  talentCount: number;
  /** Starting reputation score. */
  startingReputation: number;
}

/**
 * Age profiles. Older characters trade physical peak for more skill points,
 * talents, and reputation — the classic Year Zero tradeoff.
 */
export const AGE_PROFILES: Record<AgeGroup, AgeProfile> = {
  young: {
    ageGroup: "young",
    label: "Young",
    skillPoints: 8,
    maxSkillValue: 3,
    talentCount: 1,
    startingReputation: 2,
  },
  middleAged: {
    ageGroup: "middleAged",
    label: "Middle-aged",
    skillPoints: 10,
    maxSkillValue: 4,
    talentCount: 2,
    startingReputation: 3,
  },
  old: {
    ageGroup: "old",
    label: "Old",
    skillPoints: 12,
    maxSkillValue: 5,
    talentCount: 3,
    startingReputation: 4,
  },
};

export const UPBRINGINGS: readonly Upbringing[] = ["plebeian", "stationary", "privileged"];

/** Starting money (birr) by upbringing. */
export const UPBRINGING_BIRR: Record<Upbringing, number> = {
  plebeian: 1_000,
  stationary: 2_000,
  privileged: 4_000,
};

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32) — reproducible generation from a seed.
// ---------------------------------------------------------------------------

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Random element of a non-empty array. */
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

// ---------------------------------------------------------------------------
// Allocation helpers
// ---------------------------------------------------------------------------

/**
 * Distributes `pool` points across the four attributes, respecting the min/max
 * bounds and letting the key attribute reach `KEY_ATTRIBUTE_MAX`. Points are
 * biased toward the key attribute first, then spread randomly.
 */
export function allocateAttributes(
  keyAttribute: AttributeKey,
  rng: Rng,
  pool: number = ATTRIBUTE_POINT_POOL,
): AttributeScores {
  const scores = baseAttributeScores();
  let remaining = pool;

  const capFor = (key: AttributeKey) =>
    key === keyAttribute ? KEY_ATTRIBUTE_MAX : ATTRIBUTE_MAX;

  // Prioritise the key attribute a little.
  while (remaining > 0 && scores[keyAttribute] < capFor(keyAttribute) && rng.next() < 0.75) {
    scores[keyAttribute] += 1;
    remaining -= 1;
  }

  // Spread the rest across attributes that still have room.
  let guard = 1000;
  while (remaining > 0 && guard-- > 0) {
    const candidates = ATTRIBUTE_KEYS.filter((k) => scores[k] < capFor(k));
    if (candidates.length === 0) break;
    const key = rng.pick(candidates);
    scores[key] += 1;
    remaining -= 1;
  }

  return scores;
}

/**
 * Distributes `profile.skillPoints` across skills, favouring the concept's key
 * skills. No skill exceeds `profile.maxSkillValue`.
 */
export function allocateSkills(
  concept: ConceptKey,
  profile: AgeProfile,
  rng: Rng,
): SkillScores {
  const scores = baseSkillScores();
  let remaining = profile.skillPoints;
  const keySkills = CONCEPTS[concept].keySkills;

  const raise = (key: SkillKey) => {
    if (scores[key] < profile.maxSkillValue && remaining > 0) {
      scores[key] += 1;
      remaining -= 1;
      return true;
    }
    return false;
  };

  // Invest in key skills first.
  for (const key of keySkills) {
    const target = Math.min(profile.maxSkillValue, rng.int(1, profile.maxSkillValue));
    while (scores[key] < target) {
      if (!raise(key)) break;
    }
  }

  // Spread the remainder across any skill.
  let guard = 1000;
  while (remaining > 0 && guard-- > 0) {
    const candidates = SKILL_KEYS.filter((k) => scores[k] < profile.maxSkillValue);
    if (candidates.length === 0) break;
    // Weight toward key skills so builds stay coherent.
    const pool = rng.next() < 0.5 ? keySkills : candidates;
    raise(rng.pick(pool.length ? pool : candidates));
  }

  return scores;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GenerationInput {
  id: string;
  seed: number;
  name?: string;
  playerName?: string;
  /** If omitted, a concept is chosen at random. */
  concept?: ConceptKey;
  ageGroup?: AgeGroup;
  upbringing?: Upbringing;
  /** If omitted, a birth Icon is chosen at random. */
  icon?: IconKey;
}

/**
 * Produces a complete, rules-valid character from the given input. The same
 * seed and input always yield the same character.
 */
export function generateCharacter(input: GenerationInput): Character {
  const rng = createRng(input.seed);

  const concept: ConceptKey = input.concept ?? rng.pick(Object.keys(CONCEPTS) as ConceptKey[]);
  const ageGroup: AgeGroup = input.ageGroup ?? rng.pick(["young", "middleAged", "old"] as AgeGroup[]);
  const upbringing: Upbringing = input.upbringing ?? rng.pick(UPBRINGINGS);
  const icon: IconKey = input.icon ?? rng.pick(ICON_KEYS);
  const profile = AGE_PROFILES[ageGroup];
  const conceptDef = CONCEPTS[concept];

  const attributes = allocateAttributes(conceptDef.keyAttribute, rng);
  const skills = allocateSkills(concept, profile, rng);

  const talents = conceptDef.suggestedTalents.slice(0, profile.talentCount);

  const character = createBlankCharacter(input.id);
  character.name = input.name ?? "";
  character.playerName = input.playerName;
  character.concept = concept;
  character.ageGroup = ageGroup;
  character.upbringing = upbringing;
  character.icon = icon;
  character.attributes = attributes;
  character.skills = skills;
  character.talents = talents;
  character.reputation = profile.startingReputation;
  character.birr = UPBRINGING_BIRR[upbringing];
  character.hitPointsCurrent = maxHitPoints(attributes);
  character.mindPointsCurrent = maxMindPoints(attributes);

  return character;
}

// ---------------------------------------------------------------------------
// Assessment — validate a finished build against the generation rules.
// ---------------------------------------------------------------------------

export type IssueSeverity = "error" | "warning";

export interface AssessmentIssue {
  severity: IssueSeverity;
  /** Which part of the sheet the issue concerns. */
  area: "attributes" | "skills" | "talents" | "derived";
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
 * Assesses a character build: checks point pools, per-value caps, and talent
 * counts against the age profile. Hard rule breaks are `error`s; advisory
 * observations are `warning`s. A build is `valid` when it has no errors.
 */
export function assessCharacter(character: Character): CharacterAssessment {
  const issues: AssessmentIssue[] = [];
  const profile = AGE_PROFILES[character.ageGroup];
  const conceptDef = CONCEPTS[character.concept];
  const keyAttribute = conceptDef.keyAttribute;

  // --- Attributes ---
  const attrSpent = attributePointsSpent(character.attributes);
  if (attrSpent !== ATTRIBUTE_POINT_POOL) {
    issues.push({
      severity: "error",
      area: "attributes",
      message: `Attribute points spent (${attrSpent}) must equal ${ATTRIBUTE_POINT_POOL}.`,
    });
  }
  for (const key of ATTRIBUTE_KEYS) {
    const value = character.attributes[key];
    const max = key === keyAttribute ? KEY_ATTRIBUTE_MAX : ATTRIBUTE_MAX;
    if (value < ATTRIBUTE_MIN) {
      issues.push({
        severity: "error",
        area: "attributes",
        message: `${key} is below the minimum of ${ATTRIBUTE_MIN}.`,
      });
    }
    if (value > max) {
      issues.push({
        severity: "error",
        area: "attributes",
        message: `${key} is above its maximum of ${max}.`,
      });
    }
  }

  // --- Skills ---
  let skillSpent = 0;
  for (const key of SKILL_KEYS) {
    const value = character.skills[key];
    skillSpent += value;
    if (value < SKILL_MIN) {
      issues.push({
        severity: "error",
        area: "skills",
        message: `${key} is below the minimum of ${SKILL_MIN}.`,
      });
    }
    if (value > profile.maxSkillValue) {
      issues.push({
        severity: "error",
        area: "skills",
        message: `${key} (${value}) exceeds the ${profile.label} cap of ${profile.maxSkillValue}.`,
      });
    }
  }
  if (skillSpent !== profile.skillPoints) {
    issues.push({
      severity: "error",
      area: "skills",
      message: `Skill points spent (${skillSpent}) must equal ${profile.skillPoints} for a ${profile.label} character.`,
    });
  }

  // --- Talents ---
  if (character.talents.length !== profile.talentCount) {
    issues.push({
      severity: "warning",
      area: "talents",
      message: `Expected ${profile.talentCount} starting talent(s) for a ${profile.label} character, found ${character.talents.length}.`,
    });
  }

  // --- Derived trackers ---
  const hpMax = maxHitPoints(character.attributes);
  const mpMax = maxMindPoints(character.attributes);
  if (character.hitPointsCurrent > hpMax) {
    issues.push({
      severity: "warning",
      area: "derived",
      message: `Current hit points (${character.hitPointsCurrent}) exceed the maximum of ${hpMax}.`,
    });
  }
  if (character.mindPointsCurrent > mpMax) {
    issues.push({
      severity: "warning",
      area: "derived",
      message: `Current mind points (${character.mindPointsCurrent}) exceed the maximum of ${mpMax}.`,
    });
  }

  return {
    valid: issues.every((i) => i.severity !== "error"),
    attributePointsSpent: attrSpent,
    attributePointsAllowed: ATTRIBUTE_POINT_POOL,
    skillPointsSpent: skillSpent,
    skillPointsAllowed: profile.skillPoints,
    issues,
  };
}
