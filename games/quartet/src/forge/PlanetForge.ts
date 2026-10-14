import { SeededRandom } from '@sa/core'
import { PARTICLE_COLORS } from '../shared/ParticleColor.js'
import type { ParticleColor } from '../shared/ParticleColor.js'
import type { Planet, PlanetTypeId, Rarity } from './Planet.js'
import { PLANET_TYPES, RARITIES } from './Planet.js'
import type { IPlanetNamer } from './PlanetNamer.js'
import type { IRarityOdds, RarityWeights } from './RarityOdds.js'

export const PORTION_SIZE = 10
export const PORTIONS_PER_PLANET = 4
export const BLACKHOLE_CHANCE = 0.08

export interface ForgeRoll {
  readonly planet: Planet
  readonly weights: RarityWeights
}

export class PlanetForge {
  private readonly namer: IPlanetNamer
  private readonly odds: IRarityOdds
  private readonly entropy: () => number

  constructor(namer: IPlanetNamer, odds: IRarityOdds, entropy: () => number = Math.random) {
    this.namer = namer
    this.odds = odds
    this.entropy = entropy
  }

  resolveType(portions: readonly ParticleColor[]): PlanetTypeId {
    const dominant = PARTICLE_COLORS.filter(
      (color) => portions.filter((portion) => portion === color).length >= 2,
    )
    if (dominant.length === 0) return 'pearl'
    const match = PLANET_TYPES.find(
      (type) =>
        !type.secret &&
        type.recipe.length === dominant.length &&
        type.recipe.every((color) => dominant.includes(color)),
    )
    return match?.id ?? 'pearl'
  }

  weights(portions: readonly ParticleColor[], pity: boolean): RarityWeights {
    return this.odds.weights(portions, pity)
  }

  create(portions: readonly ParticleColor[], pity: boolean, now: number = Date.now()): ForgeRoll {
    const seed = Math.floor(this.entropy() * 0xffffffff) >>> 0
    const random = new SeededRandom(seed)
    const weights = this.weights(portions, pity)
    const rarity = random.weighted<Rarity>(
      RARITIES.map((value) => ({ value, weight: weights[value] })),
    )
    const allPurple = portions.every((color) => color === 'purple')
    const type: PlanetTypeId =
      allPurple && random.next() < BLACKHOLE_CHANCE ? 'blackhole' : this.resolveType(portions)
    const planet: Planet = {
      id: `${now.toString(36)}-${seed.toString(36)}`,
      seed,
      type,
      rarity,
      name: this.namer.name(random.fork('name')),
      portions: [...portions],
      createdAt: now,
    }
    return { planet, weights }
  }
}
