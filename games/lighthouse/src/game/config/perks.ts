import { PEARL_KINDS } from './pearls.js'
import type { PearlKind, PearlPrice } from './pearls.js'
import { note, stat } from './stats.js'
import type { StatLine } from './stats.js'

export type PerkId =
  | 'treasure'
  | 'kit'
  | 'spareHeart'
  | 'discount'
  | 'elevator'
  | 'secondWind'
  | 'keyMagnet'
  | 'tide'
  | 'longPowers'
  | 'lucky'

export interface PerkDef {
  readonly id: PerkId
  readonly title: string
  readonly maxLevel: number
  readonly priceScale: number
  stats(level: number): readonly StatLine[]
}

export type PerkLevels = Readonly<Record<PerkId, number>>

export interface PerkEffects {
  readonly pearlMultiplier: number
  readonly kit: number
  readonly spareHearts: number
  readonly discount: number
  readonly checkpointEvery: number
  readonly liftHeart: number
  readonly secondWinds: number
  readonly secondWindHearts: number
  readonly keyMagnet: number
  readonly tideDelay: number
  readonly powerDuration: number
  readonly dropChance: number
}

export const RELIC_LEVELS = 4

export const KIT_RUN_START = 1
export const KIT_GUARDIAN_FLOORS = 2
export const KIT_EVERY_FLOOR = 3
export const KIT_DOUBLE_START = 4

const PERK_VALUES = {
  treasure: [0, 0.1, 0.2, 0.3, 0.4],
  kit: [0, 1, 2, 3, 4],
  spareHeart: [0, 1, 2, 3, 4],
  discount: [0, 0.08, 0.15, 0.22, 0.3],
  elevator: [5, 4, 3, 3, 2],
  liftHeart: [0, 0, 0, 1, 1],
  secondWind: [0, 1, 1, 2, 2],
  secondWindHearts: [0, 1, 2, 1, 2],
  keyMagnet: [0, 1, 1.5, 2, 3],
  tide: [0, 3, 6, 9, 12],
  longPowers: [1, 1.15, 1.3, 1.45, 1.6],
  lucky: [1, 1.4, 1.8, 2.2, 2.6],
} as const satisfies Record<string, readonly number[]>

const value = (id: keyof typeof PERK_VALUES, level: number): number => {
  const values: readonly number[] = PERK_VALUES[id]
  return values[Math.min(level, values.length - 1)] as number
}

const percent = (fraction: number): string => `${Math.round(fraction * 100)} %`

const times = (factor: number): string => `×${factor.toLocaleString('uk-UA')}`

const hearts = (count: number): string => (count === 1 ? '1 серцем' : `${count} серцями`)

export const emptyPerkLevels = (): Record<PerkId, number> => ({
  treasure: 0,
  kit: 0,
  spareHeart: 0,
  discount: 0,
  elevator: 0,
  secondWind: 0,
  keyMagnet: 0,
  tide: 0,
  longPowers: 0,
  lucky: 0,
})

const KIT_TEXT = [
  'Без стартового бонусу',
  'Бонус на старті забігу',
  'Бонус на старті й у вартових',
  'Бонус на кожному поверсі',
  'Бонус щоповерху, на старті — два',
] as const

export const PERKS: readonly PerkDef[] = [
  {
    id: 'treasure',
    title: 'Скарб глибин',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [stat('Перлів більше', `+${percent(value('treasure', level))}`)],
  },
  {
    id: 'kit',
    title: 'Тривожна валіза',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [note(KIT_TEXT[Math.min(level, KIT_TEXT.length - 1)] as string)],
  },
  {
    id: 'spareHeart',
    title: 'Запасне серце',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [stat('Сердець на старті', `+${value('spareHeart', level)}`)],
  },
  {
    id: 'discount',
    title: 'Цехова знижка',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [stat('Апгрейди дешевші', percent(value('discount', level)))],
  },
  {
    id: 'elevator',
    title: 'Частий ліфт',
    maxLevel: RELIC_LEVELS,
    priceScale: 1.2,
    stats: (level) => {
      const lift = stat('Ліфт — кожен', `${value('elevator', level)}-й поверх`)
      return value('liftHeart', level) > 0 ? [lift, stat('Серце з ліфтом', '+1')] : [lift]
    },
  },
  {
    id: 'secondWind',
    title: 'Друге дихання',
    maxLevel: RELIC_LEVELS,
    priceScale: 1.2,
    stats: (level) => {
      const charges = value('secondWind', level)
      if (charges === 0) return [note('Без воскресіння')]
      return [note(`${charges === 1 ? 'Раз' : 'Двічі'} за забіг встаєш з ${hearts(value('secondWindHearts', level))}`)]
    },
  },
  {
    id: 'keyMagnet',
    title: 'Ключник',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => {
      const reach = value('keyMagnet', level)
      if (reach === 0) return [note('Ключі магніт не тягне')]
      return [note(reach === 1 ? 'Магніт тягне й ключі' : `Ключі з радіуса ${times(reach)}`)]
    },
  },
  {
    id: 'tide',
    title: 'Тиха вода',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [stat('Вода рушає пізніше', `+${value('tide', level)} с`)],
  },
  {
    id: 'longPowers',
    title: 'Довгий запал',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [stat('Бонуси тривають довше', `+${percent(value('longPowers', level) - 1)}`)],
  },
  {
    id: 'lucky',
    title: 'Щедре море',
    maxLevel: RELIC_LEVELS,
    priceScale: 1,
    stats: (level) => [stat('Бонуси з потвор', times(value('lucky', level)))],
  },
]

const RELIC_PRICES: readonly Readonly<Partial<Record<PearlKind, number>>>[] = [
  { white: 400 },
  { white: 600, pink: 200 },
  { white: 1000, pink: 400, black: 250 },
  { white: 1500, pink: 600, black: 300, rainbow: 200 },
]

const PRICE_STEP = 10

export const relicPrice = (def: PerkDef, level: number): PearlPrice => {
  const row = RELIC_PRICES[Math.min(level, RELIC_PRICES.length) - 1] ?? {}
  return PEARL_KINDS.filter((kind) => row[kind] !== undefined).map((kind) => ({
    kind,
    amount: Math.round(((row[kind] as number) * def.priceScale) / PRICE_STEP) * PRICE_STEP,
  }))
}

export const resolvePerks = (levels: PerkLevels): PerkEffects => ({
  pearlMultiplier: 1 + value('treasure', levels.treasure),
  kit: value('kit', levels.kit),
  spareHearts: value('spareHeart', levels.spareHeart),
  discount: value('discount', levels.discount),
  checkpointEvery: value('elevator', levels.elevator),
  liftHeart: value('liftHeart', levels.elevator),
  secondWinds: value('secondWind', levels.secondWind),
  secondWindHearts: value('secondWindHearts', levels.secondWind),
  keyMagnet: value('keyMagnet', levels.keyMagnet),
  tideDelay: value('tide', levels.tide),
  powerDuration: value('longPowers', levels.longPowers),
  dropChance: value('lucky', levels.lucky),
})
