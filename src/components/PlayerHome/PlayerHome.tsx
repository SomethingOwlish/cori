/**
 * PlayerHome — the player's entry after signing in.
 *
 * Shows the campaigns this player has joined and lets them join a new one by the
 * code their Game Master shares. Picking a campaign opens the character builder
 * scoped to it (their player name pre-filled), so anything they save shows up on
 * the GM's dashboard for that campaign.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignRepository, CharacterRepository } from "../../data";
import { addPlayer, hasPlayer, type Campaign } from "../../domain/campaign";
import type { Session } from "../../session";
import { CharacterBuilder } from "../CharacterBuilder";
import "./PlayerHome.css";

export interface PlayerHomeProps {
  session: Session;
  campaigns: CampaignRepository;
  characters: CharacterRepository;
  onSignOut: () => void;
}

export function PlayerHome({ session, campaigns, characters, onSignOut }: PlayerHomeProps) {
  const [all, setAll] = useState<Campaign[]>([]);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setAll(await campaigns.list());
  }, [campaigns]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Campaigns this player is attached to.
  const mine = useMemo(
    () =>
      all
        .filter((c) => hasPlayer(c, session.name))
        .sort((a, b) => b.createdAt - a.createdAt),
    [all, session.name],
  );

  const activeCampaign = activeCampaignId
    ? (all.find((c) => c.id === activeCampaignId) ?? null)
    : null;

  const handleJoin = async () => {
    const entered = code.trim().toUpperCase();
    if (!entered) return;
    setJoinError(null);

    const list = await campaigns.list();
    const match = list.find((c) => c.joinCode.toUpperCase() === entered);
    if (!match) {
      setJoinError("No campaign found with that code.");
      return;
    }

    const updated = addPlayer(match, session.name);
    if (updated !== match) await campaigns.save(updated);

    setCode("");
    await refresh();
    setActiveCampaignId(match.id);
  };

  // ---- Builder for the chosen campaign -----------------------------------
  if (activeCampaign) {
    return (
      <CharacterBuilder
        repository={characters}
        campaignId={activeCampaign.id}
        defaultPlayerName={session.name}
        onBack={() => setActiveCampaignId(null)}
      />
    );
  }

  // ---- Campaign chooser ---------------------------------------------------
  return (
    <div className="ph">
      <header className="ph__head">
        <div>
          <h2 className="ph__title">Your campaigns</h2>
          <p className="ph__welcome">Signed in as {session.name}</p>
        </div>
        <button type="button" className="ph__link" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      <section className="ph__join" aria-label="Join a campaign">
        <h3 className="ph__subhead">Join a campaign</h3>
        <form
          className="ph__join-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleJoin();
          }}
        >
          <input
            value={code}
            placeholder="Enter join code, e.g. K7QP2M"
            onChange={(e) => {
              setCode(e.target.value);
              setJoinError(null);
            }}
            aria-invalid={joinError !== null}
          />
          <button type="submit" className="ph__primary" disabled={code.trim() === ""}>
            Join
          </button>
        </form>
        {joinError && <p className="ph__error">{joinError}</p>}
      </section>

      <section aria-label="Campaigns you've joined">
        <h3 className="ph__subhead">Attached campaigns</h3>
        {mine.length === 0 ? (
          <p className="ph__empty">
            You haven’t joined any campaigns yet. Ask your Game Master for a join code and enter it
            above.
          </p>
        ) : (
          <ul className="ph__list">
            {mine.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="ph__item"
                  onClick={() => setActiveCampaignId(c.id)}
                >
                  <span className="ph__item-name">{c.name}</span>
                  <span className="ph__item-meta">GM: {c.gmName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PlayerHome;
