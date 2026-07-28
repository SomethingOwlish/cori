import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Campaign } from "../domain/campaign";
import { LocalStorageCampaignRepository } from "./localStorageCampaignRepository";

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

function makeCampaign(id: string, overrides: Partial<Campaign> = {}): Campaign {
  return {
    id,
    name: `Campaign ${id}`,
    gmName: "GM",
    joinCode: "CODE01",
    playerNames: [],
    createdAt: 0,
    ...overrides,
  };
}

describe("LocalStorageCampaignRepository", () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: Storage }).localStorage =
      new FakeStorage() as unknown as Storage;
  });

  afterEach(() => {
    delete (globalThis as unknown as { localStorage?: Storage }).localStorage;
  });

  it("returns null for a missing campaign", async () => {
    const repo = new LocalStorageCampaignRepository();
    expect(await repo.get("nope")).toBeNull();
  });

  it("saves and reads back a campaign", async () => {
    const repo = new LocalStorageCampaignRepository();
    await repo.save(makeCampaign("a", { name: "Dawn" }));
    const got = await repo.get("a");
    expect(got?.name).toBe("Dawn");
  });

  it("upserts by id rather than duplicating", async () => {
    const repo = new LocalStorageCampaignRepository();
    await repo.save(makeCampaign("a", { name: "First" }));
    await repo.save(makeCampaign("a", { name: "Renamed" }));
    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Renamed");
  });

  it("returns copies so callers can't mutate stored state", async () => {
    const repo = new LocalStorageCampaignRepository();
    await repo.save(makeCampaign("a"));
    const got = await repo.get("a");
    got!.playerNames.push("Intruder");
    const again = await repo.get("a");
    expect(again?.playerNames).toEqual([]);
  });

  it("persists across repository instances (same backing store)", async () => {
    await new LocalStorageCampaignRepository().save(makeCampaign("a", { name: "Persisted" }));
    const fresh = new LocalStorageCampaignRepository();
    expect((await fresh.get("a"))?.name).toBe("Persisted");
  });

  it("deletes a campaign", async () => {
    const repo = new LocalStorageCampaignRepository();
    await repo.save(makeCampaign("a"));
    await repo.delete("a");
    expect(await repo.get("a")).toBeNull();
  });
});
