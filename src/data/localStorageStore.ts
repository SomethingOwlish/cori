/**
 * Tiny JSON-collection helper over `localStorage`.
 *
 * Both the campaign and character localStorage repositories persist an array of
 * records under a single key. These functions centralize the read/write and
 * degrade gracefully: when `localStorage` is unavailable (SSR, tests, private
 * mode) or a value is corrupt, reads return an empty list and writes are no-ops
 * rather than throwing.
 */

function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    // Accessing localStorage can throw in some sandboxed contexts.
    return null;
  }
}

/** Reads the array stored at `key`, or `[]` when missing/unavailable/corrupt. */
export function loadCollection<T>(key: string): T[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Overwrites the array stored at `key`. Silently no-ops when unavailable. */
export function saveCollection<T>(key: string, items: T[]): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(items));
  } catch {
    // Quota exceeded or serialization failure — nothing sensible to do here.
  }
}
