---
name: coriolis-design
description: Use this skill to generate well-branded interfaces and assets for Coriolis (a mystic old-Arabic space-TTRPG web app for GM & player data), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `styles.css` — link this one file; it `@import`s all tokens (`tokens/*.css`). Everything is CSS custom properties: `--void/--deep/--hull*` (surfaces), `--gold*` (accent), `--ivory/--parchment/--sand*` (ink), `--astral` (links), semantic `--verdant/--amber/--garnet/--lapis`, plus type/space/effect tokens and `--motif-girih/--motif-stars/--motif-rule` background motifs.
- `components/` — React primitives (namespace `window.CoriolisDesignSystem_f33570`): Button, IconButton, Input, Select, Checkbox, Radio, Switch, Card, Badge, Tag, StatBlock, Meter, Avatar, Dialog, Toast, Tooltip, Tabs, DicePool. Each has a `.prompt.md` with usage.
- `ui_kits/coriolis-app/` — full interactive product recreation (login, GM dashboard, crew roster, character sheet, ship, dice roller).
- `guidelines/` — visual specimen cards.

## Voice
Warm, playful, lightly in-world: "Welcome back, spacer." Cinzel uppercase for labels, Cormorant italic for one-line flavor, Spline Sans body, mono for stats. A "success" is a six on a d6. No emoji in production; ✦ is the ornamental glyph; icons are Lucide.
