# Cori — Brief for Stage 4 (rules verification) and Stage 5 (design)

This document is a self-contained hand-off brief. It captures everything built
so far so no context is lost, and specifies exactly what Stage 4 and Stage 5
require. Paste it into a fresh working session together with the rulebook
materials (see **Source materials**) to continue.

> **Project:** Coriolis: The Third Horizon character toolkit (Year Zero Engine).
> **Stack:** TypeScript + React (Vite), Vitest for tests. Firebase (Firestore)
> for persistence. CI runs `typecheck → test → build` on every PR into `main`.

> **Status of this brief:** the character-creation, skills, and talents chapters
> of the **Studio 101 Russian edition** core rulebook (`ST3001 Кориолис.pdf`)
> have now been read directly (pp. 16–79). **Section 3 below is verified against
> the book, not guessed.** It supersedes the earlier "needs confirmation" notes.
> The verification surfaced a **structural mismatch** in the current code — see
> §3a.

---

## 1. Working rules (must follow)

- **Mechanics and structure only — never copy rulebook prose.** Talent, icon,
  and concept descriptions are written in original words. (The tables below list
  rulebook *names* and *mechanical values* — game data the project models — not
  the book's descriptive text.)
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
- `talents.ts` — talent registry (**currently ~11 talents with invented names,
  explicitly marked "representative, not exhaustive"**).
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

**Goal:** make character creation match the rulebook. The verification is done
(below); Stage 4 is now an **implementation** task — correct the wrong constants
and structure in their single home, port the full talents list, and update tests.

### 3a. Headline finding — creation axis is Upbringing, not Age

The core rulebook (Studio 101 «Кориолис», ch. 2, pp. 16–51) has **no age
mechanic at all**. Character creation is driven by **Воспитание (Upbringing)**,
a three-tier social class: **Плебей / Орбитал / Аристократ** (Plebeian /
Orbital / Aristocrat). Upbringing sets attribute points, skill points, base
reputation, and starting money.

The current code instead drives generation off an invented **`AgeGroup`**
(young/middle-aged/old → `AGE_PROFILES` in `generation.ts`), and its `Upbringing`
type (`plebeian | stationary | privileged`) only controls starting money.
**This is the single biggest correction in Stage 4.**

> The 8/10/12 skill-point numbers in the code's age table are real numbers —
> but in the book they belong to the three **upbringings**, not to ages. The
> code kept the numbers and attached them to the wrong axis.

Recommended shape after the fix:
- Remove `AgeGroup` / `AGE_PROFILES` as the generation driver (or keep `AgeGroup`
  as pure flavour with no mechanical effect — decide during implementation; the
  book gives it none).
- Introduce an `UPBRINGING_PROFILES` map keyed by the three real upbringings,
  each carrying `attributePoints`, `skillPoints`, `baseReputation`, `startingBirr`.
- Rename the upbringing union to match the book: **`plebeian | orbital |
  aristocrat`** (current `stationary`→`orbital`, `privileged`→`aristocrat`).
  This touches `character.ts`, `generation.ts`, the Firestore converter's
  `migrate` hook, and the builder UI — treat it as a schema change.

### 3b. Verified creation tables (Table 2.2 / 2.4, pp. 23–25)

**Attributes** — every attribute starts at **0**; distribute the upbringing's
attribute points; **each attribute must land in 2–4**, except the **key
attribute** (set by the character's amplua, §3f) which may reach **5**.

**Skills** — every skill starts at **0**; distribute the upbringing's skill
points; **key skills (from the amplua/role) may reach 3, every other skill is
capped at 1 at creation.** (Overall skill ceiling is 5, reached only through play
via XP.) General skills can be rolled at value 0 (attribute only); special skills
require value > 0 to be used.

| Upbringing (Воспитание) | Attribute pts | Skill pts | Base Reputation | Starting money |
|---|---|---|---|---|
| **Plebeian** (Плебей)     | **15** | **8**  | **2** | **500 birr**  |
| **Orbital** (Орбитал)     | **14** | **10** | **4** | **1000 birr** |
| **Aristocrat** (Аристократ) | **13** | **12** | **6** | **5000 birr** |

**Reputation** is `upbringing base + amplua modifier` (§3f), then **halved for
пасынки (bastards)**: a bastard plebeian starts at 1, a bastard orbital at 2
(bastards can only be plebeian or orbital). Reputation cannot drop below 0.

**Derived (confirmed, already correct in code):** HP = Strength + Agility;
MP = Wits + Empathy; encumbrance slots = Strength × 2.

### 3c. Constants to change — current vs. correct

| Constant / structure | File | Current | Correct (per rulebook) |
|---|---|---|---|
| Creation driver | `generation.ts` | `AGE_PROFILES` by `AgeGroup` | Upbringing profiles by `Upbringing` |
| `ATTRIBUTE_MIN` / `MAX` | `attributes.ts` | 2 / 4 | 2 / 4 ✅ (unchanged) |
| `KEY_ATTRIBUTE_MAX` | `attributes.ts` | 5 | 5 ✅ (unchanged) |
| Attribute points | `generation.ts` (`ATTRIBUTE_POINT_POOL = 6` on top of base 2) | flat 6 → total 14 | **15 / 14 / 13 by upbringing** (as *totals* from base 0) |
| Skill points | `AGE_PROFILES.*.skillPoints` (8/10/12 by age) | by age | **8 / 10 / 12 by upbringing** |
| Skill cap at creation | `AGE_PROFILES.*.maxSkillValue` (3/4/5 by age) | by age | **key skills 3, all others 1** (not an age curve) |
| Starting talents | `AGE_PROFILES.*.talentCount` (1/2/3 by age) | by age | **exactly 3** for every character (see §3e) |
| Starting reputation | `AGE_PROFILES.*.startingReputation` (2/3/4 by age) | by age | **upbringing base (2/4/6) + amplua mod**, bastards halve |
| `UPBRINGING_BIRR` | `generation.ts` | 1000 / 2000 / 4000 | **500 / 1000 / 5000** |
| Icon `theTwoDjinns` | `icons.ts` | "The Two Djinns" | **The Messenger (Вестник)** — no "Two Djinns" in this edition |
| `culture` attribute | `skills.ts` | governed by `wits` | Мудрость is governed by **эмпатия (empathy)** |
| Concept set | `concepts.ts` | 10 invented concepts | **11 amplua** with corrected key attributes (§3f) |
| Talents | `talents.ts` | ~11 invented names | full rulebook lists (§3d, Appendix A) |

### 3d. The Talents (Достоинства) — full lists (Chapter 4, pp. 66–79)

Talent **names and groupings** are game data (listed in Appendix A). The
rulebook's prose descriptions must **not** be copied — write an original
one-line summary per talent when porting, as `talents.ts` already does.

The book groups talents into distinct kinds. `TalentKind` in code is currently
`general | icon | concept`; the real taxonomy is richer and worth modelling:

| Rulebook group | Count | Notes |
|---|---|---|
| Team talents (Достоинства команды, Table 4.1) | 15 | Tied to the **team's** amplua (5 team types × 3), not the character's. |
| Icon gifts (Дары Ликов, Table 4.2) | 9 | One per Icon; assigned by birth Icon, never bought. |
| Personal talents (Личные достоинства, Table 4.3) | 26 | The main pool; a character picks 1 at creation from their amplua's 3 options. |
| Bastard stigmas (Стигмы пасынков, Table 4.4) | 3 | Only for пасынки; never bought. |
| Cybernetic implants (Table 4.5) | 16 | Talent **and** gear; cost birr + XP. |
| Bionic modifications (Table 4.6) | 7 | Talent **and** gear; cost birr + XP. |
| Mystic powers (Мистические практики, Table 4.7) | 10 | Require Mysticism > 0. |

### 3e. Starting talents rule (pp. 25, 68)

Every character starts with **exactly three** talents:
1. **one team talent** — from the team amplua (chosen jointly),
2. **one personal talent** — from the character amplua's 3 listed options,
3. **one Icon gift** — from the randomly rolled birth Icon.

Plus, if the character is a **пасынок (bastard)**, a **stigma** (4th). And if the
character is a **mystic** (Mysticism > 0), their personal talent **must** be a
mystic power. New talents later cost 5 XP each.

> The current generator takes `conceptDef.suggestedTalents.slice(0, talentCount)`
> — i.e. 1–3 talents all from one flat list. Correct it to the three-source rule
> above (team + personal + Icon gift).

### 3f. Amplua (the real "concepts") — key attribute & reputation (pp. 30–51)

There are **11 amplua**, each with a fixed **key attribute**, a **reputation
modifier**, and **three roles**; each role has its own four **key skills**
(full role→key-skill table in Appendix B). The code's `concepts.ts` should be
rebuilt from this. Note several key-attribute mismatches vs. current code
(e.g. code's Soldier = strength, but the book's Солдат key attribute is
**agility**; code's Operator = wits, book's Оперативник = **agility**).

| Amplua | Key attribute | Rep. mod |
|---|---|---|
| Artist (Артист) | Empathy | +1 |
| Data Spider (Сетевой паук) | Wits | +0 |
| Fugitive (Беглец) | Empathy | −2 |
| Negotiator (Негоциант) | Empathy | +1 |
| Operative (Оперативник) | Agility | +0 |
| Pilot (Пилот) | Agility | +0 |
| Preacher (Проповедник) | Empathy | +1 |
| Scientist (Учёный) | Wits | +1 |
| Sailor (Матрос) | Strength | −1 |
| Soldier (Солдат) | Agility | −1 |
| Pathfinder (Первопроходец) | Wits | +0 |

> Modelling decision for implementation: key skills are defined **per role**, not
> per amplua, and the key attribute is **per amplua**. Either model roles as a
> sub-level of amplua, or (simpler first pass) collapse each amplua to a
> representative key-skill set and note the loss. Reputation is a modifier, so the
> generator must compute `upbringingBase + ampluaMod` rather than reading a flat
> `startingReputation`.

### 3g. Verified sets (no change needed to counts)

- **Icons — 9** (Table 2.5, d66 roll). Names: Lady of Tears (Владычица Слёз),
  Dancer (Танцор), Gambler (Игрок), Merchant (Купец), Deckhand (Юнга), Traveler
  (Странник), **Messenger (Вестник)**, Judge (Судья), Faceless (Незримый). Fix
  the code's `theTwoDjinns` → Messenger.
- **Skills — 16** with attributes confirmed (Appendix C). Only correction:
  `culture` (Мудрость) is **empathy**, not wits.
- **Attributes — 4**: Strength (Телосложение), Agility (Ловкость), Wits
  (Смекалка), Empathy (Эмпатия). ✅

### 3h. Deliverable

- Fix every wrong constant **in its single home**; do not scatter magic numbers.
- Rework the generation driver from age → upbringing (schema change; update the
  Firestore converter `migrate` hook and the builder UI accordingly).
- Port the talent lists (Appendix A) with original one-line summaries.
- Rebuild concepts from the 11 amplua (Appendix B).
- Update/extend `generation.test.ts` (and add talent coverage) so tests assert
  the corrected values and that generation stays rules-valid.
- One PR, green CI.

---

## 4. Stage 5 — Design pass

Apply a visual design to `PlayerCard` and the builder UI (Claude design pattern
/ Figma). Current styling (`PlayerCard.css`, `CharacterBuilder.css`, `App.css`)
is deliberately plain and structural — safe to replace. Keep the component
structure and the `Character`-driven data flow intact. If syncing with Figma,
the Figma MCP connector must be authorized first.

---

## 5. Source materials

The rulebook PDFs are the Studio 101 Russian edition (text-extractable, not
scans). In the session that produced this revision they were provided as a
**local folder** and read directly with a PDF text extractor (`pypdf`). Page
index in `ST3001 Кориолис.pdf` equals the printed book page number.

Primary source for Stage 4 — **`ST3001 Кориолис.pdf`** (core rulebook):
- **«Персонажи игроков» pp. 16–51** — character creation. Key pages: **Table 2.2
  Воспитание p. 23**, **Table 2.4 Пункты навыков p. 25**, **Table 2.5
  Лик-покровитель p. 25**, amplua descriptions **pp. 30–51**.
- **«Навыки» pp. 52–65** — the 16 skills (summary list p. 24).
- **«Достоинства» (Talents) pp. 66–79** — talent tables 4.1–4.7. *Достоинства =
  Talents in this edition.*

Cross-check sheet: `ST3099 Бланк персонажа.pdf`.

> If a future session lacks the local folder, everything Stage 4 needs is already
> captured in §3 and the appendices below.

---

## 6. Quick reference — Russian ↔ code terms

| Russian (Studio 101) | Code / English |
|---|---|
| Характеристики / Способности | attributes (strength/agility/wits/empathy) |
| Телосложение / Ловкость / Смекалка / Эмпатия | strength / agility / wits / empathy |
| Ключевая характеристика | key attribute (from amplua) |
| Навыки | skills |
| Достоинства | talents |
| Амплуа (роль) | amplua / "concept" (role) |
| Воспитание: Плебей / Орбитал / Аристократ | upbringing: plebeian / orbital / aristocrat |
| Репутация | reputation |
| Бир / бирка | birr (currency) / birr chip |
| Лики | Icons (zodiac) |
| Пасынок | bastard (halved reputation, gets a stigma) |
| Мистические практики | mystic powers (need Mysticism > 0) |

---

## Appendix A — Talent lists (names only; write original summaries when porting)

Russian source name → suggested English name/key.

**Team talents (Table 4.1), by team amplua:**
- *Free Traders:* Нюх на бирры → Nose for Birr · Ты — мне, я — тебе → You Scratch My Back · Кратчайший путь → Shortcut
- *Mercenaries:* Огонь! → Fire! · В атаку! → Charge! · Не зевать! → Stay Sharp
- *Agents:* Сто друзей → A Hundred Friends · Гильдия убийц → Assassins' Guild · Танцоры Алама → Dancers of Alam
- *Explorers:* Бывалые путешественники → Seasoned Travelers · Остаться в живых → Survivors · Искатели истины → Truth Seekers
- *Pilgrims:* Шутники → Jesters · Милость Ликов → Grace of the Icons · Без бирра за душой → Busking

**Icon gifts (Table 4.2):** Gift of the Lady of Tears · Gift of the Dancer ·
Gift of the Gambler · Gift of the Merchant · Gift of the Deckhand · Gift of the
Traveler · Gift of the Messenger · Gift of the Judge · Gift of the Faceless.

**Personal talents (Table 4.3, 26):** Бегун → Runner · Благословитель → Blesser ·
Богатая семья → Rich Family *(aristocrat only)* · Быстрая перезарядка → Fast
Reload · Выстрел в упор → Point-Blank Shot · Грозный вид → Intimidating · Девять
жизней → Nine Lives · Закалка → Hardened · Защитная стойка → Defensive Stance ·
Здоровяк → Rugged *(+2 HP)* · Зловещий → Sinister · Изобличитель → Lie Detector ·
Изобретатель → Inventor · Коварный удар → Backstab · Лицензиат → Licensed ·
Обольститель → Seducer · Опытный воин → Veteran Warrior · Освятитель →
Consecrator · Палач → Executioner · Полевой медикург → Field Medicurg · Привычка
к невесомости → Zero-G Training · Пулемётчик → Machine Gunner · Утешитель →
Comforter · Член фракции → Faction Member · Шестое чувство → Sixth Sense ·
Экзотехник → Exo Technician.

**Bastard stigmas (Table 4.4, 3):** Подводное дыхание → Underwater Breathing ·
Стойкость → Resilience · Феромоны → Pheromones.

**Cybernetic implants (Table 4.5, 16):** Активный сенсор → Active Sensor ·
Встроенное оружие → Built-in Weapon · Детектор лжи → Lie Detector · Интерпретатор
→ Interpreter · Кожные электроды → Skin Electrodes · Коммуникатор → Communicator ·
Оптимизированный метаболизм → Optimized Metabolism · Пассивный сенсор → Passive
Sensor · Подводное дыхание → Underwater Breathing · Подкожная броня → Subdermal
Armor · Сервосуставы → Servo Joints · Усиленные мышцы → Reinforced Muscles ·
Усиленный голос → Amplified Voice · Усиленный скелет → Reinforced Skeleton ·
Ускоренная реакция → Boosted Reflexes · Целеуказатель → Targeting Eye.

**Bionic modifications (Table 4.6, 7):** Вживлённое оружие → Implanted Weapon ·
Координация → Coordination · Морфирование → Morphing · Прекрасная внешность →
Beautiful Appearance · Регенерация → Regeneration · Скорость → Speed · Улучшенный
интеллект → Enhanced Intellect.

**Mystic powers (Table 4.7, 10):** Забвение → Oblivion · Интуиция → Intuition ·
Ментальный контакт → Mind Link · Постижение → Insight · Предчувствие →
Premonition · Прорицание → Divination · Телекинез → Telekinesis · Чтение мыслей →
Mind Reading · Экзорцизм → Exorcism · Ясновидение → Clairvoyance.

---

## Appendix B — Amplua roles → key skills (pp. 30–51)

Each role's four key skills (may reach 3 at creation). Amplua key attribute and
reputation modifier are in §3f.

- **Artist** — Companion: Manipulation, Culture, Dexterity, Observation · Musician: Manipulation, Culture, Infiltration, Observation · Poet: Manipulation, Culture, Dexterity, Infiltration
- **Data Spider** — Analyst: Data Djinn, Culture, Manipulation, Science · Correspondent: Culture, Manipulation, Infiltration, Observation · Net Djinn: Data Djinn, Manipulation, Observation, Science
- **Fugitive** — Criminal: Force, Melee Combat, Dexterity, Infiltration · Mystic: Manipulation, Mysticism, Dexterity, Infiltration · Revolutionary: Ranged Combat, Dexterity, Observation, Survival
- **Negotiator** — Agitator: Data Djinn, Force, Manipulation, Culture · Diplomat: Command, Culture, Manipulation, Melee Combat · Dealer: Culture, Manipulation, Observation, Pilot
- **Operative** — Assassin: Infiltration, Dexterity, Melee Combat, Ranged Combat · Guard: Force, Melee Combat, Ranged Combat, Observation · Spy: Data Djinn, Manipulation, Infiltration, Ranged Combat
- **Pilot** — Driver: Force, Pilot, Ranged Combat, Survival · Ace: Data Djinn, Pilot, Ranged Combat, Technology · Trucker: Data Djinn, Force, Pilot, Technology
- **Preacher** — Ascetic: Force, Culture, Dexterity, Science · Missionary: Culture, Manipulation, Dexterity, Survival · Prophet: Force, Culture, Manipulation, Observation
- **Scientist** — Archaeologist: Culture, Observation, Science, Survival · Medicurg: Medicurgy, Manipulation, Observation, Science · Technician: Force, Technology, Observation, Science
- **Sailor** — Roughneck: Force, Manipulation, Dexterity, Culture · Loader: Force, Melee Combat, Dexterity, Technology · Engineer: Data Djinn, Force, Observation, Technology
- **Soldier** — Legionnaire: Force, Melee Combat, Ranged Combat, Survival · Mercenary: Melee Combat, Dexterity, Observation, Ranged Combat · Officer: Command, Culture, Melee Combat, Ranged Combat
- **Pathfinder** — Colonist: Force, Dexterity, Ranged Combat, Survival · Prospector: Pilot, Technology, Science, Survival · Scout: Infiltration, Ranged Combat, Observation, Survival

Each amplua also lists 3 personal-talent options (its entries in Appendix A);
these are the legal picks for that amplua's starting personal talent.

---

## Appendix C — The 16 skills and governing attributes (p. 24)

**General (8):** Проворство/Dexterity (Agility) · Сила/Force (Strength) ·
Скрытность/Infiltration (Agility) · Влияние/Manipulation (Empathy) · Ближний
бой/Melee Combat (Strength) · Наблюдательность/Observation (Wits) ·
Стрельба/Ranged Combat (Agility) · Выживание/Survival (Wits).

**Special (8):** Лидерство/Command (Empathy) · Мудрость/Culture (**Empathy**) ·
Инфомантия/Data Djinn (Wits) · Медикургия/Medicurgy (Wits) ·
Психомистицизм/Mysticism (Empathy) · Пилотирование/Pilot (Agility) ·
Наука/Science (Wits) · Технологика/Technology (Wits).
