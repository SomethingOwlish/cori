import { describe, expect, it } from "vitest";
import { addPlayer, hasPlayer, isMemberOrGm, normalizeName, type Campaign } from "./campaign";

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "c1",
    name: "Test Run",
    gmName: "Gamemaster",
    joinCode: "ABC123",
    playerNames: [],
    createdAt: 0,
    ...overrides,
  };
}

describe("normalizeName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeName("  Zara  ")).toBe("Zara");
  });
});

describe("hasPlayer", () => {
  it("matches case-insensitively", () => {
    const c = makeCampaign({ playerNames: ["Zara"] });
    expect(hasPlayer(c, "zara")).toBe(true);
    expect(hasPlayer(c, "  ZARA ")).toBe(true);
    expect(hasPlayer(c, "Kael")).toBe(false);
  });
});

describe("addPlayer", () => {
  it("adds a new player (trimmed)", () => {
    const c = addPlayer(makeCampaign(), "  Zara ");
    expect(c.playerNames).toEqual(["Zara"]);
  });

  it("is idempotent for a player already present (case-insensitive)", () => {
    const c = makeCampaign({ playerNames: ["Zara"] });
    const same = addPlayer(c, "ZARA");
    expect(same).toBe(c); // unchanged reference, safe to save unconditionally
    expect(same.playerNames).toEqual(["Zara"]);
  });

  it("ignores empty names", () => {
    const c = makeCampaign();
    expect(addPlayer(c, "   ")).toBe(c);
  });

  it("does not mutate the original", () => {
    const c = makeCampaign();
    addPlayer(c, "Zara");
    expect(c.playerNames).toEqual([]);
  });
});

describe("isMemberOrGm", () => {
  const c = makeCampaign({ gmName: "Gamemaster", playerNames: ["Zara"] });

  it("recognizes the GM by name", () => {
    expect(isMemberOrGm(c, "gamemaster", "gm")).toBe(true);
    expect(isMemberOrGm(c, "Someone", "gm")).toBe(false);
  });

  it("recognizes a joined player", () => {
    expect(isMemberOrGm(c, "zara", "player")).toBe(true);
    expect(isMemberOrGm(c, "Kael", "player")).toBe(false);
  });
});
