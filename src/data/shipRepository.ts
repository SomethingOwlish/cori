/**
 * Ship persistence — storage-agnostic contract.
 *
 * A ship belongs to a campaign (`Ship.campaignId`). A campaign has at most one
 * active ship (`archived === false`) plus any number of archived ones. Like the
 * character/campaign repositories, the UI depends only on this interface so the
 * backend (localStorage locally, Firestore when configured) can be swapped
 * without touching React. `subscribe` lets every crew member see the master's
 * edits and the current ship live.
 */

import type { Ship } from "../domain/coriolis";

export type Unsubscribe = () => void;

export interface ShipRepository {
  /** Every ship of a campaign (active + archived). Ordering is not guaranteed. */
  listByCampaign(campaignId: string): Promise<Ship[]>;

  /** Returns the ship with the given id, or `null` if none exists. */
  get(id: string): Promise<Ship | null>;

  /** Creates or replaces a ship, keyed by its `id`. */
  save(ship: Ship): Promise<void>;

  /** Removes a ship. Deleting a missing id is a no-op. */
  delete(id: string): Promise<void>;

  /**
   * Calls `listener` with the campaign's ships whenever they change. Returns an
   * unsubscribe.
   */
  subscribe(campaignId: string, listener: (ships: Ship[]) => void): Unsubscribe;
}
