/**
 * Third Horizon atlas persistence — storage-agnostic contract.
 *
 * The atlas is a single shared document (`ThirdHorizonState`): the master's
 * places and the «вы здесь» marker, visible to every player at the table. Like
 * the campaign/character repositories, the UI depends only on this interface so
 * the backend (localStorage locally, Firestore when configured) can be swapped
 * without touching React. `subscribe` lets viewers see the master's edits live.
 */

import type { ThirdHorizonState } from "../domain/thirdHorizon";

export type Unsubscribe = () => void;

export interface ThirdHorizonRepository {
  /** Loads the stored atlas state, or `null` if nothing has been saved yet. */
  load(): Promise<ThirdHorizonState | null>;

  /** Creates or replaces the single atlas document. */
  save(state: ThirdHorizonState): Promise<void>;

  /**
   * Calls `listener` with the latest state whenever it changes. Returns an
   * unsubscribe. `null` means the document does not exist yet.
   */
  subscribe(listener: (state: ThirdHorizonState | null) => void): Unsubscribe;
}
