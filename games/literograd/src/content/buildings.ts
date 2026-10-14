const NB = ' '

export type BuildingId = 'count' | 'clock' | 'library' | 'mill' | 'fountain' | 'lighthouse'
export type DecorId = 'tree' | 'lamp' | 'house'
export type Feature = 'latin' | 'reverse' | 'lowercase' | 'numbers' | 'byTwo' | 'countdown'

export const MAX_LEVEL = 3

export interface BuildingSpec {
  readonly id: BuildingId
  readonly name: string
  readonly x: number
  readonly costs: readonly [number, number, number]
  readonly effects: readonly [string, string, string, string]
  readonly upgrades: readonly [string, string, string]
}

export interface DecorSpec {
  readonly id: DecorId
  readonly name: string
  readonly cost: number
}

export interface DecorSlot {
  readonly x: number
  readonly front: boolean
}

export interface Requirement {
  readonly building: BuildingId
  readonly level: number
}

export const BUILDINGS: readonly BuildingSpec[] = [
  {
    id: 'count',
    name: 'Рахівня',
    x: 78,
    costs: [30, 90, 180],
    effects: ['Числа ще закриті', 'Відкрито «Числа по черзі»', 'Числа по одному й двійками', 'Усі три види лічби'],
    upgrades: ['Відкриває гру «Числа по черзі»', 'Лічба двійками: 2, 4, 6…', `Лічба навпаки: 30${NB}→${NB}1`],
  },
  {
    id: 'clock',
    name: 'Годинникова вежа',
    x: 198,
    costs: [40, 110, 220],
    effects: [`Раунд триває 45${NB}с`, `Раунд триває 50${NB}с`, `Раунд триває 55${NB}с`, `Раунд триває 60${NB}с`],
    upgrades: [`Раунд довшає до 50${NB}с`, `Раунд довшає до 55${NB}с`, `Раунд довшає до 60${NB}с`],
  },
  {
    id: 'library',
    name: 'Бібліотека',
    x: 330,
    costs: [70, 170, 340],
    effects: ['Лише українська абетка', 'Відкрито латинку A–Z', 'Латинка й абетка навпаки', 'Латинка, навпаки й малі літери'],
    upgrades: ['Латинська абетка A–Z', `Абетка навпаки: Я${NB}→${NB}А`, 'Малі літери: а, б, в…'],
  },
  {
    id: 'mill',
    name: 'Млин',
    x: 468,
    costs: [80, 200, 400],
    effects: ['Без бонусу до чорнила', `+20${NB}% чорнила за раунд`, `+40${NB}% чорнила за раунд`, `+60${NB}% чорнила за раунд`],
    upgrades: [`+20${NB}% чорнила за раунд`, `+40${NB}% чорнила за раунд`, `+60${NB}% чорнила за раунд`],
  },
  {
    id: 'fountain',
    name: 'Фонтан',
    x: 590,
    costs: [60, 150, 300],
    effects: ['Комбо до ×2', 'Комбо до ×2,5', 'Комбо до ×3', 'Комбо до ×4'],
    upgrades: ['Комбо до ×2,5', 'Комбо до ×3', 'Комбо до ×4'],
  },
  {
    id: 'lighthouse',
    name: 'Маяк',
    x: 718,
    costs: [50, 120, 240],
    effects: ['Підказок немає', '1 підказка маркером за раунд', '2 підказки за раунд', '3 підказки за раунд'],
    upgrades: ['1 підказка маркером за раунд', '2 підказки за раунд', '3 підказки за раунд'],
  },
]

export const BUILDING_IDS: readonly BuildingId[] = BUILDINGS.map((spec) => spec.id)

const BY_ID = new Map<BuildingId, BuildingSpec>(BUILDINGS.map((spec) => [spec.id, spec]))

export const buildingSpec = (id: BuildingId): BuildingSpec => {
  const spec = BY_ID.get(id)
  if (!spec) throw new Error(`Unknown building: ${id}`)
  return spec
}

export const costAt = (spec: BuildingSpec, level: number): number | null => spec.costs[level] ?? null

export const effectAt = (spec: BuildingSpec, level: number): string => spec.effects[level] ?? ''

export const upgradeAt = (spec: BuildingSpec, level: number): string => spec.upgrades[level] ?? ''

export const DECOR: readonly DecorSpec[] = [
  { id: 'tree', name: 'Дерево', cost: 15 },
  { id: 'lamp', name: 'Ліхтар', cost: 20 },
  { id: 'house', name: 'Будиночок', cost: 25 },
]

export const DECOR_IDS: readonly DecorId[] = DECOR.map((spec) => spec.id)

export const decorSpec = (id: DecorId): DecorSpec => {
  const spec = DECOR.find((item) => item.id === id)
  if (!spec) throw new Error(`Unknown decor: ${id}`)
  return spec
}

export const DECOR_SLOTS: readonly DecorSlot[] = [
  { x: 147, front: true },
  { x: 418, front: true },
  { x: 665, front: true },
  { x: 248, front: true },
  { x: 519, front: true },
  { x: 16, front: true },
  { x: 772, front: true },
  { x: 132, front: false },
  { x: 404, front: false },
  { x: 650, front: false },
  { x: 261, front: false },
  { x: 533, front: false },
  { x: 787, front: false },
  { x: 162, front: false },
  { x: 432, front: false },
  { x: 681, front: false },
  { x: 236, front: false },
  { x: 506, front: false },
  { x: 758, front: false },
]

export const FEATURE_REQUIREMENTS: Readonly<Record<Feature, Requirement>> = {
  latin: { building: 'library', level: 1 },
  reverse: { building: 'library', level: 2 },
  lowercase: { building: 'library', level: 3 },
  numbers: { building: 'count', level: 1 },
  byTwo: { building: 'count', level: 2 },
  countdown: { building: 'count', level: 3 },
}
