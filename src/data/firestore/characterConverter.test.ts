import { describe, expect, it } from "vitest";

import { generateCharacter } from "../../domain/coriolis";
import {
  CURRENT_SCHEMA_VERSION,
  characterToDocument,
  documentToCharacter,
  type CharacterDocument,
} from "./characterConverter";

describe("characterConverter", () => {
  it("round-trips a generated character unchanged", () => {
    const character = generateCharacter({ id: "abc123", seed: 42, name: "Ravok" });

    const restored = documentToCharacter(character.id, characterToDocument(character));

    expect(restored).toEqual(character);
  });

  it("round-trips characters across many seeds", () => {
    for (let seed = 0; seed < 50; seed++) {
      const character = generateCharacter({ id: `id-${seed}`, seed });
      const restored = documentToCharacter(character.id, characterToDocument(character));
      expect(restored).toEqual(character);
    }
  });

  it("stamps the current schema version and drops the id", () => {
    const character = generateCharacter({ id: "keep-me", seed: 7 });

    const doc = characterToDocument(character);

    expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(doc).not.toHaveProperty("id");
  });

  it("omits optional fields that are undefined", () => {
    const character = generateCharacter({ id: "x", seed: 1 });
    delete character.playerName;
    character.appearance = undefined;
    character.personalProblem = undefined;

    const doc = characterToDocument(character);

    expect(doc).not.toHaveProperty("playerName");
    expect(doc).not.toHaveProperty("appearance");
    expect(doc).not.toHaveProperty("personalProblem");
  });

  it("preserves optional fields when present", () => {
    const character = generateCharacter({ id: "y", seed: 2 });
    character.playerName = "Sam";
    character.appearance = "Weathered spacer with a djinn tattoo.";
    character.personalProblem = "Owes a debt to the wrong faction.";

    const restored = documentToCharacter(character.id, characterToDocument(character));

    expect(restored.playerName).toBe("Sam");
    expect(restored.appearance).toBe("Weathered spacer with a djinn tattoo.");
    expect(restored.personalProblem).toBe("Owes a debt to the wrong faction.");
  });

  it("uses the document id, not any stored id", () => {
    const character = generateCharacter({ id: "original", seed: 3 });

    const restored = documentToCharacter("from-firestore", characterToDocument(character));

    expect(restored.id).toBe("from-firestore");
  });

  it("upgrades documents tagged with an older schema version", () => {
    const character = generateCharacter({ id: "z", seed: 4 });
    const legacy: CharacterDocument = { ...characterToDocument(character), schemaVersion: 0 };

    const restored = documentToCharacter(character.id, legacy);

    expect(restored).toEqual(character);
  });

  it("does not alias nested objects between the character and its document", () => {
    const character = generateCharacter({ id: "iso", seed: 5 });

    const doc = characterToDocument(character);
    doc.attributes.strength = 99;
    doc.talents.push("tampered");

    expect(character.attributes.strength).not.toBe(99);
    expect(character.talents).not.toContain("tampered");
  });
});
