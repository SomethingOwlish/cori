import { describe, expect, it } from "vitest";
import {
  BUILTIN_CODEX,
  CODEX_CATEGORIES,
  countByCategory,
  groupsForCategory,
  searchCodex,
  type CodexEntry,
} from "./codex";

describe("встроенный каталог кодекса", () => {
  it("содержит записи всех типов, включая корабли", () => {
    const counts = countByCategory(BUILTIN_CODEX);
    for (const c of CODEX_CATEGORIES) expect(counts[c]).toBeGreaterThan(0);
    expect(counts.ship).toBeGreaterThan(0);
  });

  it("раскладывает корабли по подтипам «Корабль · …»", () => {
    const groups = groupsForCategory(BUILTIN_CODEX, "ship");
    expect(groups).toContain("Корабль · Достоинства");
    expect(groups).toContain("Корабль · Модули");
    expect(groups).toContain("Корабль · Орудия");
  });

  it("даёт уникальные id всем записям", () => {
    const ids = BUILTIN_CODEX.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("переносит боевые характеристики оружия из корбука", () => {
    const vulcan = BUILTIN_CODEX.find((e) => e.name === "Вулкан-пистолет");
    expect(vulcan?.category).toBe("weapon");
    expect(vulcan?.stats?.find((s) => s.label === "Урон")?.value).toBe("2");
    expect(vulcan?.tags).toContain("Надёжное");
  });
});

describe("searchCodex", () => {
  const sample: CodexEntry[] = [...BUILTIN_CODEX];

  it("фильтрует по типу", () => {
    const armor = searchCodex(sample, { category: "armor" });
    expect(armor.length).toBeGreaterThan(0);
    expect(armor.every((e) => e.category === "armor")).toBe(true);
  });

  it("ищет по свойству без учёта регистра и буквы ё", () => {
    const silent = searchCodex(sample, { text: "БЕСШУМНОЕ" });
    expect(silent.length).toBeGreaterThan(0);
    // Каждая найденная запись упоминает свойство в тексте или тегах.
    const mentions = (e: CodexEntry) =>
      `${e.summary} ${(e.tags ?? []).join(" ")}`.toLowerCase().includes("бесшумн");
    expect(silent.every(mentions)).toBe(true);
    // Сужение типом оставляет только оружие с этим свойством.
    const silentWeapons = searchCodex(sample, { text: "бесшумное", category: "weapon" });
    expect(silentWeapons.map((e) => e.name)).toContain("Рельсовый пистолет");
  });

  it("сужает по лицензии и уровню технологии", () => {
    const licensed = searchCodex(sample, { licensedOnly: true, tech: "П" });
    expect(licensed.length).toBeGreaterThan(0);
    expect(licensed.every((e) => e.licensed && e.tech === "П")).toBe(true);
  });

  it("groupsForCategory возвращает подгруппы выбранного типа", () => {
    const groups = groupsForCategory(sample, "weapon");
    expect(groups).toContain("Пистолеты");
  });
});
