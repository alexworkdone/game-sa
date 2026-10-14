import type { IStorage } from '@sa/core'

interface LimitState {
  readonly day: string
  readonly used: number
}

export class DailyLimit {
  private readonly storage: IStorage
  private readonly key: string
  private readonly limit: number
  private readonly today: () => string

  constructor(storage: IStorage, key: string, limit: number, today: () => string) {
    this.storage = storage
    this.key = key
    this.limit = limit
    this.today = today
  }

  get remaining(): number {
    const state = this.storage.get<LimitState | null>(this.key, null)
    const used = state?.day === this.today() ? state.used : 0
    return Math.max(0, this.limit - used)
  }

  consume(): boolean {
    const remaining = this.remaining
    if (remaining <= 0) return false
    this.storage.set(this.key, { day: this.today(), used: this.limit - remaining + 1 })
    return true
  }
}
