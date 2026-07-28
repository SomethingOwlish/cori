/**
 * localStorage-backed `CampaignRepository`.
 *
 * Stores every campaign as one JSON array under a single key, so the master's
 * campaigns and players' memberships survive a page reload during local play.
 * Values are deep-copied on the way in and out so callers can't mutate stored
 * state by holding a reference, matching the semantics of a networked store.
 */

import type { Campaign } from "../domain/campaign";
import type { CampaignRepository } from "./campaignRepository";
import { loadCollection, saveCollection } from "./localStorageStore";

const DEFAULT_KEY = "cori.campaigns";

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export class LocalStorageCampaignRepository implements CampaignRepository {
  constructor(private readonly key: string = DEFAULT_KEY) {}

  private read(): Campaign[] {
    return loadCollection<Campaign>(this.key);
  }

  private write(campaigns: Campaign[]): void {
    saveCollection(this.key, campaigns);
  }

  async get(id: string): Promise<Campaign | null> {
    const found = this.read().find((c) => c.id === id);
    return found ? clone(found) : null;
  }

  async list(): Promise<Campaign[]> {
    return this.read().map(clone);
  }

  async save(campaign: Campaign): Promise<void> {
    const all = this.read();
    const index = all.findIndex((c) => c.id === campaign.id);
    if (index >= 0) all[index] = clone(campaign);
    else all.push(clone(campaign));
    this.write(all);
  }

  async delete(id: string): Promise<void> {
    this.write(this.read().filter((c) => c.id !== id));
  }
}
