/**
 * The Icons of the Coriolis zodiac.
 *
 * Every character is born under one of the nine Icons. Mechanically an Icon is
 * simply a birth sign the player can invoke; here we model it as a key, a
 * display name, and a one-word association used for flavour on the card. No
 * rulebook prose is reproduced.
 */

export type IconKey =
  | "ladyOfTears"
  | "theGambler"
  | "theDeckhand"
  | "theTraveler"
  | "theMerchant"
  | "theDancer"
  | "theTwoDjinns"
  | "theJudge"
  | "theFaceless";

export interface IconDef {
  key: IconKey;
  name: string;
  /** A single associated theme, useful as a card subtitle. */
  theme: string;
}

export const ICONS: Record<IconKey, IconDef> = {
  ladyOfTears: { key: "ladyOfTears", name: "The Lady of Tears", theme: "Mercy" },
  theGambler: { key: "theGambler", name: "The Gambler", theme: "Fortune" },
  theDeckhand: { key: "theDeckhand", name: "The Deckhand", theme: "Toil" },
  theTraveler: { key: "theTraveler", name: "The Traveler", theme: "Journeys" },
  theMerchant: { key: "theMerchant", name: "The Merchant", theme: "Trade" },
  theDancer: { key: "theDancer", name: "The Dancer", theme: "Passion" },
  theTwoDjinns: { key: "theTwoDjinns", name: "The Two Djinns", theme: "Duality" },
  theJudge: { key: "theJudge", name: "The Judge", theme: "Order" },
  theFaceless: { key: "theFaceless", name: "The Faceless", theme: "Mystery" },
};

export const ICON_KEYS: readonly IconKey[] = Object.keys(ICONS) as IconKey[];
