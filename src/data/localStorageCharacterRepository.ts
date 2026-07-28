/**
 * localStorage-backed `CharacterRepository`.
 *
 * Persists characters as one JSON array so a campaign's roster survives page
 * reloads during local play. Characters carry an optional `campaignId`; callers
 * (the master dashboard, the player's builder) filter `list()` by it to scope a
 * roster to one campaign. Deep-copies on read/write keep stored state immutable
 * from the outside, matching `InMemoryCharacterRepository`.
 */

import type { Character } from "../domain/coriolis";
import type { CharacterRepository } from "./characterRepository";
import { loadCollection, saveCollection } from "./localStorageStore";

const DEFAULT_KEY = "cori.characters";

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export class LocalStorageCharacterRepository implements CharacterRepository {
  constructor(private readonly key: string = DEFAULT_KEY) {}

  private read(): Character[] {
    return loadCollection<Character>(this.key);
  }

  private write(characters: Character[]): void {
    saveCollection(this.key, characters);
  }

  async get(id: string): Promise<Character | null> {
    const found = this.read().find((c) => c.id === id);
    return found ? clone(found) : null;
  }

  async list(): Promise<Character[]> {
    return this.read().map(clone);
  }

  async save(character: Character): Promise<void> {
    const all = this.read();
    const index = all.findIndex((c) => c.id === character.id);
    if (index >= 0) all[index] = clone(character);
    else all.push(clone(character));
    this.write(all);
  }

  async delete(id: string): Promise<void> {
    this.write(this.read().filter((c) => c.id !== id));
  }
}
