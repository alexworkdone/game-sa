import { SeededRandom } from '@sa/core'
import type { Tier } from '../content/CategoryData.js'
import type { ICategoryBank } from '../content/CategoryBank.js'
import type { IPuzzleSource } from './IPuzzleSource.js'
import type { ILevelSchedule } from './LevelSchedule.js'
import type { IPuzzleGenerator, Puzzle } from './Puzzle.js'

const TIERS: readonly Tier[] = [1, 2, 3, 4]

export class LevelPuzzleSource implements IPuzzleSource<number> {
  private readonly bank: ICategoryBank
  private readonly generator: IPuzzleGenerator
  private readonly schedule: ILevelSchedule
  private readonly salt: string
  private readonly cache = new Map<number, Puzzle>()
  private readonly orders = new Map<string, readonly string[]>()

  constructor(
    bank: ICategoryBank,
    generator: IPuzzleGenerator,
    schedule: ILevelSchedule,
    salt = 'quartet:levels',
  ) {
    this.bank = bank
    this.generator = generator
    this.schedule = schedule
    this.salt = salt
  }

  get(level: number): Puzzle {
    const cached = this.cache.get(level)
    if (cached) return cached
    const profile = this.schedule.profile(level)
    const cursors = this.cursorsBefore(level)
    const seen = new Map<Tier, number>()
    const slots = profile.tiers.map((tier) => {
      const repeat = seen.get(tier) ?? 0
      seen.set(tier, repeat + 1)
      return this.rotation(tier, (cursors.get(tier) ?? 0) + repeat)
    })
    const puzzle =
      this.generator.generate({ seed: `${this.salt}:${level}`, slots, decoys: profile.decoys }) ??
      this.generator.generate({
        seed: `${this.salt}:${level}:relaxed`,
        slots,
        decoys: { min: 0, max: 16 },
      })
    if (!puzzle) throw new Error(`Level ${level}: no valid puzzle`)
    this.cache.set(level, puzzle)
    return puzzle
  }

  private cursorsBefore(level: number): Map<Tier, number> {
    const cursors = new Map<Tier, number>(TIERS.map((tier) => [tier, 0]))
    for (let previous = 1; previous < level; previous++) {
      for (const tier of this.schedule.profile(previous).tiers) {
        cursors.set(tier, (cursors.get(tier) ?? 0) + 1)
      }
    }
    return cursors
  }

  private rotation(tier: Tier, cursor: number): readonly string[] {
    const size = this.bank.byTier(tier).length
    if (size === 0) return []
    const cycle = Math.floor(cursor / size)
    const order = this.order(tier, cycle)
    const start = cursor % size
    return [...order.slice(start), ...order.slice(0, start)]
  }

  private order(tier: Tier, cycle: number): readonly string[] {
    const key = `${tier}:${cycle}`
    const cached = this.orders.get(key)
    if (cached) return cached
    const random = new SeededRandom(`${this.salt}:tier${tier}:cycle${cycle}`)
    const order = random.shuffle(this.bank.byTier(tier).map((category) => category.id))
    this.orders.set(key, order)
    return order
  }
}
