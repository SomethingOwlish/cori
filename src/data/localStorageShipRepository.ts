/**
 * localStorage-backed `ShipRepository`.
 *
 * Stores every ship as one JSON array under a single key, mirroring the campaign
 * repository. Values are deep-copied in and out so callers can't mutate stored
 * state by holding a reference. `subscribe` reacts to the browser `storage`
 * event, which fires in *other* tabs of the same browser — enough for a
 * shared-screen table (same-tab writes update state optimistically).
 */

import type { Ship } from "../domain/coriolis";
import type { ShipRepository, Unsubscribe } from "./shipRepository";
import { loadCollection, saveCollection } from "./localStorageStore";

const DEFAULT_KEY = "cori.ships";

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export class LocalStorageShipRepository implements ShipRepository {
  constructor(private readonly key: string = DEFAULT_KEY) {}

  private read(): Ship[] {
    return loadCollection<Ship>(this.key);
  }

  private write(ships: Ship[]): void {
    saveCollection(this.key, ships);
  }

  async listByCampaign(campaignId: string): Promise<Ship[]> {
    return this.read()
      .filter((s) => s.campaignId === campaignId)
      .map(clone);
  }

  async get(id: string): Promise<Ship | null> {
    const found = this.read().find((s) => s.id === id);
    return found ? clone(found) : null;
  }

  async save(ship: Ship): Promise<void> {
    const all = this.read();
    const index = all.findIndex((s) => s.id === ship.id);
    if (index >= 0) all[index] = clone(ship);
    else all.push(clone(ship));
    this.write(all);
  }

  async delete(id: string): Promise<void> {
    this.write(this.read().filter((s) => s.id !== id));
  }

  subscribe(campaignId: string, listener: (ships: Ship[]) => void): Unsubscribe {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key !== null && event.key !== this.key) return;
      listener(this.read().filter((s) => s.campaignId === campaignId).map(clone));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}
