import { describe, expect, it } from "vitest";
import {
  allocateAttributes,
  allocateSkills,
  assessCharacter,
  createRng,
  generateCharacter,
  rollD66,
  keySkillsOf,
  KEY_SKILL_CREATION_MAX,
  OTHER_SKILL_CREATION_MAX,
} from "./generation";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MIN, KEY_ATTRIBUTE_MAX } from "./attributes";
import { SKILL_KEYS } from "./skills";
import { CONCEPTS, type ConceptKey } from "./concepts";
import { UPBRINGINGS, UPBRINGING_KEYS } from "./upbringing";
import { attributePointsSpent } from "./character";

const CONCEPT_LIST = Object.keys(CONCEPTS) as ConceptKey[];

describe("createRng", () => {
  it("детерминирован для одного семени", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("int остаётся в границах", () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      const v = rng.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it("rollD66 даёт значения 11..66", () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const v = rollD66(rng);
      expect(v).toBeGreaterThanOrEqual(11);
      expect(v).toBeLessThanOrEqual(66);
      expect(v % 10).toBeGreaterThanOrEqual(1);
      expect(v % 10).toBeLessThanOrEqual(6);
    }
  });
});

describe("allocateAttributes", () => {
  it("тратит ровно пул воспитания и соблюдает пределы", () => {
    for (const up of UPBRINGING_KEYS) {
      const pool = UPBRINGINGS[up].attributePoints;
      for (let seed = 0; seed < 40; seed++) {
        const concept = CONCEPT_LIST[seed % CONCEPT_LIST.length];
        const scores = allocateAttributes(concept, pool, createRng(seed));
        expect(attributePointsSpent(scores)).toBe(pool);
        for (const key of ATTRIBUTE_KEYS) {
          expect(scores[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
          const cap = key === CONCEPTS[concept].keyAttribute ? KEY_ATTRIBUTE_MAX : 4;
          expect(scores[key]).toBeLessThanOrEqual(cap);
        }
      }
    }
  });
});

describe("allocateSkills", () => {
  it("тратит ровно пул и соблюдает пределы ключевых/прочих навыков", () => {
    for (const up of UPBRINGING_KEYS) {
      const pool = UPBRINGINGS[up].skillPoints;
      for (let seed = 0; seed < 30; seed++) {
        const concept = CONCEPT_LIST[seed % CONCEPT_LIST.length];
        const role = CONCEPTS[concept].roles[seed % 3].key;
        const key = keySkillsOf(concept, role);
        const skills = allocateSkills(concept, role, pool, createRng(seed));
        const spent = SKILL_KEYS.reduce((s, k) => s + skills[k], 0);
        expect(spent).toBe(pool);
        for (const k of SKILL_KEYS) {
          const cap = key.has(k) ? KEY_SKILL_CREATION_MAX : OTHER_SKILL_CREATION_MAX;
          expect(skills[k]).toBeLessThanOrEqual(cap);
          expect(skills[k]).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe("generateCharacter", () => {
  it("даёт того же персонажа для того же семени и входа", () => {
    const input = { id: "x", seed: 123, concept: "pilot" as const, role: "ace", upbringing: "stationary" as const };
    expect(generateCharacter(input)).toEqual(generateCharacter(input));
  });

  it("всегда даёт корректного по правилам персонажа для всех амплуа/ролей/воспитаний", () => {
    for (const concept of CONCEPT_LIST) {
      for (const role of CONCEPTS[concept].roles) {
        for (const upbringing of UPBRINGING_KEYS) {
          for (let seed = 0; seed < 8; seed++) {
            const c = generateCharacter({ id: `c-${seed}`, seed, concept, role: role.key, upbringing, parentage: "human" });
            const a = assessCharacter(c);
            expect(a.valid, `невалидно: ${concept}/${role.key}/${upbringing}/${seed} -> ${JSON.stringify(a.issues)}`).toBe(true);
          }
        }
      }
    }
  });

  it("уважает выбранные амплуа, роль, воспитание, происхождение и Лика", () => {
    const c = generateCharacter({
      id: "y",
      seed: 5,
      concept: "scientist",
      role: "medicurg",
      upbringing: "privileged",
      parentage: "human",
      icon: "theJudge",
    });
    expect(c.concept).toBe("scientist");
    expect(c.role).toBe("medicurg");
    expect(c.biography.upbringing).toBe("privileged");
    expect(c.icon).toBe("theJudge");
    // Репутация = база аристократа (6) + модификатор учёного (+1).
    expect(c.reputation).toBe(6 + CONCEPTS.scientist.reputationModifier);
  });

  it("пасынок не получает аристократическое воспитание и получает стигму", () => {
    const c = generateCharacter({ id: "s", seed: 4, parentage: "stray", upbringing: "privileged" });
    expect(c.biography.upbringing).not.toBe("privileged");
    expect(c.talents.some((t) => ["underwaterBreathingStigma", "resilience", "pheromones"].includes(t))).toBe(true);
  });
});

describe("assessCharacter", () => {
  it("отмечает перебор характеристики как ошибку", () => {
    const c = generateCharacter({ id: "z", seed: 1, concept: "soldier", upbringing: "plebeian" });
    c.attributes.strength += 3;
    const a = assessCharacter(c);
    expect(a.valid).toBe(false);
    expect(a.issues.some((i) => i.area === "attributes")).toBe(true);
  });

  it("отмечает навык выше предела создания", () => {
    const c = generateCharacter({ id: "z2", seed: 2, concept: "soldier", role: "legionnaire" });
    const nonKey = SKILL_KEYS.find((k) => !keySkillsOf("soldier", "legionnaire").has(k))!;
    c.skills[nonKey] = 5;
    const a = assessCharacter(c);
    expect(a.valid).toBe(false);
    expect(a.issues.some((i) => i.area === "skills")).toBe(true);
  });
});
