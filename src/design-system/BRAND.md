# Coriolis Design System

> **الأفق الثالث · The Third Horizon**
> A design system for **Coriolis** — a web app that helps Game Masters and players run a
> tabletop RPG set in a mystic, old-Arabic vision of deep space. It holds character data,
> crew rosters, ship state, session logs, and dice resolution.

The visual world is an **illuminated star-chart**: a teal-navy void lit by **gold leaf**,
warm **ivory** ink, geometric *girih* tessellation, and Cinzel display caps paired with
Arabic (Amiri) script accents. Think a captain's ledger crossed with an astrolabe.

---

## Sources

This system was authored **from scratch** — no codebase, Figma, or brand assets were
provided. There is **no logo**: the brand is rendered as a **type wordmark** (Cinzel
"CORIOLIS" + Amiri "كوريوليس"). If you have a real mark, drop it in `assets/` and update the
wordmark usages.

- **Direction chosen:** "Illuminated" (see `directions.html` at the project root for the three
  explored options — Third Horizon, Astrolabe HUD, Illuminated).
- **Fonts:** loaded from Google Fonts (see Substitutions below).

---

## Content Fundamentals

Coriolis copy is **warm, playful, and lightly in-world** — a friendly GM at your shoulder,
never a cold dashboard.

- **Voice:** second person, immersive but clear. *"Welcome back, spacer."* *"Sign in to your
  captain's ledger."* Addresses the reader as crew.
- **In-world flavor** appears in *italic Cormorant serif* pull-quotes: *"The Icons watch over
  every jump. Trust the readings, not your gut."* Keep these to one line; never bury a
  function behind flavor.
- **Labels & UI** are plain and functional (Cinzel uppercase): `CALLSIGN`, `ACCESS KEY`,
  `HULL INTEGRITY`, `DARKNESS POINTS`. Function first, flavor as garnish.
- **Casing:** UI labels/eyebrows are UPPERCASE with wide tracking. Titles are Cinzel Title Case.
  Body is sentence case.
- **Vocabulary:** lean on the setting — *spacer, holder, crew, the Icons, Darkness Points,
  portal jump, birr (currency), djinn (AI), the Third Horizon*. A "success" is any **six**
  rolled on a d6.
- **Emoji:** not used in production UI. The ✦ star glyph is used sparingly as an ornamental
  bullet/accent. Iconography is Lucide (see below).
- **Numbers & stats** are always monospace (Spline Sans Mono).

---

## Visual Foundations

- **Palette.** Backgrounds are a teal-navy ladder — `--void #08171c` → `--deep #0d2229`
  (app bg) → `--hull`/`--hull-2`/`--hull-3` (raised panels). The one hero accent is
  **gold leaf** (`--gold #c4965a`, bright/deep variants). Text is **warm ivory**
  (`--ivory` → `--parchment` → `--sand` → `--sand-dim`). A cool **astral cyan** (`--astral`)
  is reserved for links/HUD. Semantic hues are jewel-toned: verdant, amber, garnet, lapis.
- **Type.** Display = **Cinzel** (caps, `.06em` tracking) for titles, wordmark, eyebrows.
  Literary accent = **Cormorant Garamond** italic for flavor/quotes. Body = **Spline Sans**.
  Data/stats = **Spline Sans Mono**. Arabic accents = **Amiri** (pair beside Latin, never
  replace it).
- **Backgrounds & texture.** Never flat black. Radial teal glow from the top, faint
  **starfield dust** (`--motif-stars`), a **girih** eight-point tessellation overlay
  (`--motif-girih`) on hero/header bands, and a gilt **rule strip** (`--motif-rule`) for
  manuscript dividers. Gradients are subtle and dark — deep-navy radial washes, never
  saturated purple/blue SaaS gradients.
- **Corners.** Restrained: `--radius-md 8px` default, `12px` for large panels. Engraved, not
  bubbly.
- **Borders.** Hairline `--line` on dark; **gilt** `--border-gold` (semi-transparent gold) on
  featured/interactive surfaces.
- **Shadows & glow.** Deep soft space shadows (`--shadow-md/lg/xl`). Raised "gilt" panels add a
  **candlelit inner glow** (`--inner-gilt`). Active/interactive gold elements get
  `--glow-gold`. Focus rings are gold (`--ring-gold`).
- **Cards.** Two treatments — `plain` (flat `--hull`, hairline border, small shadow) and
  `gilt` (hull gradient + gold frame + inner glow) for hero/featured content.
- **Buttons.** Primary = **gilt gradient** (`--gold-bright`→`--gold-deep`) with gloss, uppercase
  Cinzel, gold-ink text. Secondary = gold-tint outline. Ghost = bare. Danger = garnet.
- **Motion.** Calm and settling — `--ease-out` (cubic-bezier(.16,1,.3,1)), `120–400ms`. Dialogs
  fade + rise 8px. Dice tumble briefly. No bounces, no infinite loops on content.
- **Hover / press.** Hover lightens toward `--gold-bright` / raises to `--hull-3`. Press deepens
  to `--gold-deep`. Focus shows the gold ring.
- **Imagery vibe.** Cool teal shadows, warm gold highlights, a hint of grain/starfield — like an
  old star map under lamplight.

---

## Iconography

- **System:** **[Lucide](https://lucide.dev)** at ~1.75px stroke, `currentColor` — loaded from
  CDN (`unpkg.com/lucide`). This is a **substitution** (no source icon set existed); swap for a
  house set later if desired. The UI-kit `lib.jsx` wraps it as `<Icon name="rocket" />`.
- **Ornamental glyph:** the ✦ four-point star (Unicode) is used as a gold bullet/accent in tags,
  inputs, and flavor lines. Used sparingly.
- **Arabic script** (Amiri) functions as decorative typographic iconography beside the wordmark
  and section headers — never as functional labels.
- **No emoji** in production surfaces (the dice die-face 🎲 appears only inside a couple of
  specimen cards for convenience; production uses the `DicePool` component).
- No hand-drawn brand SVGs exist; do not invent a logo.

---

## Index / Manifest

Root:
- `styles.css` — the single entry point consumers link (`@import` manifest only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand groups).
- `components/` — reusable primitives (below).
- `ui_kits/coriolis-app/` — the interactive product recreation.
- `directions.html` — the three explored visual directions.
- `SKILL.md` — Agent-Skill wrapper for use in Claude Code.

### Components (18)

Namespace at runtime: `window.CoriolisDesignSystem_f33570`.

**forms/** — `Button`, `IconButton`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
**data/** — `Card`, `Badge`, `Tag`, `StatBlock`, `Meter`, `Avatar`
**feedback/** — `Dialog`, `Toast`, `Tooltip`
**navigation/** — `Tabs`
**game/** — `DicePool`

Each component directory holds `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and a
`@dsCard` demo HTML.

**Intentional additions** (game-specific primitives with no generic equivalent, needed by the
product surfaces): `StatBlock` (attribute readout), `Meter` (hull/HP/reputation resource bar),
`DicePool` (d6 success pool — the signature action-resolution primitive), `Avatar` (crew portrait).

### UI kit: `coriolis-app`

An interactive click-through: **Login → GM Dashboard → Crew Roster → Character Sheet → Ship
Management → Dice Roller**, with a GM/Player mode toggle. Composes the components above.
Files: `index.html` (entry + router), `lib.jsx` (Icon + mock data), and one JSX per screen.

---

## Caveats / Substitutions

- **Fonts** are Google Fonts stand-ins for a bespoke pairing — Cinzel, Cormorant Garamond,
  Spline Sans, Spline Sans Mono, Amiri. Provide licensed/self-hosted files to replace.
- **Icons** are Lucide (CDN) as a substitution — no source set existed.
- **No logo** — wordmark only. Provide a mark to replace the type treatment.
- **"Coriolis" name / setting flavor** here is original work for this web-app tool and does not
  reproduce any third-party publisher's artwork, logos, or copyrighted material.
