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

export interface FaceEntry {
  id: string;
  type: FaceType;
  name: string;
  description: string;
  /** Visible only to the game master. */
  masterDescription?: string;
  imageUrl?: string;
  /** Free-form stat block, intentionally optional. */
  statBlock?: string;
  lastLocation?: FaceLocation;
  /** New entries start hidden, and must be explicitly revealed by the GM. */
  hidden: boolean;
}
