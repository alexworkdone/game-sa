import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'

interface RecordsState {
  readonly rounds: number
  readonly totalInk: number
  readonly best: Readonly<Record<string, number>>
}

const KEY = 'v1.records'

const freshState = (): RecordsState => ({ rounds: 0, totalInk: 0, best: {} })

const readBest = (value: unknown): Record<string, number> => {
  const best: Record<string, number> = {}
  if (!value || typeof value !== 'object') return best
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const amount = Number(raw)
    if (Number.isFinite(amount) && amount > 0) best[key] = Math.round(amount)
  }
  return best
}

export class Records {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: RecordsState

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = storage.get<Partial<Record<keyof RecordsState, unknown>> | null>(KEY, null)
    this.state = saved
      ? {
          rounds: Math.max(0, Math.round(Number(saved.rounds) || 0)),
          totalInk: Math.max(0, Math.round(Number(saved.totalInk) || 0)),
          best: readBest(saved.best),
        }
      : freshState()
  }

  get rounds(): number {
    return this.state.rounds
  }

  get totalInk(): number {
    return this.state.totalInk
  }

  best(key: string): number {
    return this.state.best[key] ?? 0
  }

  entries(): [string, number][] {
    return Object.entries(this.state.best).sort((a, b) => b[1] - a[1])
  }

  submit(key: string, gained: number): boolean {
    const record = gained > 0 && gained > this.best(key)
    this.commit({
      rounds: this.state.rounds + 1,
      totalInk: this.state.totalInk + gained,
      best: record ? { ...this.state.best, [key]: gained } : this.state.best,
    })
    return record
  }

  reset(): void {
    this.commit(freshState())
  }

  private commit(next: RecordsState): void {
    this.state = next
    this.storage.set(KEY, next)
    this.onChange.emit()
  }
}
