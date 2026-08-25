import type { DailySeed, IStorage } from '@sa/core'

export interface RunResult {
  readonly score: number
  readonly catches: number
  readonly bestCombo: number
  readonly durationMs: number
  readonly daily: boolean
  readonly dayNumber: number
}

export interface RunSummary extends RunResult {
  readonly best: number
  readonly dailyBest: number
  readonly streak: number
  readonly isPersonalBest: boolean
}

const KEY_BEST = 'best'
const KEY_DAILY_BEST = 'dailyBest'
const KEY_DAILY_DATE = 'dailyDate'
const KEY_STREAK = 'streak'
const KEY_LAST_PLAYED = 'lastPlayed'

export class RunRecords {
  private readonly storage: IStorage
  private readonly dailySeed: DailySeed

  constructor(storage: IStorage, dailySeed: DailySeed) {
    this.storage = storage
    this.dailySeed = dailySeed
  }

  get best(): number {
    return this.storage.get(KEY_BEST, 0)
  }

  get streak(): number {
    return this.storage.get(KEY_STREAK, 0)
  }

  dailyBest(date: Date = new Date()): number {
    const today = this.dailySeed.isoDate(date)
    if (this.storage.get(KEY_DAILY_DATE, '') !== today) return 0
    return this.storage.get(KEY_DAILY_BEST, 0)
  }

  submit(result: RunResult, date: Date = new Date()): RunSummary {
    const today = this.dailySeed.isoDate(date)
    const previousBest = this.best
    const best = Math.max(previousBest, result.score)
    this.storage.set(KEY_BEST, best)

    let dailyBest = this.dailyBest(date)
    if (result.daily) {
      dailyBest = Math.max(dailyBest, result.score)
      this.storage.set(KEY_DAILY_DATE, today)
      this.storage.set(KEY_DAILY_BEST, dailyBest)
    }

    const lastPlayed = this.storage.get(KEY_LAST_PLAYED, '')
    let streak = this.streak
    if (lastPlayed !== today) {
      const yesterday = this.dailySeed.isoDate(new Date(date.getTime() - 86_400_000))
      streak = lastPlayed === yesterday ? streak + 1 : 1
      this.storage.set(KEY_STREAK, streak)
      this.storage.set(KEY_LAST_PLAYED, today)
    }

    return {
      ...result,
      best,
      dailyBest,
      streak,
      isPersonalBest: result.score > previousBest && result.score > 0,
    }
  }
}
