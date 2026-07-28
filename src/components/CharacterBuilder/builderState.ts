/**
 * Чистая логика состояния мастера создания персонажа.
 *
 * Все правки проходят через `builderReducer`, который возвращает нового
 * `Character` с применённым изменением и соблюдёнными границами. Отсутствие
 * React делает правила редактирования (ограничения характеристик/навыков,
 * пересчёт репутации и богатства) удобными для юнит-тестов. Сама валидация
 * делегируется доменной `assessCharacter`.
 */

import {
  ATTRIBUTE_MIN,
  SKILL_MIN,
  UPBRINGINGS,
  attributeCreationCap,
  skillCreationCap,
  startingReputation,
  generateCharacter,
  type AttributeKey,
  type Character,
  type ConceptKey,
  type IconKey,
  type SkillKey,
  type TeamArchetypeKey,
  type Upbringing,
  type Parentage,
  type ShipPosition,
} from "../../domain/coriolis";

/** Свободные текстовые поля, которые мастер правит напрямую. */
export type TextField = "name" | "playerName" | "appearance" | "personalProblem";
export type BioTextField = "homeworld" | "lineage";

export type BuilderAction =
  | { type: "load"; character: Character }
  | { type: "reroll"; seed: number }
  | { type: "setText"; field: TextField; value: string }
  | { type: "setBioText"; field: BioTextField; value: string }
  | { type: "setConcept"; concept: ConceptKey }
  | { type: "setRole"; role: string }
  | { type: "setUpbringing"; upbringing: Upbringing }
  | { type: "setParentage"; parentage: Parentage }
  | { type: "setIcon"; icon: IconKey }
  | { type: "setTeamArchetype"; team: TeamArchetypeKey }
  | { type: "setShipPosition"; position: ShipPosition }
  | { type: "adjustAttribute"; key: AttributeKey; delta: number }
  | { type: "adjustSkill"; key: SkillKey; delta: number }
  | { type: "chooseTalent"; key: string; options: readonly string[] }
  | { type: "patch"; patch: Partial<Character> };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Пересчитывает репутацию по биографии и амплуа. */
function withReputation(c: Character): Character {
  return {
    ...c,
    reputation: startingReputation(c.biography.upbringing, c.biography.parentage, c.concept),
  };
}

/** Обрезает навыки под ограничения выбранной роли (ключевые ≤3, прочие ≤1). */
function clampSkills(c: Character): Character {
  const skills = { ...c.skills };
  for (const key of Object.keys(skills) as SkillKey[]) {
    skills[key] = clamp(skills[key], SKILL_MIN, skillCreationCap(c.concept, c.role, key));
  }
  return { ...c, skills };
}

/** Обрезает характеристики под ограничения амплуа (ключевая ≤5, прочие ≤4). */
function clampAttributes(c: Character): Character {
  const attributes = { ...c.attributes };
  for (const key of Object.keys(attributes) as AttributeKey[]) {
    attributes[key] = clamp(attributes[key], ATTRIBUTE_MIN, attributeCreationCap(c.concept, key));
  }
  return { ...c, attributes };
}

export function builderReducer(character: Character, action: BuilderAction): Character {
  switch (action.type) {
    case "load":
      return action.character;

    case "reroll":
      // Сохраняем id, текст личности и кампанию; остальное определяет семя.
      return {
        ...generateCharacter({
          id: character.id,
          seed: action.seed,
          name: character.name || undefined,
          playerName: character.playerName,
        }),
        campaignId: character.campaignId,
      };

    case "setText": {
      const value = action.value;
      if (action.field === "name") return { ...character, name: value };
      return { ...character, [action.field]: value === "" ? undefined : value };
    }

    case "setBioText": {
      const value = action.value === "" ? undefined : action.value;
      return { ...character, biography: { ...character.biography, [action.field]: value } };
    }

    case "setConcept": {
      // Смена амплуа сбрасывает роль (роли у амплуа разные) и меняет пределы.
      // Роль игрок выбирает следующим шагом — не подставляем её сами.
      const role = character.concept === action.concept ? character.role : undefined;
      let next: Character = { ...character, concept: action.concept, role };
      next = clampAttributes(next);
      next = clampSkills(next);
      return withReputation(next);
    }

    case "setRole":
      return clampSkills({ ...character, role: action.role });

    case "setUpbringing": {
      const profile = UPBRINGINGS[action.upbringing];
      let bio = { ...character.biography, upbringing: action.upbringing };
      // Пасынок не может быть аристократом.
      if (bio.parentage === "stray" && action.upbringing === "privileged") {
        bio = { ...bio, parentage: "human" };
      }
      return withReputation({ ...character, biography: bio, birr: profile.birr });
    }

    case "setParentage": {
      let bio = { ...character.biography, parentage: action.parentage };
      if (action.parentage === "stray" && bio.upbringing === "privileged") {
        bio = { ...bio, upbringing: "stationary" };
      }
      const birr = bio.upbringing ? UPBRINGINGS[bio.upbringing].birr : character.birr;
      return withReputation({ ...character, biography: bio, birr });
    }

    case "setIcon":
      return { ...character, icon: action.icon };

    case "setTeamArchetype":
      return { ...character, teamArchetype: action.team };

    case "setShipPosition":
      return { ...character, shipPosition: action.position };

    case "adjustAttribute": {
      const cap = attributeCreationCap(character.concept, action.key);
      const next = clamp(character.attributes[action.key] + action.delta, ATTRIBUTE_MIN, cap);
      return { ...character, attributes: { ...character.attributes, [action.key]: next } };
    }

    case "adjustSkill": {
      const cap = skillCreationCap(character.concept, character.role, action.key);
      const next = clamp(character.skills[action.key] + action.delta, SKILL_MIN, cap);
      return { ...character, skills: { ...character.skills, [action.key]: next } };
    }

    case "chooseTalent": {
      // Единственный выбор в слоте: снимаем прочие варианты из этого же списка
      // (например, личное достоинство амплуа даётся ровно одно), затем ставим
      // выбранный — либо снимаем его, если кликнули повторно.
      const optionSet = new Set(action.options);
      const wasSelected = character.talents.includes(action.key);
      const talents = character.talents.filter((t) => !optionSet.has(t));
      if (!wasSelected) talents.push(action.key);
      return { ...character, talents };
    }

    case "patch":
      return { ...character, ...action.patch };

    default: {
      const _never: never = action;
      return _never;
    }
  }
}
