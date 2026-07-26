import { describe, expect, it } from "vitest";

import {
  AGE_PROFILES,
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  CONCEPTS,
  KEY_ATTRIBUTE_MAX,
  UPBRINGING_BIRR,
  generateCharacter,
  type Character,
} from "../../domain/coriolis";
import { attributeCap, builderReducer, skillCap } from "./builderState";

function base(seed = 1): Character {
  return generateCharacter({ id: "test", seed, name: "Base" });
}

describe("builderReducer", () => {
  it("loads a character wholesale", () => {
    const replacement = generateCharacter({ id: "other", seed: 9 });
    expect(builderReducer(base(), { type: "load", character: replacement })).toBe(replacement);
  });

  it("rerolls but keeps id and identity text", () => {
    const start = base();
    start.name = "Keep Name";
    start.playerName = "Keep Player";

    const rerolled = builderReducer(start, { type: "reroll", seed: 123 });

    expect(rerolled.id).toBe(start.id);
    expect(rerolled.name).toBe("Keep Name");
    expect(rerolled.playerName).toBe("Keep Player");
    // The build itself should match a direct generation with the same inputs.
    expect(rerolled).toEqual(
      generateCharacter({ id: start.id, seed: 123, name: "Keep Name", playerName: "Keep Player" }),
    );
  });

  it("sets the name field", () => {
    const next = builderReducer(base(), { type: "setText", field: "name", value: "Ravok" });
    expect(next.name).toBe("Ravok");
  });

  it("clears optional text fields when set to empty", () => {
    const start = { ...base(), appearance: "scarred" };
    const next = builderReducer(start, { type: "setText", field: "appearance", value: "" });
    expect(next.appearance).toBeUndefined();
  });

  it("syncs reputation when the age group changes", () => {
    const next = builderReducer(base(), { type: "setAgeGroup", ageGroup: "old" });
    expect(next.ageGroup).toBe("old");
    expect(next.reputation).toBe(AGE_PROFILES.old.startingReputation);
  });

  it("syncs birr when the upbringing changes", () => {
    const next = builderReducer(base(), { type: "setUpbringing", upbringing: "privileged" });
    expect(next.upbringing).toBe("privileged");
    expect(next.birr).toBe(UPBRINGING_BIRR.privileged);
  });

  it("adjusts an attribute within its cap", () => {
    // Use a concept whose key attribute is strength (soldier) and edit a non-key attr.
    const start = { ...base(), concept: "soldier" as const };
    start.attributes = { ...start.attributes, wits: ATTRIBUTE_MIN };

    const up = builderReducer(start, { type: "adjustAttribute", key: "wits", delta: 10 });
    expect(up.attributes.wits).toBe(ATTRIBUTE_MAX);

    const down = builderReducer(up, { type: "adjustAttribute", key: "wits", delta: -10 });
    expect(down.attributes.wits).toBe(ATTRIBUTE_MIN);
  });

  it("lets the key attribute reach the higher cap", () => {
    const start = { ...base(), concept: "soldier" as const };
    const key = CONCEPTS.soldier.keyAttribute; // strength
    start.attributes = { ...start.attributes, [key]: ATTRIBUTE_MIN };

    const next = builderReducer(start, { type: "adjustAttribute", key, delta: 10 });
    expect(next.attributes[key]).toBe(KEY_ATTRIBUTE_MAX);
  });

  it("adjusts a skill within the age cap", () => {
    const start = { ...base(), ageGroup: "young" as const };
    start.skills = { ...start.skills, pilot: 0 };

    const up = builderReducer(start, { type: "adjustSkill", key: "pilot", delta: 10 });
    expect(up.skills.pilot).toBe(AGE_PROFILES.young.maxSkillValue);

    const down = builderReducer(up, { type: "adjustSkill", key: "pilot", delta: -10 });
    expect(down.skills.pilot).toBe(0);
  });

  it("toggles a talent on and off", () => {
    const start = { ...base(), talents: [] };
    const added = builderReducer(start, { type: "toggleTalent", key: "defender" });
    expect(added.talents).toContain("defender");

    const removed = builderReducer(added, { type: "toggleTalent", key: "defender" });
    expect(removed.talents).not.toContain("defender");
  });

  it("does not mutate the input character", () => {
    const start = base();
    const before = structuredClone(start);
    builderReducer(start, { type: "adjustAttribute", key: "strength", delta: 1 });
    expect(start).toEqual(before);
  });
});

describe("caps", () => {
  it("attributeCap raises the concept's key attribute", () => {
    const key = CONCEPTS.pilot.keyAttribute;
    expect(attributeCap("pilot", key)).toBe(KEY_ATTRIBUTE_MAX);
    const other = key === "strength" ? "wits" : "strength";
    expect(attributeCap("pilot", other)).toBe(ATTRIBUTE_MAX);
  });

  it("skillCap follows the age profile", () => {
    expect(skillCap("young")).toBe(AGE_PROFILES.young.maxSkillValue);
    expect(skillCap("old")).toBe(AGE_PROFILES.old.maxSkillValue);
  });
});
