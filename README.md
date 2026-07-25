# Cori

A player-card and character-generation toolkit for **Coriolis: The Third Horizon**
(Free League Publishing, Year Zero Engine).

This repository contains the base domain model and a structural player-card UI.
Visual design is intentionally minimal for now — the priority is a correct,
well-typed structure for characters and a working generation/assessment engine.

> This project models game *mechanics and structure* only. It contains no
> rulebook text. You need the official Coriolis rulebook to play.

## Stack

- **TypeScript + React** (Vite)
- **Vitest** for the domain tests
- Firebase / Cloudflare handle hosting and persistence (not required to run the
  domain layer or tests locally)

## Getting started

```bash
npm install
npm run dev        # start the demo app (generate + render a player card)
npm test           # run the domain tests
npm run typecheck  # type-check without emitting
```

## Project structure

```
src/
  domain/coriolis/       Framework-agnostic game model
    attributes.ts        Four core attributes + bounds
    skills.ts            General & advanced skills, each tied to an attribute
    icons.ts             The nine birth Icons of the zodiac
    talents.ts           Extensible talent registry
    concepts.ts          Character concepts (archetypes) with key attribute/skills
    character.ts         Character shape + derived stats (HP, MP, encumbrance)
    generation.ts        Age profiles, point-buy, seeded generator, assessment
    index.ts             Public API — import from here
  components/PlayerCard/  Base React player card
  App.tsx                 Demo shell (generate → render → assess)
```

## Domain concepts

### Character

A `Character` stores identity (name, concept, age group, upbringing, birth
Icon), core scores (attributes, skills, talents), progression (reputation,
experience, relationships), resources (birr, gear), and live trackers (hit
points, mind points, radiation).

Derived values are **computed, never stored**, so they cannot drift:

| Derived value      | Formula              |
| ------------------ | -------------------- |
| Max hit points     | Strength + Agility   |
| Max mind points    | Wits + Empathy       |
| Encumbrance limit  | Strength × 2         |

### Generation

`generateCharacter(input)` produces a complete, rules-valid character from a
concept, age group, upbringing, and Icon. A seed makes generation
**deterministic** — the same input always yields the same character, which keeps
tests reproducible and lets the app offer a "reroll from seed" flow.

Attribute and skill points are distributed by a point-buy allocator that
respects per-value caps and biases investment toward the concept's key
attribute and key skills, so generated builds stay coherent.

### Assessment

`assessCharacter(character)` validates a finished build against the generation
rules and returns a report:

- point pools spent vs. allowed (attributes and skills),
- a list of `issues`, each an `error` (hard rule break) or `warning` (advisory),
- a `valid` flag (true when there are no errors).

This is the "character generation assessment" — it powers both the demo output
and any future character-builder UI.

## Rule constants

The tunable rule numbers (point pools, per-value caps, age profiles, starting
birr) are collected as named constants in `attributes.ts`, `skills.ts`, and
`generation.ts`. They reflect a standard human character and are grouped so they
can be verified against your rulebook printing and adjusted in one place without
touching logic.
