import { describe, expect, it } from "vitest";
import {
  AGE_PROFILES,
  ATTRIBUTE_POINT_POOL,
  allocateAttributes,
  allocateSkills,
  assessCharacter,
  createRng,
  generateCharacter,
} from "./generation";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MIN, KEY_ATTRIBUTE_MAX } from "./attributes";
import { SKILL_KEYS } from "./skills";
import { CONCEPTS, type ConceptKey } from "./concepts";
import { attributePointsSpent, type AgeGroup } from "./character";

const CONCEPT_LIST = Object.keys(CONCEPTS) as ConceptKey[];
const AGE_LIST = Object.keys(AGE_PROFILES) as AgeGroup[];

describe("createRng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it("int stays within bounds", () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      const v = rng.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });
});

describe("allocateAttributes", () => {
  it("spends exactly the attribute pool and respects caps", () => {
    for (let seed = 0; seed < 50; seed++) {
      const rng = createRng(seed);
      const concept = CONCEPT_LIST[seed % CONCEPT_LIST.length];
      const scores = allocateAttributes(CONCEPTS[concept].keyAttribute, rng);
      expect(attributePointsSpent(scores)).toBe(ATTRIBUTE_POINT_POOL);
      for (const key of ATTRIBUTE_KEYS) {
        expect(scores[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
        expect(scores[key]).toBeLessThanOrEqual(KEY_ATTRIBUTE_MAX);
      }
    }
  });
});

describe("allocateSkills", () => {
  it("spends exactly the skill points for the age group and respects the cap", () => {
    for (const age of AGE_LIST) {
      const profile = AGE_PROFILES[age];
      for (let seed = 0; seed < 30; seed++) {
        const rng = createRng(seed);
        const concept = CONCEPT_LIST[seed % CONCEPT_LIST.length];
        const skills = allocateSkills(concept, profile, rng);
        const spent = SKILL_KEYS.reduce((s, k) => s + skills[k], 0);
        expect(spent).toBe(profile.skillPoints);
        for (const key of SKILL_KEYS) {
          expect(skills[key]).toBeLessThanOrEqual(profile.maxSkillValue);
          expect(skills[key]).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe("generateCharacter", () => {
  it("produces the same character for the same seed and input", () => {
    const input = { id: "x", seed: 123, concept: "pilot" as const, ageGroup: "old" as const };
    expect(generateCharacter(input)).toEqual(generateCharacter(input));
  });

  it("always produces a rules-valid character across many seeds and combinations", () => {
    for (const concept of CONCEPT_LIST) {
      for (const ageGroup of AGE_LIST) {
        for (let seed = 0; seed < 15; seed++) {
          const character = generateCharacter({ id: `c-${seed}`, seed, concept, ageGroup });
          const assessment = assessCharacter(character);
          expect(
            assessment.valid,
            `invalid: ${concept}/${ageGroup}/${seed} -> ${JSON.stringify(assessment.issues)}`,
          ).toBe(true);
        }
      }
    }
  });

  it("honours the chosen concept, age, upbringing, and icon", () => {
    const character = generateCharacter({
      id: "y",
      seed: 5,
      concept: "scientist",
      ageGroup: "middleAged",
      upbringing: "privileged",
      icon: "theJudge",
    });
    expect(character.concept).toBe("scientist");
    expect(character.ageGroup).toBe("middleAged");
    expect(character.upbringing).toBe("privileged");
    expect(character.icon).toBe("theJudge");
    expect(character.reputation).toBe(AGE_PROFILES.middleAged.startingReputation);
  });
});

describe("assessCharacter", () => {
  it("flags an over-spent attribute as an error", () => {
    const character = generateCharacter({ id: "z", seed: 1, concept: "soldier" });
    character.attributes.strength += 3; // over the pool and likely the cap
    const assessment = assessCharacter(character);
    expect(assessment.valid).toBe(false);
    expect(assessment.issues.some((i) => i.area === "attributes")).toBe(true);
  });

  it("flags a skill above the age cap", () => {
    const character = generateCharacter({ id: "z2", seed: 2, concept: "soldier", ageGroup: "young" });
    character.skills.rangedCombat = 5; // young cap is 3
    const assessment = assessCharacter(character);
    expect(assessment.valid).toBe(false);
    expect(assessment.issues.some((i) => i.area === "skills")).toBe(true);
  });
});
