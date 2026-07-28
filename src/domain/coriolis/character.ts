/**
 * Модель персонажа — данные за карточкой героя.
 *
 * Это каноническая форма, которую хранит репозиторий и отображает `PlayerCard`.
 * Производные значения (здоровье, рассудок, нагрузка) вычисляются из хранимых
 * характеристик, а не хранятся, чтобы они никогда не рассинхронизировались.
 *
 * Источник: ST3001 «Кориолис», гл. 2.
 */

import {
  ATTRIBUTE_KEYS,
  baseAttributeScores,
  type AttributeKey,
  type AttributeScores,
} from "./attributes";
import { baseSkillScores, type SkillScores } from "./skills";
import type { ConceptKey, TeamArchetypeKey, ShipPosition } from "./concepts";
import type { IconKey } from "./icons";
import type { Upbringing, Parentage } from "./upbringing";

export interface GearItem {
  name: string;
  /** Вес в строках нагрузки: обычный предмет = 1, лёгкий = 0.5, тяжёлый ≥ 2. */
  weight?: number;
  notes?: string;
}

export interface Relationship {
  /** Имя персонажа, с которым установлена связь. */
  name: string;
  /** Описание связи. */
  description: string;
  /** Отмечен как «Друг» — ближайший товарищ. */
  isFriend?: boolean;
}

/** Биография героя (на игровую механику влияет только воспитание и происхождение). */
export interface Biography {
  /** Родная планета (свободный текст). */
  homeworld?: string;
  /** Линия: зенитиец или первопоселенец (свободный текст). */
  lineage?: string;
  /** Воспитание — определяет пункты, репутацию и богатство. */
  upbringing: Upbringing;
  /** Человек или пасынок. */
  parentage: Parentage;
}

export interface Character {
  id: string;
  name: string;
  playerName?: string;

  // Биография
  biography: Biography;

  // Амплуа
  concept: ConceptKey;
  /** Ключ роли внутри амплуа. */
  role: string;

  // Внешность и история
  appearance?: string;
  personalProblem?: string;

  // Лик-покровитель
  icon: IconKey;

  // Основные показатели
  attributes: AttributeScores;
  skills: SkillScores;
  /** Достоинства (личное, командное, дар Лика, при необходимости стигма). Ключи из `talents.ts`/`icons.ts`. */
  talents: string[];

  // Команда
  teamArchetype?: TeamArchetypeKey;
  shipPosition?: ShipPosition;

  // Социальное / развитие
  reputation: number;
  /** Накопленные пункты опыта (5 → прокачка). */
  experience: number;
  relationships: Relationship[];

  // Ресурсы
  birr: number;
  gear: GearItem[];

  // Текущие показатели (максимумы вычисляются)
  hitPointsCurrent: number;
  mindPointsCurrent: number;
  radiation: number;
}

/** Запас здоровья = телосложение + ловкость. */
export function maxHitPoints(attributes: AttributeScores): number {
  return attributes.strength + attributes.agility;
}

/** Запас рассудка = смекалка + эмпатия. */
export function maxMindPoints(attributes: AttributeScores): number {
  return attributes.wits + attributes.empathy;
}

/** Грузоподъёмность в строках нагрузки = телосложение × 2. */
export function encumbranceLimit(attributes: AttributeScores): number {
  return attributes.strength * 2;
}

/** Текущая нагрузка. */
export function currentEncumbrance(gear: GearItem[]): number {
  return gear.reduce((sum, item) => sum + (item.weight ?? 1), 0);
}

/** Сумма пунктов, вложенных в характеристики (сами значения). */
export function attributePointsSpent(attributes: AttributeScores): number {
  return ATTRIBUTE_KEYS.reduce(
    (sum, key: AttributeKey) => sum + attributes[key],
    0,
  );
}

/**
 * Создаёт пустого, но структурно валидного персонажа. Ожидается, что вызывающий
 * заполнит биографию, показатели и снаряжение — обычно через генератор.
 */
export function createBlankCharacter(id: string): Character {
  const attributes = baseAttributeScores();
  return {
    id,
    name: "",
    biography: { upbringing: "plebeian", parentage: "human" },
    concept: "soldier",
    role: "legionnaire",
    icon: "theTraveler",
    attributes,
    skills: baseSkillScores(),
    talents: [],
    reputation: 0,
    experience: 0,
    relationships: [],
    birr: 0,
    gear: [],
    hitPointsCurrent: maxHitPoints(attributes),
    mindPointsCurrent: maxMindPoints(attributes),
    radiation: 0,
  };
}
