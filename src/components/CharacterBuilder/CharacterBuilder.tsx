/**
 * CharacterBuilder — an interactive editor over the domain model.
 *
 * Every edit runs through `builderReducer` (bounds enforced there) and the
 * result is continuously validated with `assessCharacter`, so the player sees
 * live point tallies and rule violations as they build. A seeded "reroll"
 * regenerates a complete valid character, and the current build can be saved,
 * listed, and reloaded through an injected `CharacterRepository`.
 *
 * Styling is intentionally light and structural; the visual pass comes later.
 */

import { useCallback, useEffect, useMemo, useReducer, useState, type Dispatch } from "react";

import {
  ADVANCED_SKILL_KEYS,
  ATTRIBUTES,
  ATTRIBUTE_KEYS,
  AGE_PROFILES,
  CONCEPTS,
  CONCEPT_KEYS,
  GENERAL_SKILL_KEYS,
  ICONS,
  ICON_KEYS,
  SKILLS,
  TALENTS,
  TALENT_KEYS,
  UPBRINGINGS,
  assessCharacter,
  generateCharacter,
  type AgeGroup,
  type AttributeKey,
  type Character,
  type ConceptKey,
  type IconKey,
  type SkillKey,
  type Upbringing,
} from "../../domain/coriolis";
import type { CharacterRepository } from "../../data";
import { PlayerCard } from "../PlayerCard";
import { attributeCap, builderReducer, skillCap, type BuilderAction } from "./builderState";
import "./CharacterBuilder.css";

export interface CharacterBuilderProps {
  repository: CharacterRepository;
  /** Character to edit on mount. Defaults to a fresh seeded generation. */
  initialCharacter?: Character;
}

/** Best-effort unique id for freshly created characters. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `char-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function CharacterBuilder({ repository, initialCharacter }: CharacterBuilderProps) {
  const [seed, setSeed] = useState(1);
  const [character, dispatch] = useReducer(
    builderReducer,
    initialCharacter ?? generateCharacter({ id: newId(), seed: 1, name: "New Character" }),
  );

  const [saved, setSaved] = useState<Character[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const assessment = useMemo(() => assessCharacter(character), [character]);

  const refreshList = useCallback(async () => {
    const all = await repository.list();
    all.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    setSaved(all);
  }, [repository]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const handleReroll = () => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    dispatch({ type: "reroll", seed: nextSeed });
    setSaveState("idle");
  };

  const handleNew = () => {
    dispatch({
      type: "load",
      character: generateCharacter({ id: newId(), seed, name: "New Character" }),
    });
    setSaveState("idle");
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await repository.save(character);
      setSaveState("saved");
      await refreshList();
    } catch {
      setSaveState("error");
    }
  };

  const handleLoad = async (id: string) => {
    const loaded = await repository.get(id);
    if (loaded) {
      dispatch({ type: "load", character: loaded });
      setSaveState("idle");
    }
  };

  return (
    <div className="cb">
      <div className="cb__editor">
        <h2 className="cb__title">Character Builder</h2>

        <div className="cb__actions">
          <button type="button" onClick={handleReroll}>
            Reroll (seed {seed})
          </button>
          <button type="button" onClick={handleNew}>
            New blank build
          </button>
          <button type="button" onClick={handleSave} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
          {saveState === "saved" && <span className="cb__hint cb__hint--ok">Saved ✓</span>}
          {saveState === "error" && <span className="cb__hint cb__hint--err">Save failed</span>}
        </div>

        {/* Identity */}
        <fieldset className="cb__group">
          <legend>Identity</legend>
          <label className="cb__field">
            <span>Name</span>
            <input
              value={character.name}
              onChange={(e) => dispatch({ type: "setText", field: "name", value: e.target.value })}
            />
          </label>
          <label className="cb__field">
            <span>Player</span>
            <input
              value={character.playerName ?? ""}
              onChange={(e) =>
                dispatch({ type: "setText", field: "playerName", value: e.target.value })
              }
            />
          </label>

          <label className="cb__field">
            <span>Concept</span>
            <select
              value={character.concept}
              onChange={(e) =>
                dispatch({ type: "setConcept", concept: e.target.value as ConceptKey })
              }
            >
              {CONCEPT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CONCEPTS[key].name}
                </option>
              ))}
            </select>
          </label>

          <label className="cb__field">
            <span>Age</span>
            <select
              value={character.ageGroup}
              onChange={(e) =>
                dispatch({ type: "setAgeGroup", ageGroup: e.target.value as AgeGroup })
              }
            >
              {(Object.keys(AGE_PROFILES) as AgeGroup[]).map((key) => (
                <option key={key} value={key}>
                  {AGE_PROFILES[key].label}
                </option>
              ))}
            </select>
          </label>

          <label className="cb__field">
            <span>Upbringing</span>
            <select
              value={character.upbringing}
              onChange={(e) =>
                dispatch({ type: "setUpbringing", upbringing: e.target.value as Upbringing })
              }
            >
              {UPBRINGINGS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <label className="cb__field">
            <span>Birth Icon</span>
            <select
              value={character.icon}
              onChange={(e) => dispatch({ type: "setIcon", icon: e.target.value as IconKey })}
            >
              {ICON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ICONS[key].name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* Attributes */}
        <fieldset className="cb__group">
          <legend>
            Attributes — {assessment.attributePointsSpent}/{assessment.attributePointsAllowed} points
          </legend>
          <div className="cb__steppers">
            {ATTRIBUTE_KEYS.map((key: AttributeKey) => {
              const isKey = CONCEPTS[character.concept].keyAttribute === key;
              const cap = attributeCap(character.concept, key);
              const value = character.attributes[key];
              return (
                <div key={key} className={`cb-stepper${isKey ? " cb-stepper--key" : ""}`}>
                  <span className="cb-stepper__label">
                    {ATTRIBUTES[key].name}
                    {isKey && <span className="cb-stepper__badge">key</span>}
                  </span>
                  <div className="cb-stepper__controls">
                    <button
                      type="button"
                      aria-label={`Decrease ${ATTRIBUTES[key].name}`}
                      onClick={() => dispatch({ type: "adjustAttribute", key, delta: -1 })}
                    >
                      −
                    </button>
                    <span className="cb-stepper__value">{value}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${ATTRIBUTES[key].name}`}
                      disabled={value >= cap}
                      onClick={() => dispatch({ type: "adjustAttribute", key, delta: 1 })}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* Skills */}
        <fieldset className="cb__group">
          <legend>
            Skills — {assessment.skillPointsSpent}/{assessment.skillPointsAllowed} points (cap{" "}
            {skillCap(character.ageGroup)})
          </legend>
          <div className="cb__skills">
            <SkillColumn
              title="General"
              keys={GENERAL_SKILL_KEYS}
              character={character}
              dispatch={dispatch}
            />
            <SkillColumn
              title="Advanced"
              keys={ADVANCED_SKILL_KEYS}
              character={character}
              dispatch={dispatch}
            />
          </div>
        </fieldset>

        {/* Talents */}
        <fieldset className="cb__group">
          <legend>
            Talents — {character.talents.length}/{AGE_PROFILES[character.ageGroup].talentCount}{" "}
            expected
          </legend>
          <div className="cb__talents">
            {TALENT_KEYS.map((key) => {
              const talent = TALENTS[key];
              const checked = character.talents.includes(key);
              return (
                <label key={key} className={`cb-talent${checked ? " cb-talent--on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => dispatch({ type: "toggleTalent", key })}
                  />
                  <span className="cb-talent__name">{talent.name}</span>
                  <span className="cb-talent__summary">{talent.summary}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Validation */}
        <section
          className={`cb__validation${assessment.valid ? " cb__validation--ok" : " cb__validation--bad"}`}
          aria-label="Build validation"
        >
          <p className="cb__validation-head">
            {assessment.valid ? "Build is valid ✓" : "Build has errors"}
          </p>
          {assessment.issues.length > 0 && (
            <ul className="cb__issues">
              {assessment.issues.map((issue, i) => (
                <li key={i} className={`cb-issue cb-issue--${issue.severity}`}>
                  <span className="cb-issue__tag">{issue.severity}</span>
                  <span className="cb-issue__area">{issue.area}</span>
                  <span className="cb-issue__msg">{issue.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Saved characters */}
        {saved.length > 0 && (
          <section className="cb__saved" aria-label="Saved characters">
            <h3 className="cb__subhead">Saved characters</h3>
            <ul className="cb__saved-list">
              {saved.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="cb__saved-item"
                    onClick={() => handleLoad(c.id)}
                    aria-current={c.id === character.id}
                  >
                    {c.name || "Unnamed"} · {CONCEPTS[c.concept].name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="cb__preview" aria-label="Live preview">
        <PlayerCard character={character} />
      </aside>
    </div>
  );
}

function SkillColumn({
  title,
  keys,
  character,
  dispatch,
}: {
  title: string;
  keys: readonly SkillKey[];
  character: Character;
  dispatch: Dispatch<BuilderAction>;
}) {
  const cap = skillCap(character.ageGroup);
  return (
    <div className="cb__skills-col">
      <h4 className="cb__subhead">{title}</h4>
      {keys.map((key) => {
        const value = character.skills[key];
        return (
          <div key={key} className="cb-skill-row">
            <span className="cb-skill-row__name">
              {SKILLS[key].name}
              <span className="cb-skill-row__attr">
                {ATTRIBUTES[SKILLS[key].attribute].abbreviation}
              </span>
            </span>
            <div className="cb-stepper__controls">
              <button
                type="button"
                aria-label={`Decrease ${SKILLS[key].name}`}
                onClick={() => dispatch({ type: "adjustSkill", key, delta: -1 })}
              >
                −
              </button>
              <span className="cb-stepper__value">{value}</span>
              <button
                type="button"
                aria-label={`Increase ${SKILLS[key].name}`}
                disabled={value >= cap}
                onClick={() => dispatch({ type: "adjustSkill", key, delta: 1 })}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CharacterBuilder;
