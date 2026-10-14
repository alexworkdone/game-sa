import type { Tier } from '../content/CategoryData.js'
import type { DecoyRange } from './Puzzle.js'

export interface LevelProfile {
  readonly tiers: readonly [Tier, Tier, Tier, Tier]
  readonly decoys: DecoyRange
}

export interface ILevelSchedule {
  profile(level: number): LevelProfile
}

const LATE_ROTATION: readonly LevelProfile['tiers'][] = [
  [1, 2, 3, 4],
  [2, 3, 3, 4],
  [2, 2, 3, 4],
  [1, 3, 4, 4],
  [2, 3, 4, 4],
]

export class LevelSchedule implements ILevelSchedule {
  profile(level: number): LevelProfile {
    if (level <= 3) return { tiers: [1, 1, 2, 2], decoys: { min: 0, max: 0 } }
    if (level <= 8) return { tiers: [1, 2, 2, 3], decoys: { min: 0, max: 1 } }
    if (level <= 16) return { tiers: [1, 2, 3, 4], decoys: { min: 0, max: 2 } }
    if (level <= 30) return { tiers: [1, 2, 3, 4], decoys: { min: 1, max: 3 } }
    const tiers = LATE_ROTATION[level % LATE_ROTATION.length] ?? [1, 2, 3, 4]
    return { tiers, decoys: { min: 1, max: 4 } }
  }
}
