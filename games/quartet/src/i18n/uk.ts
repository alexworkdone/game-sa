import type { ParticleColor } from '../shared/ParticleColor.js'
import type { PlanetTypeId, Rarity } from '../forge/Planet.js'
import type { ThemeId } from '../meta/Themes.js'
import type { ScoreLineKind } from '../meta/Scoring.js'
import { plural } from './plural.js'
import type { PluralForms } from './plural.js'

export const UK = {
  appName: 'Квартет',
  tagline: 'Знайди четвірки — запали світи',

  tabs: {
    home: 'Головна',
    levels: 'Шлях',
    forge: 'Кузня',
    galaxy: 'Галактика',
    profile: 'Профіль',
  },

  home: {
    play: 'Грати',
    level: (level: number) => `Рівень\u00a0${level}`,
    dailyTitle: 'Щоденна',
    dailyReady: 'Нова головоломка!',
    dailyDone: 'Наступна через',
    dailyReward: '×2 частинки',
    forgeTitle: 'Кузня світів',
    forgeReady: (count: number) => `Можна створити: ${count}`,
    forgeNotReady: 'Збирай частинки',
    galaxyTitle: 'Моя галактика',
    galaxyProgress: (found: number, total: number) => `Відкрито ${found} з ${total}\u00a0світів`,
    firstPlanet: 'Твоя перша планета чекає в кузні',
    chestReady: 'Скриня розділу чекає!',
  },

  levels: {
    title: 'Шлях',
    chapter: (index: number) => `Розділ\u00a0${index + 1}`,
    chest: 'Скриня',
    chestHint: (need: number) => `Збери ${need}\u00a0★, щоб відкрити`,
    chestOpen: 'Відкрити',
    chestClaimed: 'Відкрито',
    locked: 'Пройди попередній розділ',
  },

  chapters: [
    'Перші зорі',
    'Місячна стежка',
    'Пояс астероїдів',
    'Туманність',
    'Кільця гіганта',
    'Зоряний вітер',
    'Подвійне сонце',
    'Крижана хмара',
    'Квазар',
    'Чумацький Шлях',
    'Край галактики',
    'Нова ера',
  ] as readonly string[],

  game: {
    daily: 'Щоденна',
    level: (level: number) => `Рівень\u00a0${level}`,
    subtitle: 'Знайди 4\u00a0групи по 4\u00a0слова',
    mistakes: 'Спроби',
    shuffle: 'Перемішати',
    clear: 'Скинути',
    submit: 'Перевірити',
    hint: 'Підказка',
    oneAway: 'Майже! Одне слово зайве',
    wrong: 'Не та четвірка',
    repeat: 'Ви вже пробували ці слова',
    noHints: 'Підказки скінчилися',
    hintTitle: (title: string) => `Одна з груп: «${title}»`,
    hintWord: 'Позначено слово з цієї групи',
    praise: ['Чудово!', 'Так!', 'Влучно!', 'Є контакт!', 'Блискуче!'] as readonly string[],
    leaveTitle: 'Вийти з гри?',
    leaveText: 'Прогрес цієї головоломки буде втрачено.',
    leave: 'Вийти',
    stay: 'Грати далі',
    outTitle: 'Спроби скінчилися',
    outText: 'Переглянь коротку рекламу — і отримаєш ще одну спробу.',
    outWatch: 'Ще спроба',
    outGiveUp: 'Здатися',
    unavailable: 'Не вдалося зібрати головоломку. Спробуй пізніше.',
  },

  result: {
    winTitles: ['Є!', 'Чудово!', 'Бездоганно!'] as readonly string[],
    loseTitle: 'Цього разу ні',
    loseText: 'Ось якими були групи:',
    score: 'Бали',
    earned: 'Здобуто частинок',
    next: 'Далі',
    retry: 'Ще раз',
    menu: 'Меню',
    toForge: 'У кузню',
    rankUp: 'Новий ранг!',
    dailyDone: 'Щоденну пройдено',
    streak: (days: number, forms: string) => `Серія: ${days}\u00a0${forms}`,
    lines: {
      groups: 'Групи',
      perfect: 'Без помилок',
      speed: 'Швидкість',
      mistakes: 'Помилки',
      hints: 'Підказки',
      daily: 'Щоденний бонус',
    } satisfies Record<ScoreLineKind, string>,
    bonusHint: '+1\u00a0підказка',
  },

  forge: {
    title: 'Кузня світів',
    intro: 'Засип 4\u00a0порції частинок у ядро — і народиться новий світ.',
    rule: 'Тип світу визначають кольори, яких у ядрі щонайменше дві порції. Чотири різні кольори дають перламутровий світ.',
    add: 'Додати',
    clear: 'Очистити',
    create: 'Створити світ',
    needMore: 'Заповни всі 4\u00a0комірки',
    prediction: 'Прогноз',
    unknown: 'Невідомий світ',
    pity: (left: number) => `Епічний або кращий гарантовано через ${left}\u00a0${plural(left, ['світ', 'світи', 'світів'])}`,
    pityReady: 'Наступний світ — щонайменше епічний!',
    newType: 'Нове відкриття!',
    newRarity: 'Нова рідкість!',
    toGalaxy: 'У галактику',
    again: 'Ще один',
    great: 'Чудово',
    madeOf: 'Створено з',
    empty: 'Частинок поки немає — розгадуй групи, щоб їх здобути.',
    infoTitle: 'Як це працює',
  },

  galaxy: {
    title: 'Галактика',
    atlas: 'Атлас',
    mine: 'Мої світи',
    worlds: (count: number, forms: string) => `${count}\u00a0${forms}`,
    locked: 'Ще не відкрито',
    hintRecipe: 'Підказка: спробуй ці кольори',
    secretHint: 'Кажуть, його народжує чистий аметист…',
    empty: 'Тут зʼявляться створені тобою світи.',
    collection: 'Колекція',
    created: 'Створено',
    rarityCount: (count: number) => `×${count}`,
  },

  profile: {
    title: 'Профіль',
    xp: 'Досвід',
    stats: 'Статистика',
    played: 'Зіграно',
    won: 'Перемог',
    winRate: 'Успішність',
    perfect: 'Бездоганних',
    bestScore: 'Рекорд',
    streak: 'Серія днів',
    planets: 'Світів',
    legendary: 'Легендарних',
    ranks: 'Ранги',
    themes: 'Теми',
    themeLocked: (count: number) => `Відкрий ${count}\u00a0типів світів`,
    themeSecret: 'Знайди таємний обʼєкт',
    settings: 'Налаштування',
    sound: 'Звук',
    vibration: 'Вібрація',
    howTo: 'Як грати',
    reset: 'Скинути прогрес',
    resetTitle: 'Скинути весь прогрес?',
    resetText: 'Рівні, частинки, світи та статистика зникнуть назавжди.',
    resetConfirm: 'Скинути',
    cancel: 'Скасувати',
    rankReward: '+20\u00a0частинок кожного кольору, +2\u00a0підказки',
  },

  tutorial: [
    {
      title: 'Знайди четвірки',
      text: 'Перед тобою 16\u00a0слів. Вони складаються в 4\u00a0групи по 4 — у кожної щось спільне.',
    },
    {
      title: 'Обери й перевір',
      text: 'Торкнися 4\u00a0слів і натисни «Перевірити». Маєш 4\u00a0спроби — стеж за хибними слідами!',
    },
    {
      title: 'Запали світи',
      text: 'Кожна група дає частинки свого кольору. У Кузні з них народжуються унікальні планети.',
    },
  ] as readonly { title: string; text: string }[],
  tutorialNext: 'Далі',
  tutorialStart: 'Почати',

  hintOffer: {
    title: 'Потрібна підказка?',
    text: (left: number) => `Переглянь коротку рекламу — отримаєш +1\u00a0підказку. Сьогодні доступно: ${left}.`,
    none: 'На сьогодні рекламні підказки скінчилися. Проходь щоденну головоломку й підвищуй ранг — там теж дають підказки.',
    watch: 'Переглянути',
  },

  rewards: {
    chestTitle: 'Скриня розділу',
    take: 'Забрати',
  },

  particles: {
    yellow: 'Сонячні',
    green: 'Смарагдові',
    blue: 'Сапфірові',
    purple: 'Аметистові',
  } satisfies Record<ParticleColor, string>,

  particlesShort: {
    yellow: 'Сонце',
    green: 'Смарагд',
    blue: 'Сапфір',
    purple: 'Аметист',
  } satisfies Record<ParticleColor, string>,

  rarity: {
    common: 'Звичайний',
    rare: 'Рідкісний',
    epic: 'Епічний',
    legendary: 'Легендарний',
  } satisfies Record<Rarity, string>,

  planetTypes: {
    desert: { name: 'Золоті дюни', lore: 'Пісок, що світиться на заході трьох сонць.' },
    jungle: { name: 'Світ-джунглі', lore: 'Ліс тут такий густий, що видно його з орбіти.' },
    ocean: { name: 'Океанія', lore: 'Суцільна вода і рідкі острови-перлини.' },
    crystal: { name: 'Кристалічний світ', lore: 'Грані кристалів співають під зоряним вітром.' },
    savanna: { name: 'Савана', lore: 'Безкраї трави під теплим світлом.' },
    gas: { name: 'Газовий гігант', lore: 'Смуги бур і вічний шторм посередині.' },
    volcanic: { name: 'Вулканічний світ', lore: 'Лава прокладає світні ріки в темряві.' },
    cloud: { name: 'Хмарний світ', lore: 'Хмари закручуються у вічний танець.' },
    toxic: { name: 'Кислотний світ', lore: 'Неонові моря, де ніщо не стоїть на місці.' },
    ice: { name: 'Крижаний світ', lore: 'Тріщини в льоду сяють холодним світлом.' },
    pearl: { name: 'Перламутровий світ', lore: 'Переливається всіма кольорами одразу.' },
    blackhole: { name: 'Чорна діра', lore: 'Навіть світло не повертається звідси.' },
  } satisfies Record<PlanetTypeId, { name: string; lore: string }>,

  themes: {
    cosmos: 'Космос',
    aurora: 'Аврора',
    sunset: 'Захід',
    abyss: 'Безодня',
  } satisfies Record<ThemeId, string>,

  ranks: [
    'Новачок',
    'Спостерігач',
    'Астроном',
    'Навігатор',
    'Пілот',
    'Капітан',
    'Дослідник',
    'Творець світів',
    'Архітектор галактик',
    'Володар зірок',
  ] as readonly string[],

  forms: {
    planets: ['світ', 'світи', 'світів'],
    hints: ['підказка', 'підказки', 'підказок'],
    days: ['день', 'дні', 'днів'],
    stars: ['зірка', 'зірки', 'зірок'],
  } satisfies Record<string, PluralForms>,

  common: {
    close: 'Закрити',
    ok: 'Гаразд',
  },
}

export const RANK_THRESHOLDS: readonly number[] = [
  0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000,
]
