/**
 * App shell and top-level routing.
 *
 * There are three destinations, chosen by the current session:
 *   - signed out   → the Login screen (pick a name and a role)
 *   - Game Master  → MasterDashboard (create campaigns, view every character)
 *   - Player       → PlayerHome (join by code, pick a campaign, build a character)
 *
 * Once signed in, a nav switches between the role home (кампании), the shared
 * Codex справочник, and the «Третий Горизонт» star map. All three are open to
 * both the GM and players (the map and codex adapt what's editable to the role).
 *
 * Campaigns and characters persist to Firestore when Firebase is configured
 * (`VITE_FIREBASE_*`), so a Game Master's campaign and its roster are visible to
 * players joining by code from any other device. When Firebase is not
 * configured — local development, tests — the app falls back to `localStorage`,
 * which keeps a single browser's data across reloads but is not shared.
 */

import { useEffect, useMemo, useState } from "react";
import { Codex } from "./components/Codex";
import { Faces } from "./components/Faces";
import { Login } from "./components/Login";
import { MasterDashboard } from "./components/MasterDashboard";
import { PlayerHome } from "./components/PlayerHome";
import { ThirdHorizonPage } from "./components/ThirdHorizon";
import { ShipPage } from "./components/Ship";
import { hasPlayer, type Campaign } from "./domain/campaign";
import {
  ensureSignedIn,
  FirestoreCampaignRepository,
  FirestoreCharacterRepository,
  FirestoreCodexRepository,
  FirestoreFacesRepository,
  FirestoreShipRepository,
  FirestoreThirdHorizonRepository,
  getFirestoreDb,
  LocalStorageCampaignRepository,
  LocalStorageCharacterRepository,
  LocalStorageCodexRepository,
  LocalStorageFacesRepository,
  LocalStorageShipRepository,
  LocalStorageThirdHorizonRepository,
  readFirebaseConfigFromEnv,
  signInWithGoogle,
  type CampaignRepository,
  type CharacterRepository,
  type CodexRepository,
  type FacesRepository,
  type ShipRepository,
  type ThirdHorizonRepository,
} from "./data";
import { clearSession, loadSession, saveSession, type Session } from "./session";
import "./App.css";

interface Repositories {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
  codex: CodexRepository;
  faces: FacesRepository;
  thirdHorizon: ThirdHorizonRepository;
  ships: ShipRepository;
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
 * Builds the repository set for the app's lifetime. Prefers the shared
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
      faces: new FirestoreFacesRepository(db),
      thirdHorizon: new FirestoreThirdHorizonRepository(db),
      ships: new FirestoreShipRepository(db),
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
      faces: new LocalStorageFacesRepository(),
      thirdHorizon: new LocalStorageThirdHorizonRepository(),
      ships: new LocalStorageShipRepository(),
    };
  }
}

/** Top-level destination once signed in. */
type Page = "home" | "codex" | "faces" | "atlas" | "ship";

export function App() {
  // One repository instance each for the app's lifetime.
  const { characters, campaigns, codex, faces, thirdHorizon, ships } = useMemo(createRepositories, []);
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
  // Three destinations once signed in: the role home (кампании), the shared
  // Codex, and the «Третий Горизонт» map. Both the GM and players see all three.
  const [page, setPage] = useState<Page>("home");
  // Which flavour of the home page to open. Players get two menu entries into it:
  // «Кампании» (the list) and «Карточка персонажа» (jump straight to their card).
  // The nonce forces PlayerHome to remount so the chosen `initialView` re-applies
  // even when we are already on the home page.
  const [homeIntent, setHomeIntent] = useState<{ view: "campaigns" | "card"; nonce: number }>({
    view: "campaigns",
    nonce: 0,
  });
  // Campaigns the signed-in user belongs to — used to resolve the campaign-bound
  // ship page (reachable from the global menu) and to show the ship's debt.
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [shipCampaignId, setShipCampaignId] = useState<string | null>(null);
  // Collapsible nav. Remember the last open/closed choice across reloads.
  const [menuOpen, setMenuOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("cori.menu.open") !== "0";
    } catch {
      return true;
    }
  });

  const toggleMenu = () => {
    setMenuOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem("cori.menu.open", next ? "1" : "0");
      } catch {
        // ignore — приватный режим и т.п.
      }
      return next;
    });
  };

  // Navigate home with a chosen view; bump the nonce so PlayerHome remounts.
  const goHome = (view: "campaigns" | "card") => {
    setHomeIntent((prev) => ({ view, nonce: prev.nonce + 1 }));
    setPage("home");
  };

  // Load the user's campaigns once signed in, to resolve the ship page's
  // campaign and default to the most recent one.
  useEffect(() => {
    if (!authReady || !session) return;
    let cancelled = false;
    void campaigns.list().then((all) => {
      if (cancelled) return;
      const mine = all
        .filter((c) =>
          session.role === "gm"
            ? c.gmName.toLowerCase() === session.name.toLowerCase()
            : hasPlayer(c, session.name),
        )
        .sort((a, b) => b.createdAt - a.createdAt);
      setMyCampaigns(mine);
      setShipCampaignId((prev) => prev ?? mine[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [authReady, session, campaigns, page]);

  // Open the campaign-bound ship page (from the global menu or a campaign view).
  const openShip = (campaignId?: string) => {
    if (campaignId) setShipCampaignId(campaignId);
    setPage("ship");
  };

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

        {authReady && session && (
          <nav className="app__nav" aria-label="Разделы">
            <div
              id="app-menu"
              className={`app__nav-items${menuOpen ? " app__nav-items--open" : ""}`}
            >
              <div className="app__nav-list">
                {session.role === "player" && (
                  <button
                    type="button"
                    className={`app__nav-link${
                      page === "home" && homeIntent.view === "card" ? " app__nav-link--active" : ""
                    }`}
                    aria-current={page === "home" && homeIntent.view === "card"}
                    onClick={() => goHome("card")}
                  >
                    Карточка персонажа
                  </button>
                )}
                <button
                  type="button"
                  className={`app__nav-link${
                    page === "home" && homeIntent.view === "campaigns" ? " app__nav-link--active" : ""
                  }`}
                  aria-current={page === "home" && homeIntent.view === "campaigns"}
                  onClick={() => goHome("campaigns")}
                >
                  {session.role === "gm" ? "Панель ведущего" : "Кампании"}
                </button>
                <button
                  type="button"
                  className={`app__nav-link${page === "codex" ? " app__nav-link--active" : ""}`}
                  aria-current={page === "codex"}
                  onClick={() => setPage("codex")}
                >
                  Кодекс
                </button>
                <button
                  type="button"
                  className={`app__nav-link${page === "faces" ? " app__nav-link--active" : ""}`}
                  aria-current={page === "faces"}
                  onClick={() => setPage("faces")}
                >
                  Лица
                </button>
                <button
                  type="button"
                  className={`app__nav-link${page === "atlas" ? " app__nav-link--active" : ""}`}
                  aria-current={page === "atlas"}
                  onClick={() => setPage("atlas")}
                >
                  Третий Горизонт
                </button>
                <button
                  type="button"
                  className={`app__nav-link${page === "ship" ? " app__nav-link--active" : ""}`}
                  aria-current={page === "ship"}
                  onClick={() => openShip()}
                >
                  Корабль
                </button>
              </div>
            </div>

            <button
              type="button"
              className="app__nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="app-menu"
              onClick={toggleMenu}
            >
              <span className="app__nav-toggle-icon" aria-hidden>
                {menuOpen ? "✕" : "☰"}
              </span>
              Меню
            </button>
          </nav>
        )}
      </header>

      {!authReady ? (
        <p className="app__loading">Подключение…</p>
      ) : !session ? (
        <Login onSignIn={handleSignIn} onGoogleSignIn={handleGoogleSignIn} />
      ) : (
        <>
          {page === "codex" ? (
            <Codex codex={codex} />
          ) : page === "faces" ? (
            <Faces repository={faces} atlas={thirdHorizon} role={session.role} />
          ) : page === "atlas" ? (
            <ThirdHorizonPage
              repository={thirdHorizon}
              editMode={session.role === "gm" ? "master" : "player"}
            />
          ) : page === "ship" ? (
            <ShipPage
              repository={ships}
              codex={codex}
              campaignId={shipCampaignId}
              campaignName={myCampaigns.find((c) => c.id === shipCampaignId)?.name}
              campaignOptions={myCampaigns.map((c) => ({ id: c.id, name: c.name }))}
              onSelectCampaign={setShipCampaignId}
              role={session.role}
              currentUserName={session.name}
            />
          ) : session.role === "gm" ? (
            <MasterDashboard
              session={session}
              campaigns={campaigns}
              characters={characters}
              ships={ships}
              onOpenShip={openShip}
              onSignOut={handleSignOut}
            />
          ) : (
            <PlayerHome
              key={homeIntent.nonce}
              session={session}
              campaigns={campaigns}
              characters={characters}
              ships={ships}
              onOpenShip={openShip}
              onSignOut={handleSignOut}
              initialView={homeIntent.view}
            />
          )}
        </>
      )}
    </main>
  );
}

export default App;
