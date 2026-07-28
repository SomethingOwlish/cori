/**
 * App shell and top-level routing.
 *
 * There are three destinations, chosen by the current session:
 *   - signed out   → the Login screen (pick a name and a role)
 *   - Game Master  → MasterDashboard (create campaigns, view every character)
 *   - Player       → PlayerHome (join by code, pick a campaign, build a character)
 *
 * Campaigns and characters persist to `localStorage` so a reload keeps a
 * campaign's roster intact. Swapping in the Firestore repositories (see
 * `src/data`) is all it takes to persist to a backend instead.
 */

import { useMemo, useState } from "react";
import { Login } from "./components/Login";
import { MasterDashboard } from "./components/MasterDashboard";
import { PlayerHome } from "./components/PlayerHome";
import {
  LocalStorageCampaignRepository,
  LocalStorageCharacterRepository,
} from "./data";
import { clearSession, loadSession, saveSession, type Session } from "./session";
import "./App.css";

export function App() {
  // One repository instance each for the app's lifetime.
  const characters = useMemo(() => new LocalStorageCharacterRepository(), []);
  const campaigns = useMemo(() => new LocalStorageCampaignRepository(), []);

  const [session, setSession] = useState<Session | null>(() => loadSession());

  const handleSignIn = (next: Session) => {
    saveSession(next);
    setSession(next);
  };

  const handleSignOut = () => {
    clearSession();
    setSession(null);
  };

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Кориолис. Третий Горизонт</h1>
        <p className="app__tagline">Кампании, создание персонажей и карточки героев</p>
      </header>

      {!session ? (
        <Login onSignIn={handleSignIn} />
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
    </main>
  );
}

export default App;
