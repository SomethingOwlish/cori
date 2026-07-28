/**
 * Кодекс: раздел космических кораблей — и структурные данные для конструктора.
 *
 * Данные извлечены из ST3001 «Кориолис», гл. 7 (стр. 142–162): табл. 7.4 (типы),
 * 7.5–6 (базовые характеристики классов), 7.7 (модули), 7.8–9 (орудия), 7.10
 * (усовершенствования), а также изъяны и верфи.
 *
 * Модуль экспортирует две вещи:
 *   1. `SHIP_CODEX` — записи `CodexEntry` для общего справочника (как раньше);
 *   2. типизированные таблицы (`SHIP_CLASSES`, `SHIPYARDS`, `SHIP_MODULES`,
 *      `SHIP_UPGRADES`, `SHIP_WEAPONS_DATA`, `SHIP_FLAWS`, `SHIP_TYPES`) с
 *      числовыми характеристиками и модификаторами — их использует конструктор
 *      корабля (`ship.ts`) для расчётов и живой проверки правил. У каждой строки
 *      есть стабильный `codexId`, совпадающий с id соответствующей записи кодекса,
 *      чтобы выбор в конструкторе ссылался на запись справочника.
 */

import type { CodexEntry, CodexStat, TechLevel } from "./codex";

const slugged = new Set<string>();
function shipId(name: string): string {
  const base = `ship:${name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-zа-я0-9:-]/gi, "");
  let key = base;
  let n = 2;
  while (slugged.has(key)) key = `${base}-${n++}`;
  slugged.add(key);
  return key;
}

/** Модификаторы характеристик корабля, которые даёт верфь или усовершенствование. */
export interface ShipStatMods {
  energy?: number;
  hull?: number;
  maneuver?: number;
  signature?: number;
  armor?: number;
  speed?: number;
  /** Изменение числа модульных отсеков. */
  slots?: number;
}

function ship(r: {
  name: string;
  group: string;
  summary: string;
  stats?: CodexStat[];
  tags?: string[];
  tech?: TechLevel;
  price?: string;
  licensed?: boolean;
  id: string;
}): CodexEntry {
  return {
    id: r.id,
    category: "ship",
    name: r.name,
    group: `Корабль · ${r.group}`,
    summary: r.summary,
    stats: r.stats,
    tags: r.tags,
    tech: r.tech,
    price: r.price,
    licensed: r.licensed,
  };
}

// ── Классы кораблей — табл. 7.5–6 ────────────────────────────────────────────
export interface ShipClass {
  /** Обозначение класса: «I»…«V». */
  cls: string;
  codexId: string;
  energy: number;
  hull: number;
  maneuver: number;
  signature: number;
  armor: number;
  speed: number;
  /** Число модульных отсеков. */
  slots: number;
  /** Базовая цена в биррах. */
  price: number;
}

const CLASS_ROWS: Omit<ShipClass, "codexId">[] = [
  { cls: "I", energy: 3, hull: 2, maneuver: 2, signature: -2, armor: 3, speed: 4, slots: 3, price: 100000 },
  { cls: "II", energy: 4, hull: 4, maneuver: 1, signature: -1, armor: 4, speed: 4, slots: 6, price: 200000 },
  { cls: "III", energy: 5, hull: 6, maneuver: 0, signature: 0, armor: 5, speed: 2, slots: 10, price: 1000000 },
  { cls: "IV", energy: 6, hull: 9, maneuver: -1, signature: 2, armor: 7, speed: 1, slots: 20, price: 2000000 },
  { cls: "V", energy: 7, hull: 12, maneuver: -2, signature: 3, armor: 9, speed: 1, slots: 40, price: 10000000 },
];

export const SHIP_CLASSES: readonly ShipClass[] = CLASS_ROWS.map((c) => ({
  ...c,
  codexId: shipId(`Корабль ${c.cls} класса`),
}));

// ── Достоинства (усовершенствования) — табл. 7.10 ────────────────────────────
// Цена усовершенствования — процент от базовой цены корабля.
export interface ShipUpgradeDef {
  codexId: string;
  name: string;
  effect: string;
  /** Стоимость как процент от базовой цены корабля. */
  costPercent: number;
  /** Сколько раз можно приобрести (undefined — без ограничения). */
  maxCount?: number;
  /** Влияние на характеристики корабля (только там, где оно есть). */
  mods?: ShipStatMods;
  tech?: TechLevel;
  licensed?: boolean;
}

const UPGRADE_ROWS: Omit<ShipUpgradeDef, "codexId">[] = [
  { name: "Абляционное покрытие", effect: "Уменьшает урон от одного попадания на 3 пункта, после чего выходит из строя.", costPercent: 10, tech: "П" },
  { name: "Аварийная катапульта", effect: "Все боевые посты мостика встроены в спасательную капсулу, автоматически отстреливаемую при гибели судна.", costPercent: 10 },
  { name: "Автоматика", effect: "Заменяет одного члена экипажа (нужная характеристика 3, навык 3). Можно установить несколько раз; не заменяет капитана.", costPercent: 20, tech: "П" },
  { name: "Антивещественные двигатели", effect: "Вместо гравитонного маршевого двигателя — антивещественные ускорители Ордена. +2 при пилотировании при сокращении/наращивании дистанции и таране; реактор не нужен (−1 обязательный модуль). Обслуживание вдвое дороже.", costPercent: 20, tech: "З", licensed: true },
  { name: "Аэродинамическая конструкция", effect: "Позволяет входить в атмосферу, садиться на поверхность планет и взлетать с них.", costPercent: 10 },
  { name: "Благословение", effect: "+1 при пилотировании при проходе сквозь врата и долгих перелётах через Межзвёздную Тьму.", costPercent: 5, tech: "А" },
  { name: "Дальнобойные сенсоры", effect: "Увеличивает дистанцию действия корабельных сенсоров до предельной (8 шагов).", costPercent: 20, tech: "П" },
  { name: "Демонтажный блок", effect: "Позволяет утилизировать обломки кораблей при помощи добывающего отсека (цель — минимум на два класса легче).", costPercent: 10 },
  { name: "Дополнительные модульные отсеки", effect: "Увеличивает число модульных отсеков на 5. Можно приобрести несколько раз (лимит зависит от класса).", costPercent: 20, mods: { slots: 5 } },
  { name: "Исследовательский компьютер", effect: "+1 при науке во время сбора и анализа естественнонаучных данных.", costPercent: 5, tech: "П" },
  { name: "Каскадная перегрузка реактора", effect: "При перегрузке реактора в бою даёт +3 энергии (и +1 за каждую доп. шестёрку); корабль получает 2 структурного урона.", costPercent: 10 },
  { name: "Компрессионное поле", effect: "Автоматически запечатывает пробоины в корпусе, нивелируя взрывную декомпрессию.", costPercent: 20 },
  { name: "Корабельный интеллект", effect: "Разумный корабельный ИскИн (характеристики 1, навыки 3): выполняет функции одного члена экипажа. Может стать эксцентричным.", costPercent: 30, tech: "П" },
  { name: "Мощный реактор", effect: "+1 к запасу энергии корабля.", costPercent: 10, mods: { energy: 1 } },
  { name: "Наружный грузовой отсек", effect: "Позволяет крепить грузы на обшивке: вчетверо больше внутреннего, но негерметичен.", costPercent: 10 },
  { name: "Оранжерея", effect: "Отдыхая в оранжерее, персонажи восстанавливают рассудок вдвое быстрее (2 в час). Неприкосновенный запас пищи на несколько дней.", costPercent: 5 },
  { name: "Отлаженный маршевый двигатель", effect: "+2 при пилотировании при сокращении или наращивании дистанции.", costPercent: 10 },
  { name: "Передовая мастерская", effect: "Позволяет ремонтировать оборудование передового уровня.", costPercent: 10, tech: "П" },
  { name: "Прочный корпус", effect: "+1 к запасу прочности корабля.", costPercent: 10, mods: { hull: 1 } },
  { name: "Реанимационный отсек", effect: "Превращает корабельный медотсек в реанимационный (увеличивает модификаторы медикургии).", costPercent: 10, tech: "П", licensed: true },
  { name: "Система маскировки", effect: "−1 к заметности; корабль может попытаться исчезнуть с сенсоров в разгар сражения.", costPercent: 20, mods: { signature: -1 }, tech: "П" },
  { name: "Турбогенератор", effect: "+1 к манёвренности и скорости. Можно приобрести дважды.", costPercent: 20, maxCount: 2, mods: { maneuver: 1, speed: 1 } },
  { name: "Тяжёлая броня", effect: "+1 к броне, −1 к манёвренности. Можно приобрести трижды.", costPercent: 10, maxCount: 3, mods: { armor: 1, maneuver: -1 } },
  { name: "Улучшенная система наведения", effect: "+1 при инфомантии при захвате цели.", costPercent: 10 },
  { name: "Улучшенное орудие", effect: "+1 при проверке стрельбы из выбранного орудия.", costPercent: 20 },
  { name: "Улучшенные маневровые двигатели", effect: "+2 при пилотировании при взлёте, посадке, стыковке, абордаже и уклонении.", costPercent: 10 },
  { name: "Улучшенные торпеды", effect: "Обеспечивает противнику −1 при работе его БКО.", costPercent: 10 },
  { name: "Улучшенный БКО", effect: "+1 при работе бортового комплекса обороны.", costPercent: 10 },
  { name: "Чуткие сенсоры", effect: "+1 при любых проверках с участием корабельных сенсоров. Можно приобрести трижды.", costPercent: 10, maxCount: 3 },
  { name: "Электронная библиотека", effect: "+3 при мудрости или науке в выбранной сфере знания.", costPercent: 5, tech: "П" },
];

export const SHIP_UPGRADES: readonly ShipUpgradeDef[] = UPGRADE_ROWS.map((u) => ({
  ...u,
  codexId: shipId(u.name),
}));

// ── Модули — табл. 7.7 ───────────────────────────────────────────────────────
export interface ShipModuleDef {
  codexId: string;
  name: string;
  functional: string;
  /** Цена в биррах; null — встроенный/переменной цены модуль. */
  price: number | null;
  /** Обязательный встроенный модуль (мостик, реактор, двигатели). */
  builtIn?: boolean;
  /** Занимает столько модульных отсеков (по умолчанию 1). */
  slots?: number;
  mod?: string;
  tech?: TechLevel;
  licensed?: boolean;
  /** Отображаемая цена, если она не число (напр. «Разн.»). */
  priceLabel?: string;
}

const MODULE_ROWS: Omit<ShipModuleDef, "codexId">[] = [
  { name: "Мостик", functional: "Обязательный модуль: рубка с боевыми постами капитана, пилота и штурмана-оператора.", price: null, builtIn: true, slots: 0, priceLabel: "встроен" },
  { name: "Реактор", functional: "Обязательный модуль: водородный реактор термоядерного синтеза — источник энергии корабля.", price: null, builtIn: true, slots: 0, priceLabel: "встроен" },
  { name: "Гравитонные двигатели", functional: "Обязательный модуль: маршевые и маневровые гравитонные двигатели.", price: null, builtIn: true, slots: 0, priceLabel: "встроен" },
  { name: "Демонтажный отсек", functional: "Утилизация кораблей и их обломков (цель — минимум на класс легче).", price: 55000 },
  { name: "Стыковочный отсек", functional: "Стыковка с другими кораблями и станциями. Необходим кораблям тяжелее II класса.", price: 15000 },
  { name: "Ангар", functional: "Приём других кораблей и транспортных средств (минимум на два класса легче носителя).", price: 10000 },
  { name: "Каюты-ячейки", functional: "Тесные многоярусные спальные места с общим санблоком.", price: 15000 },
  { name: "Каюты-комнаты", functional: "Стандартные жилые каюты ~3×2 м с койкой и санблоком, кают-компанией.", price: 25000 },
  { name: "Каюты-люкс", functional: "Роскошные апартаменты с рекреационными зонами.", price: 40000 },
  { name: "Часовня", functional: "Место отправления культа Ликов: +2 при молитве Лику, облегчает прыжки сквозь врата.", price: 10000, mod: "+1" },
  { name: "Грузовой отсек", functional: "Складское помещение с климат-контролем. Вместимость зависит от класса корабля.", price: 5000 },
  { name: "Медотсек", functional: "Корабельный медпункт для лечения ранений и травм.", price: 10000, mod: "+3" },
  { name: "Спасательные капсулы", functional: "Спасение экипажа с обречённого корабля; недельный запас на пятерых в каждой капсуле.", price: 20000 },
  { name: "Добывающий отсек", functional: "Добыча газов и минералов в космосе (буры, тралы, инструмент). Для хранения нужен грузовой отсек.", price: 75000 },
  { name: "Ремонтный отсек", functional: "Ремонт и техническое обслуживание судна; помогает бортинженеру в бою и в пути.", price: 45000 },
  { name: "Потайной грузовой отсек", functional: "Замаскированный склад для контрабанды (20 % вместимости обычного; обнаружение — проверка наблюдательности).", price: 5000 },
  { name: "Криокамеры", functional: "Капсулы криогенного сна — необходимы для прыжков сквозь врата и долгих перелётов.", price: 25000, tech: "П" },
  { name: "Торпедно-минный отсек", functional: "Хранение и пуск торпед и мин (до 4 торпед / 8 мин). Критическое повреждение вызывает детонацию всего запаса.", price: 20000 },
  { name: "Бортовое вооружение", functional: "Установка корабельного орудия. Цена зависит от типа орудия (см. подтип «Орудия»).", price: null, priceLabel: "Разн." },
  { name: "Современная мастерская", functional: "+1 при технологике во время ремонта снаряжения и самого корабля (архаичный/современный уровень).", price: 7500, mod: "+1" },
];

export const SHIP_MODULES: readonly ShipModuleDef[] = MODULE_ROWS.map((m) => ({
  ...m,
  codexId: shipId(m.name),
}));

// ── Орудия и торпеды — табл. 7.9 ─────────────────────────────────────────────
export interface ShipWeaponDef {
  codexId: string;
  name: string;
  group: "Орудия" | "Торпеды и мины";
  bonus: string;
  range: string;
  damage: string;
  crit: string;
  tech: TechLevel;
  /** Цена в биррах; null — цена не указана в книге. */
  price: number | null;
  features: string;
  licensed?: boolean;
}

const WEAPON_ROWS: Omit<ShipWeaponDef, "codexId">[] = [
  { name: "Автоматическая пушка", group: "Орудия", bonus: "+2", range: "Нулевая", damage: "2", crit: "3", tech: "С", price: 15000, features: "Оборонительный огонь" },
  { name: "БКО (бортовой комплекс обороны)", group: "Орудия", bonus: "+2", range: "Ближняя", damage: "–", crit: "–", tech: "С", price: 5000, features: "Сбивает торпеды и мины" },
  { name: "Боевой мем", group: "Орудия", bonus: "+0", range: "Дальняя", damage: "–", crit: "–", tech: "П", price: 75000, features: "Отключает выбранный модуль просканированного корабля" },
  { name: "Инфо-импульс", group: "Орудия", bonus: "+0", range: "Дальняя", damage: "1", crit: "–", tech: "С", price: 50000, features: "Системный урон, броня не учитывается" },
  { name: "Ионная пушка", group: "Орудия", bonus: "+1", range: "Средняя", damage: "1", crit: "2", tech: "С", price: 40000, features: "Структурный и системный урон" },
  { name: "Ионный разрядник", group: "Орудия", bonus: "+1", range: "Ближняя", damage: "1", crit: "3", tech: "С", price: 7500, features: "Структурный и системный урон, одноразовое" },
  { name: "Мезонная пушка", group: "Орудия", bonus: "+0", range: "Ближняя", damage: "2", crit: "1", tech: "З", price: null, features: "Структурный и системный урон, броня не учитывается", licensed: true },
  { name: "Плазменная пушка", group: "Орудия", bonus: "+1", range: "Дальняя", damage: "1", crit: "1", tech: "П", price: 70000, features: "Лучи перегретой плазмы", licensed: true },
  { name: "Рельсовая пушка", group: "Орудия", bonus: "+1", range: "Средняя", damage: "1", crit: "2", tech: "С", price: 25000, features: "Электромагнитный ускоритель" },
  { name: "Тяжёлая рельсовая пушка", group: "Орудия", bonus: "+1", range: "Средняя", damage: "2", crit: "1", tech: "С", price: 40000, features: "Увеличенный урон" },
  { name: "«Нестера Расчленитель»", group: "Орудия", bonus: "+2", range: "Средняя", damage: "1", crit: "1", tech: "С", price: 50000, features: "Скорострельная рельсовая пушка с разрывными снарядами" },
  { name: "Торпеда", group: "Торпеды и мины", bonus: "+2", range: "Дальняя", damage: "2", crit: "2", tech: "С", price: 5000, features: "2 шага/ход; цена за одну торпеду" },
  { name: "Плазменная торпеда", group: "Торпеды и мины", bonus: "+2", range: "Дальняя", damage: "1", crit: "2", tech: "П", price: 10000, features: "Снижает класс защиты; цена за одну", licensed: true },
  { name: "Ионная торпеда", group: "Торпеды и мины", bonus: "+2", range: "Дальняя", damage: "1", crit: "2", tech: "С", price: 8000, features: "Структурный и системный урон; цена за одну" },
  { name: "Антивещественная торпеда", group: "Торпеды и мины", bonus: "+2", range: "Предельная", damage: "4", crit: "1", tech: "З", price: 400000, features: "Урон по всем целям в ближней дистанции; цена за одну", licensed: true },
  { name: "Ядерная торпеда", group: "Торпеды и мины", bonus: "+2", range: "Дальняя", damage: "3", crit: "1", tech: "П", price: 30000, features: "Урон по всем целям в нулевой дистанции; цена за одну", licensed: true },
  { name: "Мина", group: "Торпеды и мины", bonus: "+0", range: "Нулевая", damage: "2", crit: "2", tech: "С", price: 3000, features: "Цена за одну мину" },
  { name: "Антивещественная мина", group: "Торпеды и мины", bonus: "+0", range: "Нулевая", damage: "4", crit: "1", tech: "З", price: 300000, features: "Урон по всем целям в ближней дистанции; цена за одну", licensed: true },
  { name: "Ядерная мина", group: "Торпеды и мины", bonus: "+0", range: "Нулевая", damage: "3", crit: "1", tech: "П", price: 20000, features: "Урон по всем целям в нулевой дистанции; цена за одну", licensed: true },
];

export const SHIP_WEAPONS_DATA: readonly ShipWeaponDef[] = WEAPON_ROWS.map((w) => ({
  ...w,
  codexId: shipId(w.name),
}));

// ── Изъяны — стр. 143–144 ────────────────────────────────────────────────────
export interface ShipFlawDef {
  codexId: string;
  name: string;
  summary: string;
}

const FLAW_ROWS: Omit<ShipFlawDef, "codexId">[] = [
  { name: "Сбоящие маневровые двигатели", summary: "Маневровые двигатели ненадёжны. При активации изъяна корабль получает −1 к манёвренности до конца сражения, сцены или действия." },
  { name: "Проклятие", summary: "Лики отвратили взор от корабля. При активации: −1 при пилотировании сквозь врата, а в Межзвёздной Тьме ведущий получает на 1 пункт тьмы в неделю больше (до 3)." },
  { name: "Ненадёжные сенсоры", summary: "Сенсоры оставляют желать лучшего. При активации штурман-оператор получает −1 при инфомантии до конца сражения, сцены или действия." },
  { name: "Устаревший компьютер", summary: "Корабельный компьютер видел лучшие дни. При активации пилот получает −1 при пилотировании до конца сражения, сцены или действия." },
  { name: "Прожорливый маршевый двигатель", summary: "Разгонный блок плохо слушается управления. При активации перемещение корабля до конца сражения стоит на один пункт энергии больше." },
  { name: "Повышенная заметность", summary: "Система экранирования корпуса барахлит. При активации противники получают +2 при инфомантии, пытаясь засечь корабль сенсорами (до конца сражения или сцены)." },
  { name: "Эксцентричный корабельный интеллект", summary: "Требует усовершенствования «Корабельный интеллект». При активации ИскИн отказывается выполнять задачу и громко спорит через интерком (несколько часов или до конца сражения)." },
];

export const SHIP_FLAWS: readonly ShipFlawDef[] = FLAW_ROWS.map((f) => ({
  ...f,
  codexId: shipId(f.name),
}));

// ── Верфи — стр. 142–143 ─────────────────────────────────────────────────────
export interface Shipyard {
  codexId: string;
  name: string;
  summary: string;
  /** Модификаторы характеристик корабля. */
  mods?: ShipStatMods;
  /** Изменение базовой цены в процентах (+5 / −5). */
  pricePct?: number;
  /** Добавляет к отсекам значение класса корабля (I=1 … V=5). */
  slotsAddClass?: boolean;
}

const SHIPYARD_ROWS: Omit<Shipyard, "codexId">[] = [
  { name: "Верфь «Хелеб» (Майра)", summary: "Красивые, изящные и резвые корабли. +1 к манёвренности и заметности, +5 % к базовой цене.", mods: { maneuver: 1, signature: 1 }, pricePct: 5 },
  { name: "Верфь «Харима» (Монолит)", summary: "Быстрые и роскошные суда — гоночные, прогулочные, курьерские. +1 к запасу энергии, −1 к запасу прочности, +5 % к базовой цене.", mods: { energy: 1, hull: -1 }, pricePct: 5 },
  { name: "Верфь Каррмеррак (Залос)", summary: "Верфи Ордена Неприкасаемых. Дают доступ к усовершенствованию «антивещественные двигатели». Базовая цена не меняется." },
  { name: "Верфь «Даркос» (пояс Куа)", summary: "Практичные, надёжные и неплохо вооружённые грузовые корабли. +1 к запасу прочности, −2 к броне, +5 % к базовой цене.", mods: { hull: 1, armor: -2 }, pricePct: 5 },
  { name: "Верфь «Хальгрия» (орбита Куа)", summary: "Могучие большегрузы и недорогие грузовые корабли. −1 к манёвренности, +[класс] модульных отсеков, −5 % к базовой цене.", mods: { maneuver: -1 }, pricePct: -5, slotsAddClass: true },
  { name: "Верфь Дагараб (Садааль-Б)", summary: "Грузовые и боевые корабли с доп. вооружением. −1 модульный отсек, +[класс] отсеков для бортовых орудий, +5 % к базовой цене.", mods: { slots: -1 }, pricePct: 5 },
];

export const SHIPYARDS: readonly Shipyard[] = SHIPYARD_ROWS.map((y) => ({
  ...y,
  codexId: shipId(y.name),
}));

// ── Типы кораблей (готовые сборки) — стр. 156–161 ────────────────────────────
export interface ShipTypeDef {
  codexId: string;
  name: string;
  cls: string;
  energy: number;
  hull: number;
  maneuver: number;
  signature: number;
  armor: number;
  speed: number;
  summary: string;
  price: number;
}

const TYPE_ROWS: Omit<ShipTypeDef, "codexId">[] = [
  { name: "Лёгкое грузовое судно «Скарабей»", cls: "III", energy: 5, hull: 6, maneuver: 1, signature: 1, armor: 5, speed: 2, price: 1462500, summary: "Обтекаемый универсальный грузовик, популярный у вольных торговцев. Стыковочный отсек, каюты, криокамеры, часовня, 2 грузовых отсека, медотсек, рельсовая пушка, БКО. Изъян: устаревший компьютер." },
  { name: "Канонерка «Азук»", cls: "III", energy: 5, hull: 7, maneuver: -1, signature: 0, armor: 6, speed: 2, price: 1640000, summary: "Грозный боевой корабль наёмников: тяжёлая броня, мощные орудия. Ангары, БКО, рельсовая и автоматическая пушки, торпедно-минный отсек. Изъян: повышенная заметность." },
  { name: "Курьерская яхта «Орикс»", cls: "III", energy: 6, hull: 6, maneuver: 2, signature: 1, armor: 5, speed: 3, price: 1637500, summary: "Быстрый и юркий космоатмосферник верфи «Хелеб». Каюта-люкс, часовня, мастерская, рельсовая пушка, БКО. Усовершенствования: турбогенератор, мощный реактор. Изъян: ненадёжные сенсоры." },
  { name: "Спасательный корабль «Камрук»", cls: "IV", energy: 6, hull: 11, maneuver: -1, signature: 2, armor: 5, speed: 1, price: 3662500, summary: "Тяжёлое рабочее судно для старателей и мусорщиков. Демонтажный, ремонтный, добывающий отсеки, спасательные капсулы, много свободных отсеков. Изъян: повышенная заметность." },
  { name: "Космическая шлюпка", cls: "I", energy: 3, hull: 2, maneuver: 2, signature: -2, armor: 3, speed: 4, price: 100000, summary: "Крохотное судно для сообщения между кораблями и выхода в открытый космос. Мест на 2–4 человек." },
  { name: "Истребитель", cls: "I", energy: 3, hull: 3, maneuver: 2, signature: -2, armor: 3, speed: 4, price: 145000, summary: "Недорогой одноместный боевой корабль: скорость и манёвренность позволяют бить в упор. Автоматическая пушка, аварийная катапульта." },
  { name: "Челнок", cls: "II", energy: 4, hull: 4, maneuver: 1, signature: -1, armor: 4, speed: 4, price: 240000, summary: "Основной транспорт между орбитой и планетой, на 6–8 человек. Аэродинамическая конструкция, грузовой отсек." },
  { name: "Пиратская шхуна", cls: "III", energy: 5, hull: 6, maneuver: 0, signature: 0, armor: 6, speed: 3, price: 1450000, summary: "Пираты предпочитают скорость тяжёлому оружию и броне. Рельсовая и автоматическая пушки, торпедно-минный отсек, тяжёлая броня, турбогенератор." },
  { name: "Эсминец", cls: "IV", energy: 6, hull: 10, maneuver: -1, signature: 2, armor: 8, speed: 2, price: 3885000, summary: "Патрульный эсминец — гроза пиратов и контрабандистов. Две рельсовые пушки, автоматическая пушка, инфо-импульс, тяжёлая броня, дальнобойные сенсоры." },
];

export const SHIP_TYPES: readonly ShipTypeDef[] = TYPE_ROWS.map((t) => ({
  ...t,
  codexId: shipId(t.name),
}));

// ── Помощники ────────────────────────────────────────────────────────────────

/** Числовое значение класса: I → 1 … V → 5. */
export function classValue(cls: string): number {
  return ["I", "II", "III", "IV", "V"].indexOf(cls) + 1;
}

function stat(label: string, value: string | number): CodexStat {
  return { label, value: String(value) };
}

function shipDataStats(r: {
  cls: string;
  energy: number;
  hull: number;
  maneuver: number;
  signature: number;
  armor: number;
  speed: number;
  slots?: number;
}): CodexStat[] {
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  const s: CodexStat[] = [
    stat("Класс", r.cls),
    stat("Энергия", r.energy),
    stat("Прочность", r.hull),
    stat("Манёвр.", sign(r.maneuver)),
    stat("Заметность", sign(r.signature)),
    stat("Броня", r.armor),
    stat("Скорость", r.speed),
  ];
  if (r.slots !== undefined) s.push(stat("Отсеки", r.slots));
  return s;
}

// ── Сборка записей кодекса из структурных таблиц ─────────────────────────────

export const SHIP_CODEX: readonly CodexEntry[] = [
  ...SHIP_UPGRADES.map((u) =>
    ship({
      id: u.codexId,
      name: u.name,
      group: "Достоинства",
      summary: u.effect,
      stats: [stat("Стоимость", `${u.costPercent} % цены`)],
      tech: u.tech,
      licensed: u.licensed,
    }),
  ),
  ...SHIP_MODULES.map((m) =>
    ship({
      id: m.codexId,
      name: m.name,
      group: "Модули",
      summary: m.functional,
      stats: m.mod ? [stat("Модификатор", m.mod)] : undefined,
      tech: m.tech ?? "С",
      price: m.price != null ? String(m.price) : m.priceLabel,
      licensed: m.licensed,
    }),
  ),
  ...SHIP_WEAPONS_DATA.map((w) =>
    ship({
      id: w.codexId,
      name: w.name,
      group: w.group,
      summary:
        `Дистанция «${w.range}», урон ${w.damage}, порог ${w.crit}, мод. ${w.bonus}.` +
        (w.features ? ` ${w.features}.` : ""),
      stats: [
        stat("Мод.", w.bonus),
        stat("Дистанция", w.range),
        stat("Урон", w.damage),
        stat("Порог", w.crit),
      ],
      tags: w.features ? w.features.split(",").map((s) => s.trim()) : undefined,
      tech: w.tech,
      price: w.price != null ? String(w.price) : undefined,
      licensed: w.licensed,
    }),
  ),
  ...SHIP_FLAWS.map((f) => ship({ id: f.codexId, name: f.name, group: "Изъяны", summary: f.summary })),
  ...SHIPYARDS.map((y) => ship({ id: y.codexId, name: y.name, group: "Верфи", summary: y.summary })),
  ...SHIP_CLASSES.map((c) =>
    ship({
      id: c.codexId,
      name: `Корабль ${c.cls} класса`,
      group: "Классы",
      summary: `Базовые характеристики корабля ${c.cls} класса (до выбора верфи, модулей и усовершенствований).`,
      stats: shipDataStats(c),
      price: String(c.price),
    }),
  ),
  ...SHIP_TYPES.map((t) =>
    ship({
      id: t.codexId,
      name: t.name,
      group: "Типы",
      summary: t.summary,
      stats: shipDataStats(t),
      price: String(t.price),
    }),
  ),
];
