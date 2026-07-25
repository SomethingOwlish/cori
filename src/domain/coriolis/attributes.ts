/**
 * Coriolis attributes.
 *
 * The Year Zero Engine used by Coriolis: The Third Horizon defines four core
 * attributes. Values here model the *mechanics* (ranges and keys) rather than
 * reproducing any rulebook text.
 */

export type AttributeKey = "strength" | "agility" | "wits" | "empathy";

export interface AttributeDef {
  key: AttributeKey;
  /** Display name. */
  name: string;
  /** Short label used on the compact player card. */
  abbreviation: string;
}

export const ATTRIBUTES: Record<AttributeKey, AttributeDef> = {
  strength: { key: "strength", name: "Strength", abbreviation: "STR" },
  agility: { key: "agility", name: "Agility", abbreviation: "AGI" },
  wits: { key: "wits", name: "Wits", abbreviation: "WIT" },
  empathy: { key: "empathy", name: "Empathy", abbreviation: "EMP" },
};

/** Stable ordering for iteration and rendering. */
export const ATTRIBUTE_KEYS: readonly AttributeKey[] = [
  "strength",
  "agility",
  "wits",
  "empathy",
];

/**
 * Attribute bounds at character creation for the human species.
 *
 * NOTE: These are the generation-rule constants. They are collected here so
 * they can be verified against the current rulebook printing in one place.
 */
export const ATTRIBUTE_MIN = 2;
export const ATTRIBUTE_MAX = 4;
/** The concept's key attribute may be raised one step higher than the rest. */
export const KEY_ATTRIBUTE_MAX = 5;

/** A full attribute block. */
export type AttributeScores = Record<AttributeKey, number>;

/** Creates an attribute block with every attribute at the minimum value. */
export function baseAttributeScores(): AttributeScores {
  return {
    strength: ATTRIBUTE_MIN,
    agility: ATTRIBUTE_MIN,
    wits: ATTRIBUTE_MIN,
    empathy: ATTRIBUTE_MIN,
  };
}
