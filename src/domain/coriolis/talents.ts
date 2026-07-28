/**
 * Реестр достоинств «Кориолис. Третий Горизонт».
 *
 * Достоинства — свойства, трюки и способности, дающие герою преимущество.
 * В начале игры каждый персонаж получает три достоинства: командное (из амплуа
 * команды), личное (из амплуа персонажа) и дар Лика-покровителя. Пасынок
 * получает ещё и стигму. Мистик обязан взять мистическую практику как личное
 * достоинство.
 *
 * Дары Ликов заданы в `icons.ts`. Здесь — личные, командные, мистические,
 * стигмы, кибернетические имплантаты и бионические модификации.
 *
 * Источник: ST3001 «Кориолис», гл. 4 (стр. 68–79).
 */

export type TalentKind =
  | "personal" // личное достоинство
  | "group" // достоинство команды
  | "mystic" // мистическая практика
  | "stigma" // стигма пасынка
  | "cybernetic" // кибернетический имплантат
  | "bionic"; // бионическая модификация

export interface TalentDef {
  key: string;
  name: string;
  kind: TalentKind;
  /** Полное описание эффекта (по корбуку). */
  summary: string;
  /** Стоимость в биррах (для имплантатов и модификаций). */
  cost?: number;
  /** К какому амплуа команды относится (для командных достоинств). */
  team?: string;
}

export const TALENTS: Record<string, TalentDef> = {
  // ── Личные достоинства (табл. 4.3) ────────────────────────────────────────
  runner: { key: "runner", name: "Бегун", kind: "personal", summary: "Твоя скорость увеличивается с 10 до 12 метров. Можно приобрести трижды (до 14 и 16 м). Несовместимо с имплантатом усиленных мышц." },
  blesser: { key: "blesser", name: "Благословитель", kind: "personal", summary: "Раз за встречу благословляешь союзника в ближней дистанции: +3 к любой проверке. В бою — продолжительное действие. Ведущий получает 1 пункт тьмы." },
  richFamily: { key: "richFamily", name: "Богатая семья", kind: "personal", summary: "Играя на слухах о богатствах семьи, получаешь +2 при проверке влияния (если ведущий сочтёт уместным). Только при аристократическом воспитании." },
  fastReload: { key: "fastReload", name: "Быстрая перезарядка", kind: "personal", summary: "Перезаряжаешь оружие быстрым действием вместо стандартного." },
  pointBlank: { key: "pointBlank", name: "Выстрел в упор", kind: "personal", summary: "Попадая в противника в ближней дистанции, считаешь, что при проверке стрельбы у тебя выпало на одну шестёрку больше." },
  menacing: { key: "menacing", name: "Грозный вид", kind: "personal", summary: "Запугивая, можешь использовать силу вместо влияния. При условном успехе можешь настоять на своём первоначальном предложении." },
  nineLives: { key: "nineLives", name: "Девять жизней", kind: "personal", summary: "При проверке травмы (d66) можешь поменять местами «десятки» и «единицы». Нейтрализуется достоинством «Палач»." },
  hardened: { key: "hardened", name: "Закалка", kind: "personal", summary: "«Броня» с классом защиты 3 против природного ситуативного урона (холод, буря, декомпрессия, огонь)." },
  defensiveStance: { key: "defensiveStance", name: "Защитная стойка", kind: "personal", summary: "Защищаясь, получаешь +2 при проверках ближнего боя." },
  tough: { key: "tough", name: "Здоровяк", kind: "personal", summary: "Твой запас здоровья увеличивается на 2 пункта." },
  sinister: { key: "sinister", name: "Зловещий", kind: "personal", summary: "Причиняя стресс успешной проверкой влияния, наносишь на 1 пункт стресса больше обычного." },
  lieRevealer: { key: "lieRevealer", name: "Изобличитель", kind: "personal", summary: "Определяешь ложь без проверки влияния, поговорив хотя бы минуту (но не знаешь, в чём именно ложь). За использование ведущий получает 1 пункт тьмы." },
  inventor: { key: "inventor", name: "Изобретатель", kind: "personal", summary: "Успешной проверкой технологики чинишь предмет без запчастей (сломается после первого применения) или собираешь одноразовый аналог из запчастей." },
  sneakAttack: { key: "sneakAttack", name: "Коварный удар", kind: "personal", summary: "Нанося удар исподтишка лёгким оружием, получаешь +2 при проверке ближнего боя." },
  licensee: { key: "licensee", name: "Лицензиат", kind: "personal", summary: "У тебя есть разрешения на покупку лицензированного оружия и снаряжения (при наличии денег и товара)." },
  seducer: { key: "seducer", name: "Обольститель", kind: "personal", summary: "+2 при проверках влияния, когда пытаешься добиться чего-либо обольщением." },
  seasonedWarrior: { key: "seasonedWarrior", name: "Опытный воин", kind: "personal", summary: "При проверке инициативы бросаешь два кубика и выбираешь лучший (с имплантатом ускоренной реакции — три)." },
  consecrator: { key: "consecrator", name: "Освятитель", kind: "personal", summary: "Создаёшь и освящаешь талисманы (d6 часов, нужна часовня или алтарь). Талисман даёт +1 к одной проверке любого навыка, затем теряет силу." },
  executioner: { key: "executioner", name: "Палач", kind: "personal", summary: "При проверке травмы противника (d66) можешь поменять местами «десятки» и «единицы». Нейтрализуется достоинством «Девять жизней»." },
  fieldMedic: { key: "fieldMedic", name: "Полевой медикург", kind: "personal", summary: "Оказывая неотложную помощь, получаешь +2 при проверках медикургии." },
  zeroGHabit: { key: "zeroGHabit", name: "Привычка к невесомости", kind: "personal", summary: "+2 при проверках проворства в условиях невесомости." },
  machineGunner: { key: "machineGunner", name: "Пулемётчик", kind: "personal", summary: "При автоматическом огне игнорируешь первую выпавшую единицу (с вместительным магазином — первые две)." },
  consoler: { key: "consoler", name: "Утешитель", kind: "personal", summary: "+2 при проверках медикургии, когда пытаешься воодушевить недееспособного персонажа." },
  factionMember: { key: "factionMember", name: "Член фракции", kind: "personal", summary: "Принадлежишь фракции Совета или иной могущественной организации. Используя это для запугивания, получаешь +2 при влиянии (если оппонент слышал о фракции)." },
  sixthSense: { key: "sixthSense", name: "Шестое чувство", kind: "personal", summary: "Раз за встречу нейтрализуешь эффект внезапной атаки; всегда +2 при наблюдательности при обнаружении засады или атаки исподтишка." },
  exotechnician: { key: "exotechnician", name: "Экзотехник", kind: "personal", summary: "Находясь внутри любого экзоустройства, получаешь +2 при проверках проворства и силы." },

  // ── Достоинства команды (табл. 4.1) ───────────────────────────────────────
  noseForBirr: { key: "noseForBirr", name: "Нюх на бирры", kind: "group", team: "freeTraders", summary: "Торгуясь, вы получаете +2 при проверках влияния. Раз за встречу на всю команду." },
  scratchMyBack: { key: "scratchMyBack", name: "Ты — мне, я — тебе", kind: "group", team: "freeTraders", summary: "+2 при влиянии, когда пытаетесь подкупить чиновника, таможенника или стражника." },
  shortcut: { key: "shortcut", name: "Кратчайший путь", kind: "group", team: "freeTraders", summary: "Находите быстрый путь: время путешествия вдвое короче либо избегаете нежелательной встречи. Ведущий получает 1 пункт тьмы. Раз за путешествие." },
  fire: { key: "fire", name: "Огонь!", kind: "group", team: "mercenaries", summary: "+2 при стрельбе, если все герои в этом раунде атакуют одну и ту же цель." },
  charge: { key: "charge", name: "В атаку!", kind: "group", team: "mercenaries", summary: "+2 при ближнем бое, если все герои в раунде потратят пункт действия на перемещение (действует один раунд)." },
  stayAlert: { key: "stayAlert", name: "Не зевать!", kind: "group", team: "mercenaries", summary: "+2 при наблюдательности, когда нужно выяснить, заметили ли вы вражескую засаду." },
  hundredFriends: { key: "hundredFriends", name: "Сто друзей", kind: "group", team: "agents", summary: "В новом месте мигом обзаводитесь знакомствами (убежище, снаряжение, поручительство). Ведущий получает 1 пункт тьмы. Раз за встречу на команду." },
  guildOfAssassins: { key: "guildOfAssassins", name: "Гильдия убийц", kind: "group", team: "agents", summary: "Атакуя противника, не знающего о вашем присутствии, вместо ближнего боя можете использовать скрытность." },
  dancersOfAlam: { key: "dancersOfAlam", name: "Танцоры Алама", kind: "group", team: "agents", summary: "Пытаясь произвести хорошее впечатление, вместо влияния можете использовать проворство." },
  seasonedTravelers: { key: "seasonedTravelers", name: "Бывалые путешественники", kind: "group", team: "explorers", summary: "Понимая обычаи общества или группы людей, вместо мудрости можете использовать влияние." },
  survivors: { key: "survivors", name: "Остаться в живых", kind: "group", team: "explorers", summary: "Команда спасается от любой природной опасности (пожар, буря, обвал, декомпрессия). Ведущий получает 1 пункт тьмы. Раз за встречу на команду." },
  truthSeekers: { key: "truthSeekers", name: "Искатели истины", kind: "group", team: "explorers", summary: "Без проверок получаете от ведущего важную информацию или улику (обойти небольшое препятствие сценария). Ведущий получает 1 пункт тьмы. Раз за встречу на команду." },
  jokers: { key: "jokers", name: "Шутники", kind: "group", team: "pilgrims", summary: "Выпутываетесь из неприятностей, обратив всё в шутку. Ведущий получает 1 пункт тьмы. Раз за встречу на команду." },
  mercyOfIcons: { key: "mercyOfIcons", name: "Милость Ликов", kind: "group", team: "pilgrims", summary: "Отменяете эффект неприятности, только что призванной ведущим пунктами тьмы. Раз за встречу на команду." },
  pennilessCraft: { key: "pennilessCraft", name: "Без бирра за душой", kind: "group", team: "pilgrims", summary: "На новом месте зарабатываете ремеслом или представлением (встречная проверка проворства против влияния местной власти): спартанское проживание и запчасти." },

  // ── Мистические практики (табл. 4.7; доступны при психомистицизме > 0) ─────
  mysticGeneric: { key: "mysticGeneric", name: "Мистическая практика", kind: "mystic", summary: "Общий выбор мистической практики (см. ниже). Мистик обязан взять одну из них как личное достоинство." },
  oblivion: { key: "oblivion", name: "Забвение", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  intuition: { key: "intuition", name: "Интуиция", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  mentalContact: { key: "mentalContact", name: "Ментальный контакт", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  comprehension: { key: "comprehension", name: "Постижение", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  premonition: { key: "premonition", name: "Предчувствие", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  divination: { key: "divination", name: "Прорицание", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  telekinesis: { key: "telekinesis", name: "Телекинез", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  mindReading: { key: "mindReading", name: "Чтение мыслей", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  exorcism: { key: "exorcism", name: "Экзорцизм", kind: "mystic", summary: "Мистическая практика (гл. 10)." },
  clairvoyance: { key: "clairvoyance", name: "Ясновидение", kind: "mystic", summary: "Мистическая практика (гл. 10)." },

  // ── Стигмы пасынков (табл. 4.4; нельзя приобрести по ходу игры) ────────────
  underwaterBreathingStigma: { key: "underwaterBreathingStigma", name: "Подводное дыхание", kind: "stigma", summary: "Ты можешь свободно дышать под водой." },
  resilience: { key: "resilience", name: "Стойкость", kind: "stigma", summary: "Класс защиты 6 против природного ситуативного урона (в сочетании с «Закалкой» — 9)." },
  pheromones: { key: "pheromones", name: "Феромоны", kind: "stigma", summary: "Раз за встречу +2 при проверках влияния (не действует в вакууме и через противогаз/экзоскафандр)." },

  // ── Кибернетические имплантаты (табл. 4.5) ────────────────────────────────
  activeSensorImplant: { key: "activeSensorImplant", name: "Активный сенсор (имп.)", kind: "cybernetic", cost: 3000, summary: "Встроенный комплекс активных сенсоров; работает как широкополосный сенсор в активном режиме." },
  builtInWeaponImplant: { key: "builtInWeaponImplant", name: "Встроенное оружие (имп.)", kind: "cybernetic", cost: 6000, summary: "Потайное оружие в теле; обнаруживается только при полном досмотре. Само оружие покупается отдельно." },
  lieDetectorImplant: { key: "lieDetectorImplant", name: "Детектор лжи (имп.)", kind: "cybernetic", cost: 4000, summary: "Касаясь собеседника и глядя ему в глаза, проходишь проверку влияния (+2): при успехе знаешь, врёт он или нет." },
  interpreterImplant: { key: "interpreterImplant", name: "Интерпретатор (имп.)", kind: "cybernetic", cost: 12000, summary: "Гортань заменена динамиком с автопереводчиком; по умолчанию заложено пять языков." },
  skinElectrodesImplant: { key: "skinElectrodesImplant", name: "Кожные электроды (имп.)", kind: "cybernetic", cost: 6000, summary: "Успешной безоружной атакой вместо урона наносишь 2 пункта стресса (+1 за каждую доп. шестёрку)." },
  communicatorImplant: { key: "communicatorImplant", name: "Коммуникатор (имп.)", kind: "cybernetic", cost: 1500, summary: "Встроенная связь (I) незаметно: не нужно говорить вслух, звук идёт прямо на слуховой нерв." },
  optimizedMetabolismImplant: { key: "optimizedMetabolismImplant", name: "Оптимизированный метаболизм (имп.)", kind: "cybernetic", cost: 2000, summary: "Урон от голода и жажды наступает вдвое медленнее (4 дня и 24 часа)." },
  passiveSensorImplant: { key: "passiveSensorImplant", name: "Пассивный сенсор (имп.)", kind: "cybernetic", cost: 2000, summary: "Встроенный комплекс пассивных сенсоров; работает как широкополосный сенсор в пассивном режиме." },
  underwaterBreathingImplant: { key: "underwaterBreathingImplant", name: "Подводное дыхание (имп.)", kind: "cybernetic", cost: 5000, summary: "Устройство позволяет свободно дышать под водой." },
  subdermalArmorImplant: { key: "subdermalArmorImplant", name: "Подкожная броня (имп.)", kind: "cybernetic", cost: 6000, summary: "Класс защиты 3, суммируется с наружной бронёй; −1 к проворству при акробатике." },
  servoJointsImplant: { key: "servoJointsImplant", name: "Сервосуставы (имп.)", kind: "cybernetic", cost: 4000, summary: "+2 к ближнему бою в захвате и +2 к силе при поднятии тяжестей." },
  reinforcedMusclesImplant: { key: "reinforcedMusclesImplant", name: "Усиленные мышцы (имп.)", kind: "cybernetic", cost: 7000, summary: "Скорость +4 м (несовместимо с «Бегуном» и бионикой скорости), безоружный урон возрастает до 2." },
  amplifiedVoiceImplant: { key: "amplifiedVoiceImplant", name: "Усиленный голос (имп.)", kind: "cybernetic", cost: 2000, summary: "+2 к лидерству и влиянию, когда громкость голоса имеет значение." },
  reinforcedSkeletonImplant: { key: "reinforcedSkeletonImplant", name: "Усиленный скелет (имп.)", kind: "cybernetic", cost: 7000, summary: "+2 к силе при поднятии тяжестей, грузоподъёмность ×2, запас здоровья +2." },
  acceleratedReflexImplant: { key: "acceleratedReflexImplant", name: "Ускоренная реакция (имп.)", kind: "cybernetic", cost: 7000, summary: "+2 к проворству в акробатике; при инициативе бросаешь два кубика, выбираешь лучший (с «Опытным воином» — три)." },
  targeterImplant: { key: "targeterImplant", name: "Целеуказатель (имп.)", kind: "cybernetic", cost: 20000, summary: "+1 к стрельбе на средней дистанции и далее (не работает при стрельбе навскидку)." },

  // ── Бионические модификации (табл. 4.6) ───────────────────────────────────
  implantedWeaponMod: { key: "implantedWeaponMod", name: "Вживлённое оружие (мод.)", kind: "bionic", summary: "Бионическая модификация — вживлённое оружие." },
  coordinationMod: { key: "coordinationMod", name: "Координация (мод.)", kind: "bionic", summary: "Бионическая модификация координации." },
  morphingMod: { key: "morphingMod", name: "Морфирование (мод.)", kind: "bionic", summary: "Бионическая модификация морфирования облика." },
  beautyMod: { key: "beautyMod", name: "Прекрасная внешность (мод.)", kind: "bionic", summary: "Бионически усиленная внешность — используется как достоинство обольщения и влияния." },
  regenerationMod: { key: "regenerationMod", name: "Регенерация (мод.)", kind: "bionic", summary: "Бионическая модификация ускоренной регенерации." },
  speedMod: { key: "speedMod", name: "Скорость (мод.)", kind: "bionic", summary: "Бионическая модификация скорости." },
  enhancedIntellectMod: { key: "enhancedIntellectMod", name: "Улучшенный интеллект (мод.)", kind: "bionic", summary: "Бионическая модификация улучшенного интеллекта." },
};

export const TALENT_KEYS: readonly string[] = Object.keys(TALENTS);

export function isTalentKey(key: string): boolean {
  return key in TALENTS;
}

/** Мистические практики (без обобщённого «Мистическая практика»). */
export const MYSTIC_PRACTICE_KEYS: readonly string[] = TALENT_KEYS.filter(
  (k) => TALENTS[k].kind === "mystic" && k !== "mysticGeneric",
);

/**
 * Достоинства, которые нельзя получить по ходу игры за опыт: дар Лика (в
 * `icons.ts`) и стигма пасынка.
 */
export function isAcquirableByExperience(key: string): boolean {
  const t = TALENTS[key];
  return !!t && t.kind !== "stigma";
}
