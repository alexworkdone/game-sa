import type { Tier } from '../content/CategoryData.js'
import type { ParticleColor } from '../shared/ParticleColor.js'

export interface PuzzleGroup {
  readonly categoryId: string
  readonly title: string
  readonly tier: Tier
  readonly color: ParticleColor
  readonly words: readonly string[]
}

export interface Puzzle {
  readonly id: string
  readonly groups: readonly PuzzleGroup[]
  readonly tiles: readonly string[]
  readonly decoys: number
}

export interface DecoyRange {
  readonly min: number
  readonly max: number
}

export interface PuzzleRequest {
  readonly seed: string
  readonly slots: readonly (readonly string[])[]
  readonly decoys: DecoyRange
}

export interface IPuzzleGenerator {
  generate(request: PuzzleRequest): Puzzle | null
}
