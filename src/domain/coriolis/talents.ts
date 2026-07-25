/**
 * Talent registry.
 *
 * Talents are special abilities a character learns. This is a lightweight,
 * extensible registry: each entry is a key, a display name, and a short,
 * original one-line summary of what the talent does mechanically. Full rules
 * text is intentionally not reproduced — these summaries exist so the UI and
 * generator have something to reference, and can be expanded later.
 */

export type TalentKind = "general" | "icon" | "concept";

export interface TalentDef {
  key: string;
  name: string;
  kind: TalentKind;
  /** Original short summary of the talent's effect. */
  summary: string;
}

export const TALENTS: Record<string, TalentDef> = {
  // General talents
  bailOut: {
    key: "bailOut",
    name: "Bail Out",
    kind: "general",
    summary: "Escape a vehicle or hazard before it goes down with you.",
  },
  defender: {
    key: "defender",
    name: "Defender",
    kind: "general",
    summary: "Excel at protecting an ally who fights beside you.",
  },
  faction: {
    key: "faction",
    name: "Faction Standing",
    kind: "general",
    summary: "Call in support from a group you have ties to.",
  },

  // Concept talents
  combatVeteran: {
    key: "combatVeteran",
    name: "Combat Veteran",
    kind: "concept",
    summary: "Read a firefight and press an advantage in ranged combat.",
  },
  quickReflexes: {
    key: "quickReflexes",
    name: "Quick Reflexes",
    kind: "concept",
    summary: "Act sooner and slip away when a scene turns dangerous.",
  },
  machineTalker: {
    key: "machineTalker",
    name: "Machine Talker",
    kind: "concept",
    summary: "Coax cooperation out of djinns, drones, and ship systems.",
  },
  fieldMedic: {
    key: "fieldMedic",
    name: "Field Medic",
    kind: "concept",
    summary: "Stabilise the wounded quickly, even under pressure.",
  },
  smoothTalker: {
    key: "smoothTalker",
    name: "Smooth Talker",
    kind: "concept",
    summary: "Turn a tense negotiation your way with the right words.",
  },
  starGazer: {
    key: "starGazer",
    name: "Star Gazer",
    kind: "concept",
    summary: "Draw on deep knowledge of the Horizon's cultures and lore.",
  },
  aceObserver: {
    key: "aceObserver",
    name: "Ace Observer",
    kind: "concept",
    summary: "Notice the detail everyone else missed.",
  },

  // Icon talents
  iconBlessing: {
    key: "iconBlessing",
    name: "Blessing of the Icons",
    kind: "icon",
    summary: "Invoke your birth Icon to reroll against the odds.",
  },
};

export const TALENT_KEYS: readonly string[] = Object.keys(TALENTS);

export function isTalentKey(key: string): boolean {
  return key in TALENTS;
}
