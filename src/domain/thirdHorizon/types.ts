/**
 * The Third Horizon star map — domain types.
 *
 * The set of systems and the portal jumps between them are FIXED: they mirror
 * the printed map (ST3097 «Карта Третьего Горизонта»). Nodes are never created
 * or moved from the app — the canonical layout lives in `systems.ts`. What the
 * app makes editable is the layer of *places* inside each system and which
 * system the party is currently in («вы здесь»); that mutable layer is modelled
 * in `state.ts`.
 */

/** How settled a system is, per the map legend (colour of the node dot). */
export type SystemStatus =
  | "faction" // Владения фракции (фиолетовый)
  | "civilized" // Цивилизованная система (зелёный)
  | "frontier" // Пограничная система (жёлтый)
  | "undeveloped"; // Неосвоенная система (красный)

/** A portal route can pass through hazardous space, as marked on the map. */
export type PortalHazard =
  | "unstable" // Нестабильные врата
  | "dangerous"; // Опасная территория

/**
 * A place inside a system — a station, temple, ruin, holding, etc. Master-owned
 * content: only the Game Master adds, edits, hides or removes places. The single
 * field players may edit is `tags`.
 */
export interface SystemPlace {
  id: string;
  name: string;
  /** Кто владеет местом. Free text, may be empty for lore locations. */
  owner: string;
  description: string;
  /** The only field players can edit. */
  tags: string[];
  /** When true, players do not see this place; the master always does. */
  hidden: boolean;
}

/** A place seeded from the books — same shape as {@link SystemPlace} minus the runtime fields. */
export type SeedPlace = Pick<SystemPlace, "name" | "owner" | "description">;

/** A star system node. Position, stars, planets and lore are canonical and read-only. */
export interface StarSystem {
  /** Stable slug used as the node id and persistence key. */
  id: string;
  /** Display name, e.g. «Куа». */
  name: string;
  /** Position in the shared SVG coordinate space (see `systems.ts`). */
  x: number;
  y: number;
  status: SystemStatus;
  /** Крупный космопорт present in the system. */
  spaceport: boolean;
  /** One entry per star. `stars.length` is «число светил». */
  stars: string[];
  /**
   * Planet notation exactly as printed on the map, e.g. «6АГ/0/2».
   * Legend: А — пояс астероидов, Г — газовый гигант; «/» separates the bodies of
   * each star in a multiple-star system.
   */
  planets: string;
  /** Which constellation grouping on the map this belongs to. */
  region: string;
  export?: string;
  import?: string;
  /** Canonical known locations from the books (the map's «Особенности»). */
  seedPlaces: SeedPlace[];
}

/** An undirected portal jump between two systems. */
export interface Portal {
  a: string;
  b: string;
  hazard?: PortalHazard;
}
