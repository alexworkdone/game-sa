import type { IStorage } from '@sa/core'

export type RunOutcome = 'destroyed' | 'extracted'

export interface RunResult {
  readonly energy: number
  readonly catches: number
  readonly partsThisRun: number
  readonly outcome: RunOutcome
  readonly durationMs: number
}

export interface RunSummary extends RunResult {
  readonly best: number
  readonly streak: number
  readonly isPersonalBest: boolean
}

const KEY_BEST = 'bestEnergy'
const KEY_STREAK = 'streak'
const KEY_LAST_PLAYED = 'lastPlayed'

export class RunRecords {
  private readonly storage: IStorage
  constructor(storage: IStorage) {
    this.storage = storage
  }

  private static isoDate(date: Date): string {
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')
    return `${date.getUTCFullYear()}-${month}-${day}`
  }

  get best(): number {
    return this.storage.get(KEY_BEST, 0)
  }

  get streak(): number {
    return this.storage.get(KEY_STREAK, 0)
  }

  submit(result: RunResult, date: Date = new Date()): RunSummary {
    const today = RunRecords.isoDate(date)
    const previousBest = this.best
    const best = Math.max(previousBest, result.energy)
    this.storage.set(KEY_BEST, best)

    const lastPlayed = this.storage.get(KEY_LAST_PLAYED, '')
    let streak = this.streak
    if (lastPlayed !== today) {
      const yesterday = RunRecords.isoDate(new Date(date.getTime() - 86_400_000))
      streak = lastPlayed === yesterday ? streak + 1 : 1
      this.storage.set(KEY_STREAK, streak)
      this.storage.set(KEY_LAST_PLAYED, today)
    }

    return {
      ...result,
      best,
      streak,
      isPersonalBest: result.energy > previousBest && result.energy > 0,
    }
  }
}
