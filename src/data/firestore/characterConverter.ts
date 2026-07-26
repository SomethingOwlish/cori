/**
 * Firestore (de)serialization for `Character`.
 *
 * These are pure functions with no Firebase dependency, so they can be unit
 * tested in isolation and reused by any document store. The document keeps a
 * `schemaVersion` so future shape changes can be migrated on read.
 *
 * The domain `id` is intentionally *not* part of the stored document: in
 * Firestore it is the document key, supplied separately on read. Optional
 * fields that are `undefined` are omitted entirely, because Firestore rejects
 * `undefined` values.
 */

import type {
  AgeGroup,
  AttributeScores,
  Character,
  ConceptKey,
  GearItem,
  IconKey,
  Relationship,
  SkillScores,
  Upbringing,
} from "../../domain/coriolis";

/** Bump when the persisted shape changes; `documentToCharacter` migrates old docs. */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * The persisted document shape — a `Character` without its `id`, tagged with a
 * schema version. Mirrors the domain model field-for-field so the mapping stays
 * mechanical and easy to audit.
 */
export interface CharacterDocument {
  schemaVersion: number;

  name: string;
  playerName?: string;

  concept: ConceptKey;
  ageGroup: AgeGroup;
  upbringing: Upbringing;
  icon: IconKey;
  appearance?: string;
  personalProblem?: string;

  attributes: AttributeScores;
  skills: SkillScores;
  talents: string[];

  reputation: number;
  experience: number;
  relationships: Relationship[];

  birr: number;
  gear: GearItem[];

  hitPointsCurrent: number;
  mindPointsCurrent: number;
  radiation: number;
}

/** Serializes a domain `Character` into a Firestore document (id stripped). */
export function characterToDocument(character: Character): CharacterDocument {
  const doc: CharacterDocument = {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    name: character.name,

    concept: character.concept,
    ageGroup: character.ageGroup,
    upbringing: character.upbringing,
    icon: character.icon,

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

  // Only include optional string fields when set — Firestore rejects `undefined`.
  if (character.playerName !== undefined) doc.playerName = character.playerName;
  if (character.appearance !== undefined) doc.appearance = character.appearance;
  if (character.personalProblem !== undefined) doc.personalProblem = character.personalProblem;

  return doc;
}

/**
 * Rebuilds a domain `Character` from its document id and stored data. Documents
 * from older schema versions are upgraded by `migrate` before mapping.
 */
export function documentToCharacter(id: string, raw: CharacterDocument): Character {
  const doc = migrate(raw);

  const character: Character = {
    id,
    name: doc.name,

    concept: doc.concept,
    ageGroup: doc.ageGroup,
    upbringing: doc.upbringing,
    icon: doc.icon,

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

  if (doc.playerName !== undefined) character.playerName = doc.playerName;
  if (doc.appearance !== undefined) character.appearance = doc.appearance;
  if (doc.personalProblem !== undefined) character.personalProblem = doc.personalProblem;

  return character;
}

/**
 * Brings a stored document up to `CURRENT_SCHEMA_VERSION`. Today there is only
 * one version, so this normalizes the tag; new versions add cases here.
 */
function migrate(doc: CharacterDocument): CharacterDocument {
  // Future: `if (doc.schemaVersion < 2) { ...transform... }`
  return { ...doc, schemaVersion: CURRENT_SCHEMA_VERSION };
}
