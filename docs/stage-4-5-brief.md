# Cori — Brief for Stage 4 (rules verification) and Stage 5 (design)

This document is a self-contained hand-off brief. It captures everything built
so far so no context is lost, and specifies exactly what Stage 4 and Stage 5
require. Paste it into a fresh working session together with the rulebook
materials (see **Source materials**) to continue.

> **Project:** Coriolis: The Third Horizon character toolkit (Year Zero Engine).
> **Stack:** TypeScript + React (Vite), Vitest for tests. Firebase (Firestore)
> for persistence. CI runs `typecheck → test → build` on every PR into `main`.

---

## 1. Working rules (must follow)

- **Mechanics and structure only — never copy rulebook prose.** Talent, icon,
  and concept descriptions are written in original words.
- **One stage = one PR** into `main`, opened ready-for-review, merged only after
  CI is green.
- Restart the working branch from the latest `main` before each new stage
  (`git fetch origin main && git checkout -B <branch> origin/main`). A merged PR
  is finished — never reuse it; open a new PR for follow-up work.
- Commits and PRs in English. The `Character` model in
  `src/domain/coriolis/character.ts` is the single source of truth for anything
  saved or rendered; derived values (HP/MP/encumbrance) are computed, not stored.

---

## 2. What is already done (Stages 1–3, all merged to `main`)

### Domain layer — `src/domain/coriolis/`
- `attributes.ts` — 4 attributes (strength, agility, wits, empathy) + creation
  bounds.
- `skills.ts` — 16 skills (8 general + 8 advanced), each tied to an attribute.
- `icons.ts` — 9 birth Icons of the zodiac (key, name, one-word theme).
- `talents.ts` — talent registry (**currently ~11 talents, explicitly marked
  "representative, not exhaustive"**).
- `concepts.ts` — 10 concepts (key attribute, key skills, suggested talents).
- `character.ts` — the `Character` model + derived helpers.
- `generation.ts` — seed-deterministic generator (`generateCharacter`) and
  `assessCharacter()` validator. **All the tunable rule constants live here.**
- `index.ts` — public API (import from here).

### Persistence layer — `src/data/` (Stage 2)
- `characterRepository.ts` — `CharacterRepository` interface: `get/list/save/
  delete` + optional `subscribe`.
- `inMemoryCharacterRepository.ts` — Map-backed impl (tests/dev).
- `firestore/firebaseApp.ts` — lazy init from `VITE_FIREBASE_*`.
- `firestore/characterConverter.ts` — pure `characterToDocument` /
  `documentToCharacter` with `schemaVersion` + `migrate` hook.
- `firestore/firestoreCharacterRepository.ts` — Firestore impl via
  `FirestoreDataConverter`.
- `.env.example` documents the Firebase keys.

### UI (Stages 1 & 3)
- `src/components/PlayerCard/` — read-only character card.
- `src/components/CharacterBuilder/` — interactive editor: `builderState.ts`
  (pure reducer, bounds enforced) + `CharacterBuilder.tsx` (identity selectors,
  attribute/skill steppers, talent toggles, live `assessCharacter` validation,
  live PlayerCard preview, save/list/reload via the repository).
- `App.tsx` hosts the builder with an in-memory repository.

Tests: `npm run test` (all green). `npm run typecheck` and `npm run build`
also pass.

---

## 3. Stage 4 — Verify generation constants against the rulebook

**Goal:** confirm every character-creation constant against the rulebook,
correct any that are wrong (in the one place they live), and update tests.
This includes porting the **full Достоинства (Talents) list**, which is the
main known gap.

### 3a. Constants to verify — with current values and where they live

| Constant | File | Current value | Rulebook section to check |
|---|---|---|---|
| `ATTRIBUTE_MIN` | `attributes.ts` | `2` | Character creation (attributes) |
| `ATTRIBUTE_MAX` | `attributes.ts` | `4` | ″ |
| `KEY_ATTRIBUTE_MAX` | `attributes.ts` | `5` | ″ (key/concept attribute) |
| `ATTRIBUTE_POINT_POOL` | `generation.ts` | `6` | ″ (points distributed) |
| `AGE_PROFILES.young` | `generation.ts` | skillPoints `8`, maxSkillValue `3`, talentCount `1`, startingReputation `2` | Age table |
| `AGE_PROFILES.middleAged` | `generation.ts` | `10` / `4` / `2` / `3` | ″ |
| `AGE_PROFILES.old` | `generation.ts` | `12` / `5` / `3` / `4` | ″ |
| `UPBRINGING_BIRR` | `generation.ts` | plebeian `1000`, stationary `2000`, privileged `4000` | Upbringing / starting money |
| Concepts set | `concepts.ts` | 10 concepts, each keyAttribute + keySkills + suggestedTalents | Concept list |
| Icons set | `icons.ts` | 9 icons | The Icons / zodiac |
| Skills set | `skills.ts` | 16 skills, attribute + category each | Skill list |

### 3b. Confidence notes (from general Year Zero / Coriolis knowledge — to be confirmed against the book, not treated as fact)
- **Attributes** (base 2, +6 to distribute, max 4, key attribute max 5) and the
  **age table** (8/10/12 skill points, caps 3/4/5, talents 1/2/3) match the
  standard rules and are *likely correct* — but still verify.
- **Reputation** (`startingReputation` 2/3/4 by age) — **needs confirmation**;
  verify whether starting Reputation is age-based and these exact numbers.
- **Starting money by upbringing** (1000/2000/4000 birr) — **needs
  confirmation**; verify the exact birr amounts and whether money is granted
  purely by upbringing.

### 3c. The Talents (Достоинства) gap — highest-value task
`talents.ts` holds only ~11 talents and generation only ever assigns a
concept's `suggestedTalents`. The full talent list from the rulebook is **not**
in the code. Task:
1. Port the **complete general talent list** into `TALENTS`, each with an
   **original one-line summary** (no rulebook prose).
2. Verify each concept's `keyAttribute`, `keySkills`, and `suggestedTalents`
   against the book; correct names/keys as needed.
3. Consider whether icon-specific and concept-specific talents should be modeled
   distinctly (`TalentKind` already exists: `general` / `icon` / `concept`).

### 3d. Also verify
- **Concept list** (`concepts.ts`): names, key attribute, and key skills per
  concept. The current 10 are representative; expand/correct to match the book.
- **Icons** (`icons.ts`): confirm the nine Icons and their names.
- **Skills** (`skills.ts`): confirm the 16 skills, their governing attributes,
  and general/advanced split.

### 3e. Deliverable
- Fix any wrong constant **in its single home**; do not scatter magic numbers.
- Update/extend tests in `generation.test.ts` (and add talent coverage) so they
  assert the corrected values and that generation stays rules-valid.
- One PR, green CI.

---

## 4. Stage 5 — Design pass

Apply a visual design to `PlayerCard` and the builder UI (Claude design pattern
/ Figma). Current styling (`PlayerCard.css`, `CharacterBuilder.css`, `App.css`)
is deliberately plain and structural — safe to replace. Keep the component
structure and the `Character`-driven data flow intact. If syncing with Figma,
the Figma MCP connector must be authorized first.

---

## 5. Source materials (Google Drive)

Folder: `1Oeh2K7gA8j4mxLuk56zmqGZ56NQlC6Rs` (owner: argentummortis@gmail.com).
Files are **text-extractable PDFs** (Studio 101 Russian edition), not scans.

Primary source for Stage 4:
- **`ST3001 Кориолис.pdf`** (core rulebook, id `1SldrQ_6afFFC7zHjA6yR4aOlP7-xAzhn`).
  Relevant chapters (from its table of contents):
  - **«Персонажи игроков» — p. 14–51** (character creation: attributes, skills,
    age, upbringing, reputation, starting money).
  - **«Навыки» (Skills) — p. 52–65.**
  - **«Достоинства» (Talents) — p. 66–79.**  ← note: *Достоинства = Talents* in
    this edition.
- `ST3099 Бланк персонажа.pdf` (character sheet, id
  `1_fjuZhSOXZ1bmcXA5PghtQYy_E9d_doc`) — useful cross-check for the creation
  table.

**Access note:** in the session that produced this brief, only Drive
`search_files` was permitted; `read_file_content` / `download_file_content`
returned "requires approval" and could not be used. To let a working session
read the chapters, **grant the Google Drive connector read access** (claude.ai
connector settings), or **paste the character-creation table (≈ p. 14–20) and
the talents list (≈ p. 66–79)** directly into the chat.

---

## 6. Quick reference — Russian ↔ code terms

| Russian (Studio 101) | Code / English |
|---|---|
| Характеристики / Способности | attributes (strength/agility/wits/empathy) |
| Ключевая характеристика | key attribute (concept) |
| Навыки | skills |
| Достоинства | talents |
| Концепция | concept |
| Возраст: Молодой / Средних лет / Пожилой | ageGroup: young / middleAged / old |
| Происхождение | upbringing |
| Репутация | reputation |
| Бир | birr (currency) |
| Лики | Icons (zodiac) |
