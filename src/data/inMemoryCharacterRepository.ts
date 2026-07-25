/**
 * In-memory `CharacterRepository`.
 *
 * Backed by a plain `Map`, this implementation is used by tests and local
 * development where a real backend is unnecessary. It stores deep copies so
 * callers can't mutate persisted state by holding onto a reference, mirroring
 * the copy-on-read/write semantics of a networked store.
 */

import type { Character } from "../domain/coriolis";
import type { CharacterRepository, Unsubscribe } from "./characterRepository";

/** Structured deep copy; falls back to JSON for older runtimes. */
function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryCharacterRepository implements CharacterRepository {
  private readonly store = new Map<string, Character>();
  private readonly listeners = new Map<string, Set<(character: Character | null) => void>>();

  constructor(initial: Iterable<Character> = []) {
    for (const character of initial) {
      this.store.set(character.id, clone(character));
    }
  }

  async get(id: string): Promise<Character | null> {
    const found = this.store.get(id);
    return found ? clone(found) : null;
  }

  async list(): Promise<Character[]> {
    return Array.from(this.store.values(), clone);
  }

  async save(character: Character): Promise<void> {
    this.store.set(character.id, clone(character));
    this.emit(character.id);
  }

  async delete(id: string): Promise<void> {
    if (this.store.delete(id)) {
      this.emit(id);
    }
  }

  subscribe(id: string, callback: (character: Character | null) => void): Unsubscribe {
    let set = this.listeners.get(id);
    if (!set) {
      set = new Set();
      this.listeners.set(id, set);
    }
    set.add(callback);

    // Emit the current value immediately, like a realtime store would.
    const current = this.store.get(id);
    callback(current ? clone(current) : null);

    return () => {
      const listeners = this.listeners.get(id);
      if (!listeners) return;
      listeners.delete(callback);
      if (listeners.size === 0) this.listeners.delete(id);
    };
  }

  private emit(id: string): void {
    const listeners = this.listeners.get(id);
    if (!listeners) return;
    const current = this.store.get(id);
    const snapshot = current ? clone(current) : null;
    for (const listener of listeners) {
      listener(snapshot ? clone(snapshot) : null);
    }
  }
}
