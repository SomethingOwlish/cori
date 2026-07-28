/**
 * The Character model — the data behind a player card.
 *
 * This is the canonical shape persisted (e.g. to Firebase) and rendered by the
 * `PlayerCard` component. Derived values (hit points, mind points, encumbrance)
 * are computed from the stored scores rather than stored, so they can never
 * drift out of sync.
 */

import {
  ATTRIBUTE_KEYS,
  baseAttributeScores,
  type AttributeKey,
  type AttributeScores,
} from "./attributes";
import { baseSkillScores, type SkillScores } from "./skills";
import type { ConceptKey } from "./concepts";
import type { IconKey } from "./icons";

export type AgeGroup = "young" | "middleAged" | "old";

export type Upbringing = "plebeian" | "stationary" | "privileged";

export interface GearItem {
  name: string;
  /** Encumbrance weight; most items count as 1. */
  weight?: number;
  notes?: string;
}

export interface Relationship {
  /** Name of the person the character has a bond with. */
  name: string;
  /** Free-text description of the bond. */
  description: string;
}

export interface Character {
  id: string;
  name: string;
  playerName?: string;
  /** Id of the campaign this character belongs to, if any. */
  campaignId?: string;

  // Identity
  concept: ConceptKey;
  ageGroup: AgeGroup;
  upbringing: Upbringing;
  /** Birth Icon of the Coriolis zodiac. */
  icon: IconKey;
  appearance?: string;
  personalProblem?: string;

  // Core scores
  attributes: AttributeScores;
  skills: SkillScores;
  talents: string[];

  // Social / progression
  reputation: number;
  experience: number;
  relationships: Relationship[];

  // Resources
  birr: number;
  gear: GearItem[];

  // Live trackers (current values; maxima are derived)
  hitPointsCurrent: number;
  mindPointsCurrent: number;
  radiation: number;
}

/** Maximum hit points = Strength + Agility. */
export function maxHitPoints(attributes: AttributeScores): number {
  return attributes.strength + attributes.agility;
}

/** Maximum mind points = Wits + Empathy. */
export function maxMindPoints(attributes: AttributeScores): number {
  return attributes.wits + attributes.empathy;
}

/** Carrying capacity in encumbrance points = Strength x 2. */
export function encumbranceLimit(attributes: AttributeScores): number {
  return attributes.strength * 2;
}

/** Total encumbrance currently carried. */
export function currentEncumbrance(gear: GearItem[]): number {
  return gear.reduce((sum, item) => sum + (item.weight ?? 1), 0);
}

/** Sum of the points spent above the attribute minimum. */
export function attributePointsSpent(attributes: AttributeScores): number {
  return ATTRIBUTE_KEYS.reduce(
    (sum, key: AttributeKey) => sum + (attributes[key] - baseAttributeScores()[key]),
    0,
  );
}

/**
 * Builds a blank but structurally valid character. Callers are expected to fill
 * in identity, scores, and gear — typically via the generator.
 */
export function createBlankCharacter(id: string): Character {
  const attributes = baseAttributeScores();
  return {
    id,
    name: "",
    concept: "soldier",
    ageGroup: "young",
    upbringing: "plebeian",
    icon: "theTraveler",
    attributes,
    skills: baseSkillScores(),
    talents: [],
    reputation: 0,
    experience: 0,
    relationships: [],
    birr: 0,
    gear: [],
    hitPointsCurrent: maxHitPoints(attributes),
    mindPointsCurrent: maxMindPoints(attributes),
    radiation: 0,
  };
}
