import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBlankShip, type Ship } from "../domain/coriolis";
import { LocalStorageShipRepository } from "./localStorageShipRepository";

/** Minimal in-memory Storage stand-in (tests run in the node environment). */
class FakeStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

function makeShip(id: string, campaignId: string, overrides: Partial<Ship> = {}): Ship {
  return { ...createBlankShip(id, campaignId), name: `Ship ${id}`, classId: "III", ...overrides };
}

describe("LocalStorageShipRepository", () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: Storage }).localStorage =
      new FakeStorage() as unknown as Storage;
  });

  afterEach(() => {
    delete (globalThis as unknown as { localStorage?: Storage }).localStorage;
  });

  it("returns null for a missing ship", async () => {
    const repo = new LocalStorageShipRepository();
    expect(await repo.get("nope")).toBeNull();
  });

  it("saves and reads back a ship", async () => {
    const repo = new LocalStorageShipRepository();
    await repo.save(makeShip("a", "camp1", { name: "Скарабей" }));
    expect((await repo.get("a"))?.name).toBe("Скарабей");
  });

  it("lists only ships of the requested campaign", async () => {
    const repo = new LocalStorageShipRepository();
    await repo.save(makeShip("a", "camp1"));
    await repo.save(makeShip("b", "camp1", { archived: true }));
    await repo.save(makeShip("c", "camp2"));
    const camp1 = await repo.listByCampaign("camp1");
    expect(camp1.map((s) => s.id).sort()).toEqual(["a", "b"]);
    expect((await repo.listByCampaign("camp2")).map((s) => s.id)).toEqual(["c"]);
  });

  it("upserts by id rather than duplicating", async () => {
    const repo = new LocalStorageShipRepository();
    await repo.save(makeShip("a", "camp1", { name: "First" }));
    await repo.save(makeShip("a", "camp1", { name: "Renamed" }));
    const all = await repo.listByCampaign("camp1");
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Renamed");
  });

  it("returns copies so callers can't mutate stored state", async () => {
    const repo = new LocalStorageShipRepository();
    await repo.save(makeShip("a", "camp1"));
    const got = await repo.get("a");
    got!.weapons.push({ name: "X", bonus: "+0", damage: "1", crit: "1", range: "Ближняя", price: 0 });
    expect((await repo.get("a"))?.weapons).toEqual([]);
  });

  it("deletes a ship", async () => {
    const repo = new LocalStorageShipRepository();
    await repo.save(makeShip("a", "camp1"));
    await repo.delete("a");
    expect(await repo.get("a")).toBeNull();
  });
});
