/**
 * App shell and top-level routing.
 *
 * There are three destinations, chosen by the current session:
 *   - signed out   → the Login screen (pick a name and a role)
 *   - Game Master  → MasterDashboard (create campaigns, view every character)
 *   - Player       → PlayerHome (join by code, pick a campaign, build a character)
 *
 * Campaigns and characters persist to Firestore when Firebase is configured
 * (`VITE_FIREBASE_*`), so a Game Master's campaign and its roster are visible to
 * players joining by code from any other device. When Firebase is not
 * configured — local development, tests — the app falls back to `localStorage`,
 * which keeps a single browser's data across reloads but is not shared.
 */

import { useEffect, useMemo, useState } from "react";
import { Codex } from "./components/Codex";
import { Login } from "./components/Login";
import { MasterDashboard } from "./components/MasterDashboard";
import { PlayerHome } from "./components/PlayerHome";
import {
  ensureSignedIn,
  FirestoreCampaignRepository,
  FirestoreCharacterRepository,
  FirestoreCodexRepository,
  getFirestoreDb,
  LocalStorageCampaignRepository,
  LocalStorageCharacterRepository,
  LocalStorageCodexRepository,
  readFirebaseConfigFromEnv,
  signInWithGoogle,
  type CampaignRepository,
  type CharacterRepository,
  type CodexRepository,
} from "./data";
import { clearSession, loadSession, saveSession, type Session } from "./session";
import "./App.css";

interface Repositories {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
  codex: CodexRepository;
}

/** True when the `VITE_FIREBASE_*` env is fully configured for this build. */
function isFirebaseConfigured(): boolean {
  try {
    readFirebaseConfigFromEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the repository pair for the app's lifetime. Prefers the shared
 * Firestore backend; if Firebase is not configured (`getFirestoreDb` throws on
 * missing `VITE_FIREBASE_*` env), falls back to per-browser localStorage so the
 * app still runs locally. The fallback is logged, not silent, because on a
 * deployed build it means cross-device play is quietly disabled.
 */
function createRepositories(): Repositories {
  try {
    const db = getFirestoreDb();
    return {
      characters: new FirestoreCharacterRepository(db),
      campaigns: new FirestoreCampaignRepository(db),
      codex: new FirestoreCodexRepository(db),
    };
  } catch (error) {
    console.warn(
      "Firebase не настроен — использую локальное хранилище (данные не будут " +
        "видны на других устройствах). Задай переменные VITE_FIREBASE_*.",
      error,
    );
    return {
      characters: new LocalStorageCharacterRepository(),
      campaigns: new LocalStorageCampaignRepository(),
      codex: new LocalStorageCodexRepository(),
    };
  }
}

export function App() {
  // One repository instance each for the app's lifetime.
  const { characters, campaigns, codex } = useMemo(createRepositories, []);
  const firebaseEnabled = useMemo(isFirebaseConfigured, []);

  // Firestore's rules require an authenticated client. When Firebase is
  // configured we sign in anonymously on load and hold the authenticated UI back
  // until that token exists, so no read/write races the rules. Without Firebase
  // (localStorage fallback) there is nothing to wait for.
  const [authReady, setAuthReady] = useState(!firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let cancelled = false;
    ensureSignedIn()
      .catch((error) => {
        console.error("Не удалось выполнить анонимный вход в Firebase.", error);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [firebaseEnabled]);

  const [session, setSession] = useState<Session | null>(() => loadSession());
  // Two destinations once signed in: the role home (кампании) and the shared
  // Codex. Both the GM and players can open the Codex.
  const [page, setPage] = useState<"home" | "codex">("home");

  const handleSignIn = (next: Session) => {
    saveSession(next);
    setSession(next);
  };

  const handleSignOut = () => {
    clearSession();
    setSession(null);
  };

  // Signs in with Google and returns the display name to pre-fill the login, or
  // null if the account has no name. Only wired when Firebase is configured.
  const handleGoogleSignIn = firebaseEnabled
    ? async () => {
        const user = await signInWithGoogle();
        return user.displayName;
      }
    : undefined;

  return (
    <main className="app">
      <header className="app__header crl-girih">
        <div className="app__brand">
          <span className="crl-eyebrow">الأفق الثالث · Третий Горизонт</span>
          <h1 className="app__title crl-wordmark">Кориолис</h1>
          <p className="app__tagline crl-flavor">Капитанский журнал: кампании, герои и их листы.</p>
        </div>
        <span className="app__mark crl-arabic" aria-hidden>
          كوريوليس
        </span>
      </header>

      {!authReady ? (
        <p className="app__loading">Подключение…</p>
      ) : !session ? (
        <Login onSignIn={handleSignIn} onGoogleSignIn={handleGoogleSignIn} />
      ) : (
        <>
          <nav className="app__nav" aria-label="Разделы">
            <button
              type="button"
              className={`app__nav-link${page === "home" ? " app__nav-link--active" : ""}`}
              onClick={() => setPage("home")}
            >
              {session.role === "gm" ? "Панель ведущего" : "Кампании"}
            </button>
            <button
              type="button"
              className={`app__nav-link${page === "codex" ? " app__nav-link--active" : ""}`}
              onClick={() => setPage("codex")}
            >
              Кодекс
            </button>
          </nav>

          {page === "codex" ? (
            <Codex codex={codex} />
          ) : session.role === "gm" ? (
            <MasterDashboard
              session={session}
              campaigns={campaigns}
              characters={characters}
              onSignOut={handleSignOut}
            />
          ) : (
            <PlayerHome
              session={session}
              campaigns={campaigns}
              characters={characters}
              onSignOut={handleSignOut}
            />
          )}
        </>
      )}
    </main>
  );
}

export default App;
