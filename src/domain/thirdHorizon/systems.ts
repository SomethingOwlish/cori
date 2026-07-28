/**
 * The canonical Third Horizon map — 36 systems and their portal network,
 * transcribed from the printed map «ST3097 Карта Третьего Горизонта».
 *
 * Coordinates live in a single SVG space that mirrors the map's layout (roughly
 * 2000×1420, origin top-left). They are read-only: the app never creates or
 * moves nodes. `seedPlaces` are the map's «Особенности» — the known locations
 * from the books, shown immediately in every system.
 */

import type { Portal, StarSystem } from "./types";

/** Legend for the `planets` notation, shown in the UI. */
export const PLANET_LEGEND = "А — пояс астероидов, Г — газовый гигант";

export const THIRD_HORIZON_SYSTEMS: StarSystem[] = [
  // ── Садаальская Тропа ──────────────────────────────────────────────────────
  {
    id: "menkar", name: "Менкар", x: 372, y: 622, status: "frontier", spaceport: false,
    region: "Садаальская Тропа", stars: ["жёлтая", "белая"], planets: "4Г/3АГ",
    seedPlaces: seeds("Падающий Монолит", "Слепые врата", "Затерянные колонии"),
  },
  {
    id: "deybul", name: "Дейбул", x: 432, y: 528, status: "frontier", spaceport: false,
    region: "Садаальская Тропа", stars: ["жёлтая", "красный гигант"], planets: "3АГ/2Г",
    seedPlaces: seeds("Осенний Дворец", "Ледяные кольца Аридеса", "Тарраб из Сурожа"),
  },
  {
    id: "godar", name: "Годар", x: 548, y: 480, status: "frontier", spaceport: false,
    region: "Садаальская Тропа", stars: ["белая"], planets: "3АГ",
    seedPlaces: seeds("Годарские электрические бури", "Обогатительная платформа «Гир-3»", "Солнцеликая княгиня Хамзи"),
  },
  {
    id: "dziban", name: "Дзибан", x: 672, y: 405, status: "frontier", spaceport: false,
    region: "Садаальская Тропа", stars: ["красная"], planets: "3АГ",
    seedPlaces: seeds("Дзибан Мематург", "Облачная Завеса", "Мематургические культы"),
  },
  {
    id: "sadaal", name: "Садааль", x: 640, y: 583, status: "civilized", spaceport: true,
    region: "Садаальская Тропа", stars: ["жёлтая", "красная"], planets: "9Г/3А",
    export: "промышленное оборудование, благородные газы, руда",
    import: "высокие технологии, медикаменты",
    seedPlaces: seeds("Тоталитарная ликократия", "Радиоактивные ветра Намтара", "Висячие сады Альбарза"),
  },
  {
    id: "nagar", name: "Нагар", x: 665, y: 632, status: "undeveloped", spaceport: false,
    region: "Садаальская Тропа", stars: ["красная звезда", "чёрная дыра"], planets: "4Г/0",
    seedPlaces: seeds("Штормовой портал", "Чёрная дыра Куари", "Лунный Гарем"),
  },
  {
    id: "erray", name: "Эррай", x: 742, y: 528, status: "frontier", spaceport: false,
    region: "Садаальская Тропа", stars: ["жёлтая", "жёлтая"], planets: "6А/2АГ",
    seedPlaces: seeds("Гравитационная обсерватория", "Эррайский мёд", "Садаальские Вольные Капитаны"),
  },

  // ── Майранская Цепь ────────────────────────────────────────────────────────
  {
    id: "tarazag", name: "Таразаг", x: 848, y: 388, status: "undeveloped", spaceport: false,
    region: "Майранская Цепь", stars: ["белый карлик"], planets: "4Г",
    seedPlaces: seeds("Таразагская лихорадка", "Пустые врата", "Омранские руины"),
  },
  {
    id: "odakon", name: "Одакон", x: 1015, y: 375, status: "undeveloped", spaceport: false,
    region: "Майранская Цепь", stars: ["красная"], planets: "4А",
    seedPlaces: seeds("Последняя битва эпохи Падения Врат", "Корабельные кладбища", "Пояс Пепла"),
  },
  {
    id: "zib", name: "Зиб", x: 852, y: 470, status: "frontier", spaceport: false,
    region: "Майранская Цепь", stars: ["красная"], planets: "4А",
    seedPlaces: seeds("Зибская обсерватория", "Мёртвый флот", "Торговый пост «Хамза-Йарбат»"),
  },
  {
    id: "zhou", name: "Жоу", x: 1202, y: 430, status: "frontier", spaceport: false,
    region: "Майранская Цепь", stars: ["жёлтая", "белая", "синяя"], planets: "6/4Г/3А",
    seedPlaces: seeds("Родина Почётного Легиона", "Станция «Лансянь»", "Необычные руины Зодчих"),
  },
  {
    id: "mayra", name: "Майра", x: 912, y: 525, status: "faction", spaceport: true,
    region: "Майранская Цепь", stars: ["жёлтая", "белая", "белая"], planets: "6АГ/4Г/5Г",
    export: "предметы культа, ткани, гравитонные двигатели",
    import: "минералы, высокие технологии, благородные газы",
    seedPlaces: seeds("Парящие храмы Города Ликов", "Верфь «Хелеб»", "Майранский шёлк"),
  },
  {
    id: "sayvas", name: "Сайвас", x: 1095, y: 500, status: "civilized", spaceport: false,
    region: "Майранская Цепь", stars: ["жёлтая"], planets: "5Г",
    seedPlaces: seeds("Братство Лотоса", "Компаньоны-кисэн", "Горнодобывающие предприятия Великого Разлома"),
  },
  {
    id: "ordana", name: "Ордана", x: 1210, y: 545, status: "civilized", spaceport: false,
    region: "Майранская Цепь", stars: ["синяя", "белая"], planets: "7Г/6А",
    seedPlaces: seeds("Фабрики картеля «Айюн»", "Торговая станция «Хайранга»", "Революционное движение «Леопарды Айюты»"),
  },
  {
    id: "zalos", name: "Залос", x: 988, y: 560, status: "faction", spaceport: true,
    region: "Майранская Цепь", stars: ["жёлтая", "белая"], planets: "3А/4Г",
    export: "продовольствие, специи, наркотики, медикаменты",
    import: "высокие технологии, промышленное оборудование",
    seedPlaces: seeds("Мятеж в Залосе-Б", "Молитвенные станции типа «Хорал»", "Родина Ордена Неприкасаемых"),
  },
  {
    id: "altai", name: "Алтай", x: 1140, y: 600, status: "undeveloped", spaceport: false,
    region: "Майранская Цепь", stars: ["белая"], planets: "7АГ",
    seedPlaces: seeds("Алебастровый Совет", "Пираты Хорсабада", "Путь Предков"),
  },
  {
    id: "aivaz", name: "Айваз", x: 872, y: 632, status: "civilized", spaceport: false,
    region: "Майранская Цепь", stars: ["белая", "жёлтая"], planets: "3Г/5АГ",
    seedPlaces: seeds("Айвазские ковры", "Храм Ока Танцора", "Огненные озёра"),
  },

  // ── Дабаранское Кольцо ─────────────────────────────────────────────────────
  {
    id: "kua", name: "Куа", x: 1020, y: 690, status: "faction", spaceport: true,
    region: "Дабаранское Кольцо", stars: ["белая"], planets: "7АГ",
    export: "древесина, промышленные товары, передовое промышленное оборудование",
    import: "руда, предметы роскоши, химикаты",
    seedPlaces: seeds("Станция «Кориолис»", "Монолит", "Посольство Зина"),
  },
  {
    id: "kaf", name: "Каф", x: 1000, y: 752, status: "undeveloped", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["голубая", "жёлтая"], planets: "4/5АГ",
    seedPlaces: seeds("Орбитальные платформы", "Красные газовые кристаллы", "Флотилия «Гидра»"),
  },
  {
    id: "khamura", name: "Хамура", x: 872, y: 792, status: "frontier", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["белый карлик"], planets: "2Г",
    seedPlaces: seeds("Привратная станция «Хаммурапи»", "Пираты Самины", "Ионные бури"),
  },
  {
    id: "taoan", name: "Таоань", x: 862, y: 902, status: "undeveloped", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["красный гигант"], planets: "3Г",
    seedPlaces: seeds("Гибель Цубари", "Блокада Совета", "Газодобывающая станция «Таоань»"),
  },
  {
    id: "ukharu", name: "Ухару", x: 908, y: 990, status: "undeveloped", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["жёлтая", "коричневый карлик"], planets: "3/26А",
    seedPlaces: seeds("Лесные луны", "Ухаруанские мятежники", "Крематории лавовой луны"),
  },
  {
    id: "dabaran", name: "Дабаран", x: 972, y: 1092, status: "civilized", spaceport: true,
    region: "Дабаранское Кольцо", stars: ["красный гигант", "красный карлик"], planets: "7Г/0",
    export: "вино, благородные газы, предметы роскоши",
    import: "высокие технологии, медикаменты, продовольствие",
    seedPlaces: seeds("Дабаранские вина", "Планета даров", "Шрам"),
  },
  {
    id: "rigel", name: "Ригель", x: 1052, y: 1058, status: "undeveloped", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["бело-голубой сверхгигант"], planets: "А",
    seedPlaces: seeds("Плазменные бури", "Денебова слепота", "Пираты Заррарана"),
  },
  {
    id: "melik", name: "Мелик", x: 1152, y: 1048, status: "civilized", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["белая"], planets: "5Г",
    seedPlaces: seeds("Голубой газовый гигант Джибри", "Космопорт «Гормус»", "Храм-на-Краю-Горизонта"),
  },
  {
    id: "algebar", name: "Альгебар", x: 1272, y: 972, status: "frontier", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["жёлтая"], planets: "12АГ",
    seedPlaces: seeds("Эмират Тасфур", "Мозаичные утёсы", "Альгебарские ткани"),
  },
  {
    id: "amedo", name: "Амёдо", x: 1248, y: 892, status: "frontier", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["жёлтая", "красная"], planets: "10АГ/3",
    seedPlaces: seeds("Око Эхарана", "Храмы Белого острова", "Родина скавара"),
  },
  {
    id: "marfik", name: "Марфик", x: 1120, y: 812, status: "undeveloped", spaceport: false,
    region: "Дабаранское Кольцо", stars: ["красная"], planets: "4",
    seedPlaces: seeds("Царица Куарра", "Литофор", "Космическая фауна"),
  },

  // ── Алгольская Тропа ───────────────────────────────────────────────────────
  {
    id: "avadhi", name: "Авадхи", x: 1132, y: 682, status: "frontier", spaceport: false,
    region: "Алгольская Тропа", stars: ["белая звезда", "жёлтая звезда", "чёрная дыра"], planets: "3/7АГ/0",
    seedPlaces: seeds("Газовая луна Аргим", "Солнечный Веер", "Лесные храмы"),
  },
  {
    id: "algol", name: "Алголь", x: 1180, y: 730, status: "civilized", spaceport: true,
    region: "Алгольская Тропа", stars: ["белая", "белый карлик", "жёлтая"], planets: "6АГ/0/2",
    export: "руда, промышленные товары, химикаты, древесина",
    import: "предметы роскоши, предметы культа, продовольствие",
    seedPlaces: seeds("Алгольские работорговцы", "Слоновий рынок Акхандара", "Хребет Танзим"),
  },
  {
    id: "zamusa", name: "Замуса", x: 1312, y: 690, status: "undeveloped", spaceport: false,
    region: "Алгольская Тропа", stars: ["гипергигант"], planets: "2",
    seedPlaces: seeds("Кольца", "Научно-исследовательская база «Замуса»", "Туманность Скорби"),
  },
  {
    id: "anaspora", name: "Анаспора", x: 1288, y: 812, status: "frontier", spaceport: false,
    region: "Алгольская Тропа", stars: ["жёлтая"], planets: "3АГ",
    seedPlaces: seeds("Плавучие фермы", "Артефакт Юфи", "Пираты Бокора"),
  },
  {
    id: "yastapol", name: "Ястаполь", x: 1355, y: 822, status: "frontier", spaceport: false,
    region: "Алгольская Тропа", stars: ["белый карлик"], planets: "2Г",
    seedPlaces: seeds("Верфь «Ястаполь»", "Пояс обломков", "Старатели-мусорщики"),
  },
  {
    id: "nyarmada", name: "Ньярмада", x: 1452, y: 675, status: "frontier", spaceport: false,
    region: "Алгольская Тропа", stars: ["белая", "белая", "красный карлик"], planets: "2/7/4АГ",
    seedPlaces: seeds("Змеиный пояс", "Обогатительный завод «Сабаль»", "Космопорт «Ахаль»"),
  },
  {
    id: "ereku", name: "Эреку", x: 1600, y: 812, status: "frontier", spaceport: false,
    region: "Алгольская Тропа", stars: ["красный гигант"], planets: "5А",
    seedPlaces: seeds("Спиральный пояс", "Зимняя Колония на Хибуле", "Петроглифы"),
  },
  {
    id: "enu", name: "Эну", x: 1642, y: 918, status: "undeveloped", spaceport: false,
    region: "Алгольская Тропа", stars: ["жёлтая", "красная"], planets: "6АГ/3Г",
    seedPlaces: seeds("Базар-на-Краю-Света", "Колониальное судно «Скитающийся джинн»", "Бури Тьмы"),
  },
];

/**
 * The portal jumps. Undirected: `{a, b}` means a route runs both ways. `hazard`
 * mirrors the map's «Нестабильные врата» / «Опасная территория» markers.
 */
export const THIRD_HORIZON_PORTALS: Portal[] = [
  // Садаальская Тропа
  { a: "menkar", b: "deybul" },
  { a: "deybul", b: "godar" },
  { a: "godar", b: "dziban" },
  { a: "godar", b: "sadaal" },
  { a: "sadaal", b: "nagar" },
  { a: "sadaal", b: "erray" },
  { a: "dziban", b: "erray", hazard: "unstable" },
  // Link into Майранская Цепь
  { a: "erray", b: "aivaz" },
  // Майранская Цепь
  { a: "tarazag", b: "odakon", hazard: "unstable" },
  { a: "tarazag", b: "zib" },
  { a: "odakon", b: "zhou", hazard: "dangerous" },
  { a: "zib", b: "mayra" },
  { a: "mayra", b: "zalos" },
  { a: "zalos", b: "aivaz" },
  { a: "sayvas", b: "zhou" },
  { a: "sayvas", b: "altai" },
  { a: "ordana", b: "zhou" },
  { a: "ordana", b: "altai" },
  { a: "altai", b: "kua" },
  { a: "altai", b: "avadhi" },
  { a: "aivaz", b: "kua" },
  // Дабаранское Кольцо
  { a: "kua", b: "kaf" },
  { a: "kaf", b: "marfik" },
  { a: "marfik", b: "amedo" },
  { a: "amedo", b: "algebar", hazard: "unstable" },
  { a: "algebar", b: "melik" },
  { a: "melik", b: "rigel" },
  { a: "rigel", b: "dabaran" },
  { a: "dabaran", b: "ukharu" },
  { a: "ukharu", b: "taoan", hazard: "dangerous" },
  { a: "taoan", b: "khamura", hazard: "dangerous" },
  { a: "khamura", b: "kua" },
  // Алгольская Тропа
  { a: "avadhi", b: "algol" },
  { a: "algol", b: "zamusa", hazard: "unstable" },
  { a: "algol", b: "anaspora" },
  { a: "zamusa", b: "nyarmada" },
  { a: "anaspora", b: "yastapol" },
  { a: "yastapol", b: "nyarmada", hazard: "unstable" },
  { a: "nyarmada", b: "ereku" },
  { a: "ereku", b: "enu" },
];

/** Index for O(1) lookup by id. */
export const SYSTEM_BY_ID: Readonly<Record<string, StarSystem>> = Object.fromEntries(
  THIRD_HORIZON_SYSTEMS.map((s) => [s.id, s]),
);

/** Helper to declare the map's «Особенности» as seed places (name only; owner/description left for the master). */
function seeds(...names: string[]) {
  return names.map((name) => ({ name, owner: "", description: "" }));
}
