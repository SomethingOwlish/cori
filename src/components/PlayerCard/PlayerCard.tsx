/**
 * PlayerCard — карточка персонажа для ОТОБРАЖЕНИЯ.
 *
 * Карточка по умолчанию доступна только для чтения. Единственный способ
 * изменить показатели прямо здесь — режим прокачки: если у героя есть 5+ пунктов
 * опыта и переданы обработчики, рядом с навыками появляются кнопки «+», а под
 * достоинствами — блок покупки нового достоинства за опыт. Полноценное
 * редактирование доступно мастеру через отдельный редактор (см. App).
 *
 * Источник данных: доменный слой `../../domain/coriolis`.
 */

import {
  ATTRIBUTES,
  ATTRIBUTE_KEYS,
  CONCEPTS,
  GENERAL_SKILL_KEYS,
  ADVANCED_SKILL_KEYS,
  ICONS,
  SKILLS,
  SKILL_LEVEL_NAMES,
  SKILL_MAX,
  TALENTS,
  UPBRINGINGS,
  PARENTAGES,
  TEAM_ARCHETYPES,
  SHIP_POSITIONS,
  currentEncumbrance,
  encumbranceLimit,
  findRole,
  maxHitPoints,
  maxMindPoints,
  canRaiseSkill,
  type Character,
  type SkillKey,
} from "../../domain/coriolis";
import "./PlayerCard.css";

export interface PlayerCardProps {
  character: Character;
  /** Разрешить прокачку прямо на карточке (кнопки «+» за опыт). */
  canLevelUp?: boolean;
  /** Поднять навык за 5 пунктов опыта. */
  onRaiseSkill?: (key: SkillKey) => void;
}

function SkillRow({
  skillKey,
  value,
  levelUp,
  onRaise,
}: {
  skillKey: SkillKey;
  value: number;
  levelUp: boolean;
  onRaise?: () => void;
}) {
  const skill = SKILLS[skillKey];
  return (
    <div className={`pc-skill${value > 0 ? " pc-skill--trained" : ""}`}>
      <span className="pc-skill__name" title={skill.description}>
        {skill.name}
      </span>
      <span className="pc-skill__attr" title={ATTRIBUTES[skill.attribute].name}>
        {ATTRIBUTES[skill.attribute].abbreviation}
      </span>
      <span className="pc-skill__value">{value}</span>
      {levelUp ? (
        <button
          type="button"
          className="pc-skill__raise"
          onClick={onRaise}
          disabled={value >= SKILL_MAX || !onRaise}
          title="Поднять навык за 5 пунктов опыта"
        >
          +
        </button>
      ) : null}
    </div>
  );
}

export function PlayerCard({ character, canLevelUp = false, onRaiseSkill }: PlayerCardProps) {
  const concept = character.concept ? CONCEPTS[character.concept] : undefined;
  const role = findRole(character.concept, character.role);
  const icon = character.icon ? ICONS[character.icon] : undefined;
  const { upbringing, parentage } = character.biography;

  const hpMax = maxHitPoints(character.attributes);
  const mpMax = maxMindPoints(character.attributes);
  const encMax = encumbranceLimit(character.attributes);
  const encUsed = currentEncumbrance(character.gear);
  const levelUpActive = canLevelUp && character.experience >= 5;

  return (
    <article className="pc" aria-label={`Карточка персонажа ${character.name || "без имени"}`}>
      <header className="pc__header">
        <div>
          <h2 className="pc__name">{character.name || "Без имени"}</h2>
          {(() => {
            const parts = [
              concept?.name,
              role?.name,
              upbringing ? UPBRINGINGS[upbringing].name : undefined,
              parentage === "stray" ? PARENTAGES.stray.name : undefined,
            ].filter(Boolean);
            return parts.length > 0 ? <p className="pc__concept">{parts.join(" · ")}</p> : null;
          })()}
          {character.teamArchetype ? (
            <p className="pc__team">Команда: {TEAM_ARCHETYPES[character.teamArchetype].name}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="pc__icon" title={icon.description}>
            <span className="pc__icon-name">{icon.name}</span>
            <span className="pc__icon-theme">{icon.symbol}</span>
          </div>
        ) : null}
      </header>

      <section className="pc__attributes" aria-label="Характеристики">
        {ATTRIBUTE_KEYS.map((key) => (
          <div
            key={key}
            className={`pc-attr${concept && key === concept.keyAttribute ? " pc-attr--key" : ""}`}
            title={ATTRIBUTES[key].description}
          >
            <span className="pc-attr__value">{character.attributes[key]}</span>
            <span className="pc-attr__label">{ATTRIBUTES[key].abbreviation}</span>
          </div>
        ))}
      </section>

      <section className="pc__derived" aria-label="Производные показатели">
        <div className="pc-stat">
          <span className="pc-stat__label">Здоровье</span>
          <span className="pc-stat__value">
            {character.hitPointsCurrent} / {hpMax}
          </span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Рассудок</span>
          <span className="pc-stat__value">
            {character.mindPointsCurrent} / {mpMax}
          </span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Репутация</span>
          <span className="pc-stat__value">{character.reputation}</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Радиация</span>
          <span className="pc-stat__value">{character.radiation}</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Опыт</span>
          <span className="pc-stat__value">{character.experience}</span>
        </div>
      </section>

      {levelUpActive ? (
        <p className="pc__levelup-hint">
          Прокачка: у героя {character.experience} пунктов опыта. Жми «+» у навыка (−5 опыта, максимум 5).
        </p>
      ) : null}

      <section className="pc__skills" aria-label="Навыки">
        <div className="pc__skills-col">
          <h3 className="pc__subhead">Общие навыки</h3>
          {GENERAL_SKILL_KEYS.map((key) => (
            <SkillRow
              key={key}
              skillKey={key}
              value={character.skills[key]}
              levelUp={levelUpActive}
              onRaise={
                onRaiseSkill && canRaiseSkill(character, key) ? () => onRaiseSkill(key) : undefined
              }
            />
          ))}
        </div>
        <div className="pc__skills-col">
          <h3 className="pc__subhead">Специальные навыки</h3>
          {ADVANCED_SKILL_KEYS.map((key) => (
            <SkillRow
              key={key}
              skillKey={key}
              value={character.skills[key]}
              levelUp={levelUpActive}
              onRaise={
                onRaiseSkill && canRaiseSkill(character, key) ? () => onRaiseSkill(key) : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="pc__talents" aria-label="Достоинства">
        <h3 className="pc__subhead">Достоинства</h3>
        <ul className="pc__talent-list">
          {/* Дар Лика-покровителя — выводится из знака рождения (если Лик определён). */}
          {icon ? (
            <li className="pc-talent pc-talent--icon">
              <span className="pc-talent__name">Дар {icon.name}</span>
              <span className="pc-talent__summary">{icon.gift}</span>
            </li>
          ) : null}
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
      </section>

      {character.appearance || character.personalProblem ? (
        <section className="pc__bio" aria-label="Внешность и проблема">
          {character.appearance ? (
            <p>
              <span className="pc-stat__label">Внешность:</span> {character.appearance}
            </p>
          ) : null}
          {character.personalProblem ? (
            <p>
              <span className="pc-stat__label">Личная проблема:</span> {character.personalProblem}
            </p>
          ) : null}
        </section>
      ) : null}

      {character.gear.length > 0 ? (
        <section className="pc__gear" aria-label="Снаряжение">
          <h3 className="pc__subhead">Снаряжение</h3>
          <ul className="pc__gear-list">
            {character.gear.map((g, i) => (
              <li key={i}>{g.name}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {character.relationships.length > 0 ? (
        <section className="pc__rel" aria-label="Взаимоотношения">
          <h3 className="pc__subhead">Взаимоотношения</h3>
          <ul className="pc__rel-list">
            {character.relationships.map((r, i) => (
              <li key={i}>
                <strong>{r.name}</strong>
                {r.isFriend ? " (Друг)" : ""}: {r.description}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="pc__footer">
        <div className="pc-stat">
          <span className="pc-stat__label">Бирры</span>
          <span className="pc-stat__value">{character.birr.toLocaleString("ru-RU")}</span>
        </div>
        <div className="pc-stat">
          <span className="pc-stat__label">Нагрузка</span>
          <span className="pc-stat__value">
            {encUsed} / {encMax}
          </span>
        </div>
        {character.shipPosition ? (
          <div className="pc-stat">
            <span className="pc-stat__label">Должность</span>
            <span className="pc-stat__value">{SHIP_POSITIONS[character.shipPosition]}</span>
          </div>
        ) : null}
        {character.playerName ? (
          <div className="pc-stat">
            <span className="pc-stat__label">Игрок</span>
            <span className="pc-stat__value">{character.playerName}</span>
          </div>
        ) : null}
      </footer>

      {/* Справочник уровней навыка для подсказки. */}
      <p className="pc__legend">
        Уровни навыка: {Object.entries(SKILL_LEVEL_NAMES)
          .filter(([n]) => Number(n) > 0)
          .map(([n, name]) => `${n} — ${name}`)
          .join(", ")}
        .
      </p>
    </article>
  );
}

export default PlayerCard;
