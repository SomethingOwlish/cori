/**
 * (Де)сериализация `Character` для Firestore.
 *
 * Это чистые функции без зависимости от Firebase, поэтому их можно тестировать
 * изолированно и переиспользовать в любом документном хранилище. Документ
 * хранит `schemaVersion`, чтобы будущие изменения формы можно было мигрировать
 * при чтении.
 *
 * Доменный `id` намеренно НЕ входит в документ: в Firestore это ключ документа,
 * который передаётся отдельно при чтении. Необязательные поля со значением
 * `undefined` полностью опускаются, так как Firestore не принимает `undefined`.
 */

import type {
  Armor,
  Biography,
  Character,
  ConceptKey,
  GearItem,
  IconKey,
  Injury,
  Relationship,
  ShipPosition,
  TeamArchetypeKey,
  Weapon,
} from "../../domain/coriolis";
import type { AttributeScores } from "../../domain/coriolis";
import type { SkillScores } from "../../domain/coriolis";

/** Увеличивай при изменении формы; `documentToCharacter` мигрирует старые документы. */
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Форма хранимого документа — `Character` без `id`, с версией схемы. Повторяет
 * доменную модель поле в поле, чтобы отображение оставалось механическим.
 */
export interface CharacterDocument {
  schemaVersion: number;

  name: string;
  playerName?: string;
  campaignId?: string;

  biography: Biography;

  concept?: ConceptKey;
  role?: string;
  icon?: IconKey;
  appearance?: string;
  appearanceFace?: string;
  appearanceClothing?: string;
  personalProblem?: string;
  portraitUrl?: string;

  attributes: AttributeScores;
  skills: SkillScores;
  talents: string[];

  teamArchetype?: TeamArchetypeKey;
  shipPosition?: ShipPosition;

  reputation: number;
  experience: number;
  relationships: Relationship[];

  birr: number;
  gear: GearItem[];
  weapons?: Weapon[];
  armor?: Armor;

  hitPointsCurrent: number;
  mindPointsCurrent: number;
  radiation: number;
  injuries?: Injury[];

  notes?: string;
  quarters?: string;
}

/** Сериализует доменного `Character` в документ Firestore (без `id`). */
export function characterToDocument(character: Character): CharacterDocument {
  const doc: CharacterDocument = {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    name: character.name,

    biography: { ...character.biography },

    attributes: { ...character.attributes },
    skills: { ...character.skills },
    talents: [...character.talents],

    reputation: character.reputation,
    experience: character.experience,
    relationships: character.relationships.map((r) => ({ ...r })),

    birr: character.birr,
    gear: character.gear.map((g) => ({ ...g })),

    hitPointsCurrent: character.hitPointsCurrent,
    mindPointsCurrent: character.mindPointsCurrent,
    radiation: character.radiation,
  };

  // Необязательные поля включаем, только если заданы — Firestore не примет undefined.
  if (character.concept !== undefined) doc.concept = character.concept;
  if (character.role !== undefined) doc.role = character.role;
  if (character.icon !== undefined) doc.icon = character.icon;
  if (character.playerName !== undefined) doc.playerName = character.playerName;
  if (character.campaignId !== undefined) doc.campaignId = character.campaignId;
  if (character.appearance !== undefined) doc.appearance = character.appearance;
  if (character.appearanceFace !== undefined) doc.appearanceFace = character.appearanceFace;
  if (character.appearanceClothing !== undefined) doc.appearanceClothing = character.appearanceClothing;
  if (character.personalProblem !== undefined) doc.personalProblem = character.personalProblem;
  if (character.portraitUrl !== undefined) doc.portraitUrl = character.portraitUrl;
  if (character.teamArchetype !== undefined) doc.teamArchetype = character.teamArchetype;
  if (character.shipPosition !== undefined) doc.shipPosition = character.shipPosition;
  if (character.weapons !== undefined) doc.weapons = character.weapons.map((w) => ({ ...w }));
  if (character.armor !== undefined) doc.armor = { ...character.armor };
  if (character.injuries !== undefined) doc.injuries = character.injuries.map((i) => ({ ...i }));
  if (character.notes !== undefined) doc.notes = character.notes;
  if (character.quarters !== undefined) doc.quarters = character.quarters;

  return doc;
}

/**
 * Восстанавливает доменного `Character` из id документа и хранимых данных.
 * Документы старых версий приводятся `migrate` к текущей форме.
 */
export function documentToCharacter(id: string, raw: CharacterDocument): Character {
  const doc = migrate(raw);

  const character: Character = {
    id,
    name: doc.name,

    biography: { ...doc.biography },

    attributes: { ...doc.attributes },
    skills: { ...doc.skills },
    talents: [...doc.talents],

    reputation: doc.reputation,
    experience: doc.experience,
    relationships: doc.relationships.map((r) => ({ ...r })),

    birr: doc.birr,
    gear: doc.gear.map((g) => ({ ...g })),

    hitPointsCurrent: doc.hitPointsCurrent,
    mindPointsCurrent: doc.mindPointsCurrent,
    radiation: doc.radiation,
  };

  if (doc.concept !== undefined) character.concept = doc.concept;
  if (doc.role !== undefined) character.role = doc.role;
  if (doc.icon !== undefined) character.icon = doc.icon;
  if (doc.playerName !== undefined) character.playerName = doc.playerName;
  if (doc.campaignId !== undefined) character.campaignId = doc.campaignId;
  if (doc.appearance !== undefined) character.appearance = doc.appearance;
  if (doc.appearanceFace !== undefined) character.appearanceFace = doc.appearanceFace;
  if (doc.appearanceClothing !== undefined) character.appearanceClothing = doc.appearanceClothing;
  if (doc.personalProblem !== undefined) character.personalProblem = doc.personalProblem;
  if (doc.portraitUrl !== undefined) character.portraitUrl = doc.portraitUrl;
  if (doc.teamArchetype !== undefined) character.teamArchetype = doc.teamArchetype;
  if (doc.shipPosition !== undefined) character.shipPosition = doc.shipPosition;
  if (doc.weapons !== undefined) character.weapons = doc.weapons.map((w) => ({ ...w }));
  if (doc.armor !== undefined) character.armor = { ...doc.armor };
  if (doc.injuries !== undefined) character.injuries = doc.injuries.map((i) => ({ ...i }));
  if (doc.notes !== undefined) character.notes = doc.notes;
  if (doc.quarters !== undefined) character.quarters = doc.quarters;

  return character;
}

/**
 * Приводит хранимый документ к `CURRENT_SCHEMA_VERSION`. Документы версии 1
 * (со старой возрастной моделью) приводятся к воспитанию по умолчанию.
 */
function migrate(doc: CharacterDocument): CharacterDocument {
  const next = { ...doc };
  // Версия 1 использовала ageGroup/upbringing на верхнем уровне вместо biography.
  if (!next.biography) {
    const legacy = doc as unknown as { upbringing?: Biography["upbringing"] };
    next.biography = { upbringing: legacy.upbringing ?? "plebeian", parentage: "human" };
  }
  return { ...next, schemaVersion: CURRENT_SCHEMA_VERSION };
}
