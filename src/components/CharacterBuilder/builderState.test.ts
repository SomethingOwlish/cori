import { describe, expect, it } from "vitest";

import {
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  CONCEPTS,
  KEY_ATTRIBUTE_MAX,
  KEY_SKILL_CREATION_MAX,
  OTHER_SKILL_CREATION_MAX,
  UPBRINGINGS,
  keySkillsOf,
  startingReputation,
  generateCharacter,
  type Character,
  type SkillKey,
} from "../../domain/coriolis";
import { builderReducer } from "./builderState";

function base(seed = 1): Character {
  return generateCharacter({ id: "test", seed, name: "Base" });
}

describe("builderReducer", () => {
  it("загружает персонажа целиком", () => {
    const replacement = generateCharacter({ id: "other", seed: 9 });
    expect(builderReducer(base(), { type: "load", character: replacement })).toBe(replacement);
  });

  it("перегенерирует, сохраняя id и текст личности", () => {
    const start = base();
    start.name = "Оставить имя";
    start.playerName = "Игрок";
    const rerolled = builderReducer(start, { type: "reroll", seed: 123 });
    expect(rerolled.id).toBe(start.id);
    expect(rerolled).toEqual(
      generateCharacter({ id: start.id, seed: 123, name: "Оставить имя", playerName: "Игрок" }),
    );
  });

  it("устанавливает имя", () => {
    const next = builderReducer(base(), { type: "setText", field: "name", value: "Равок" });
    expect(next.name).toBe("Равок");
  });

  it("очищает необязательное текстовое поле при пустом значении", () => {
    const start = { ...base(), appearance: "шрам" };
    const next = builderReducer(start, { type: "setText", field: "appearance", value: "" });
    expect(next.appearance).toBeUndefined();
  });

  it("синхронизирует богатство и репутацию при смене воспитания", () => {
    const next = builderReducer(base(), { type: "setUpbringing", upbringing: "privileged" });
    expect(next.biography.upbringing).toBe("privileged");
    expect(next.birr).toBe(UPBRINGINGS.privileged.birr);
    expect(next.reputation).toBe(
      startingReputation("privileged", next.biography.parentage, next.concept),
    );
  });

  it("не позволяет пасынку остаться аристократом", () => {
    const priv = builderReducer(base(), { type: "setUpbringing", upbringing: "privileged" });
    const stray = builderReducer(priv, { type: "setParentage", parentage: "stray" });
    expect(stray.biography.upbringing).not.toBe("privileged");
    expect(stray.biography.parentage).toBe("stray");
  });

  it("держит характеристику в пределах, а ключевую поднимает выше", () => {
    const start = { ...base(), concept: "soldier" as const, role: "legionnaire" };
    // Солдат: ключевая — ловкость. Неключевая (смекалка) ограничена 4.
    start.attributes = { ...start.attributes, wits: ATTRIBUTE_MIN };
    const up = builderReducer(start, { type: "adjustAttribute", key: "wits", delta: 10 });
    expect(up.attributes.wits).toBe(ATTRIBUTE_MAX);

    const key = CONCEPTS.soldier.keyAttribute; // agility
    const start2 = { ...base(), concept: "soldier" as const };
    start2.attributes = { ...start2.attributes, [key]: ATTRIBUTE_MIN };
    const next = builderReducer(start2, { type: "adjustAttribute", key, delta: 10 });
    expect(next.attributes[key]).toBe(KEY_ATTRIBUTE_MAX);
  });

  it("держит навык в пределах создания (ключевой ≤3, прочий ≤1)", () => {
    const start = { ...base(), concept: "pilot" as const, role: "ace" };
    const keys = keySkillsOf("pilot", "ace");
    const keySkill = [...keys][0] as SkillKey;
    const nonKey = (Object.keys(start.skills) as SkillKey[]).find((k) => !keys.has(k))!;

    start.skills = { ...start.skills, [keySkill]: 0, [nonKey]: 0 };
    const upKey = builderReducer(start, { type: "adjustSkill", key: keySkill, delta: 10 });
    expect(upKey.skills[keySkill]).toBe(KEY_SKILL_CREATION_MAX);
    const upOther = builderReducer(start, { type: "adjustSkill", key: nonKey, delta: 10 });
    expect(upOther.skills[nonKey]).toBe(OTHER_SKILL_CREATION_MAX);
  });

  it("выбирает достоинство из слота и допускает повторное снятие", () => {
    const options = ["tough", "seasonedWarrior", "reinforcedMusclesImplant"];
    const start = { ...base(), talents: [] };
    const added = builderReducer(start, { type: "chooseTalent", key: "tough", options });
    expect(added.talents).toContain("tough");
    const removed = builderReducer(added, { type: "chooseTalent", key: "tough", options });
    expect(removed.talents).not.toContain("tough");
  });

  it("держит в слоте только одно достоинство (замена, а не добавление)", () => {
    const options = ["tough", "seasonedWarrior", "reinforcedMusclesImplant"];
    const start = { ...base(), talents: ["tough", "keepMe"] };
    const next = builderReducer(start, { type: "chooseTalent", key: "seasonedWarrior", options });
    // Прежний вариант из этого же списка снят, посторонние достоинства сохранены.
    expect(next.talents).toContain("seasonedWarrior");
    expect(next.talents).not.toContain("tough");
    expect(next.talents).toContain("keepMe");
    expect(next.talents.filter((t) => options.includes(t))).toHaveLength(1);
  });

  it("не мутирует исходного персонажа", () => {
    const start = base();
    const before = structuredClone(start);
    builderReducer(start, { type: "adjustAttribute", key: "strength", delta: 1 });
    expect(start).toEqual(before);
  });
});
