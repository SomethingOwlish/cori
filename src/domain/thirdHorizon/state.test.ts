import { describe, expect, it } from "vitest";
import { SYSTEM_BY_ID, THIRD_HORIZON_PORTALS, THIRD_HORIZON_SYSTEMS } from "./systems";
import {
  addCustomPlace,
  emptyState,
  makeCustomPlaceId,
  removeCustomPlace,
  resolvePlaces,
  seedPlaceId,
  setCurrentSystem,
  setPlaceDetails,
  setPlaceHidden,
  setPlaceTags,
  visiblePlaces,
} from "./state";
import type { SystemPlace } from "./types";

const kua = SYSTEM_BY_ID.kua;

function customPlace(overrides: Partial<SystemPlace> = {}): SystemPlace {
  return {
    id: makeCustomPlaceId("kua", "abc"),
    name: "Тайный склад",
    owner: "Синдикат",
    description: "Скрытая база на тёмной стороне луны.",
    tags: [],
    hidden: false,
    ...overrides,
  };
}

describe("canonical map integrity", () => {
  it("has the 36 systems of the Third Horizon", () => {
    expect(THIRD_HORIZON_SYSTEMS).toHaveLength(36);
  });

  it("every portal connects two known, distinct systems", () => {
    for (const p of THIRD_HORIZON_PORTALS) {
      expect(SYSTEM_BY_ID[p.a], `unknown system ${p.a}`).toBeDefined();
      expect(SYSTEM_BY_ID[p.b], `unknown system ${p.b}`).toBeDefined();
      expect(p.a).not.toBe(p.b);
    }
  });

  it("has no duplicate portals (undirected)", () => {
    const seen = new Set<string>();
    for (const p of THIRD_HORIZON_PORTALS) {
      const key = [p.a, p.b].sort().join("|");
      expect(seen.has(key), `duplicate portal ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("has a connected network (every system reachable from Куа)", () => {
    const adj = new Map<string, string[]>();
    for (const s of THIRD_HORIZON_SYSTEMS) adj.set(s.id, []);
    for (const p of THIRD_HORIZON_PORTALS) {
      adj.get(p.a)!.push(p.b);
      adj.get(p.b)!.push(p.a);
    }
    const seen = new Set<string>(["kua"]);
    const queue = ["kua"];
    while (queue.length) {
      for (const n of adj.get(queue.pop()!)!) if (!seen.has(n)) (seen.add(n), queue.push(n));
    }
    expect(seen.size).toBe(THIRD_HORIZON_SYSTEMS.length);
  });

  it("preloads every system's known places from the books", () => {
    for (const s of THIRD_HORIZON_SYSTEMS) expect(s.seedPlaces.length).toBeGreaterThan(0);
  });
});

describe("«вы здесь» marker", () => {
  it("marks exactly one system and replaces the previous one", () => {
    let state = setCurrentSystem(emptyState(), "kua");
    expect(state.currentSystemId).toBe("kua");
    state = setCurrentSystem(state, "dabaran");
    expect(state.currentSystemId).toBe("dabaran");
  });

  it("toggles off when re-selecting the current system", () => {
    const state = setCurrentSystem(setCurrentSystem(emptyState(), "kua"), "kua");
    expect(state.currentSystemId).toBeNull();
  });

  it("ignores unknown systems", () => {
    expect(setCurrentSystem(emptyState(), "atlantis").currentSystemId).toBeNull();
  });
});

describe("places layer", () => {
  it("resolves seeded places without any state", () => {
    const places = resolvePlaces(kua, emptyState());
    expect(places.map((p) => p.name)).toContain("Станция «Кориолис»");
    expect(places.every((p) => p.tags.length === 0 && !p.hidden)).toBe(true);
  });

  it("lets players edit tags on a seeded place via overrides", () => {
    const id = seedPlaceId("kua", 0);
    const state = setPlaceTags(emptyState(), "kua", id, ["столица", "торговля"]);
    const place = resolvePlaces(kua, state).find((p) => p.id === id)!;
    expect(place.tags).toEqual(["столица", "торговля"]);
  });

  it("hides a seeded place from players but not the master", () => {
    const id = seedPlaceId("kua", 1);
    const state = setPlaceHidden(emptyState(), "kua", id, true);
    expect(visiblePlaces(kua, state, false).some((p) => p.id === id)).toBe(false);
    expect(visiblePlaces(kua, state, true).some((p) => p.id === id)).toBe(true);
  });

  it("adds, edits and removes custom places", () => {
    const place = customPlace();
    let state = addCustomPlace(emptyState(), "kua", place);
    expect(resolvePlaces(kua, state).some((p) => p.id === place.id)).toBe(true);

    state = setPlaceDetails(state, "kua", place.id, { name: "Новый склад" });
    expect(resolvePlaces(kua, state).find((p) => p.id === place.id)!.name).toBe("Новый склад");

    state = removeCustomPlace(state, "kua", place.id);
    expect(resolvePlaces(kua, state).some((p) => p.id === place.id)).toBe(false);
  });

  it("keeps a seeded place's canonical name even when details are edited", () => {
    const id = seedPlaceId("kua", 0);
    const original = resolvePlaces(kua, emptyState()).find((p) => p.id === id)!.name;
    const state = setPlaceDetails(emptyState(), "kua", id, { name: "Переименовано", owner: "Фонд" });
    const place = resolvePlaces(kua, state).find((p) => p.id === id)!;
    expect(place.name).toBe(original);
    expect(place.owner).toBe("Фонд");
  });
});
