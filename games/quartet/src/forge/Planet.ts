import type { ParticleColor } from '../shared/ParticleColor.js'

export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const

export type Rarity = (typeof RARITIES)[number]

export type PlanetTypeId =
  | 'desert'
  | 'jungle'
  | 'ocean'
  | 'crystal'
  | 'savanna'
  | 'gas'
  | 'volcanic'
  | 'cloud'
  | 'toxic'
  | 'ice'
  | 'pearl'
  | 'blackhole'

export interface Planet {
  readonly id: string
  readonly seed: number
  readonly type: PlanetTypeId
  readonly rarity: Rarity
  readonly name: string
  readonly portions: readonly ParticleColor[]
  readonly createdAt: number
}

export interface PlanetTypeDef {
  readonly id: PlanetTypeId
  readonly recipe: readonly ParticleColor[]
  readonly secret: boolean
}

export const PLANET_TYPES: readonly PlanetTypeDef[] = [
  { id: 'desert', recipe: ['yellow'], secret: false },
  { id: 'jungle', recipe: ['green'], secret: false },
  { id: 'ocean', recipe: ['blue'], secret: false },
  { id: 'crystal', recipe: ['purple'], secret: false },
  { id: 'savanna', recipe: ['yellow', 'green'], secret: false },
  { id: 'gas', recipe: ['yellow', 'blue'], secret: false },
  { id: 'volcanic', recipe: ['yellow', 'purple'], secret: false },
  { id: 'cloud', recipe: ['green', 'blue'], secret: false },
  { id: 'toxic', recipe: ['green', 'purple'], secret: false },
  { id: 'ice', recipe: ['blue', 'purple'], secret: false },
  { id: 'pearl', recipe: ['yellow', 'green', 'blue', 'purple'], secret: false },
  { id: 'blackhole', recipe: ['purple'], secret: true },
]

export const planetType = (id: PlanetTypeId): PlanetTypeDef =>
  PLANET_TYPES.find((type) => type.id === id) ?? (PLANET_TYPES[0] as PlanetTypeDef)
