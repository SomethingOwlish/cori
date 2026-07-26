/**
 * Pure state logic for the character builder.
 *
 * All edits go through `builderReducer`, which returns a new `Character` with
 * the change applied and bounds enforced. Keeping this free of React makes the
 * editing rules (clamping to attribute/skill caps, syncing age/upbringing
 * defaults) straightforward to unit test. Validation itself is delegated to the
 * domain's `assessCharacter`.
 */

import {
  AGE_PROFILES,
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  CONCEPTS,
  KEY_ATTRIBUTE_MAX,
  SKILL_MIN,
  UPBRINGING_BIRR,
  generateCharacter,
  type AgeGroup,
  type AttributeKey,
  type Character,
  type ConceptKey,
  type IconKey,
  type SkillKey,
  type Upbringing,
} from "../../domain/coriolis";

/** Free-text identity fields the builder can edit directly. */
export type TextField = "name" | "playerName" | "appearance" | "personalProblem";

export type BuilderAction =
  | { type: "load"; character: Character }
  | { type: "reroll"; seed: number }
  | { type: "setText"; field: TextField; value: string }
  | { type: "setConcept"; concept: ConceptKey }
  | { type: "setAgeGroup"; ageGroup: AgeGroup }
  | { type: "setUpbringing"; upbringing: Upbringing }
  | { type: "setIcon"; icon: IconKey }
  | { type: "adjustAttribute"; key: AttributeKey; delta: number }
  | { type: "adjustSkill"; key: SkillKey; delta: number }
  | { type: "toggleTalent"; key: string };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** The highest an attribute may reach for a given concept (key attribute is +1). */
export function attributeCap(concept: ConceptKey, key: AttributeKey): number {
  return key === CONCEPTS[concept].keyAttribute ? KEY_ATTRIBUTE_MAX : ATTRIBUTE_MAX;
}

/** The highest any single skill may reach for a given age group. */
export function skillCap(ageGroup: AgeGroup): number {
  return AGE_PROFILES[ageGroup].maxSkillValue;
}

export function builderReducer(character: Character, action: BuilderAction): Character {
  switch (action.type) {
    case "load":
      return action.character;

    case "reroll":
      // Preserve id and identity text; reroll everything the seed drives.
      return generateCharacter({
        id: character.id,
        seed: action.seed,
        name: character.name,
        playerName: character.playerName,
      });

    case "setText": {
      const value = action.value;
      if (action.field === "name") return { ...character, name: value };
      // Optional fields: an empty string clears them back to undefined.
      return { ...character, [action.field]: value === "" ? undefined : value };
    }

    case "setConcept":
      return { ...character, concept: action.concept };

    case "setAgeGroup":
      // Age drives the reputation baseline; keep it in sync on change.
      return {
        ...character,
        ageGroup: action.ageGroup,
        reputation: AGE_PROFILES[action.ageGroup].startingReputation,
      };

    case "setUpbringing":
      // Upbringing drives starting money; keep it in sync on change.
      return {
        ...character,
        upbringing: action.upbringing,
        birr: UPBRINGING_BIRR[action.upbringing],
      };

    case "setIcon":
      return { ...character, icon: action.icon };

    case "adjustAttribute": {
      const cap = attributeCap(character.concept, action.key);
      const next = clamp(character.attributes[action.key] + action.delta, ATTRIBUTE_MIN, cap);
      return {
        ...character,
        attributes: { ...character.attributes, [action.key]: next },
      };
    }

    case "adjustSkill": {
      const cap = skillCap(character.ageGroup);
      const next = clamp(character.skills[action.key] + action.delta, SKILL_MIN, cap);
      return {
        ...character,
        skills: { ...character.skills, [action.key]: next },
      };
    }

    case "toggleTalent": {
      const has = character.talents.includes(action.key);
      const talents = has
        ? character.talents.filter((t) => t !== action.key)
        : [...character.talents, action.key];
      return { ...character, talents };
    }

    default: {
      // Exhaustiveness guard: a new action type without a case fails to compile.
      const _never: never = action;
      return _never;
    }
  }
}
