import { tierName } from './tiers.js'

export type MenuFeature = 'floors' | 'achievements' | 'relics' | 'tiers' | 'streak'

export interface UnlockView {
  readonly floorsPassed: number
  readonly maxTier: number
  readonly canAdvance: boolean
}

export interface MenuUnlockDef {
  readonly id: MenuFeature
  readonly caption?: string
  readonly title: string
  readonly lines: readonly string[]
  isOpen(view: UnlockView): boolean
}

const afterFloor =
  (floor: number) =>
  (view: UnlockView): boolean =>
    view.floorsPassed >= floor || view.maxTier > 1

export const MENU_UNLOCKS: readonly MenuUnlockDef[] = [
  {
    id: 'floors',
    title: 'Старт з поверху',
    lines: [
      'Кожен 5-й поверх, до якого ти дійшов, стає ліфтом. Новий забіг можна почати прямо з нього — не дертися щоразу з першого.',
      'Обирай поверх у рядку «Старт з поверху»: клік або ← →. Кружечки з замочком — ліфти, до яких ще не дійшов.',
      'Нижчі поверхи спокійніші — зручно, щоб назбирати перлів. Вищі — швидше до рекорду.',
    ],
    isOpen: afterFloor(5),
  },
  {
    id: 'achievements',
    title: 'Досягнення',
    lines: [
      'Полиця трофеїв за подвиги: поверхи, вартові, ключі, забіги без жодної подряпини…',
      'Нове досягнення виїжджає сповіщенням зверху, а тут видно всі разом, умови й прогрес до наступних.',
    ],
    isOpen: afterFloor(10),
  },
  {
    id: 'relics',
    title: 'Реліквії маяка',
    lines: [
      'Вічні покращення за перли: не скидаються ніколи й діють на всіх рівнях складності.',
      `Купувати їх можна з рівня складності «${tierName(2)}» — прокачай усі апгрейди в майстерні до максимуму. Зазирни, що на тебе чекає.`,
    ],
    isOpen: afterFloor(20),
  },
  {
    id: 'streak',
    caption: 'НОВЕ В ГРІ',
    title: 'Серія поверхів',
    lines: [
      'Проходь поверхи поспіль — бонус за поверх росте: ×1,1, ×1,2, ×1,3… аж до ×2.',
      'Смерть або вихід із забігу в меню обнуляють серію. Майстерня між поверхами — ні.',
      'Множник видно на панелі між поверхами.',
    ],
    isOpen: afterFloor(25),
  },
  {
    id: 'tiers',
    title: 'Рівні складності',
    lines: [
      'Усі апгрейди на максимумі — маяк готовий до нового шторму.',
      'На новій складності апгрейди з нуля й дорожчі, вартові міцніші, а перли тут свої: на II — рожеві, далі — чорні й райдужні.',
      'Апгрейди купуються перлами своєї складності, а реліквії (відкриваються разом із II) — сумішшю перлин різних складностей.',
      "Перемикатися можна будь-коли в рядку «Складність»: кожна пам'ятає свої апгрейди, рекорд і ліфти.",
    ],
    isOpen: (view) => view.maxTier > 1 || view.canAdvance,
  },
]
