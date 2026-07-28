/**
 * Доменная модель корабля и его ассесмент — чистые, без хранения.
 *
 * Корабль привязан к кампании. Команда собирает его по правилам книги (ST3001,
 * гл. 7): выбирает класс, верфь, ставит модули (каждый занимает модульные
 * отсеки), усовершенствования (цена — процент от базовой), орудия и изъян.
 *
 * `assessShip` — аналог `assessCharacter`: чистая функция, по кораблю считающая
 * итоговые характеристики, занятые/доступные отсеки, полную цену и долг, а также
 * список нарушений правил для живой проверки в конструкторе. Числовые данные
 * берутся из структурных таблиц в `codexShips.ts`, поэтому расчёт соответствует
 * книге.
 */

import {
  SHIP_CLASSES,
  SHIP_MODULES,
  SHIPYARDS,
  classValue,
  type ShipClass,
  type ShipStatMods,
  type Shipyard,
} from "./codexShips";

/** Модуль, установленный на корабль. */
export interface ShipModule {
  /** Ссылка на запись кодекса, если модуль выбран из справочника. */
  codexId?: string;
  name: string;
  /** Сколько модульных отсеков занимает (0 — обязательный встроенный). */
  slots: number;
  /** Цена в биррах. */
  price: number;
  /** Обязательный встроенный модуль (мостик, реактор, двигатели). */
  builtIn?: boolean;
  /** «Не в строю» — повреждён. */
  outOfOrder?: boolean;
}

/** Орудие корабля (устанавливается в бортовое вооружение — занимает один отсек). */
export interface ShipWeapon {
  codexId?: string;
  name: string;
  bonus: string;
  damage: string;
  crit: string;
  range: string;
  notes?: string;
  price: number;
  outOfOrder?: boolean;
}

/** Усовершенствование (достоинство) корабля. */
export interface ShipUpgrade {
  codexId?: string;
  name: string;
  mod?: string;
  /** Стоимость как процент от базовой цены корабля. */
  costPercent: number;
  /** Влияние на характеристики (если есть). */
  mods?: ShipStatMods;
}

/** Изъян (проблема) корабля. */
export interface ShipFlaw {
  codexId?: string;
  name: string;
  summary?: string;
}

/** Экипаж — имена на должностях по бланку ST3098. */
export interface ShipCrew {
  captain?: string;
  pilot?: string;
  engineer?: string;
  sensorOp?: string;
  gunner?: string;
}

/** Строка бортжурнала. */
export interface ShipLogEntry {
  destination?: string;
  cycle?: string;
  route?: string;
  encounters?: string;
  notes?: string;
}

export interface Ship {
  id: string;
  /** Кампания, которой принадлежит корабль. */
  campaignId: string;
  name: string;
  /** Обозначение класса: «I»…«V». */
  classId: string;
  /** Название типа (готовой сборки), если выбрано. */
  typeName?: string;
  /** Верфь — `Shipyard.codexId`. */
  shipyardId?: string;
  problem?: ShipFlaw;
  /** Ручной долг мастера; если не задан — считается из сборки. */
  debtOverride?: number;
  modules: ShipModule[];
  weapons: ShipWeapon[];
  upgrades: ShipUpgrade[];
  crew: ShipCrew;
  criticalDamage?: string;
  cargo?: string;
  notes?: string;
  log?: ShipLogEntry[];
  createdAt: number;
  /** Имя того, кто собрал корабль. */
  createdBy?: string;
  archived: boolean;
  archivedAt?: number;
}

/** Итоговые характеристики корабля («Данные» бланка + энергия/прочность). */
export interface ShipStats {
  energy: number;
  hull: number;
  maneuver: number;
  signature: number;
  armor: number;
  speed: number;
}

export interface ShipAssessment {
  cls: ShipClass | null;
  shipyard: Shipyard | null;
  stats: ShipStats;
  /** Доступно модульных отсеков (класс + верфь + усовершенствования). */
  slotsTotal: number;
  /** Занято модульных отсеков (модули + орудия). */
  slotsUsed: number;
  basePrice: number;
  modulesPrice: number;
  weaponsPrice: number;
  upgradesPrice: number;
  totalPrice: number;
  /** Долг: ручной (`debtOverride`) или равный полной цене сборки. */
  debt: number;
  /** Обязательные встроенные модули, всегда присутствующие. */
  mandatoryModules: string[];
  /** Нарушения правил сборки (для живой проверки). */
  violations: string[];
}

/** Названия обязательных встроенных модулей (мостик, реактор, двигатели). */
export const MANDATORY_MODULE_NAMES: readonly string[] = SHIP_MODULES.filter((m) => m.builtIn).map(
  (m) => m.name,
);

/** Обязательные встроенные модули как готовые записи для `Ship.modules`. */
export function mandatoryModules(): ShipModule[] {
  return SHIP_MODULES.filter((m) => m.builtIn).map((m) => ({
    codexId: m.codexId,
    name: m.name,
    slots: 0,
    price: 0,
    builtIn: true,
  }));
}

/** Пустой черновик корабля со встроенными модулями, без выбранного класса. */
export function createBlankShip(id: string, campaignId: string, createdBy?: string): Ship {
  return {
    id,
    campaignId,
    name: "",
    classId: "",
    modules: mandatoryModules(),
    weapons: [],
    upgrades: [],
    crew: {},
    createdAt: 0,
    createdBy,
    archived: false,
  };
}

const ZERO_STATS: ShipStats = { energy: 0, hull: 0, maneuver: 0, signature: 0, armor: 0, speed: 0 };

/** Применяет боевые модификаторы к характеристикам (без изменения отсеков). */
function applyStatMods(stats: ShipStats, mods: ShipStatMods): void {
  stats.energy += mods.energy ?? 0;
  stats.hull += mods.hull ?? 0;
  stats.maneuver += mods.maneuver ?? 0;
  stats.signature += mods.signature ?? 0;
  stats.armor += mods.armor ?? 0;
  stats.speed += mods.speed ?? 0;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Считает итоговые характеристики, отсеки, цену, долг и нарушения корабля.
 * Чистая: не мутирует `ship`.
 */
export function assessShip(ship: Ship): ShipAssessment {
  const cls = SHIP_CLASSES.find((c) => c.cls === ship.classId) ?? null;
  const shipyard = ship.shipyardId
    ? SHIPYARDS.find((y) => y.codexId === ship.shipyardId) ?? null
    : null;
  const violations: string[] = [];
  const mandatory = [...MANDATORY_MODULE_NAMES];

  const modulesPrice = sum(ship.modules.filter((m) => !m.builtIn).map((m) => m.price));
  const weaponsPrice = sum(ship.weapons.map((w) => w.price));
  // Занято отсеков: модули (кроме встроенных) + по одному отсеку на орудие.
  const slotsUsed = sum(ship.modules.filter((m) => !m.builtIn).map((m) => m.slots)) + ship.weapons.length;

  if (!cls) {
    violations.push("Не выбран класс корабля.");
    return {
      cls: null,
      shipyard,
      stats: { ...ZERO_STATS },
      slotsTotal: 0,
      slotsUsed,
      basePrice: 0,
      modulesPrice,
      weaponsPrice,
      upgradesPrice: 0,
      totalPrice: modulesPrice + weaponsPrice,
      debt: ship.debtOverride ?? modulesPrice + weaponsPrice,
      mandatoryModules: mandatory,
      violations,
    };
  }

  // Характеристики: база класса → модификаторы верфи → усовершенствования.
  const stats: ShipStats = {
    energy: cls.energy,
    hull: cls.hull,
    maneuver: cls.maneuver,
    signature: cls.signature,
    armor: cls.armor,
    speed: cls.speed,
  };
  let slotsTotal = cls.slots;

  if (shipyard?.mods) {
    applyStatMods(stats, shipyard.mods);
    slotsTotal += shipyard.mods.slots ?? 0;
  }
  if (shipyard?.slotsAddClass) slotsTotal += classValue(cls.cls);

  for (const u of ship.upgrades) {
    if (u.mods) {
      applyStatMods(stats, u.mods);
      slotsTotal += u.mods.slots ?? 0;
    }
  }

  const basePrice = Math.round(cls.price * (1 + (shipyard?.pricePct ?? 0) / 100));
  const upgradesPrice = sum(ship.upgrades.map((u) => Math.round((u.costPercent / 100) * cls.price)));
  const totalPrice = basePrice + modulesPrice + weaponsPrice + upgradesPrice;
  const debt = ship.debtOverride ?? totalPrice;

  if (slotsUsed > slotsTotal) {
    violations.push(`Превышено число модульных отсеков: занято ${slotsUsed} из ${slotsTotal}.`);
  }

  return {
    cls,
    shipyard,
    stats,
    slotsTotal,
    slotsUsed,
    basePrice,
    modulesPrice,
    weaponsPrice,
    upgradesPrice,
    totalPrice,
    debt,
    mandatoryModules: mandatory,
    violations,
  };
}
