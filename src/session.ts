/**
 * Lightweight session for local play.
 *
 * This app has no backend accounts, so "logging in" is just declaring who you
 * are and in what role. There is no password and nothing sensitive here — it is
 * a convenience so the app knows which campaigns and characters to show. The
 * current session is persisted to `localStorage` so a reload keeps you signed
 * in.
 */

export type Role = "gm" | "player";

export interface Session {
  name: string;
  role: Role;
}

const SESSION_KEY = "cori.session";

/** Reads the persisted session, or `null` when signed out / unavailable. */
export function loadSession(): Session | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (
      parsed &&
      typeof parsed.name === "string" &&
      parsed.name.trim() !== "" &&
      (parsed.role === "gm" || parsed.role === "player")
    ) {
      return { name: parsed.name, role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

/** Persists the current session. */
export function saveSession(session: Session): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Non-fatal: session simply won't survive reload.
  }
}

/** Clears the persisted session (sign out). */
export function clearSession(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore.
  }
}
