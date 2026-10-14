import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'
import type { Planet, PlanetTypeId, Rarity } from './Planet.js'
import { RARITIES } from './Planet.js'

interface GalaxyState {
  readonly planets: readonly Planet[]
  readonly sinceEpic: number
}

export interface AddResult {
  readonly newType: boolean
  readonly newRarity: boolean
}

const KEY = 'v1.galaxy'
export const PITY_AFTER = 9

export class Galaxy {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: GalaxyState

  constructor(storage: IStorage) {
    this.storage = storage
    this.state = storage.get<GalaxyState>(KEY, { planets: [], sinceEpic: 0 })
  }

  get planets(): readonly Planet[] {
    return this.state.planets
  }

  get count(): number {
    return this.state.planets.length
  }

  get pityReady(): boolean {
    return this.state.sinceEpic >= PITY_AFTER
  }

  get untilPity(): number {
    return Math.max(0, PITY_AFTER - this.state.sinceEpic)
  }

  newest(limit: number): readonly Planet[] {
    return [...this.state.planets].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
  }

  ofType(type: PlanetTypeId): readonly Planet[] {
    return this.state.planets.filter((planet) => planet.type === type)
  }

  discovered(type: PlanetTypeId): boolean {
    return this.state.planets.some((planet) => planet.type === type)
  }

  discoveredTypes(): ReadonlySet<PlanetTypeId> {
    return new Set(this.state.planets.map((planet) => planet.type))
  }

  rarities(type: PlanetTypeId): ReadonlySet<Rarity> {
    return new Set(this.ofType(type).map((planet) => planet.rarity))
  }

  best(type: PlanetTypeId): Planet | null {
    const planets = this.ofType(type)
    if (planets.length === 0) return null
    return planets.reduce((best, planet) =>
      RARITIES.indexOf(planet.rarity) > RARITIES.indexOf(best.rarity) ? planet : best,
    )
  }

  countRarity(rarity: Rarity): number {
    return this.state.planets.filter((planet) => planet.rarity === rarity).length
  }

  collectionSlots(): { filled: number; total: number } {
    const types = new Set(this.state.planets.map((planet) => `${planet.type}:${planet.rarity}`))
    return { filled: types.size, total: 12 * RARITIES.length }
  }

  add(planet: Planet): AddResult {
    const newType = !this.discovered(planet.type)
    const newRarity = !this.rarities(planet.type).has(planet.rarity)
    const epicPlus = planet.rarity === 'epic' || planet.rarity === 'legendary'
    this.state = {
      planets: [...this.state.planets, planet],
      sinceEpic: epicPlus ? 0 : this.state.sinceEpic + 1,
    }
    this.storage.set(KEY, this.state)
    this.onChange.emit()
    return { newType, newRarity }
  }
}
