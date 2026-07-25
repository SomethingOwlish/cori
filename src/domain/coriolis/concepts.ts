/**
 * Character concepts.
 *
 * A concept is the archetype a player chooses for their character (soldier,
 * pilot, and so on). Mechanically it defines a key attribute, a set of key
 * skills, and suggested starting talents. This is a representative — not
 * exhaustive — set, expressed purely as functional data.
 */

import type { AttributeKey } from "./attributes";
import type { SkillKey } from "./skills";

export type ConceptKey =
  | "artist"
  | "fugitive"
  | "operator"
  | "pilot"
  | "preacher"
  | "scientist"
  | "soldier"
  | "trucker"
  | "negotiator"
  | "shipWorker";

export interface ConceptDef {
  key: ConceptKey;
  name: string;
  /** The attribute that may be raised to `KEY_ATTRIBUTE_MAX`. */
  keyAttribute: AttributeKey;
  /** Skills the concept is built around; the generator favours these. */
  keySkills: SkillKey[];
  /** Talent keys suggested for this concept (see `talents.ts`). */
  suggestedTalents: string[];
}

export const CONCEPTS: Record<ConceptKey, ConceptDef> = {
  artist: {
    key: "artist",
    name: "Artist",
    keyAttribute: "empathy",
    keySkills: ["culture", "manipulation"],
    suggestedTalents: ["smoothTalker", "starGazer"],
  },
  fugitive: {
    key: "fugitive",
    name: "Fugitive",
    keyAttribute: "agility",
    keySkills: ["infiltration", "dexterity"],
    suggestedTalents: ["quickReflexes", "bailOut"],
  },
  operator: {
    key: "operator",
    name: "Operator",
    keyAttribute: "wits",
    keySkills: ["dataDjinn", "observation"],
    suggestedTalents: ["machineTalker", "aceObserver"],
  },
  pilot: {
    key: "pilot",
    name: "Pilot",
    keyAttribute: "agility",
    keySkills: ["pilot", "rangedCombat"],
    suggestedTalents: ["quickReflexes", "bailOut"],
  },
  preacher: {
    key: "preacher",
    name: "Preacher",
    keyAttribute: "empathy",
    keySkills: ["mysticism", "manipulation"],
    suggestedTalents: ["iconBlessing", "smoothTalker"],
  },
  scientist: {
    key: "scientist",
    name: "Scientist",
    keyAttribute: "wits",
    keySkills: ["science", "technology"],
    suggestedTalents: ["starGazer", "machineTalker"],
  },
  soldier: {
    key: "soldier",
    name: "Soldier",
    keyAttribute: "strength",
    keySkills: ["rangedCombat", "meleeCombat"],
    suggestedTalents: ["combatVeteran", "defender"],
  },
  trucker: {
    key: "trucker",
    name: "Trucker",
    keyAttribute: "wits",
    keySkills: ["pilot", "technology"],
    suggestedTalents: ["machineTalker", "faction"],
  },
  negotiator: {
    key: "negotiator",
    name: "Negotiator",
    keyAttribute: "empathy",
    keySkills: ["manipulation", "culture"],
    suggestedTalents: ["smoothTalker", "faction"],
  },
  shipWorker: {
    key: "shipWorker",
    name: "Ship Worker",
    keyAttribute: "strength",
    keySkills: ["technology", "force"],
    suggestedTalents: ["machineTalker", "defender"],
  },
};

export const CONCEPT_KEYS: readonly ConceptKey[] = Object.keys(CONCEPTS) as ConceptKey[];
