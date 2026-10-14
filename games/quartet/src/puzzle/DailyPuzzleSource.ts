import { SeededRandom } from '@sa/core'
import type { Tier } from '../content/CategoryData.js'
import type { ICategoryBank } from '../content/CategoryBank.js'
import type { IPuzzleSource } from './IPuzzleSource.js'
import type { IPuzzleGenerator, Puzzle } from './Puzzle.js'

const DAILY_TIERS: readonly Tier[] = [1, 2, 3, 4]

export class DailyPuzzleSource implements IPuzzleSource<string> {
  private readonly bank: ICategoryBank
  private readonly generator: IPuzzleGenerator
  private readonly cache = new Map<string, Puzzle>()

  constructor(bank: ICategoryBank, generator: IPuzzleGenerator) {
    this.bank = bank
    this.generator = generator
  }

  get(seed: string): Puzzle {
    const cached = this.cache.get(seed)
    if (cached) return cached
    const random = new SeededRandom(`${seed}:slots`)
    const slots = DAILY_TIERS.map((tier) =>
      random.shuffle(this.bank.byTier(tier).map((category) => category.id)),
    )
    const puzzle =
      this.generator.generate({ seed, slots, decoys: { min: 1, max: 3 } }) ??
      this.generator.generate({ seed: `${seed}:relaxed`, slots, decoys: { min: 0, max: 16 } })
    if (!puzzle) throw new Error(`Daily ${seed}: no valid puzzle`)
    this.cache.set(seed, puzzle)
    return puzzle
  }
}
