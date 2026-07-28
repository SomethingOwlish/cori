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

/**
 * Оружие с боевыми характеристиками (для секции «Оружие» на карточке).
 * Значения соответствуют строкам печатного бланка: инициатива, урон, порог
 * критического, заряды.
 */
export interface Weapon {
  name: string;
  /** Дистанция: «БЛИЖНЯЯ», «СРЕДНЯЯ», «ДАЛЬНЯЯ» и т. п. (свободный текст). */
  range?: string;
  /** Модификатор инициативы (напр. +2). */
  initiative?: number;
  /** Урон. */
  damage?: number;
  /** Порог (критического попадания). */
  crit?: number;
  /** Заряды/боезапас (null — не применимо). */
  ammo?: number | null;
  /** Свойства оружия (свободный текст). */
  features?: string;
}

/** Броня — класс защиты и название. */
export interface Armor {
  /** Класс защиты. */
  rating: number;
  /** Название брони (напр. «лёгкий скафандр»). */
  name?: string;
}

/** Травма/состояние, влияющее на броски. */
export interface Injury {
  name: string;
  /** Краткий эффект (напр. «−1 куб.»). */
  effect?: string;
  /** Подробное описание. */
  description?: string;
  /** Критическая травма. */
  critical?: boolean;
}

export interface Relationship {
  /** Имя персонажа, с которым установлена связь. */
  name: string;
  /** Описание связи. */
  description: string;
  /** Отмечен как «Друг» — ближайший товарищ. */
  isFriend?: boolean;
  /** Отмечен как «Долг» — герой что-то должен этому персонажу. */
  isDebt?: boolean;
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
  /** Id of the campaign this character belongs to, if any. */
  campaignId?: string;

  // Биография
  biography: Biography;

  // Амплуа
  concept: ConceptKey;
  /** Ключ роли внутри амплуа. */
  role: string;

  // Внешность и история
  appearance?: string;
  /** Черты лица (для секции «Внешний вид»). */
  appearanceFace?: string;
  /** Одежда (для секции «Внешний вид»). */
  appearanceClothing?: string;
  personalProblem?: string;
  /** Портрет героя (data-URL или ссылка). */
  portraitUrl?: string;

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
  /** Оружие с боевыми характеристиками. */
  weapons?: Weapon[];
  /** Носимая броня. */
  armor?: Armor;

  // Текущие показатели (максимумы вычисляются)
  hitPointsCurrent: number;
  mindPointsCurrent: number;
  radiation: number;
  /** Полученные травмы. */
  injuries?: Injury[];

  // Заметки
  /** Свободные заметки игрока/мастера. */
  notes?: string;
  /** Описание каюты героя. */
  quarters?: string;
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
