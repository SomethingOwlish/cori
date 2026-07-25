/**
 * PlayerCard — the base visual representation of a character.
 *
 * This is deliberately structural rather than decorative: it lays out every
 * meaningful piece of a Coriolis character so the shape is right. Styling is a
 * thin, replaceable pass (see PlayerCard.css) and can be redesigned later.
 */

import {
  ATTRIBUTES,
  ATTRIBUTE_KEYS,
  CONCEPTS,
  GENERAL_SKILL_KEYS,
  ADVANCED_SKILL_KEYS,
  ICONS,
  SKILLS,
  TALENTS,
  currentEncumbrance,
  encumbranceLimit,
  maxHitPoints,
  maxMindPoints,
  type Character,
  type SkillKey,
} from "../../domain/coriolis";
import { AGE_PROFILES } from "../../domain/coriolis/generation";
import "./PlayerCard.css";

export interface PlayerCardProps {
  character: Character;
}

function SkillRow({ skillKey, value }: { skillKey: SkillKey; value: number }) {
  const skill = SKILLS[skillKey];
  return (
    <div className={`pc-skill${value > 0 ? " pc-skill--trained" : ""}`}>
      <span className="pc-skill__name">{skill.name}</span>
      <span className="pc-skill__attr">{ATTRIBUTES[skill.attribute].abbreviation}</span>
      <span className="pc-skill__value">{value}</span>
    </div>
  );
}

export function PlayerCard({ character }: PlayerCardProps) {
  const concept = CONCEPTS[character.concept];
  const icon = ICONS[character.icon];
  const ageProfile = AGE_PROFILES[character.ageGroup];

  const hpMax = maxHitPoints(character.attributes);
  const mpMax = maxMindPoints(character.attributes);
  const encMax = encumbranceLimit(character.attributes);
  const encUsed = currentEncumbrance(character.gear);

  return (
    <article className="pc" aria-label={`Player card for ${character.name || "unnamed character"}`}>
      <header className="pc__header">
        <div>
          <h2 className="pc__name">{character.name || "Unnamed"}</h2>
          <p className="pc__concept">
            {concept.name} · {ageProfile.label}
            {character.upbringing ? ` · ${character.upbringing}` : ""}
          </p>
        </div>
        <div className="pc__icon" title={`Born under ${icon.name}`}>
          <span className="pc__icon-name">{icon.name}</span>
          <span className="pc__icon-theme">{icon.theme}</span>
        </div>
      </header>

      <section className="pc__attributes" aria-label="Attributes">
        {ATTRIBUTE_KEYS.map((key) => (
          <div key={key} className="pc-attr">
            <span className="pc-attr__value">{character.attributes[key]}</span>
            <span className="pc-attr__label">{ATTRIBUTES[key].abbreviation}</span>
          </div>
        ))}
      </section>

      <section className="pc__derived" aria-label="Derived stats">
        <div className="pc-stat">
          <span className="pc-stat__label">Hit Points</span>
          <span className="pc-stat__value">
            {character.hitPointsCurrent} / {hpMax}
          </span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Mind Points</span>
          <span className="pc-stat__value">
            {character.mindPointsCurrent} / {mpMax}
          </span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Reputation</span>
          <span className="pc-stat__value">{character.reputation}</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Radiation</span>
          <span className="pc-stat__value">{character.radiation}</span>
        </div>
      </section>

      <section className="pc__skills" aria-label="Skills">
        <div className="pc__skills-col">
          <h3 className="pc__subhead">General Skills</h3>
          {GENERAL_SKILL_KEYS.map((key) => (
            <SkillRow key={key} skillKey={key} value={character.skills[key]} />
          ))}
        </div>
        <div className="pc__skills-col">
          <h3 className="pc__subhead">Advanced Skills</h3>
          {ADVANCED_SKILL_KEYS.map((key) => (
            <SkillRow key={key} skillKey={key} value={character.skills[key]} />
          ))}
        </div>
      </section>

      <section className="pc__talents" aria-label="Talents">
        <h3 className="pc__subhead">Talents</h3>
        {character.talents.length === 0 ? (
          <p className="pc__empty">No talents yet.</p>
        ) : (
          <ul className="pc__talent-list">
            {character.talents.map((key) => {
              const talent = TALENTS[key];
              return (
                <li key={key} className="pc-talent">
                  <span className="pc-talent__name">{talent ? talent.name : key}</span>
                  {talent ? <span className="pc-talent__summary">{talent.summary}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="pc__footer">
        <div className="pc-stat">
          <span className="pc-stat__label">Birr</span>
          <span className="pc-stat__value">{character.birr.toLocaleString()}</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Encumbrance</span>
          <span className="pc-stat__value">
            {encUsed} / {encMax}
          </span>
        </div>
        {character.playerName ? (
          <div className="pc-stat">
            <span className="pc-stat__label">Player</span>
            <span className="pc-stat__value">{character.playerName}</span>
          </div>
        ) : null}
      </footer>
    </article>
  );
}

export default PlayerCard;
