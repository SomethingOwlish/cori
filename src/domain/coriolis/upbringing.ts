/**
 * Воспитание персонажа — ключевой фактор создания героя.
 *
 * Именно воспитание (а НЕ возраст) определяет количество доступных пунктов
 * характеристик и навыков, стартовую репутацию и начальное богатство.
 *
 * Источник: ST3001 «Кориолис», гл. 2, таблицы 2.2 и 2.4 (стр. 23, 25).
 */

export type Upbringing = "plebeian" | "stationary" | "privileged";

export interface UpbringingProfile {
  key: Upbringing;
  name: string;
  /** Сумма значений четырёх характеристик при создании. */
  attributePoints: number;
  /** Пункты навыков при создании. */
  skillPoints: number;
  /** Базовая репутация (до модификатора амплуа). */
  reputation: number;
  /** Стартовое богатство в биррах. */
  birr: number;
  /** Пояснение сословия. */
  description: string;
}

/**
 * Таблица 2.2 / 2.4. Обрати внимание: у плебея БОЛЬШЕ пунктов характеристик,
 * но МЕНЬШЕ пунктов навыков, чем у аристократа — и наоборот.
 */
export const UPBRINGINGS: Record<Upbringing, UpbringingProfile> = {
  plebeian: {
    key: "plebeian",
    name: "Плебей",
    attributePoints: 15,
    skillPoints: 8,
    reputation: 2,
    birr: 500,
    description:
      "Низший социальный пласт Горизонта: простые рабочие, колонисты, кочевники и т. п.",
  },
  stationary: {
    key: "stationary",
    name: "Орбитал",
    attributePoints: 14,
    skillPoints: 10,
    reputation: 4,
    birr: 1000,
    description: "Астероидяне и обитатели больших космических станций.",
  },
  privileged: {
    key: "privileged",
    name: "Аристократ",
    attributePoints: 13,
    skillPoints: 12,
    reputation: 6,
    birr: 5000,
    description:
      "Вершина социальной пирамиды: влиятельные бюрократы и фабриканты Конгломерата, эмиры, богатейшие купцы.",
  },
};

export const UPBRINGING_KEYS: readonly Upbringing[] = [
  "plebeian",
  "stationary",
  "privileged",
];

/** Происхождение персонажа (человек или пасынок). */
export type Parentage = "human" | "stray";

export const PARENTAGES: Record<Parentage, { key: Parentage; name: string; description: string }> = {
  human: {
    key: "human",
    name: "Человек",
    description: "«Дитя человеческое» — тот, кого гегемонисты считают чистокровным человеком.",
  },
  stray: {
    key: "stray",
    name: "Пасынок",
    description:
      "Человек с изменённым геномом. По воспитанию может быть только плебеем или орбиталом. " +
      "Стартовая репутация уменьшается вдвое, но персонаж получает стигму — четвёртое достоинство.",
  },
};

/**
 * Планета рождения (табл. 2.1, d6). На игровую механику не влияет — нужна
 * только для отправной точки биографии.
 */
export const BIRTH_PLANETS: readonly { roll: number; name: string; description: string }[] = [
  { roll: 1, name: "Алголь", description: "Планета мятежников, отравленная отходами тяжёлой промышленности под пятой Консорциума." },
  { roll: 2, name: "Майра", description: "Колыбель культуры первопоселенцев, обитель минаретов, храмов и монастырей." },
  { roll: 3, name: "Куа", description: "Сердце Горизонта, новая родина «Кориолиса»." },
  { roll: 4, name: "Дабаран", description: "Выжженная пустыня с неприступными сералями, садами-оазисами и дворцовыми биокуполами." },
  { roll: 5, name: "Залос", description: "Жители почитают Лик Мученика (ипостась Судьи) и ведут гражданскую войну с еретиками." },
  { roll: 6, name: "По выбору", description: "Открой карту Третьего Горизонта и выбери сам." },
];

/** Линия происхождения: зенитиец или первопоселенец (на механику не влияет). */
export const LINEAGES: readonly { key: string; name: string; description: string }[] = [
  { key: "firstcomer", name: "Первопоселенец", description: "Веками жили в Горизонте; ценят духовное, семейные узы и древние предания, истово почитают Лики." },
  { key: "zenithian", name: "Зенитиец", description: "Новоприбывшие, оживившие торговые пути; прагматики, верят в науку не меньше, чем в Лики." },
];
