/**
 * Campaign persistence — storage-agnostic contract.
 *
 * Mirrors `CharacterRepository`: UI and application code depend only on this
 * interface, so the backend (localStorage today, Firestore later) can be swapped
 * without touching React.
 */

import type { Campaign } from "../domain/campaign";

export interface CampaignRepository {
  /** Returns the campaign with the given id, or `null` if none exists. */
  get(id: string): Promise<Campaign | null>;

  /** Returns every stored campaign. Ordering is not guaranteed. */
  list(): Promise<Campaign[]>;

  /** Creates or replaces a campaign, keyed by its `id`. */
  save(campaign: Campaign): Promise<void>;

  /** Removes a campaign. Deleting a missing id is a no-op. */
  delete(id: string): Promise<void>;
}
