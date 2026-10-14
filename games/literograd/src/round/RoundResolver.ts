import type { Perks } from '../meta/Perks.js'
import type { Records } from '../meta/Records.js'
import type { Wallet } from '../meta/Wallet.js'
import type { RoundStats } from './RoundSession.js'
import type { Variant } from './Variant.js'

export interface RoundReport {
  readonly stats: RoundStats
  readonly variant: Variant
  readonly accuracy: number
  readonly accuracyBonus: number
  readonly millBonus: number
  readonly millLevel: number
  readonly bookBonus: number
  readonly booksDone: number
  readonly gained: number
  readonly record: boolean
  readonly grade: number
}

const ACCURACY_THRESHOLD = 0.9
const ACCURACY_MIN_HITS = 10
const ACCURACY_BONUS = 0.2
const EXPECTED_SECONDS_PER_HIT = 1.3
const ACCURACY_WEIGHT = 0.65
const PACE_WEIGHT = 0.35
const MAX_GRADE = 12

export class RoundResolver {
  private readonly wallet: Wallet
  private readonly records: Records
  private readonly perks: Perks

  constructor(wallet: Wallet, records: Records, perks: Perks) {
    this.wallet = wallet
    this.records = records
    this.perks = perks
  }

  settle(stats: RoundStats, variant: Variant): RoundReport {
    const attempts = stats.correct + stats.wrong
    const accuracy = attempts > 0 ? stats.correct / attempts : 0
    const accuracyBonus = accuracy >= ACCURACY_THRESHOLD && stats.correct >= ACCURACY_MIN_HITS ? ACCURACY_BONUS : 0
    const millBonus = this.perks.millBonus
    const bookBonus = this.perks.bookBonus
    const gained = Math.round(stats.earned * (1 + accuracyBonus + millBonus + bookBonus))
    this.wallet.add(gained)
    const record = this.records.submit(variant.key, gained)
    return {
      stats,
      variant,
      accuracy,
      accuracyBonus,
      millBonus,
      millLevel: this.perks.millLevel,
      bookBonus,
      booksDone: this.perks.booksDone,
      gained,
      record,
      grade: this.grade(stats, accuracy, attempts),
    }
  }

  private grade(stats: RoundStats, accuracy: number, attempts: number): number {
    if (attempts === 0) return 1
    const seconds = Math.max(1, stats.elapsedMs / 1000)
    const pace = Math.min(1, stats.correct / (seconds / EXPECTED_SECONDS_PER_HIT))
    const score = accuracy * ACCURACY_WEIGHT + pace * PACE_WEIGHT
    return Math.max(1, Math.min(MAX_GRADE, Math.round(score * MAX_GRADE)))
  }
}
