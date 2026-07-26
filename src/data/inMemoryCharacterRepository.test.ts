import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateCharacter, type Character } from "../domain/coriolis";
import { InMemoryCharacterRepository } from "./inMemoryCharacterRepository";

function makeCharacter(id: string, seed: number): Character {
  return generateCharacter({ id, seed, name: `Char ${id}` });
}

describe("InMemoryCharacterRepository", () => {
  let repo: InMemoryCharacterRepository;

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
  });

  it("returns null for an unknown id", async () => {
    expect(await repo.get("missing")).toBeNull();
  });

  it("saves and retrieves a character", async () => {
    const character = makeCharacter("a", 1);
    await repo.save(character);
    expect(await repo.get("a")).toEqual(character);
  });

  it("lists every stored character", async () => {
    await repo.save(makeCharacter("a", 1));
    await repo.save(makeCharacter("b", 2));

    const all = await repo.list();

    expect(all).toHaveLength(2);
    expect(all.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("overwrites when saving an existing id", async () => {
    const character = makeCharacter("a", 1);
    await repo.save(character);
    await repo.save({ ...character, name: "Renamed" });

    const restored = await repo.get("a");
    expect(restored?.name).toBe("Renamed");
    expect(await repo.list()).toHaveLength(1);
  });

  it("deletes a character", async () => {
    await repo.save(makeCharacter("a", 1));
    await repo.delete("a");
    expect(await repo.get("a")).toBeNull();
  });

  it("treats deleting a missing id as a no-op", async () => {
    await expect(repo.delete("nope")).resolves.toBeUndefined();
  });

  it("seeds from an initial collection", async () => {
    const seeded = new InMemoryCharacterRepository([makeCharacter("a", 1), makeCharacter("b", 2)]);
    expect(await seeded.list()).toHaveLength(2);
  });

  it("stores copies so external mutation does not leak in", async () => {
    const character = makeCharacter("a", 1);
    await repo.save(character);

    character.name = "Mutated";
    character.attributes.strength = 99;

    const restored = await repo.get("a");
    expect(restored?.name).toBe("Char a");
    expect(restored?.attributes.strength).not.toBe(99);
  });

  it("returns copies so mutating a read does not leak back in", async () => {
    await repo.save(makeCharacter("a", 1));

    const first = await repo.get("a");
    first!.name = "Tampered";

    const second = await repo.get("a");
    expect(second?.name).toBe("Char a");
  });

  describe("subscribe", () => {
    it("emits the current value immediately", async () => {
      await repo.save(makeCharacter("a", 1));
      const callback = vi.fn();

      repo.subscribe("a", callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0]?.id).toBe("a");
    });

    it("emits null immediately for an unknown id", () => {
      const callback = vi.fn();
      repo.subscribe("missing", callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it("notifies on save and delete", async () => {
      const callback = vi.fn();
      repo.subscribe("a", callback); // initial null

      await repo.save(makeCharacter("a", 1));
      await repo.delete("a");

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback.mock.calls[0][0]).toBeNull();
      expect(callback.mock.calls[1][0]?.id).toBe("a");
      expect(callback.mock.calls[2][0]).toBeNull();
    });

    it("stops notifying after unsubscribe", async () => {
      const callback = vi.fn();
      const unsubscribe = repo.subscribe("a", callback);
      callback.mockClear();

      unsubscribe();
      await repo.save(makeCharacter("a", 1));

      expect(callback).not.toHaveBeenCalled();
    });

    it("isolates listeners to their own id", async () => {
      const callbackA = vi.fn();
      const callbackB = vi.fn();
      repo.subscribe("a", callbackA);
      repo.subscribe("b", callbackB);
      callbackA.mockClear();
      callbackB.mockClear();

      await repo.save(makeCharacter("a", 1));

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackB).not.toHaveBeenCalled();
    });
  });
});
