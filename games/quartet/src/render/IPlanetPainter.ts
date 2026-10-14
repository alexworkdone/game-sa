import type { PlanetTypeId, Rarity } from '../forge/Planet.js'

export interface PlanetLike {
  readonly seed: number
  readonly type: PlanetTypeId
  readonly rarity: Rarity
}

export interface PaintOptions {
  readonly animated?: boolean
  readonly silhouette?: boolean
}

export interface IPlanetPainter {
  paint(planet: PlanetLike, options?: PaintOptions): string
}
