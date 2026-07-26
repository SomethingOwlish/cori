/**
 * Character persistence — storage-agnostic contract.
 *
 * The repository sits on top of the `Character` domain model and hides where
 * characters actually live (in memory for tests and local dev, Firestore in
 * production). UI and application code depend only on this interface, so the
 * backend can be swapped without touching React.
 */

import type { Character } from "../domain/coriolis";

/** Cancels a `subscribe` registration. */
export type Unsubscribe = () => void;

export interface CharacterRepository {
  /** Returns the character with the given id, or `null` if none exists. */
  get(id: string): Promise<Character | null>;

  /** Returns every stored character. Ordering is not guaranteed. */
  list(): Promise<Character[]>;

  /**
   * Creates or replaces a character. The character's own `id` is the key, so
   * saving an existing id overwrites it.
   */
  save(character: Character): Promise<void>;

  /** Removes a character. Deleting a missing id is a no-op. */
  delete(id: string): Promise<void>;

  /**
   * Optional realtime subscription. Invokes `callback` with the current value
   * immediately (if available) and again whenever it changes, passing `null`
   * when the character is absent or removed. Returns a function that ends the
   * subscription. Backends without realtime support may omit this.
   */
  subscribe?(id: string, callback: (character: Character | null) => void): Unsubscribe;
}
