/**
 * localStorage-backed `ThirdHorizonRepository`.
 *
 * Stores the single atlas document as one JSON object under one key, so the
 * master's places and the «вы здесь» marker survive a reload during local play.
 * `subscribe` reacts to the browser `storage` event, which fires in *other* tabs
 * of the same browser when the key changes — enough for a shared-screen table.
 * (Same-tab writes don't fire it; the page updates its own state optimistically.)
 */

import type { ThirdHorizonState } from "../domain/thirdHorizon";
import type { ThirdHorizonRepository, Unsubscribe } from "./thirdHorizonRepository";

const DEFAULT_KEY = "cori.thirdHorizon";

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export class LocalStorageThirdHorizonRepository implements ThirdHorizonRepository {
  constructor(private readonly key: string = DEFAULT_KEY) {}

  private read(): ThirdHorizonState | null {
    const store = storage();
    if (!store) return null;
    try {
      const raw = store.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as ThirdHorizonState) : null;
    } catch {
      return null;
    }
  }

  async load(): Promise<ThirdHorizonState | null> {
    const value = this.read();
    return value ? clone(value) : null;
  }

  async save(state: ThirdHorizonState): Promise<void> {
    const store = storage();
    if (!store) return;
    try {
      store.setItem(this.key, JSON.stringify(state));
    } catch {
      // Quota exceeded or serialization failure — nothing sensible to do here.
    }
  }

  subscribe(listener: (state: ThirdHorizonState | null) => void): Unsubscribe {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key !== null && event.key !== this.key) return;
      listener(this.read());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}
