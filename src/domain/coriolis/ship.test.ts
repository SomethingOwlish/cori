import { describe, expect, it } from "vitest";
import {
  SHIP_CLASSES,
  SHIP_MODULES,
  SHIP_UPGRADES,
  SHIPYARDS,
} from "./codexShips";
import { assessShip, createBlankShip, mandatoryModules, type Ship } from "./ship";

function baseShip(classId: string): Ship {
  return { ...createBlankShip("s1", "camp1"), classId, name: "Тест" };
}

describe("createBlankShip", () => {
  it("starts with the three mandatory built-in modules and no class", () => {
    const ship = createBlankShip("s1", "camp1");
    expect(ship.classId).toBe("");
    expect(ship.modules).toHaveLength(3);
    expect(ship.modules.every((m) => m.builtIn && m.slots === 0)).toBe(true);
    expect(ship.modules.map((m) => m.name)).toEqual(["Мостик", "Реактор", "Гравитонные двигатели"]);
  });
});

describe("assessShip — base stats and capacity", () => {
  it("uses the class base stats and slot count", () => {
    const cls = SHIP_CLASSES.find((c) => c.cls === "III")!;
    const a = assessShip(baseShip("III"));
    expect(a.stats).toMatchObject({
      energy: cls.energy,
      hull: cls.hull,
      maneuver: cls.maneuver,
      signature: cls.signature,
      armor: cls.armor,
      speed: cls.speed,
    });
    expect(a.slotsTotal).toBe(cls.slots);
    expect(a.slotsUsed).toBe(0); // built-in modules take no slots
    expect(a.basePrice).toBe(cls.price);
    expect(a.violations).toHaveLength(0);
  });

  it("flags a missing class", () => {
    const a = assessShip(createBlankShip("s1", "camp1"));
    expect(a.cls).toBeNull();
    expect(a.violations.some((v) => v.includes("класс"))).toBe(true);
  });
});

describe("assessShip — shipyard modifiers", () => {
  it("applies stat and price modifiers of «Хелеб»", () => {
    const heleb = SHIPYARDS.find((y) => y.name.includes("Хелеб"))!;
    const cls = SHIP_CLASSES.find((c) => c.cls === "III")!;
    const a = assessShip({ ...baseShip("III"), shipyardId: heleb.codexId });
    expect(a.stats.maneuver).toBe(cls.maneuver + 1);
    expect(a.stats.signature).toBe(cls.signature + 1);
    expect(a.basePrice).toBe(Math.round(cls.price * 1.05));
  });

  it("adds class-value slots for «Хальгрия»", () => {
    const halgria = SHIPYARDS.find((y) => y.name.includes("Хальгрия"))!;
    const cls = SHIP_CLASSES.find((c) => c.cls === "III")!;
    const a = assessShip({ ...baseShip("III"), shipyardId: halgria.codexId });
    expect(a.slotsTotal).toBe(cls.slots + 3); // III → +3
    expect(a.stats.maneuver).toBe(cls.maneuver - 1);
  });
});

describe("assessShip — modules, weapons, upgrades", () => {
  it("counts module slots and weapons against capacity", () => {
    const cargo = SHIP_MODULES.find((m) => m.name === "Грузовой отсек")!;
    const a = assessShip({
      ...baseShip("I"), // 3 slots
      modules: [
        ...mandatoryModules(),
        { codexId: cargo.codexId, name: cargo.name, slots: 1, price: cargo.price ?? 0 },
      ],
      weapons: [
        { name: "Рельсовая пушка", bonus: "+1", damage: "1", crit: "2", range: "Средняя", price: 25000 },
      ],
    });
    expect(a.slotsUsed).toBe(2); // 1 module + 1 weapon
    expect(a.modulesPrice).toBe(cargo.price);
    expect(a.weaponsPrice).toBe(25000);
    expect(a.violations).toHaveLength(0);
  });

  it("flags exceeding module compartments", () => {
    const cargo = SHIP_MODULES.find((m) => m.name === "Грузовой отсек")!;
    const ship: Ship = {
      ...baseShip("I"), // only 3 slots
      modules: [
        ...mandatoryModules(),
        ...Array.from({ length: 4 }, () => ({ name: cargo.name, slots: 1, price: cargo.price ?? 0 })),
      ],
    };
    const a = assessShip(ship);
    expect(a.slotsUsed).toBe(4);
    expect(a.violations.some((v) => v.includes("отсек"))).toBe(true);
  });

  it("prices upgrades as a percent of base price and applies their stat mods", () => {
    const heavyArmor = SHIP_UPGRADES.find((u) => u.name === "Тяжёлая броня")!;
    const cls = SHIP_CLASSES.find((c) => c.cls === "III")!;
    const a = assessShip({
      ...baseShip("III"),
      upgrades: [
        {
          codexId: heavyArmor.codexId,
          name: heavyArmor.name,
          costPercent: heavyArmor.costPercent,
          mods: heavyArmor.mods,
        },
      ],
    });
    expect(a.upgradesPrice).toBe(Math.round((heavyArmor.costPercent / 100) * cls.price));
    expect(a.stats.armor).toBe(cls.armor + 1);
    expect(a.stats.maneuver).toBe(cls.maneuver - 1);
  });
});

describe("assessShip — debt", () => {
  it("defaults debt to the total build price", () => {
    const a = assessShip(baseShip("III"));
    expect(a.debt).toBe(a.totalPrice);
    expect(a.totalPrice).toBe(a.basePrice); // no modules/weapons/upgrades
  });

  it("honors a manual debt override", () => {
    const a = assessShip({ ...baseShip("III"), debtOverride: 500000 });
    expect(a.debt).toBe(500000);
    expect(a.debt).not.toBe(a.totalPrice);
  });
});
