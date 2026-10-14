import type { ParticleColor } from '../shared/ParticleColor.js'
import type { Rarity } from './Planet.js'

export type RarityWeights = Readonly<Record<Rarity, number>>

export interface IRarityOdds {
  weights(portions: readonly ParticleColor[], pity: boolean): RarityWeights
}

export class RarityOdds implements IRarityOdds {
  weights(portions: readonly ParticleColor[], pity: boolean): RarityWeights {
    if (pity) return { common: 0, rare: 0, epic: 80, legendary: 20 }
    const purple = portions.filter((color) => color === 'purple').length
    const pure = portions.length > 0 && portions.every((color) => color === portions[0])
    const legendary = 2 + purple * 0.75 + (pure ? 1.5 : 0)
    const epic = 10 + purple * 2 + (pure ? 4 : 0)
    const rare = 26 + (pure ? 6 : 0)
    return { common: 100 - legendary - epic - rare, rare, epic, legendary }
  }
}
