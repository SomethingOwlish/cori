/**
 * Навыки «Кориолис. Третий Горизонт».
 *
 * Всего 16 навыков: 8 общих (ими в меру сил владеет каждый) и 8 специальных
 * (доступны только подготовленным специалистам). Каждый навык привязан к одной
 * из четырёх характеристик. Значение навыка — от 0 до 5.
 *
 * Проверку ОБЩЕГО навыка можно осуществлять даже при значении 0 (учитывается
 * только характеристика). Проверку СПЕЦИАЛЬНОГО навыка — только если его
 * значение выше 0.
 *
 * Источник: ST3001 «Кориолис», гл. 2 (стр. 24) и гл. 3 (стр. 54).
 */

import type { AttributeKey } from "./attributes";

export type SkillCategory = "general" | "advanced";

export type GeneralSkillKey =
  | "dexterity"
  | "force"
  | "infiltration"
  | "manipulation"
  | "meleeCombat"
  | "observation"
  | "rangedCombat"
  | "survival";

export type AdvancedSkillKey =
  | "command"
  | "culture"
  | "dataDjinn"
  | "medicurgy"
  | "mysticism"
  | "pilot"
  | "science"
  | "technology";

export type SkillKey = GeneralSkillKey | AdvancedSkillKey;

export interface SkillDef {
  key: SkillKey;
  /** Название на русском. */
  name: string;
  /** Связанная характеристика. */
  attribute: AttributeKey;
  category: SkillCategory;
  /** Краткое пояснение области применения навыка. */
  description: string;
}

export const SKILLS: Record<SkillKey, SkillDef> = {
  // Общие навыки
  dexterity: {
    key: "dexterity",
    name: "Проворство",
    attribute: "agility",
    category: "general",
    description: "Прыжки, лазанье, бег и прочие действия, требующие скорости и координации.",
  },
  force: {
    key: "force",
    name: "Сила",
    attribute: "strength",
    category: "general",
    description: "Грубое приложение физической мощи: сломать, поднять, удержать, продавить.",
  },
  infiltration: {
    key: "infiltration",
    name: "Скрытность",
    attribute: "agility",
    category: "general",
    description: "Передвижение незамеченным, маскировка, взлом, карманная кража.",
  },
  manipulation: {
    key: "manipulation",
    name: "Влияние",
    attribute: "empathy",
    category: "general",
    description: "Убеждение, обман, запугивание и торг — воздействие на других людей.",
  },
  meleeCombat: {
    key: "meleeCombat",
    name: "Ближний бой",
    attribute: "strength",
    category: "general",
    description: "Рукопашная схватка и бой холодным оружием.",
  },
  observation: {
    key: "observation",
    name: "Наблюдательность",
    attribute: "wits",
    category: "general",
    description: "Внимание к деталям, поиск улик, обнаружение засад и угроз.",
  },
  rangedCombat: {
    key: "rangedCombat",
    name: "Стрельба",
    attribute: "agility",
    category: "general",
    description: "Стрельба из любого дальнобойного оружия.",
  },
  survival: {
    key: "survival",
    name: "Выживание",
    attribute: "wits",
    category: "general",
    description: "Ориентирование, добыча пищи и воды, выживание во враждебной среде.",
  },

  // Специальные навыки
  command: {
    key: "command",
    name: "Лидерство",
    attribute: "empathy",
    category: "advanced",
    description: "Командование, воодушевление союзников и управление в бою.",
  },
  culture: {
    key: "culture",
    name: "Мудрость",
    attribute: "empathy",
    category: "advanced",
    description: "Знание культур, обычаев, истории и веры Третьего Горизонта.",
  },
  dataDjinn: {
    key: "dataDjinn",
    name: "Инфомантия",
    attribute: "wits",
    category: "advanced",
    description: "Работа с компьютерами, инфо-джиннами, сетями и базами данных.",
  },
  medicurgy: {
    key: "medicurgy",
    name: "Медикургия",
    attribute: "wits",
    category: "advanced",
    description: "Неотложная помощь, лечение ран и болезней.",
  },
  mysticism: {
    key: "mysticism",
    name: "Психомистицизм",
    attribute: "empathy",
    category: "advanced",
    description: "Мистические практики и связь с силами за гранью материального мира.",
  },
  pilot: {
    key: "pilot",
    name: "Пилотирование",
    attribute: "agility",
    category: "advanced",
    description: "Управление кораблями и наземным транспортом, манёвры в бою.",
  },
  science: {
    key: "science",
    name: "Наука",
    attribute: "wits",
    category: "advanced",
    description: "Естественные науки, анализ, исследования и расшифровка находок.",
  },
  technology: {
    key: "technology",
    name: "Технологика",
    attribute: "wits",
    category: "advanced",
    description: "Ремонт, обслуживание и создание техники, взлом механизмов.",
  },
};

export const SKILL_KEYS: readonly SkillKey[] = Object.keys(SKILLS) as SkillKey[];

export const GENERAL_SKILL_KEYS: readonly GeneralSkillKey[] = SKILL_KEYS.filter(
  (k) => SKILLS[k].category === "general",
) as GeneralSkillKey[];

export const ADVANCED_SKILL_KEYS: readonly AdvancedSkillKey[] = SKILL_KEYS.filter(
  (k) => SKILLS[k].category === "advanced",
) as AdvancedSkillKey[];

/** Уровни владения навыком (табл. 2.3). */
export const SKILL_LEVEL_NAMES: Record<number, string> = {
  0: "Нет",
  1: "Новичок",
  2: "Любитель",
  3: "Профессионал",
  4: "Специалист",
  5: "Мастер",
};

/**
 * Границы навыка. Минимум всегда 0, максимум по шкале — 5.
 * Ограничения на этапе создания задаются в `generation.ts`
 * (ключевые навыки роли — до 3, прочие — до 1).
 */
export const SKILL_MIN = 0;
export const SKILL_MAX = 5;

/** Полный блок навыков. */
export type SkillScores = Record<SkillKey, number>;

/** Блок навыков со значением 0 в каждом. */
export function baseSkillScores(): SkillScores {
  return SKILL_KEYS.reduce((acc, key) => {
    acc[key] = SKILL_MIN;
    return acc;
  }, {} as SkillScores);
}
