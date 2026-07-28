/**
 * Кодекс — единый справочник снаряжения и способностей «Кориолиса».
 *
 * Кодекс собирает записи разных типов в один поисковый каталог: оружие, броню,
 * взрывчатку, предметы снаряжения, достоинства и мистические силы. Встроенные
 * записи (`BUILTIN_CODEX`) извлечены из корбука ST3001 «Кориолис» (гл. 4, 6 и
 * 10); достоинства и дары Ликов переиспользуют реестры `talents.ts`/`icons.ts`,
 * чтобы не расходиться с механикой создания персонажа. Пользовательские записи
 * хранит `CodexRepository` и они помечаются `custom: true`.
 *
 * Источник: ST3001 «Кориолис», гл. 4 (стр. 68–79), гл. 6 (стр. 104–137),
 * гл. 10 — мистические практики (стр. 76–80).
 */

import { ICONS, ICON_KEYS } from "./icons";
import { TALENTS, TALENT_KEYS, type TalentKind } from "./talents";

/** Типы записей кодекса. */
export type CodexCategory =
  | "weapon" // оружие
  | "armor" // броня и щиты
  | "explosive" // гранаты и взрывчатка
  | "gear" // предметы снаряжения
  | "talent" // достоинства (включая имплантаты, дары Ликов, стигмы)
  | "mysticPower"; // мистические силы (практики)

export const CODEX_CATEGORIES: readonly CodexCategory[] = [
  "weapon",
  "armor",
  "explosive",
  "gear",
  "talent",
  "mysticPower",
];

/** Человекочитаемые названия типов (единственное / множественное число). */
export const CATEGORY_LABELS: Record<CodexCategory, { one: string; many: string; icon: string }> = {
  weapon: { one: "Оружие", many: "Оружие", icon: "⚔" },
  armor: { one: "Броня", many: "Броня", icon: "🛡" },
  explosive: { one: "Взрывчатка", many: "Взрывчатка", icon: "✸" },
  gear: { one: "Предмет", many: "Предметы", icon: "⚙" },
  talent: { one: "Достоинство", many: "Достоинства", icon: "★" },
  mysticPower: { one: "Мистическая сила", many: "Мистические силы", icon: "☾" },
};

/** Уровень технологии: архаичный / современный / передовой / засекреченный. */
export type TechLevel = "А" | "С" | "П" | "З";

export const TECH_LABELS: Record<TechLevel, string> = {
  А: "Архаичный",
  С: "Современный",
  П: "Передовой",
  З: "Засекреченный",
};

/** Пара «характеристика — значение» для отображения на карточке записи. */
export interface CodexStat {
  label: string;
  value: string;
}

export interface CodexEntry {
  /** Уникальный ключ. Для встроенных — стабильный слаг, для своих — id. */
  id: string;
  category: CodexCategory;
  name: string;
  /** Подгруппа внутри типа, напр. «Пистолеты», «Личные достоинства». */
  group?: string;
  /** Полное описание. */
  summary: string;
  /** Числовые характеристики в порядке отображения. */
  stats?: CodexStat[];
  /** Метки для фильтрации: свойства оружия, «Лицензия» и т. п. */
  tags?: string[];
  /** Уровень технологии. */
  tech?: TechLevel;
  /** Цена в биррах (строка — допускает диапазоны «1200–7000»). */
  price?: string;
  /** Нагрузка/вес (свободный текст: «Лёгкий», «Тяжёлый», «Маленький»). */
  weight?: string;
  /** Лицензированный предмет (нужно достоинство «Лицензиат»). */
  licensed?: boolean;
  /** Пользовательская запись — её можно редактировать и удалять. */
  custom?: boolean;
}

// ───────────────────────────────────────────────────────────────────────────
// Хелперы построения встроенного каталога
// ───────────────────────────────────────────────────────────────────────────

const slug = (() => {
  const used = new Set<string>();
  return (category: string, name: string): string => {
    const base = `${category}:${name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-zа-я0-9:-]/gi, "");
    let key = base;
    let n = 2;
    while (used.has(key)) key = `${base}-${n++}`;
    used.add(key);
    return key;
  };
})();

/** Разбор свойств оружия/брони из свободного текста в список тегов. */
function splitFeatures(text: string): string[] {
  if (!text || text === "—") return [];
  return text
    .split(/[,/]|\s+и\s+/)
    .map((s) => s.trim())
    .filter((s) => s && s !== "—")
    // «огненное (3)» → тег без числа для фильтра, но сохраняем исходник тоже
    .map((s) => s.replace(/\s+/g, " "));
}

interface WeaponRow {
  name: string;
  group: string;
  bonus: string; // модификатор к попаданию
  init: string; // модификатор инициативы
  damage: string; // урон
  crit: string; // порог критического
  range: string; // дистанция
  features: string; // свойства (через запятую)
  tech: TechLevel;
  price: string;
  licensed?: boolean;
}

function weapon(r: WeaponRow): CodexEntry {
  const feats = splitFeatures(r.features);
  return {
    id: slug("weapon", r.name),
    category: "weapon",
    name: r.name,
    group: r.group,
    summary:
      `${r.group}. Модификатор ${r.bonus}, инициатива ${r.init}, урон ${r.damage}, ` +
      `порог ${r.crit}, дистанция «${r.range}».` +
      (feats.length ? ` Свойства: ${feats.join(", ")}.` : ""),
    stats: [
      { label: "Мод.", value: r.bonus },
      { label: "Иниц.", value: r.init },
      { label: "Урон", value: r.damage },
      { label: "Порог", value: r.crit },
      { label: "Дистанция", value: r.range },
    ],
    tags: feats,
    tech: r.tech,
    price: r.price,
    licensed: r.licensed,
  };
}

interface ArmorRow {
  name: string;
  group: string; // «Броня» | «Щиты»
  rating: string; // класс защиты
  base: string; // базовые свойства
  extra?: string; // число доп. свойств
  tech: TechLevel;
  price: string;
  licensed?: boolean;
}

function armor(r: ArmorRow): CodexEntry {
  const feats = splitFeatures(r.base);
  const stats: CodexStat[] = [{ label: "Класс защиты", value: r.rating }];
  if (r.extra && r.extra !== "0" && r.extra !== "—") stats.push({ label: "Доп. свойства", value: r.extra });
  return {
    id: slug("armor", r.name),
    category: "armor",
    name: r.name,
    group: r.group,
    summary:
      `${r.group}. Класс защиты ${r.rating}.` +
      (feats.length ? ` Свойства: ${feats.join(", ")}.` : "") +
      (r.extra && r.extra !== "0" ? ` Дополнительных свойств на выбор: ${r.extra}.` : ""),
    stats,
    tags: feats,
    tech: r.tech,
    price: r.price,
    licensed: r.licensed,
  };
}

interface ExplosiveRow {
  name: string;
  group: string;
  power: string; // мощность
  damage: string; // урон
  crit: string; // порог
  radius: string; // радиус
  features: string;
  tech: TechLevel;
  price: string;
  weight: string;
  licensed?: boolean;
}

function explosive(r: ExplosiveRow): CodexEntry {
  const feats = splitFeatures(r.features);
  return {
    id: slug("explosive", r.name),
    category: "explosive",
    name: r.name,
    group: r.group,
    summary:
      `${r.group}. Мощность ${r.power}, урон ${r.damage}, порог ${r.crit}, радиус «${r.radius}».` +
      (feats.length ? ` Свойства: ${feats.join(", ")}.` : ""),
    stats: [
      { label: "Мощность", value: r.power },
      { label: "Урон", value: r.damage },
      { label: "Порог", value: r.crit },
      { label: "Радиус", value: r.radius },
    ],
    tags: feats,
    tech: r.tech,
    price: r.price,
    weight: r.weight,
    licensed: r.licensed,
  };
}

interface GearRow {
  name: string;
  group: string;
  summary: string;
  mod?: string; // модификатор навыка
  price?: string;
  weight?: string;
  tech: TechLevel;
  licensed?: boolean;
}

function gear(r: GearRow): CodexEntry {
  const stats: CodexStat[] = [];
  if (r.mod) stats.push({ label: "Модификатор", value: r.mod });
  return {
    id: slug("gear", r.name),
    category: "gear",
    name: r.name,
    group: r.group,
    summary: r.summary,
    stats: stats.length ? stats : undefined,
    tech: r.tech,
    price: r.price,
    weight: r.weight,
    licensed: r.licensed,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// ОРУЖИЕ — табл. 6.10 (дистанционное) и 6.13 (ближнего боя)
// ───────────────────────────────────────────────────────────────────────────

const WEAPONS: CodexEntry[] = [
  // Пистолеты
  weapon({ name: "Карманный вулкан-пистолет", group: "Пистолеты", bonus: "+1", init: "+2", damage: "2", crit: "2", range: "Средняя", features: "Лёгкое", tech: "С", price: "700" }),
  weapon({ name: "Вулкан-пистолет", group: "Пистолеты", bonus: "+1", init: "+1", damage: "2", crit: "2", range: "Средняя", features: "Надёжное", tech: "С", price: "500" }),
  weapon({ name: "Вулкан-пистолет «Аракс Омир»", group: "Пистолеты", bonus: "0", init: "0", damage: "3", crit: "2", range: "Средняя", features: "+2 при запугивании", tech: "С", price: "1200" }),
  weapon({ name: "Вулкан-пистолет «Скорпион»", group: "Пистолеты", bonus: "–1", init: "+1", damage: "2", crit: "2", range: "Средняя", features: "Автоматическое", tech: "С", price: "1000" }),
  weapon({ name: "Рельсовый пистолет", group: "Пистолеты", bonus: "+1", init: "0", damage: "2", crit: "1", range: "Дальняя", features: "Бесшумное", tech: "С", price: "700" }),
  weapon({ name: "Карманный плазменный пистолет", group: "Пистолеты", bonus: "+1", init: "+2", damage: "3", crit: "2", range: "Средняя", features: "Лёгкое", tech: "П", price: "2500" }),
  weapon({ name: "Плазменный пистолет", group: "Пистолеты", bonus: "+1", init: "+1", damage: "3", crit: "2", range: "Дальняя", features: "—", tech: "П", price: "2300" }),
  weapon({ name: "Нейрошокер", group: "Пистолеты", bonus: "+1", init: "+1", damage: "2", crit: "—", range: "Средняя", features: "Шоковое", tech: "П", price: "2000" }),
  // Карабины
  weapon({ name: "Вулкан-карабин", group: "Карабины", bonus: "+1", init: "+0", damage: "3", crit: "2", range: "Средняя", features: "Автоматическое", tech: "С", price: "2000" }),
  weapon({ name: "Легионерский карабин «Дайал-3»", group: "Карабины", bonus: "+1", init: "+0", damage: "3", crit: "2", range: "Дальняя", features: "Автоматическое, вместительный магазин, подствольный гранатомёт", tech: "С", price: "3000", licensed: true }),
  weapon({ name: "Штурмовой вулкан-карабин", group: "Карабины", bonus: "+1", init: "+1", damage: "3", crit: "2", range: "Средняя", features: "Автоматическое", tech: "С", price: "2500" }),
  weapon({ name: "Рельсовый карабин", group: "Карабины", bonus: "+1", init: "+0", damage: "3", crit: "1", range: "Дальняя", features: "Автоматическое, бронебойное, бесшумное", tech: "С", price: "3000" }),
  weapon({ name: "Двуствольный карабин", group: "Карабины", bonus: "+1", init: "+0", damage: "4", crit: "2", range: "Дальняя", features: "Бронебойное, бесшумное", tech: "С", price: "3700" }),
  weapon({ name: "Плазменный карабин", group: "Карабины", bonus: "+1", init: "+0", damage: "4", crit: "2", range: "Дальняя", features: "Плазменный поток", tech: "П", price: "6500" }),
  // Дробовики
  weapon({ name: "Дробовик «Саладин»", group: "Дробовики", bonus: "+2", init: "+0", damage: "2", crit: "2", range: "Средняя", features: "Однозарядное", tech: "А", price: "200" }),
  weapon({ name: "Дробовик", group: "Дробовики", bonus: "+2", init: "+0", damage: "2", crit: "2", range: "Средняя", features: "—", tech: "С", price: "400" }),
  weapon({ name: "Укороченный дробовик", group: "Дробовики", bonus: "+2", init: "+1", damage: "2", crit: "3", range: "Средняя", features: "—", tech: "С", price: "400" }),
  weapon({ name: "Автоматический дробовик", group: "Дробовики", bonus: "+2", init: "+1", damage: "2", crit: "2", range: "Средняя", features: "Автоматическое", tech: "С", price: "600" }),
  // Винтовки
  weapon({ name: "Мультук", group: "Винтовки", bonus: "0", init: "+0", damage: "2", crit: "2", range: "Дальняя", features: "Однозарядное", tech: "А", price: "100" }),
  weapon({ name: "Обрез", group: "Винтовки", bonus: "0", init: "+1", damage: "2", crit: "2", range: "Средняя", features: "Однозарядное", tech: "А", price: "100" }),
  weapon({ name: "Рельсовая винтовка", group: "Винтовки", bonus: "+1", init: "+0", damage: "3", crit: "1", range: "Предельная", features: "Бронебойное, ПНВ, бесшумное", tech: "С", price: "2000" }),
  weapon({ name: "Рельсовая винтовка «Нестера Парокс»", group: "Винтовки", bonus: "0", init: "+0", damage: "4", crit: "1", range: "Предельная", features: "Тяжёлое, бесшумное, противотранспортное, бронебойное, ПНВ", tech: "С", price: "3000" }),
  weapon({ name: "Плазменная винтовка", group: "Винтовки", bonus: "0", init: "+0", damage: "5", crit: "2", range: "Предельная", features: "Бронебойное, ПНВ", tech: "П", price: "6000" }),
  // Тяжёлое оружие
  weapon({ name: "Вулкан-пулемёт", group: "Тяжёлое оружие", bonus: "+1", init: "+0", damage: "4", crit: "2", range: "Средняя", features: "Тяжёлое, громоздкое, автоматическое, вместительный магазин", tech: "С", price: "6500", licensed: true }),
  weapon({ name: "Рельсовый пулемёт", group: "Тяжёлое оружие", bonus: "+1", init: "+0", damage: "3", crit: "1", range: "Дальняя", features: "Тяжёлое, громоздкое, автоматическое, вместительный магазин, бронебойное, бесшумное", tech: "С", price: "10000", licensed: true }),
  weapon({ name: "Рельсовая катапульта", group: "Тяжёлое оружие", bonus: "+1", init: "+0", damage: "Граната", crit: "Граната", range: "Дальняя", features: "Тяжёлое", tech: "С", price: "8000", licensed: true }),
  weapon({ name: "Ракетная установка", group: "Тяжёлое оружие", bonus: "+0", init: "+0", damage: "6", crit: "1", range: "Предельная", features: "Тяжёлое, однозарядное, противотранспортное", tech: "С", price: "900", licensed: true }),
  weapon({ name: "Огнемёт", group: "Тяжёлое оружие", bonus: "+1", init: "+0", damage: "3", crit: "1", range: "Средняя", features: "Тяжёлое, огненное (3)", tech: "С", price: "1800", licensed: true }),
  weapon({ name: "Гранатомёт", group: "Тяжёлое оружие", bonus: "0", init: "+0", damage: "Граната", crit: "Граната", range: "Дальняя", features: "Однозарядное", tech: "С", price: "1200", licensed: true }),
  weapon({ name: "Плазмомёт", group: "Тяжёлое оружие", bonus: "+1", init: "+0", damage: "4", crit: "1", range: "Дальняя", features: "Тяжёлое, громоздкое, плазменный поток, вместительный магазин", tech: "П", price: "22000", licensed: true }),
  // Транспортные орудийные системы
  weapon({ name: "Ракетная пусковая установка", group: "Транспортные орудия", bonus: "+2", init: "+0", damage: "5 (кумулятивная) / граната (тактическая)", crit: "1", range: "Предельная", features: "Противотранспортное, бронебойное", tech: "С", price: "10000", licensed: true }),
  weapon({ name: "Плазменная установка", group: "Транспортные орудия", bonus: "+2", init: "+0", damage: "4", crit: "1", range: "Средняя", features: "Плазменный поток, огненное (5), громоздкое", tech: "П", price: "26000", licensed: true }),
  weapon({ name: "Реактивный огнемёт", group: "Транспортные орудия", bonus: "+1", init: "+0", damage: "5", crit: "1", range: "Дальняя", features: "Противотранспортное, медленное, огненное (6), мощность взрыва 5", tech: "С", price: "18000", licensed: true }),
  // Прочее дистанционное
  weapon({ name: "Духовая трубка", group: "Прочее дистанционное", bonus: "+0", init: "+2", damage: "1", crit: "4", range: "Средняя", features: "Лёгкое, однозарядное", tech: "А", price: "50" }),
  weapon({ name: "Метательный нож", group: "Прочее дистанционное", bonus: "+0", init: "+1", damage: "1", crit: "2", range: "Средняя", features: "Лёгкое", tech: "А", price: "50" }),
  weapon({ name: "Метательное копьё", group: "Прочее дистанционное", bonus: "+0", init: "+1", damage: "2", crit: "2", range: "Средняя", features: "—", tech: "А", price: "150" }),
  weapon({ name: "Метательный топор", group: "Прочее дистанционное", bonus: "+0", init: "+0", damage: "2", crit: "2", range: "Средняя", features: "—", tech: "А", price: "300" }),
  weapon({ name: "Копьеметалка", group: "Прочее дистанционное", bonus: "+1", init: "+0", damage: "2", crit: "2", range: "Средняя", features: "Тяжёлое, однозарядное", tech: "А", price: "600" }),
  weapon({ name: "Гарпунное ружьё", group: "Прочее дистанционное", bonus: "+1", init: "+1", damage: "2", crit: "3", range: "Средняя", features: "Тяжёлое, однозарядное", tech: "А", price: "200" }),
  weapon({ name: "Боевой лук", group: "Прочее дистанционное", bonus: "+1", init: "+1", damage: "3 или граната", crit: "2 или граната", range: "Дальняя", features: "Однозарядное", tech: "С", price: "2000" }),
  // Ближний бой — ножи и мечи
  weapon({ name: "Нож", group: "Ближний бой · ножи и мечи", bonus: "+0", init: "+1", damage: "2", crit: "2", range: "Ближняя", features: "Лёгкое", tech: "А", price: "50" }),
  weapon({ name: "Меч", group: "Ближний бой · ножи и мечи", bonus: "+1", init: "+0", damage: "2", crit: "2", range: "Ближняя", features: "—", tech: "А", price: "200" }),
  weapon({ name: "Вибронож", group: "Ближний бой · ножи и мечи", bonus: "+0", init: "+1", damage: "2", crit: "1", range: "Ближняя", features: "Лёгкое, энергетическое", tech: "С", price: "500" }),
  weapon({ name: "Вибромеч", group: "Ближний бой · ножи и мечи", bonus: "+1", init: "+0", damage: "2", crit: "1", range: "Ближняя", features: "Тяжёлое, энергетическое", tech: "С", price: "1600" }),
  weapon({ name: "Ртутный нож", group: "Ближний бой · ножи и мечи", bonus: "+1", init: "+1", damage: "3", crit: "2", range: "Ближняя", features: "Лёгкое, ртутное, энергетическое", tech: "П", price: "1500" }),
  weapon({ name: "Ртутный меч", group: "Ближний бой · ножи и мечи", bonus: "+2", init: "+0", damage: "3", crit: "2", range: "Ближняя", features: "Лёгкое, ртутное, энергетическое", tech: "П", price: "3000" }),
  // Ближний бой — топоры
  weapon({ name: "Секира", group: "Ближний бой · топоры", bonus: "+0", init: "+0", damage: "3", crit: "2", range: "Ближняя", features: "Тяжёлое", tech: "А", price: "150" }),
  weapon({ name: "Вибросекира", group: "Ближний бой · топоры", bonus: "+0", init: "+0", damage: "3", crit: "1", range: "Ближняя", features: "Тяжёлое, энергетическое", tech: "С", price: "2000" }),
  weapon({ name: "Алебарда", group: "Ближний бой · топоры", bonus: "+0", init: "+1", damage: "3", crit: "2", range: "Ближняя", features: "Тяжёлое, длинное", tech: "А", price: "300" }),
  weapon({ name: "Виброалебарда", group: "Ближний бой · топоры", bonus: "+0", init: "+1", damage: "3", crit: "1", range: "Ближняя", features: "Тяжёлое, длинное, энергетическое", tech: "С", price: "2500" }),
  // Ближний бой — дробящее
  weapon({ name: "Дубинка", group: "Ближний бой · дробящее", bonus: "+2", init: "+0", damage: "1", crit: "3", range: "Ближняя", features: "—", tech: "А", price: "100" }),
  weapon({ name: "Дубинка телескопическая", group: "Ближний бой · дробящее", bonus: "+1", init: "+0", damage: "1", crit: "3", range: "Ближняя", features: "Лёгкое", tech: "А", price: "200" }),
  weapon({ name: "Посох", group: "Ближний бой · дробящее", bonus: "+1", init: "+2", damage: "1", crit: "3", range: "Ближняя", features: "—", tech: "А", price: "50" }),
  weapon({ name: "Посох телескопический", group: "Ближний бой · дробящее", bonus: "+1", init: "+2", damage: "1", crit: "3", range: "Ближняя", features: "Лёгкое", tech: "А", price: "250" }),
  weapon({ name: "Булава", group: "Ближний бой · дробящее", bonus: "+0", init: "+0", damage: "3", crit: "3", range: "Ближняя", features: "Тяжёлое", tech: "А", price: "100" }),
  weapon({ name: "Силовой молот", group: "Ближний бой · дробящее", bonus: "+0", init: "+0", damage: "4", crit: "3", range: "Ближняя", features: "Тяжёлое, энергетическое", tech: "С", price: "1000" }),
  weapon({ name: "Силовой кастет", group: "Ближний бой · дробящее", bonus: "+1", init: "+1", damage: "2", crit: "3", range: "Ближняя", features: "Лёгкое, энергетическое", tech: "С", price: "1500" }),
  // Ближний бой — разрядное и нейрошоковое
  weapon({ name: "Разрядный жезл", group: "Ближний бой · разрядное", bonus: "+2", init: "+0", damage: "1", crit: "—", range: "Ближняя", features: "Разрядное, энергетическое", tech: "С", price: "500" }),
  weapon({ name: "Разрядный кнут", group: "Ближний бой · разрядное", bonus: "+0", init: "+2", damage: "1", crit: "—", range: "Ближняя", features: "Разрядное, гибкое, лёгкое, энергетическое", tech: "С", price: "800" }),
  weapon({ name: "Нейрошоковый посох", group: "Ближний бой · разрядное", bonus: "+2", init: "+2", damage: "2", crit: "3", range: "Ближняя", features: "Шоковое, тяжёлое, энергетическое", tech: "П", price: "1000" }),
  weapon({ name: "Нейрошоковый жезл", group: "Ближний бой · разрядное", bonus: "+2", init: "+0", damage: "2", crit: "3", range: "Ближняя", features: "Шоковое, энергетическое", tech: "П", price: "1200" }),
  weapon({ name: "Нейрошоковый кнут", group: "Ближний бой · разрядное", bonus: "+0", init: "+2", damage: "2", crit: "3", range: "Ближняя", features: "Шоковое, гибкое, лёгкое, энергетическое", tech: "П", price: "1800" }),
  weapon({ name: "Веер Алама", group: "Ближний бой · разрядное", bonus: "+1", init: "+2", damage: "2", crit: "1", range: "Ближняя", features: "Лёгкое, шоковое, энергетическое", tech: "П", price: "2500" }),
  // Ближний бой — прочее
  weapon({ name: "Безоружная атака", group: "Ближний бой · прочее", bonus: "+0", init: "+2", damage: "1", crit: "3", range: "Ближняя", features: "—", tech: "А", price: "—" }),
  weapon({ name: "Кастет", group: "Ближний бой · прочее", bonus: "+0", init: "+2", damage: "2", crit: "3", range: "Ближняя", features: "Лёгкое", tech: "А", price: "50" }),
  weapon({ name: "Когти", group: "Ближний бой · прочее", bonus: "+0", init: "+2", damage: "1", crit: "2", range: "Ближняя", features: "—", tech: "А", price: "—" }),
  weapon({ name: "Виброкогти", group: "Ближний бой · прочее", bonus: "+0", init: "+2", damage: "1", crit: "1", range: "Ближняя", features: "Лёгкое, энергетическое", tech: "С", price: "600" }),
  weapon({ name: "Копьё", group: "Ближний бой · прочее", bonus: "+1", init: "+2", damage: "2", crit: "2", range: "Ближняя", features: "Длинное", tech: "А", price: "200" }),
  weapon({ name: "Кнут", group: "Ближний бой · прочее", bonus: "+0", init: "+2", damage: "1", crit: "4", range: "Ближняя", features: "Гибкое", tech: "А", price: "50" }),
];

// ───────────────────────────────────────────────────────────────────────────
// БРОНЯ И ЩИТЫ — табл. 6.14
// ───────────────────────────────────────────────────────────────────────────

const ARMORS: CodexEntry[] = [
  armor({ name: "Лёгкий архаичный доспех", group: "Броня", rating: "2", base: "Неудобная", extra: "0", tech: "А", price: "300" }),
  armor({ name: "Тяжёлый архаичный доспех", group: "Броня", rating: "3", base: "Неудобная", extra: "0", tech: "А", price: "600" }),
  armor({ name: "Лётный комбинезон", group: "Броня", rating: "1", base: "—", extra: "0", tech: "С", price: "500" }),
  armor({ name: "Защитная одежда", group: "Броня", rating: "3", base: "—", extra: "0", tech: "С", price: "1000" }),
  armor({ name: "Экзоскафандр", group: "Броня", rating: "2", base: "Неудобная, термостатический комбинезон, скафандр, запас кислорода", extra: "0", tech: "С", price: "2000" }),
  armor({ name: "Экзопогрузчик", group: "Броня", rating: "2", base: "Грузовая рама, неудобная, термостатический комбинезон, скафандр, запас кислорода", extra: "0", tech: "С", price: "3000" }),
  armor({ name: "Тяжёлый экзоскафандр", group: "Броня", rating: "3", base: "Неудобная, термостатический комбинезон, скафандр, запас кислорода", extra: "1", tech: "С", price: "3000" }),
  armor({ name: "Лёгкая броня", group: "Броня", rating: "4", base: "—", extra: "1", tech: "С", price: "5500" }),
  armor({ name: "Тяжёлая броня", group: "Броня", rating: "6", base: "—", extra: "1", tech: "С", price: "10000" }),
  armor({ name: "Абляционные пластины", group: "Броня", rating: "—", base: "Уменьшают урон от одного попадания на 3 пункта", extra: "0", tech: "П", price: "2000", licensed: true }),
  armor({ name: "Экзодоспех", group: "Броня", rating: "9", base: "Термостатический комбинезон, скафандр, запас кислорода, усиленные сервоприводы", extra: "2", tech: "П", price: "25000", licensed: true }),
  armor({ name: "Тяжёлый экзодоспех", group: "Броня", rating: "10", base: "Термостатический комбинезон, скафандр, запас кислорода, усиленные сервоприводы", extra: "5", tech: "П", price: "60000", licensed: true }),
  armor({ name: "Архаичный щит", group: "Щиты", rating: "2", base: "Тяжёлое", tech: "А", price: "100" }),
  armor({ name: "Тактический щит", group: "Щиты", rating: "4", base: "Тяжёлое", tech: "С", price: "500" }),
  armor({ name: "Боевой щит", group: "Щиты", rating: "6", base: "Тяжёлое", tech: "С", price: "800" }),
];

// ───────────────────────────────────────────────────────────────────────────
// ВЗРЫВЧАТКА И ГРАНАТЫ — табл. 6.12
// ───────────────────────────────────────────────────────────────────────────

const EXPLOSIVES: CodexEntry[] = [
  explosive({ name: "Объектная мина (малая)", group: "Объектные мины", power: "6", damage: "1", crit: "1", radius: "Ближний", features: "—", tech: "С", price: "500", weight: "Тяжёлый" }),
  explosive({ name: "Объектная мина (средняя)", group: "Объектные мины", power: "8", damage: "1", crit: "1", radius: "Средний", features: "—", tech: "С", price: "2000", weight: "Тяжёлый" }),
  explosive({ name: "Объектная мина (тяжёлая)", group: "Объектные мины", power: "12", damage: "1", crit: "1", radius: "Средний", features: "—", tech: "С", price: "10000", weight: "Тяжёлый", licensed: true }),
  explosive({ name: "Объектная мина (сверхтяжёлая)", group: "Объектные мины", power: "16", damage: "1", crit: "1", radius: "Средний", features: "—", tech: "С", price: "40000", weight: "Тяжёлый", licensed: true }),
  explosive({ name: "Фугасная граната", group: "Гранаты", power: "6", damage: "1", crit: "2", radius: "Ближний", features: "—", tech: "С", price: "600", weight: "Лёгкий" }),
  explosive({ name: "Осколочная граната", group: "Гранаты", power: "6", damage: "2", crit: "1", radius: "Ближний", features: "—", tech: "С", price: "500", weight: "Лёгкий" }),
  explosive({ name: "Граната «Инферно»", group: "Гранаты", power: "9", damage: "2", crit: "1", radius: "Средний", features: "—", tech: "П", price: "1500", weight: "Лёгкий", licensed: true }),
  explosive({ name: "Экранирующая граната", group: "Гранаты", power: "0", damage: "0", crit: "—", radius: "Средний", features: "Блокирует видимость и сенсоры", tech: "С", price: "1000", weight: "Лёгкий" }),
  explosive({ name: "Дымовая граната", group: "Гранаты", power: "0", damage: "0", crit: "—", radius: "Средний", features: "Блокирует видимость", tech: "С", price: "400", weight: "Лёгкий" }),
  explosive({ name: "Светошумовая граната", group: "Гранаты", power: "6", damage: "1", crit: "—", radius: "Ближний", features: "Шоковое", tech: "С", price: "800", weight: "Лёгкий" }),
  explosive({ name: "Зажигательная граната", group: "Гранаты", power: "6", damage: "1", crit: "1", radius: "Ближний", features: "Огненное (2)", tech: "П", price: "2000", weight: "Лёгкий", licensed: true }),
  explosive({ name: "Термобарическая граната", group: "Гранаты", power: "9", damage: "1", crit: "1", radius: "Средний", features: "Огненное (3)", tech: "П", price: "4000", weight: "Лёгкий", licensed: true }),
];

// ───────────────────────────────────────────────────────────────────────────
// ПРЕДМЕТЫ — табл. 6.3–6.9
// ───────────────────────────────────────────────────────────────────────────

const GEAR: CodexEntry[] = [
  // Предметы повседневного обихода (6.3)
  gear({ name: "Автоматический переводчик", group: "Повседневный обиход", tech: "П", price: "10000", weight: "Маленький", summary: "Медальон-переводчик: если говорить медленно и с паузами, переводит с любого на любой из трёх заложенных языков. Бирки с доп. языками — 5000 бирров." }),
  gear({ name: "Арраш", group: "Повседневный обиход", tech: "А", price: "25", weight: "Маленький", mod: "–1", summary: "Стимулятор-болеутолитель, который курят или добавляют в напитки. Делает человека сонным и тихим: –1 при проверках любых навыков." }),
  gear({ name: "Бирка", group: "Повседневный обиход", tech: "С", price: "50", weight: "Маленький", summary: "Кристаллическое энергонезависимое хранилище электронных бирров и данных; без цифровой подписи транзакции почти не отследить." }),
  gear({ name: "Голограф", group: "Повседневный обиход", tech: "П", price: "1200 – 7000", weight: "Маленький – тяжёлый", summary: "Принимает и передаёт детальные голограммы (текст, чертежи, портреты). Классы I–V по дальности, как у коммуникатора; импульсный вариант лицензирован." }),
  gear({ name: "Громкоговоритель", group: "Повседневный обиход", tech: "С", price: "400", weight: "Лёгкий", summary: "Устройство с раструбом и микрофоном: сказанное слышно на расстоянии до 100 метров." }),
  gear({ name: "Камбра", group: "Повседневный обиход", tech: "С", price: "250", weight: "Маленький", mod: "+1", summary: "Лёгкий наркотик-эйфоретик: +1 при проверках влияния на несколько часов. После — тяжёлое похмелье и 2 пункта стресса." }),
  gear({ name: "Коммуникатор", group: "Повседневный обиход", tech: "С", price: "200 – 5000", weight: "Маленький – тяжёлый", summary: "Приём и передача аудио/видео. Классы: персональный (I, 10 км), ближнего (II, 50 км), дальнего (III, 100 км), орбитальный (IV), межпланетный (V), импульсный (лицензия)." }),
  gear({ name: "Компьютер", group: "Повседневный обиход", tech: "А", price: "10000 / 15000 / 20000", weight: "Средний", mod: "−3 / –1 / +1", summary: "Самообучающийся компьютер с голосовым управлением. Модификатор инфомантии зависит от уровня: архаичный −3, современный –1, передовой +1." }),
  gear({ name: "Модулятор", group: "Повседневный обиход", tech: "П", price: "12000", weight: "Средний", summary: "Нанотехнологический имитатор: на дистанции до 10 км создаёт и передаёт точные, но нефункциональные массогабаритные копии предметов и людей." }),
  gear({ name: "Музыкальный инструмент", group: "Повседневный обиход", tech: "А", price: "100 – 1000", weight: "Лёгкий – тяжёлый", mod: "+1", summary: "От флейт до цитр и арф: +1 при проверке влияния, когда персонаж развлекает публику или даёт выступление." }),
  gear({ name: "Одежда", group: "Повседневный обиход", tech: "С", price: "50 – 1000", weight: "Маленький", summary: "Джеллабы, галабеи, кафтаны, курты, камизы и прочие костюмы Третьего Горизонта — от простых до роскошных." }),
  gear({ name: "Опор", group: "Повседневный обиход", tech: "А", price: "50", weight: "Маленький", mod: "–2", summary: "Мощная и аддиктивная синтетическая разновидность арраша: погружает в сонное блаженство, –2 при проверках любых навыков." }),
  gear({ name: "Прокси-сеанс", group: "Повседневный обиход", tech: "С", price: "100", weight: "Маленький", mod: "–2", summary: "Запись чужих эмоций и ощущений. Во время просмотра персонаж хуже воспринимает окружающее: –2 при наблюдательности. Нужен прокси-шлем." }),
  gear({ name: "Прокси-шлем", group: "Повседневный обиход", tech: "С", price: "500", weight: "Лёгкий", summary: "Головной убор, передающий напрямую в мозг оцифрованные ощущения прокси-сеанса." }),
  gear({ name: "Табак", group: "Повседневный обиход", tech: "А", price: "25", weight: "Маленький", summary: "Лёгкий стимулятор с сильным запахом: курят через кальян или заваривают как тонизирующий напиток." }),
  gear({ name: "Табула", group: "Повседневный обиход", tech: "С", price: "2000", weight: "Лёгкий", summary: "Электронный планшет с сенсорным управлением: поиск в сети, дневники, чтение сводок «Глашатая»." }),
  gear({ name: "Талисман", group: "Повседневный обиход", tech: "А", price: "50", weight: "Маленький", mod: "+1", summary: "Образок одного из Ликов. Должным образом освящённый (см. «Освятитель») даёт +1 к одной проверке навыка." }),
  gear({ name: "Топливный элемент", group: "Повседневный обиход", tech: "С", price: "50", weight: "Маленький", summary: "Портативный водородный источник энергии. Заправка на станции техобслуживания — 5 бирров." }),
  gear({ name: "Транзактор", group: "Повседневный обиход", tech: "С", price: "100", weight: "Маленький", mod: "+1", summary: "Электронное удостоверение с банковским счётом, привязанное к генокоду: +1 при инфомантии при попытке отследить его транзакции." }),
  gear({ name: "Электронная библиотека", group: "Повседневный обиход", tech: "П", price: "1500 / 2000 / 2500", weight: "Маленький", mod: "+1 / +2 / +3", summary: "Узкотематическая база данных для компьютера: +1…+3 при проверках науки или мудрости (чем шире тема, тем меньше бонус)." }),

  // Медицинские технологии (6.4)
  gear({ name: "Арахнид-медикург", group: "Медицина", tech: "П", price: "5000", weight: "Тяжёлый", licensed: true, summary: "Автономный полевой медблок в виде паука (смекалка 5, медикургия 3). Оказывает полный спектр помощи и вызывает подмогу через коммуникатор (II)." }),
  gear({ name: "Биомонитор", group: "Медицина", tech: "С", price: "5000", weight: "Лёгкий", summary: "Носимый монитор здоровья со встроенным коммуникатором (II): позволяет медикургам помогать друг другу на расстоянии." }),
  gear({ name: "Боевые коктейли", group: "Медицина", tech: "С", price: "200", weight: "Маленький", mod: "+1 / –1", licensed: true, summary: "Стимуляторы: на d6 часов +1 к одной характеристике. По окончании — 2 пункта урона и –1 к той же характеристике на 12 часов." }),
  gear({ name: "Докторская сумка", group: "Медицина", tech: "А", price: "300", weight: "Средний", mod: "+0", summary: "Инструменты и 10 порций целебных трав: позволяет лечить всё, кроме урона от радиации, с целебными травами по +0 вместо –1." }),
  gear({ name: "М-дротик", group: "Медицина", tech: "С", price: "1000", weight: "Лёгкий", mod: "+1", summary: "Шприц с м-стимом, выстреливаемый из вулкан-оружия для помощи на средней дистанции (нужна проверка стрельбы, затем медикургии)." }),
  gear({ name: "М-комплект", group: "Медицина", tech: "С", price: "700", weight: "Средний", mod: "+2", summary: "Переносной контейнер с 10 дозами м-стима: полный спектр помощи с модификатором +2." }),
  gear({ name: "М-стим", group: "Медицина", tech: "С", price: "50", weight: "Лёгкий", mod: "+1", summary: "Одноразовый шприц-тюбик — минимум для полного спектра помощи. Отдельно даёт +1 при медикургии." }),
  gear({ name: "Медотсек", group: "Медицина", tech: "С", price: "5000", weight: "—", mod: "+3", summary: "Оборудованный медицинский отсек со 100 дозами м-стима: помощь с модификатором +3. Переоснащение — 2500 бирров." }),
  gear({ name: "Н-стим", group: "Медицина", tech: "З", price: "1000", weight: "Лёгкий", mod: "+2 / +3", licensed: true, summary: "Засекреченный аналог м-стима Ордена Неприкасаемых: +3 при лечении травм, +2 в остальных случаях." }),
  gear({ name: "Р-комплект", group: "Медицина", tech: "П", price: "2000", weight: "Средний", mod: "+3", summary: "Передовой м-комплект с 10 дозами р-стима: помощь с модификатором +3." }),
  gear({ name: "Р-стим", group: "Медицина", tech: "П", price: "200", weight: "Лёгкий", mod: "+2", summary: "Передовая разновидность м-стима: отдельно даёт +2 при медикургии." }),
  gear({ name: "Реанимационный отсек", group: "Медицина", tech: "П", price: "20000", weight: "—", mod: "+4 / +5", licensed: true, summary: "Передовой медотсек со 100 дозами р-стима: +5 при лечении травм, +4 в остальных случаях. Переоснащение — 15000 бирров." }),
  gear({ name: "Целебные травы", group: "Медицина", tech: "А", price: "50", weight: "Лёгкий", mod: "–1", summary: "Только первая помощь и бессильны против радиации. Отдельно, без докторской сумки, дают –1 при медикургии." }),
  gear({ name: "Яды", group: "Медицина", tech: "А", price: "300 – 3000", weight: "Маленький", summary: "Токсичность 1–5 (у сильнейших до 8). Отравление — встречная проверка токсичности против характеристики жертвы." }),

  // Запчасти и инструменты (6.5)
  gear({ name: "Герметик", group: "Запчасти и инструменты", tech: "С", price: "500", weight: "Лёгкий", summary: "Инструмент-шприц: за один ход заделывает небольшую пробоину в обшивке экзоскафандра или корабля." }),
  gear({ name: "Дуговой резак", group: "Запчасти и инструменты", tech: "С", price: "800", weight: "Тяжёлый", summary: "Электродуговой резак (нужен топливный элемент): за пару минут прорезает отверстие для человека без экзоскафандра. Заряда хватает на одно применение." }),
  gear({ name: "Запчасти, архаичные", group: "Запчасти и инструменты", tech: "А", price: "50", weight: "Лёгкий", summary: "Набор для ремонта одного архаичного предмета. Без мастерской/инструментов проверка технологики –2." }),
  gear({ name: "Запчасти, современные", group: "Запчасти и инструменты", tech: "С", price: "200", weight: "Лёгкий", summary: "Набор для ремонта одного современного предмета. Нужна мастерская или набор инструментов." }),
  gear({ name: "Запчасти, передовые", group: "Запчасти и инструменты", tech: "П", price: "1000", weight: "Лёгкий", summary: "Набор для ремонта одного передового предмета. Нужна мастерская или набор инструментов передового уровня." }),
  gear({ name: "Мастерская, архаичная", group: "Запчасти и инструменты", tech: "А", price: "400", weight: "—", mod: "+1", summary: "Помещение для ремонта и создания архаичных предметов: +1 при технологике. 10 наборов запчастей в запасе." }),
  gear({ name: "Мастерская, современная", group: "Запчасти и инструменты", tech: "С", price: "2000", weight: "—", mod: "+1", summary: "Ремонт и создание современных/архаичных предметов: +1 при технологике. Переоснащение — 500 бирров." }),
  gear({ name: "Мастерская, передовая", group: "Запчасти и инструменты", tech: "П", price: "15000", weight: "—", mod: "+2", summary: "Ремонт и создание предметов любого уровня: +2 при технологике. Переоснащение — 2000 бирров." }),
  gear({ name: "Набор инструментов, архаичный", group: "Запчасти и инструменты", tech: "А", price: "100", weight: "Тяжёлый", summary: "Простейшие инструменты для архаичных предметов. Ремонт одними запчастями — проверка технологики –2." }),
  gear({ name: "Набор инструментов, современный", group: "Запчасти и инструменты", tech: "С", price: "500", weight: "Средний", summary: "Основные многофункциональные инструменты — минимум для ремонта современных предметов." }),
  gear({ name: "Набор инструментов, передовой", group: "Запчасти и инструменты", tech: "П", price: "1500", weight: "Лёгкий", mod: "+1", summary: "Расширенный набор для ремонта передовых предметов: +1 при технологике. Без него ремонт передового уровня невозможен." }),
  gear({ name: "Плазменный резак", group: "Запчасти и инструменты", tech: "П", price: "3000", weight: "Тяжёлый", summary: "Требует три топливных элемента: за минуту прорезает отверстие для человека в экзоскафандре. Заряда хватает на одно применение." }),

  // Выживание и колонизация (6.6)
  gear({ name: "Акваланг", group: "Выживание и колонизация", tech: "С", price: "1000", weight: "Тяжёлый", summary: "Шлем/маска с заплечным баллоном: запаса воздуха хватает на 2 часа подводного плавания." }),
  gear({ name: "Баллистический картограф", group: "Выживание и колонизация", tech: "П", price: "4000", weight: "Маленький", licensed: true, summary: "Мини-ракеты для вулкан-оружия выбрасывают облако датчиков и строят трёхмерную карту местности. Комплект из пяти ракет — 2000 бирров." }),
  gear({ name: "Бинокль", group: "Выживание и колонизация", tech: "А", price: "100", weight: "Лёгкий", mod: "+1", summary: "Оптический прибор для наблюдения удалённых объектов: +1 при проверках наблюдательности." }),
  gear({ name: "Верхолазный костюм", group: "Выживание и колонизация", tech: "П", price: "4000", weight: "Лёгкий", mod: "+3", licensed: true, summary: "Прилипающие перчатки, ботинки и налокотники для перемещения по стенам и потолкам: +3 при проворстве во время лазания." }),
  gear({ name: "Водный фильтр", group: "Выживание и колонизация", tech: "С", price: "1000", weight: "Лёгкий", summary: "Очищает воду от биологических, химических и радиоактивных примесей — одному человеку в сутки. Нужен топливный элемент (заряд на неделю)." }),
  gear({ name: "Водосборник", group: "Выживание и колонизация", tech: "С", price: "2000", weight: "Маленький", summary: "Конденсирует воду из воздуха: в умеренном климате — на 2 дня, во влажном — на 5, в засушливом — на 1. Нужен топливный элемент." }),
  gear({ name: "Герметичный шатёр", group: "Выживание и колонизация", tech: "С", price: "1200", weight: "Тяжёлый", summary: "Четырёхместный шатёр с изолированной атмосферой: без внешнего кислорода запаса хватает на сутки." }),
  gear({ name: "Гипертрос", group: "Выживание и колонизация", tech: "С", price: "200", weight: "Маленький", mod: "+1", summary: "Прочный трос ~50 м с зажимами для лазания: +1 при проворстве при подъёме или спуске." }),
  gear({ name: "Изолирующий противогаз", group: "Выживание и колонизация", tech: "С", price: "500", weight: "Лёгкий", summary: "Герметичная маска с кислородным баллоном: без внешнего кислорода запаса хватает на час; иначе работает как фильтрующий противогаз." }),
  gear({ name: "Искусственные жабры", group: "Выживание и колонизация", tech: "П", price: "2500", weight: "Лёгкий", summary: "Маска, извлекающая пригодную для дыхания смесь прямо из воды." }),
  gear({ name: "Компас", group: "Выживание и колонизация", tech: "А", price: "100", weight: "Маленький", mod: "+1", summary: "+1 при выживании для ориентирования на местности (если магнитное поле позволяет). Со встроенным высотомером." }),
  gear({ name: "Пищевой рециркулятор", group: "Выживание и колонизация", tech: "П", price: "3000", weight: "Маленький", summary: "Перерабатывает органические отходы в съедобную пасту на шесть человек. Требует много энергии (реактор или термоядерный аккумулятор)." }),
  gear({ name: "Пищевые пилюли", group: "Выживание и колонизация", tech: "П", price: "250", weight: "Маленький", summary: "Суточный паёк из трёх таблеток. Каждую нужно запивать полулитром воды." }),
  gear({ name: "Портативная лаборатория", group: "Выживание и колонизация", tech: "С", price: "2000", weight: "Тяжёлый", mod: "+2", summary: "+2 при науке при биологическом, радиологическом, химическом или спектральном анализе образца." }),
  gear({ name: "Походный шатёр", group: "Выживание и колонизация", tech: "П", price: "2000", weight: "Средний", summary: "Разворачивается одним нажатием в двухместный шатёр с климат-системой на солнечных панелях." }),
  gear({ name: "Сенсорный анализатор", group: "Выживание и колонизация", tech: "С", price: "400", weight: "Лёгкий", mod: "+2", summary: "+2 при выживании при определении опасных химических веществ, биоагентов или радиации." }),
  gear({ name: "Сигнальная ракета", group: "Выживание и колонизация", tech: "А", price: "50", weight: "Лёгкий", summary: "Выпущенная в воздух, вспыхивает видимым издалека пламенем и горит до конца раунда. Цвет — на корпусе." }),
  gear({ name: "Сухой паёк", group: "Выживание и колонизация", tech: "С", price: "100", weight: "Маленький", summary: "Одного пайка на три приёма хватает человеку на сутки. Добавь пол-литра воды." }),
  gear({ name: "Термостатический комбинезон", group: "Выживание и колонизация", tech: "С", price: "1100", weight: "Средний", mod: "+1", summary: "Нагрев/охлаждение без внешнего питания (–80…+70 °С), фильтрует пот и урину в воду: +1 при выживании и суточная норма воды." }),
  gear({ name: "Фильтрующий противогаз", group: "Выживание и колонизация", tech: "С", price: "300", weight: "Лёгкий", summary: "Маска с фильтром от вдыхаемых ядов. Срок службы фильтра — от одного до трёх дней." }),
  gear({ name: "Химический гаситель", group: "Выживание и колонизация", tech: "С", price: "300", weight: "Средний", summary: "Одноразовое устройство: продолжительным действием тушит небольшой огонь и нейтрализует едкое или горючее вещество." }),

  // Средства передвижения (6.7)
  gear({ name: "БПЛА", group: "Средства передвижения", tech: "С", price: "4000", weight: "—", summary: "Беспилотник с манипуляторами, управляемый через компьютер или табулу. Оснащение зависит от задач." }),
  gear({ name: "Бронированный гравилёт", group: "Средства передвижения", tech: "С", price: "40000", weight: "—", summary: "Бронированный гравилёт 5–10 м с усиленными двигателями и потолком полёта ~20 метров." }),
  gear({ name: "Вездеход", group: "Средства передвижения", tech: "С", price: "6000", weight: "—", summary: "Гусеничная машина на 6 мест и 400 кг груза (+прицеп 400 кг), скорость до 80 км/ч. Коммуникатор (III) и реактивные гарпуны." }),
  gear({ name: "Гравикомпенсатор", group: "Средства передвижения", tech: "П", price: "4500", weight: "Тяжёлый", summary: "Ремни с эмиттерами и заплечный ранец: держит 1G независимо от внешних условий. Термоядерный аккумулятор — на час работы." }),
  gear({ name: "Гравилёт", group: "Средства передвижения", tech: "С", price: "15000", weight: "—", mod: "+1", summary: "Автомобиль на гравитонных движителях, потолок ~1,5 м (некоторые «прыгают» до 10 м)." }),
  gear({ name: "Гравицикл", group: "Средства передвижения", tech: "С", price: "3000", weight: "—", mod: "+2", summary: "Одноместный аппарат с мощным гравитонным двигателем: высота до 50 м, работает от термоядерного аккумулятора." }),
  gear({ name: "Грузовая платформа", group: "Средства передвижения", tech: "С", price: "10000", weight: "—", summary: "Гравитонная платформа для тяжёлых грузов от термоядерного реактора, с сиденьем и панелью управления." }),
  gear({ name: "Подводный реактивный ранец", group: "Средства передвижения", tech: "С", price: "1100", weight: "Тяжёлый", mod: "+1", summary: "Заплечный водомёт: +1 при проворстве под водой. Топливный элемент — на два часа работы." }),
  gear({ name: "Пульт управления", group: "Средства передвижения", tech: "С", price: "2000", weight: "Маленький", summary: "Радиоприставка к табуле/компьютеру: проверкой инфомантии управляет транспортом в рамках предельной дистанции." }),
  gear({ name: "Реактивный ранец", group: "Средства передвижения", tech: "С", price: "1600", weight: "Тяжёлый", mod: "+1 / +2", summary: "Пара реактивных двигателей: +2 при проворстве в невесомости, +1 при гравитации. Топлива на час полёта." }),
  gear({ name: "Ручной маневровый двигатель", group: "Средства передвижения", tech: "С", price: "700", weight: "Тяжёлый", mod: "+1", summary: "Небольшой реактивный двигатель: +1 при проворстве в условиях невесомости." }),
  gear({ name: "Тягач", group: "Средства передвижения", tech: "С", price: "4000", weight: "—", summary: "Гусеничная грузовая платформа 30–50 м. По радиомаякам — до 60 км/ч, без них — 15 км/ч." }),

  // Разведка и шпионаж (6.8)
  gear({ name: "Детектор лжи", group: "Разведка и шпионаж", tech: "П", price: "1800", weight: "Лёгкий", mod: "+2", summary: "Датчики на теле собеседника: +2 при влиянии, чтобы определить, врёт он или говорит правду." }),
  gear({ name: "Маскировочный костюм", group: "Разведка и шпионаж", tech: "П", price: "3000", weight: "Лёгкий", mod: "+2", summary: "Меняет окраску и рассеивает тепловой след, обманывая глаз и сенсоры: +2 при скрытности." }),
  gear({ name: "Механическая отмычка", group: "Разведка и шпионаж", tech: "А", price: "50", weight: "Лёгкий", summary: "Отмычка для механических замков. Взлом импровизированными средствами — проверка технологики –1." }),
  gear({ name: "Модулирующая маска", group: "Разведка и шпионаж", tech: "П", price: "5000", weight: "Лёгкий", summary: "Миниатюрный модулятор в виде ожерелья: накладывает поверх лица чужую личину. –2 наблюдательности тому, кто пытается её распознать." }),
  gear({ name: "Разведзонд", group: "Разведка и шпионаж", tech: "С", price: "2000", weight: "Средний", summary: "Сверхмалый разведывательный БПЛА с гравитонным движителем. Управляется в рамках предельной дистанции; детальность — проверка наблюдательности." }),
  gear({ name: "Фиброскоп", group: "Разведка и шпионаж", tech: "П", price: "3000", weight: "Маленький", summary: "Крохотный объектив на оптоволоконном кабеле к табуле: заглянуть за угол или в занятое помещение, не рискуя головой." }),
  gear({ name: "Широкополосный сенсор", group: "Разведка и шпионаж", tech: "С", price: "1200", weight: "Средний", summary: "Сканирует ландшафт и объекты. Активный режим — предельная дистанция, пассивный — дальняя (сложнее обнаружить сканирующего)." }),
  gear({ name: "Электронная отмычка", group: "Разведка и шпионаж", tech: "С", price: "700", weight: "Лёгкий", summary: "Декодер для электронных замков и ловушек. Взлом импровизированными средствами — проверка технологики –2." }),

  // Амуниция и боеприпасы (6.9)
  gear({ name: "Гироскопическая подвеска", group: "Амуниция и боеприпасы", tech: "С", price: "200", weight: "Средний", summary: "Пояс/жилет с гироподвеской: позволяет игнорировать штраф при стрельбе из громоздкого оружия не из положения лёжа." }),
  gear({ name: "Командирский планшет", group: "Амуниция и боеприпасы", tech: "С", price: "2300", weight: "Лёгкий", licensed: true, summary: "Синхронизируется с коммуникаторами бойцов: оператор проходит проверки лидерства удалённо, координируя подразделение." }),
  gear({ name: "Комплект боеприпасов (архаичный)", group: "Амуниция и боеприпасы", tech: "А", price: "5", weight: "Лёгкий", summary: "Газыри, пули для пращей, стрелы. Однозарядному оружию нужен один комплект на выстрел." }),
  gear({ name: "Комплект боеприпасов (современный)", group: "Амуниция и боеприпасы", tech: "С", price: "50", weight: "Лёгкий", summary: "Снаряжённый магазин или одиночный снаряд. Для энергооружия — со встроенным топливным элементом." }),
  gear({ name: "Комплект боеприпасов (передовой)", group: "Амуниция и боеприпасы", tech: "П", price: "50", weight: "Лёгкий", summary: "Запас рабочего тела; для пистолетов — мощный топливный элемент военного образца." }),
  gear({ name: "Комплект боеприпасов, вибродротики", group: "Амуниция и боеприпасы", tech: "С", price: "200", weight: "Лёгкий", mod: "+1", licensed: true, summary: "Подкалиберные вибродротики для вулкан-оружия: +1 при стрельбе, но класс защиты брони цели +2. Дают оружию свойство «бесшумное»." }),
  gear({ name: "Оптический прицел", group: "Амуниция и боеприпасы", tech: "А", price: "200", weight: "Маленький", mod: "+1", summary: "+1 при прицельном выстреле за рамками средней дистанции. Может служить биноклем." }),
  gear({ name: "Постановщик радиопомех", group: "Амуниция и боеприпасы", tech: "С", price: "1500", weight: "Лёгкий", licensed: true, summary: "Создаёт помехи: связь в рамках предельной дистанции только после успешной проверки технологики. Работает от термоядерного аккумулятора." }),
  gear({ name: "Прибор ночного видения", group: "Амуниция и боеприпасы", tech: "С", price: "1000", weight: "Маленький", summary: "Светоусиливающий прибор: зрение монохромное, но игнорирует все эффекты темноты." }),
  gear({ name: "Сенсорный прицел (современный)", group: "Амуниция и боеприпасы", tech: "С", price: "2000", weight: "Маленький", mod: "+1", summary: "Лазерный сенсор: +1 при прицельном выстреле за рамками ближней дистанции." }),
  gear({ name: "Сенсорный прицел (передовой)", group: "Амуниция и боеприпасы", tech: "П", price: "5000", weight: "Маленький", mod: "+1", licensed: true, summary: "Инфоджинн учитывает отдачу и движение стрелка: +1 при стрельбе за рамками ближней дистанции. Не работает при стрельбе навскидку." }),
  gear({ name: "Термоядерный аккумулятор", group: "Амуниция и боеприпасы", tech: "С", price: "3000", weight: "Тяжёлый", summary: "Миниатюрный термоядерный реактор для питания устройств и транспорта; плазменному/мезонному оружию даёт три комплекта боеприпасов." }),
];

// ───────────────────────────────────────────────────────────────────────────
// ДОСТОИНСТВА — из реестра talents.ts + дары Ликов из icons.ts
// ───────────────────────────────────────────────────────────────────────────

const TALENT_GROUP: Record<TalentKind, string> = {
  personal: "Личные достоинства",
  group: "Достоинства команды",
  mystic: "Мистические практики",
  stigma: "Стигмы пасынков",
  cybernetic: "Кибернетические имплантаты",
  bionic: "Бионические модификации",
};

const TALENTS_AS_CODEX: CodexEntry[] = TALENT_KEYS.filter((k) => k !== "mysticGeneric").map((k) => {
  const t = TALENTS[k];
  return {
    id: `talent:${t.key}`,
    category: "talent" as const,
    name: t.name,
    group: TALENT_GROUP[t.kind],
    summary: t.summary,
    tech: t.kind === "cybernetic" ? "С" : t.kind === "bionic" ? "П" : undefined,
    price: t.cost != null ? String(t.cost) : undefined,
    licensed: t.kind === "bionic" || undefined,
  };
});

const ICON_GIFTS_AS_CODEX: CodexEntry[] = ICON_KEYS.map((k) => {
  const icon = ICONS[k];
  return {
    id: `talent:gift-${icon.key}`,
    category: "talent" as const,
    name: `Дар Лика: ${icon.name}`,
    group: "Дары Ликов",
    summary: `${icon.description} Дар: ${icon.gift}`,
  };
});

// ───────────────────────────────────────────────────────────────────────────
// МИСТИЧЕСКИЕ СИЛЫ — практики из гл. 10 (полные описания)
// ───────────────────────────────────────────────────────────────────────────

const MYSTIC_POWERS: CodexEntry[] = [
  { key: "oblivion", name: "Забвение", summary: "Персонаж ведущего не предпринимает незначительное рутинное действие, которое можно списать на забывчивость (пропустить через блокпост, забыть ключи). Не позволяет предотвратить вражескую атаку." },
  { key: "intuition", name: "Интуиция", summary: "Ты задаёшь ведущему один вопрос с ответом «да»/«нет», и он отвечает правдиво. Если прямого ответа нет — ведущий может ответить «может быть»." },
  { key: "mentalContact", name: "Ментальный контакт", summary: "Сосредоточившись на знакомом человеке, ты «подключаешься» к его органам чувств на любом расстоянии: видишь и слышишь как он. Мысли и эмоции недоступны." },
  { key: "comprehension", name: "Постижение", summary: "Погрузившись в транс, ты постигаешь происхождение и предназначение находящегося рядом артефакта." },
  { key: "premonition", name: "Предчувствие", summary: "По просьбе ведущего при удачной проверке персонаж понимает, что ему грозит опасность, но не её природу." },
  { key: "divination", name: "Прорицание", summary: "Психомистический сеанс: ты задаёшь ведущему вопрос о любом участнике сеанса (в т. ч. о себе), и он даёт правдивый, но короткий и загадочный ответ — иногда в форме пророчества." },
  { key: "telekinesis", name: "Телекинез", summary: "Ты силой мысли поднимаешь, двигаешь, вращаешь и изгибаешь маленькие предметы (лёгкие, средние и тяжёлые — нет). Проверка нужна для тонких операций. Нельзя пользоваться в бою." },
  { key: "mindReading", name: "Чтение мыслей", summary: "Сосредоточившись на разуме человека рядом (ближняя дистанция), ты читаешь его поверхностные, сиюминутные мысли не дольше минуты. Глубины памяти недоступны." },
  { key: "exorcism", name: "Экзорцизм", summary: "Погрузившись в транс, ты изгоняешь вселившуюся в чьё-либо тело сверхъестественную сущность." },
  { key: "clairvoyance", name: "Ясновидение", summary: "Погрузившись в транс, ты вызываешь видение, указывающее на местоположение пропавшего или похищенного предмета или существа. Знакомые понаслышке объекты — менее отчётливы." },
].map((p) => ({
  id: `mystic:${p.key}`,
  category: "mysticPower" as const,
  name: p.name,
  group: "Мистические практики",
  summary: p.summary,
  tags: ["Психомистицизм"],
}));

// ───────────────────────────────────────────────────────────────────────────
// Публичный API
// ───────────────────────────────────────────────────────────────────────────

/** Встроенный каталог кодекса из корбука ST3001. */
export const BUILTIN_CODEX: readonly CodexEntry[] = [
  ...WEAPONS,
  ...ARMORS,
  ...EXPLOSIVES,
  ...GEAR,
  ...TALENTS_AS_CODEX,
  ...ICON_GIFTS_AS_CODEX,
  ...MYSTIC_POWERS,
];

/** Число встроенных записей по типам — для бейджей на вкладках. */
export function countByCategory(entries: readonly CodexEntry[]): Record<CodexCategory, number> {
  const out = Object.fromEntries(CODEX_CATEGORIES.map((c) => [c, 0])) as Record<CodexCategory, number>;
  for (const e of entries) out[e.category] += 1;
  return out;
}

/** Уникальные подгруппы записей заданного типа (для фильтра по группам). */
export function groupsForCategory(entries: readonly CodexEntry[], category: CodexCategory): string[] {
  const set = new Set<string>();
  for (const e of entries) if (e.category === category && e.group) set.add(e.group);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}

export interface CodexQuery {
  /** Строка поиска (по названию, описанию, группе, тегам). */
  text?: string;
  /** Ограничение по типу; `null`/undefined — все типы. */
  category?: CodexCategory | null;
  /** Ограничение по подгруппе. */
  group?: string | null;
  /** Ограничение по уровню технологии. */
  tech?: TechLevel | null;
  /** Только лицензированные. */
  licensedOnly?: boolean;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").trim();
}

/** Фильтрация и поиск по каталогу. Порядок исходного массива сохраняется. */
export function searchCodex(entries: readonly CodexEntry[], query: CodexQuery): CodexEntry[] {
  const text = query.text ? normalize(query.text) : "";
  const terms = text ? text.split(/\s+/).filter(Boolean) : [];
  return entries.filter((e) => {
    if (query.category && e.category !== query.category) return false;
    if (query.group && e.group !== query.group) return false;
    if (query.tech && e.tech !== query.tech) return false;
    if (query.licensedOnly && !e.licensed) return false;
    if (terms.length) {
      const haystack = normalize(
        [e.name, e.group ?? "", e.summary, (e.tags ?? []).join(" "), e.price ?? ""].join(" "),
      );
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}
