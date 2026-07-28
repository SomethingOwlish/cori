/**
 * Характеристики персонажа «Кориолис. Третий Горизонт».
 *
 * У героя четыре характеристики (природные данные). Значение каждой — от 1 до 5,
 * чем выше, тем лучше. При создании персонажа очки характеристик распределяются
 * так, что в каждую вкладывается от 2 до 4 пунктов, и только в ключевую
 * характеристику выбранного амплуа можно вложить до 5 (см. `generation.ts`).
 *
 * Источник: ST3001 «Кориолис», гл. 2, стр. 23.
 */

export type AttributeKey = "strength" | "agility" | "wits" | "empathy";

export interface AttributeDef {
  key: AttributeKey;
  /** Название на русском. */
  name: string;
  /** Короткая метка для компактной карточки. */
  abbreviation: string;
  /** Пояснение, что описывает характеристика (по корбуку). */
  description: string;
}

export const ATTRIBUTES: Record<AttributeKey, AttributeDef> = {
  strength: {
    key: "strength",
    name: "Телосложение",
    abbreviation: "ТЕЛ",
    description: "Сочетание грубой физической силы и выносливости.",
  },
  agility: {
    key: "agility",
    name: "Ловкость",
    abbreviation: "ЛОВ",
    description: "Координация движений и моторика тела.",
  },
  wits: {
    key: "wits",
    name: "Смекалка",
    abbreviation: "СМЕ",
    description: "Интеллект, внимание и изобретательность.",
  },
  empathy: {
    key: "empathy",
    name: "Эмпатия",
    abbreviation: "ЭМП",
    description: "Харизма, привлекательность и умение манипулировать окружающими.",
  },
};

/** Устойчивый порядок для перебора и отображения. */
export const ATTRIBUTE_KEYS: readonly AttributeKey[] = [
  "strength",
  "agility",
  "wits",
  "empathy",
];

/**
 * Границы характеристик при создании персонажа (человек).
 *
 * В каждую характеристику вкладывается от 2 до 4 пунктов; ключевая
 * характеристика амплуа может достигать 5. В ходе игры значение остаётся
 * в пределах шкалы 1–5.
 */
export const ATTRIBUTE_MIN = 2;
export const ATTRIBUTE_MAX = 4;
/** Ключевую характеристику амплуа можно поднять на ступень выше остальных. */
export const KEY_ATTRIBUTE_MAX = 5;
/** Абсолютные границы шкалы характеристики (используются в игре). */
export const ATTRIBUTE_SCALE_MIN = 1;
export const ATTRIBUTE_SCALE_MAX = 5;

/** Полный блок характеристик. */
export type AttributeScores = Record<AttributeKey, number>;

/** Блок характеристик с минимальным значением 2 в каждой. */
export function baseAttributeScores(): AttributeScores {
  return {
    strength: ATTRIBUTE_MIN,
    agility: ATTRIBUTE_MIN,
    wits: ATTRIBUTE_MIN,
    empathy: ATTRIBUTE_MIN,
  };
}
