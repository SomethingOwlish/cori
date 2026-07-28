/**
 * The mutable layer over the fixed Third Horizon map — pure, storage-agnostic.
 *
 * The canonical systems/portals never change. What changes at the table is:
 *   - which system the party is in («вы здесь») — exactly one, or none;
 *   - the places inside systems: the master may enrich or hide the seeded lore
 *     locations and add wholly new ones; players may edit only a place's tags.
 *
 * To keep the canonical lore in code (and versionable), seeded places are NOT
 * copied into the state. Instead the state stores, per seeded place, an override
 * of the mutable fields, plus any custom (master-created) places. `resolvePlaces`
 * merges the two into the list the UI renders.
 */

import { SYSTEM_BY_ID } from "./systems";
import type { StarSystem, SystemPlace } from "./types";

/** Override of a seeded place's mutable fields. Absent keys keep the seeded value. */
export interface PlaceOverride {
  tags?: string[];
  hidden?: boolean;
  owner?: string;
  description?: string;
}

export interface ThirdHorizonState {
  /** The single system marked «вы здесь», or null. */
  currentSystemId: string | null;
  /** Overrides for seeded places, keyed by the place id. */
  overrides: Record<string, PlaceOverride>;
  /** Custom master-created places, keyed by system id. */
  custom: Record<string, SystemPlace[]>;
}

export function emptyState(): ThirdHorizonState {
  return { currentSystemId: null, overrides: {}, custom: {} };
}

/** Deterministic id for the n-th seeded place of a system. */
export function seedPlaceId(systemId: string, index: number): string {
  return `${systemId}::seed::${index}`;
}

/** True for ids minted by {@link makeCustomPlaceId}. Seeded ids return false. */
export function isCustomPlace(id: string): boolean {
  return id.includes("::custom::");
}

/** Mints a custom place id. `rand` supplies the randomness (kept out of this pure module). */
export function makeCustomPlaceId(systemId: string, rand: string): string {
  return `${systemId}::custom::${rand}`;
}

/**
 * The full list of places for a system, seeded lore (with overrides applied)
 * first, then custom places in creation order. Never mutates `state`.
 */
export function resolvePlaces(system: StarSystem, state: ThirdHorizonState): SystemPlace[] {
  const seeded: SystemPlace[] = system.seedPlaces.map((seed, i) => {
    const id = seedPlaceId(system.id, i);
    const ov = state.overrides[id] ?? {};
    return {
      id,
      name: seed.name,
      owner: ov.owner ?? seed.owner,
      description: ov.description ?? seed.description,
      tags: ov.tags ?? [],
      hidden: ov.hidden ?? false,
    };
  });
  return [...seeded, ...(state.custom[system.id] ?? [])];
}

/** Places a viewer may see. Players (`isMaster=false`) never see hidden places. */
export function visiblePlaces(
  system: StarSystem,
  state: ThirdHorizonState,
  isMaster: boolean,
): SystemPlace[] {
  const all = resolvePlaces(system, state);
  return isMaster ? all : all.filter((p) => !p.hidden);
}

/**
 * Marks `systemId` as «вы здесь», replacing any previous marker so at most one
 * system is ever current. Passing the already-current id clears it (toggle).
 * Unknown ids are ignored.
 */
export function setCurrentSystem(state: ThirdHorizonState, systemId: string | null): ThirdHorizonState {
  if (systemId !== null && !SYSTEM_BY_ID[systemId]) return state;
  const next = state.currentSystemId === systemId ? null : systemId;
  return { ...state, currentSystemId: next };
}

/** Adds a custom place to a system. The caller supplies the fully-built place (id included). */
export function addCustomPlace(
  state: ThirdHorizonState,
  systemId: string,
  place: SystemPlace,
): ThirdHorizonState {
  const list = state.custom[systemId] ?? [];
  return { ...state, custom: { ...state.custom, [systemId]: [...list, place] } };
}

/** Removes a custom place. Seeded places cannot be removed (they can only be hidden). */
export function removeCustomPlace(
  state: ThirdHorizonState,
  systemId: string,
  placeId: string,
): ThirdHorizonState {
  const list = state.custom[systemId];
  if (!list) return state;
  return { ...state, custom: { ...state.custom, [systemId]: list.filter((p) => p.id !== placeId) } };
}

/**
 * Sets the tags of a place — the one edit players are allowed. Routes to a
 * custom place's own field, or to a seeded place's override.
 */
export function setPlaceTags(
  state: ThirdHorizonState,
  systemId: string,
  placeId: string,
  tags: string[],
): ThirdHorizonState {
  return isCustomPlace(placeId)
    ? patchCustom(state, systemId, placeId, { tags })
    : patchOverride(state, placeId, { tags });
}

/** Master-only: shows/hides a place from players. */
export function setPlaceHidden(
  state: ThirdHorizonState,
  systemId: string,
  placeId: string,
  hidden: boolean,
): ThirdHorizonState {
  return isCustomPlace(placeId)
    ? patchCustom(state, systemId, placeId, { hidden })
    : patchOverride(state, placeId, { hidden });
}

/** Master-only: edits the descriptive fields (name only applies to custom places). */
export function setPlaceDetails(
  state: ThirdHorizonState,
  systemId: string,
  placeId: string,
  details: { name?: string; owner?: string; description?: string },
): ThirdHorizonState {
  if (isCustomPlace(placeId)) return patchCustom(state, systemId, placeId, details);
  // Seeded place: name is canonical and not overridable; owner/description are.
  const { owner, description } = details;
  return patchOverride(state, placeId, { owner, description });
}

// ── internals ────────────────────────────────────────────────────────────────

function patchOverride(state: ThirdHorizonState, placeId: string, patch: PlaceOverride): ThirdHorizonState {
  const merged = { ...(state.overrides[placeId] ?? {}), ...prune(patch) };
  return { ...state, overrides: { ...state.overrides, [placeId]: merged } };
}

function patchCustom(
  state: ThirdHorizonState,
  systemId: string,
  placeId: string,
  patch: Partial<SystemPlace>,
): ThirdHorizonState {
  const list = state.custom[systemId];
  if (!list) return state;
  const next = list.map((p) => (p.id === placeId ? { ...p, ...prune(patch) } : p));
  return { ...state, custom: { ...state.custom, [systemId]: next } };
}

/** Drops `undefined` keys so a partial patch never clobbers a field with `undefined`. */
function prune<T extends object>(patch: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
