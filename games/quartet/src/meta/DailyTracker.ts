import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'
import type { IDaySeed } from './DaySeed.js'

export interface DailyResult {
  readonly won: boolean
  readonly stars: number
  readonly mistakes: number
}

interface DailyState {
  readonly results: Record<string, DailyResult>
  readonly lastDay: string | null
  readonly streak: number
  readonly best: number
}

const KEY = 'v1.daily'
const DAY_MS = 86_400_000

export class DailyTracker {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private readonly seeds: IDaySeed
  private state: DailyState

  constructor(storage: IStorage, seeds: IDaySeed) {
    this.storage = storage
    this.seeds = seeds
    this.state = storage.get<DailyState>(KEY, { results: {}, lastDay: null, streak: 0, best: 0 })
  }

  get today(): string {
    return this.seeds.isoDate(new Date())
  }

  get seed(): string {
    return this.seeds.seedFor(new Date())
  }

  get dayNumber(): number {
    return this.seeds.dayNumber(new Date())
  }

  get msUntilNext(): number {
    return this.seeds.millisUntilNextDay(new Date())
  }

  get streak(): number {
    const { lastDay, streak } = this.state
    if (lastDay === this.today || lastDay === this.yesterday()) return streak
    return 0
  }

  get bestStreak(): number {
    return this.state.best
  }

  resultFor(day: string = this.today): DailyResult | null {
    return this.state.results[day] ?? null
  }

  get doneToday(): boolean {
    return this.resultFor() !== null
  }

  complete(result: DailyResult): boolean {
    const day = this.today
    if (this.state.results[day]) return false
    const continues = this.state.lastDay === this.yesterday()
    const streak = result.won ? (continues ? this.state.streak + 1 : 1) : 0
    this.state = {
      results: { ...this.state.results, [day]: result },
      lastDay: result.won ? day : this.state.lastDay,
      streak,
      best: Math.max(this.state.best, streak),
    }
    this.storage.set(KEY, this.state)
    this.onChange.emit()
    return true
  }

  private yesterday(): string {
    return this.seeds.isoDate(new Date(Date.now() - DAY_MS))
  }
}
