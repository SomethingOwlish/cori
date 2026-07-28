/**
 * The Campaign model — a table a Game Master runs and players join.
 *
 * A campaign is deliberately thin: it owns its identity, who runs it, a short
 * human-friendly join code players enter to attach themselves, and the roster of
 * player names that have joined. Characters point back at a campaign by id
 * (`Character.campaignId`) rather than being nested here, so the master dashboard
 * can list a campaign's characters through the character repository.
 *
 * The helpers below are pure — id and join-code generation (which need
 * randomness) live in the UI/data layer, mirroring how character ids are minted.
 */

export interface Campaign {
  id: string;
  /** Display name of the campaign, e.g. "Dawn of the Zenithian Cycle". */
  name: string;
  /** Name of the Game Master who created it. */
  gmName: string;
  /** Short code players type to join. Case-insensitive by convention. */
  joinCode: string;
  /** Names of players who have joined, in join order. */
  playerNames: string[];
  /** Creation timestamp (epoch millis), for stable ordering. */
  createdAt: number;
}

/** Normalizes a name for case-insensitive comparison and storage of players. */
export function normalizeName(name: string): string {
  return name.trim();
}

/** True when `playerName` (case-insensitively) already belongs to the campaign. */
export function hasPlayer(campaign: Campaign, playerName: string): boolean {
  const target = normalizeName(playerName).toLowerCase();
  return campaign.playerNames.some((p) => p.toLowerCase() === target);
}

/**
 * Returns a copy of the campaign with `playerName` added to the roster. If the
 * player is already present (case-insensitive), the campaign is returned
 * unchanged so callers can save unconditionally without creating duplicates.
 */
export function addPlayer(campaign: Campaign, playerName: string): Campaign {
  const name = normalizeName(playerName);
  if (!name || hasPlayer(campaign, name)) return campaign;
  return { ...campaign, playerNames: [...campaign.playerNames, name] };
}

/** True when a campaign is run by, or includes, the given person. */
export function isMemberOrGm(campaign: Campaign, name: string, role: "gm" | "player"): boolean {
  if (role === "gm") return campaign.gmName.toLowerCase() === normalizeName(name).toLowerCase();
  return hasPlayer(campaign, name);
}
