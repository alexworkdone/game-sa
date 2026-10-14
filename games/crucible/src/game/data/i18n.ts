import type { ElementId } from './elements.js'
import type { CategoryId } from './categories.js'

export type Lang = 'uk' | 'en'

export const LANGS: readonly Lang[] = ['uk', 'en']

export const LANG_LABELS: Record<Lang, string> = { uk: 'Українська', en: 'English' }

export type UiKey =
  | 'discovered'
  | 'total'
  | 'progress'
  | 'pickElements'
  | 'addOneMore'
  | 'mix'
  | 'tapToRemove'
  | 'allOff'
  | 'feedEmpty'
  | 'crucibleFull'
  | 'mixFailed'
  | 'alreadyKnown'
  | 'allChip'
  | 'locked'
  | 'menu'
  | 'language'
  | 'sorting'
  | 'theme'
  | 'close'
  | 'sortDiscovery'
  | 'sortAlpha'
  | 'sortCategory'
  | 'sortDepth'
  | 'sortUseful'
  | 'themeNight'
  | 'themeCoal'
  | 'themeForest'
  | 'themePlum'

export const UI: Record<Lang, Record<UiKey, string>> = {
  uk: {
    discovered: 'ВІДКРИТО',
    total: 'УСЬОГО',
    progress: 'ПРОГРЕС',
    pickElements: 'ОБЕРИ ЕЛЕМЕНТИ',
    addOneMore: 'ДОДАЙ ЩЕ ОДИН',
    mix: 'ЗМІШАТИ',
    tapToRemove: 'ТОРКНИСЬ ЕЛЕМЕНТА, ЩОБ ПРИБРАТИ',
    allOff: 'Усі категорії вимкнено',
    feedEmpty: 'Поки порожньо',
    crucibleFull: 'Горнило заповнене',
    mixFailed: 'Суміш не склалася',
    alreadyKnown: 'уже відкрито',
    allChip: 'Всі',
    locked: '???',
    menu: 'Меню',
    language: 'МОВА',
    sorting: 'СОРТУВАННЯ',
    theme: 'ТЕМА',
    close: 'Закрити',
    sortDiscovery: 'За відкриттям',
    sortAlpha: 'За абеткою',
    sortCategory: 'За категоріями',
    sortDepth: 'Від простих',
    sortUseful: 'Найкорисніші',
    themeNight: 'Ніч',
    themeCoal: 'Вугілля',
    themeForest: 'Ліс',
    themePlum: 'Слива',
  },
  en: {
    discovered: 'FOUND',
    total: 'TOTAL',
    progress: 'PROGRESS',
    pickElements: 'PICK ELEMENTS',
    addOneMore: 'ADD ONE MORE',
    mix: 'MIX',
    tapToRemove: 'TAP AN ELEMENT TO REMOVE',
    allOff: 'All categories are off',
    feedEmpty: 'Nothing yet',
    crucibleFull: 'Crucible is full',
    mixFailed: 'Nothing came of it',
    alreadyKnown: 'already known',
    allChip: 'All',
    locked: '???',
    menu: 'Menu',
    language: 'LANGUAGE',
    sorting: 'SORTING',
    theme: 'THEME',
    close: 'Close',
    sortDiscovery: 'By discovery',
    sortAlpha: 'Alphabetical',
    sortCategory: 'By category',
    sortDepth: 'Simplest first',
    sortUseful: 'Most useful',
    themeNight: 'Night',
    themeCoal: 'Coal',
    themeForest: 'Forest',
    themePlum: 'Plum',
  },
}

export const ELEMENT_NAMES: Record<Lang, Record<ElementId, string>> = {
  uk: {
    earth: 'Земля',
    water: 'Вода',
    fire: 'Вогонь',
    air: 'Повітря',
    steam: 'Пара',
    swamp: 'Болото',
    dust: 'Пил',
    lava: 'Лава',
    energy: 'Енергія',
    sea: 'Море',
    stone: 'Камінь',
    cloud: 'Хмара',
    smoke: 'Дим',
    sand: 'Пісок',
    rain: 'Дощ',
    obsidian: 'Обсидіан',
    glass: 'Скло',
    beach: 'Пляж',
    life: 'Життя',
    plant: 'Рослина',
    tree: 'Дерево',
    storm: 'Буря',
    volcano: 'Вулкан',
    rainbow: 'Веселка',
  },
  en: {
    earth: 'Earth',
    water: 'Water',
    fire: 'Fire',
    air: 'Air',
    steam: 'Steam',
    swamp: 'Swamp',
    dust: 'Dust',
    lava: 'Lava',
    energy: 'Energy',
    sea: 'Sea',
    stone: 'Stone',
    cloud: 'Cloud',
    smoke: 'Smoke',
    sand: 'Sand',
    rain: 'Rain',
    obsidian: 'Obsidian',
    glass: 'Glass',
    beach: 'Beach',
    life: 'Life',
    plant: 'Plant',
    tree: 'Tree',
    storm: 'Storm',
    volcano: 'Volcano',
    rainbow: 'Rainbow',
  },
}

export const CATEGORY_NAMES: Record<Lang, Record<CategoryId, string>> = {
  uk: {
    base: 'Стихії',
    sky: 'Небо',
    water: 'Вода',
    depths: 'Надра',
    stone: 'Камінь',
    life: 'Живе',
  },
  en: {
    base: 'Elements',
    sky: 'Sky',
    water: 'Water',
    depths: 'Depths',
    stone: 'Stone',
    life: 'Life',
  },
}

export const HINTS: Record<Lang, Partial<Record<ElementId, string>>> = {
  uk: {
    steam: 'Чайник на плиті свистить, коли вода зустрічає жар.',
    swamp: 'Після дощу ґрунт розкисає і чавкає під чоботом.',
    dust: 'Вітер піднімає із сухої дороги сіру завісу.',
    lava: 'Під корою планети камінь тече, наче тісто.',
    energy: 'Роздмухай вогнище — і полумʼя вистрелить угору.',
    sea: 'Повноводні річки наповнюють водою моря.',
    stone: 'Вогненна ріка на поверхні холоне і твердне.',
    cloud: 'Пара з теплої річки збирається в небі у білі купи.',
    smoke: 'Багаття із сухим листям димить найдужче.',
    sand: 'Море тисячі років перетирає скелі на дрібні зерна.',
    rain: 'Хмара набирає вологи, доки не стане заважкою.',
    obsidian: 'Розпечений потік упав у воду — і став чорним склом.',
    glass: 'У печі скловара звичайний пісок робиться прозорим.',
    beach: 'Там, де хвиля торкається піску, лягає смуга для ніг.',
    life: 'У теплій твані від першого розряду щось заворушилось.',
    plant: 'Кинь насінину в землю — і вона пробʼється вгору.',
    tree: 'Политá роками рослина деревʼяніє і тягнеться до неба.',
    storm: 'Важка хмара набирає заряду — і небо тріщить.',
    volcano: 'Гора, що курить димом, готує вогняний викид.',
    rainbow: 'Промінь, зламаний у краплі, розпадається на сім барв.',
  },
  en: {
    steam: 'A kettle whistles when water meets the heat.',
    swamp: 'After rain the ground turns soft and squelches underfoot.',
    dust: 'Wind lifts a grey veil off a dry road.',
    lava: 'Under the planet crust the rock flows like dough.',
    energy: 'Fan a bonfire and the flame shoots upward.',
    sea: 'Full rivers keep pouring water into the seas.',
    stone: 'A fiery river cools on the surface and hardens.',
    cloud: 'Steam off a warm river gathers into white heaps.',
    smoke: 'A bonfire with damp leaves gives the thickest plume.',
    sand: 'The sea grinds cliffs into tiny grains over millennia.',
    rain: 'A cloud drinks moisture until it grows too heavy.',
    obsidian: 'A molten stream fell into water and became black glass.',
    glass: 'In a glassblower furnace plain sand turns clear.',
    beach: 'Where the wave touches sand, a strip for bare feet appears.',
    life: 'In warm mud a first discharge stirred something.',
    plant: 'Drop a seed into soil and it pushes upward.',
    tree: 'Watered for years, a plant turns woody and reaches high.',
    storm: 'A heavy cloud takes on charge and the sky cracks.',
    volcano: 'A mountain smoking away is preparing a fiery burst.',
    rainbow: 'A ray broken in a droplet splits into seven colours.',
  },
}
