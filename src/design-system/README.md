# Coriolis Design System (in-app)

> **الأفق الثالث · Третий Горизонт** — an illuminated star-chart: a teal-navy void
> lit by gold leaf, warm ivory ink, girih tessellation, Cinzel display caps with
> Amiri script accents. A captain's ledger crossed with an astrolabe.

This folder is the production copy of the shipped **Coriolis Design System**. Use it
so every screen speaks the same visual language.

## Files

| File | What it is |
| --- | --- |
| `tokens.css` | All design tokens (colors, type, spacing, radii, shadows, motifs) + webfont `@import`. **Source of truth.** |
| `base.css` | Global reset, the star-chart body background, focus rings, and brand primitives (`.crl-wordmark`, `.crl-eyebrow`, `.crl-title`, `.crl-flavor`, `.crl-arabic`, `.crl-girih`, `.crl-stars`, `.crl-rule`). |
| `primitives.tsx` | Typed React components ported 1:1 from the design system. |
| `primitives.css` | Hover / focus / press states for the primitives. |
| `index.ts` | Barrel — `import { Card, Button } from "../design-system"`. |
| `BRAND.md` | Full brand book (voice, palette rationale, iconography, caveats). |
| `SKILL.md` | The original Agent-Skill wrapper. |

`tokens.css` and `base.css` are imported once in `src/main.tsx`; `primitives.css`
is pulled in automatically by `primitives.tsx`.

## Components

`Card` (`variant="gilt"` for hero/featured), `StatBlock`, `Meter` (`segments` for a pip
meter), `Badge`, `Tag`, `Button` (`primary`/`secondary`/`ghost`/`danger`), `IconButton`,
`Input`, `Textarea`, `Select`, `Dialog`, `DicePool`, `Tabs`, `Avatar`, `Rule`.

## Rules of thumb

- **Voice:** warm, lightly in-world — *«С возвращением, космач»*. Function first, flavor
  as garnish (italic Cormorant, one line).
- **Casing:** UI labels/eyebrows are UPPERCASE Cinzel with wide tracking; titles are Cinzel
  Title Case; body is sentence case. **Numbers & stats are always monospace.**
- **Color:** backgrounds ride the teal-navy ladder (`--void` → `--deep` → `--hull*`). The one
  hero accent is gold leaf (`--gold*`). Astral cyan is for links/HUD. Semantic hues are
  jewel-toned (`--verdant`/`--amber`/`--garnet`/`--lapis`).
- **Surfaces:** two card treatments — `plain` (flat hull + hairline) and `gilt` (hull gradient
  + gold frame + candlelit inner glow) for featured content.
- **Corners:** restrained (`--radius-md` 8px, `--radius-lg` 12px). Engraved, not bubbly.
- **Motion:** calm and settling — `--ease-out`, 120–400ms. No bounces or infinite loops.
- **Emoji:** not used in production. `✦` is the ornamental glyph. Never flat black backgrounds.

Reach for `BRAND.md` for the complete guidelines.
