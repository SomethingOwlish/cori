/** People, factions and other named entities met by the crew. */

export const FACE_TYPES = ["creature", "person", "organization", "mystic"] as const;
export type FaceType = (typeof FACE_TYPES)[number];

export const FACE_TYPE_LABELS: Record<FaceType, string> = {
  creature: "Существа",
  person: "Люди",
  organization: "Организации",
  mystic: "Мистические",
};

export interface FaceLocation {
  systemId: string;
  placeId: string;
}

/** Compact NPC sheet, based on the «Бланк персонажей ведущего». */
export interface NpcStatBlock {
  physique: string;
  agility: string;
  wits: string;
  empathy: string;
  health: string;
  mind: string;
  skills?: string;
  talents?: string;
  weapons?: string;
  equipment?: string;
}

export interface FaceEntry {
  id: string;
  type: FaceType;
  name: string;
  description: string;
  /** Visible only to the game master. */
  masterDescription?: string;
  imageUrl?: string;
  /** Optional, structured NPC stat block. */
  statBlock?: NpcStatBlock;
  lastLocation?: FaceLocation;
  /** New entries start hidden, and must be explicitly revealed by the GM. */
  hidden: boolean;
  /** A deceased entity remains in the archive but is visually marked. */
  dead?: boolean;
}
