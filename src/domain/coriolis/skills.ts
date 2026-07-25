/**
 * Coriolis skills.
 *
 * Skills are grouped as "general" (available to everyone) and "advanced"
 * (require training). Each skill is tied to a governing attribute. Only the
 * functional structure is modelled here.
 */

import type { AttributeKey } from "./attributes";

export type SkillCategory = "general" | "advanced";

export type GeneralSkillKey =
  | "dexterity"
  | "force"
  | "infiltration"
  | "manipulation"
  | "meleeCombat"
  | "observation"
  | "rangedCombat"
  | "survival";

export type AdvancedSkillKey =
  | "command"
  | "culture"
  | "dataDjinn"
  | "medicurgy"
  | "mysticism"
  | "pilot"
  | "science"
  | "technology";

export type SkillKey = GeneralSkillKey | AdvancedSkillKey;

export interface SkillDef {
  key: SkillKey;
  name: string;
  attribute: AttributeKey;
  category: SkillCategory;
}

export const SKILLS: Record<SkillKey, SkillDef> = {
  // General skills
  dexterity: { key: "dexterity", name: "Dexterity", attribute: "agility", category: "general" },
  force: { key: "force", name: "Force", attribute: "strength", category: "general" },
  infiltration: { key: "infiltration", name: "Infiltration", attribute: "agility", category: "general" },
  manipulation: { key: "manipulation", name: "Manipulation", attribute: "empathy", category: "general" },
  meleeCombat: { key: "meleeCombat", name: "Melee Combat", attribute: "strength", category: "general" },
  observation: { key: "observation", name: "Observation", attribute: "wits", category: "general" },
  rangedCombat: { key: "rangedCombat", name: "Ranged Combat", attribute: "agility", category: "general" },
  survival: { key: "survival", name: "Survival", attribute: "wits", category: "general" },

  // Advanced skills
  command: { key: "command", name: "Command", attribute: "empathy", category: "advanced" },
  culture: { key: "culture", name: "Culture", attribute: "wits", category: "advanced" },
  dataDjinn: { key: "dataDjinn", name: "Data Djinn", attribute: "wits", category: "advanced" },
  medicurgy: { key: "medicurgy", name: "Medicurgy", attribute: "wits", category: "advanced" },
  mysticism: { key: "mysticism", name: "Mysticism", attribute: "empathy", category: "advanced" },
  pilot: { key: "pilot", name: "Pilot", attribute: "agility", category: "advanced" },
  science: { key: "science", name: "Science", attribute: "wits", category: "advanced" },
  technology: { key: "technology", name: "Technology", attribute: "wits", category: "advanced" },
};

export const SKILL_KEYS: readonly SkillKey[] = Object.keys(SKILLS) as SkillKey[];

export const GENERAL_SKILL_KEYS: readonly GeneralSkillKey[] = SKILL_KEYS.filter(
  (k) => SKILLS[k].category === "general",
) as GeneralSkillKey[];

export const ADVANCED_SKILL_KEYS: readonly AdvancedSkillKey[] = SKILL_KEYS.filter(
  (k) => SKILLS[k].category === "advanced",
) as AdvancedSkillKey[];

/**
 * Skill bounds at character creation.
 *
 * The minimum is always 0. The maximum permitted value depends on the
 * character's age group (see `generation.ts`), so it is not fixed here.
 */
export const SKILL_MIN = 0;

/** A full skill block. */
export type SkillScores = Record<SkillKey, number>;

/** Creates a skill block with every skill at the minimum value. */
export function baseSkillScores(): SkillScores {
  return SKILL_KEYS.reduce((acc, key) => {
    acc[key] = SKILL_MIN;
    return acc;
  }, {} as SkillScores);
}
