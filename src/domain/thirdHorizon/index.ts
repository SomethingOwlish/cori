/**
 * Third Horizon map — public domain API.
 *
 * The star map (systems + portals) is fixed and read-only; the mutable places
 * layer and the «вы здесь» marker are pure functions over `ThirdHorizonState`.
 */

export type {
  StarSystem,
  Portal,
  SystemPlace,
  SeedPlace,
  SystemStatus,
  PortalHazard,
} from "./types";

export {
  THIRD_HORIZON_SYSTEMS,
  THIRD_HORIZON_PORTALS,
  SYSTEM_BY_ID,
  PLANET_LEGEND,
} from "./systems";

export {
  type ThirdHorizonState,
  type PlaceOverride,
  emptyState,
  seedPlaceId,
  isCustomPlace,
  makeCustomPlaceId,
  resolvePlaces,
  visiblePlaces,
  setCurrentSystem,
  addCustomPlace,
  removeCustomPlace,
  setPlaceTags,
  setPlaceHidden,
  setPlaceDetails,
} from "./state";
