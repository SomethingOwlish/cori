/**
 * MasterDashboard — the Game Master's home.
 *
 * Two levels of navigation, held in local `view` state:
 *   - "list":     the GM's campaigns, plus a form to create a new one.
 *   - "campaign": one campaign — its join code, its players, and a grid of every
 *                 character in it. Clicking a character opens their full player
 *                 card; "Open in builder" edits it. "New character" launches the
 *                 builder scoped to this campaign.
 *   - "builder":  the character builder, tagged with the current campaign.
 *
 * Data comes from injected repositories, so this component is backend-agnostic.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignRepository, CharacterRepository } from "../../data";
import type { Campaign } from "../../domain/campaign";
import { CONCEPTS, type Character } from "../../domain/coriolis";
import type { Session } from "../../session";
import { CharacterBuilder } from "../CharacterBuilder";
import { PlayerCard } from "../PlayerCard";
import "./MasterDashboard.css";

export interface MasterDashboardProps {
  session: Session;
  campaigns: CampaignRepository;
  characters: CharacterRepository;
  onSignOut: () => void;
}

/** Best-effort unique id. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** A short, unambiguous join code (no easily-confused characters). */
function newJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

type View =
  | { kind: "list" }
  | { kind: "campaign"; campaignId: string }
  | { kind: "builder"; campaignId: string; character?: Character };

export function MasterDashboard({
  session,
  campaigns,
  characters,
  onSignOut,
}: MasterDashboardProps) {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [roster, setRoster] = useState<Character[]>([]);
  const [view, setView] = useState<View>({ kind: "list" });
  const [viewing, setViewing] = useState<Character | null>(null);
  const [newName, setNewName] = useState("");

  // Only this GM's campaigns.
  const myCampaigns = useMemo(
    () =>
      allCampaigns
        .filter((c) => c.gmName.toLowerCase() === session.name.toLowerCase())
        .sort((a, b) => b.createdAt - a.createdAt),
    [allCampaigns, session.name],
  );

  const refreshCampaigns = useCallback(async () => {
    setAllCampaigns(await campaigns.list());
  }, [campaigns]);

  const refreshRoster = useCallback(
    async (campaignId: string) => {
      const all = await characters.list();
      setRoster(
        all
          .filter((c) => c.campaignId === campaignId)
          .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)),
      );
    },
    [characters],
  );

  useEffect(() => {
    void refreshCampaigns();
  }, [refreshCampaigns]);

  // Keep the roster in sync whenever we're viewing a campaign.
  useEffect(() => {
    if (view.kind === "campaign") void refreshRoster(view.campaignId);
  }, [view, refreshRoster]);

  const selectedCampaign = useMemo(() => {
    const id = view.kind === "campaign" ? view.campaignId : null;
    return id ? (allCampaigns.find((c) => c.id === id) ?? null) : null;
  }, [view, allCampaigns]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const campaign: Campaign = {
      id: newId(),
      name,
      gmName: session.name,
      joinCode: newJoinCode(),
      playerNames: [],
      createdAt: Date.now(),
    };
    await campaigns.save(campaign);
    setNewName("");
    await refreshCampaigns();
    setView({ kind: "campaign", campaignId: campaign.id });
  };

  const handleDeleteCampaign = async (id: string) => {
    await campaigns.delete(id);
    await refreshCampaigns();
    setView({ kind: "list" });
  };

  // ---- Builder view -------------------------------------------------------
  if (view.kind === "builder") {
    return (
      <CharacterBuilder
        repository={characters}
        campaignId={view.campaignId}
        initialCharacter={view.character}
        onBack={() => setView({ kind: "campaign", campaignId: view.campaignId })}
      />
    );
  }

  // ---- Campaign detail view ----------------------------------------------
  if (view.kind === "campaign" && selectedCampaign) {
    const campaign = selectedCampaign;
    return (
      <div className="md">
        <div className="md__crumbs">
          <button type="button" className="md__link" onClick={() => setView({ kind: "list" })}>
            ← All campaigns
          </button>
        </div>

        <header className="md__camp-head">
          <div>
            <h2 className="md__camp-name">{campaign.name}</h2>
            <p className="md__camp-meta">
              GM: {campaign.gmName} · {roster.length} character
              {roster.length === 1 ? "" : "s"} · {campaign.playerNames.length} player
              {campaign.playerNames.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="md__camp-code" title="Players enter this code to join">
            <span className="md__camp-code-label">Join code</span>
            <span className="md__camp-code-value">{campaign.joinCode}</span>
          </div>
        </header>

        {campaign.playerNames.length > 0 && (
          <div className="md__players">
            {campaign.playerNames.map((p) => (
              <span key={p} className="md__player-chip">
                {p}
              </span>
            ))}
          </div>
        )}

        <div className="md__toolbar">
          <button
            type="button"
            className="md__primary"
            onClick={() => setView({ kind: "builder", campaignId: campaign.id })}
          >
            + New character
          </button>
        </div>

        {roster.length === 0 ? (
          <p className="md__empty">
            No characters yet. Players who join with the code above will appear here, or create one
            with “New character”.
          </p>
        ) : (
          <ul className="md__grid">
            {roster.map((c) => (
              <li key={c.id} className="md__card">
                <button type="button" className="md__card-main" onClick={() => setViewing(c)}>
                  <span className="md__card-name">{c.name || "Unnamed"}</span>
                  <span className="md__card-concept">{CONCEPTS[c.concept].name}</span>
                  <span className="md__card-player">
                    {c.playerName ? `Player: ${c.playerName}` : "No player assigned"}
                  </span>
                </button>
                <div className="md__card-actions">
                  <button type="button" onClick={() => setViewing(c)}>
                    View card
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setView({ kind: "builder", campaignId: campaign.id, character: c })
                    }
                  >
                    Open in builder
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="md__danger">
          <button
            type="button"
            className="md__danger-btn"
            onClick={() => handleDeleteCampaign(campaign.id)}
          >
            Delete campaign
          </button>
        </div>

        {viewing && (
          <div
            className="md__overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Player card for ${viewing.name || "unnamed character"}`}
            onClick={() => setViewing(null)}
          >
            <div className="md__overlay-inner" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="md__overlay-close" onClick={() => setViewing(null)}>
                ✕
              </button>
              <PlayerCard character={viewing} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Campaign list view -------------------------------------------------
  return (
    <div className="md">
      <header className="md__head">
        <div>
          <h2 className="md__title">Game Master dashboard</h2>
          <p className="md__welcome">Signed in as {session.name}</p>
        </div>
        <button type="button" className="md__link" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      <section className="md__create" aria-label="Create campaign">
        <h3 className="md__subhead">Create a campaign</h3>
        <form
          className="md__create-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <input
            value={newName}
            placeholder="Campaign name, e.g. Dawn of the Zenithian Cycle"
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="md__primary" disabled={newName.trim() === ""}>
            Create
          </button>
        </form>
      </section>

      <section aria-label="Your campaigns">
        <h3 className="md__subhead">Your campaigns</h3>
        {myCampaigns.length === 0 ? (
          <p className="md__empty">No campaigns yet. Create your first one above.</p>
        ) : (
          <ul className="md__camp-list">
            {myCampaigns.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="md__camp-item"
                  onClick={() => setView({ kind: "campaign", campaignId: c.id })}
                >
                  <span className="md__camp-item-name">{c.name}</span>
                  <span className="md__camp-item-meta">
                    Join code {c.joinCode} · {c.playerNames.length} player
                    {c.playerNames.length === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default MasterDashboard;
