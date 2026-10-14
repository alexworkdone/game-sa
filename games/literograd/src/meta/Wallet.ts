import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'

const KEY = 'v1.ink'

export const STARTING_INK = 30

export class Wallet {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private ink: number

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = storage.get<number>(KEY, STARTING_INK)
    this.ink = Number.isFinite(saved) ? Math.max(0, Math.round(saved)) : STARTING_INK
  }

  get balance(): number {
    return this.ink
  }

  canAfford(amount: number): boolean {
    return this.ink >= amount
  }

  add(amount: number): void {
    if (amount <= 0) return
    this.commit(this.ink + Math.round(amount))
  }

  spend(amount: number): boolean {
    if (!this.canAfford(amount)) return false
    this.commit(this.ink - amount)
    return true
  }

  reset(amount = STARTING_INK): void {
    this.commit(amount)
  }

  private commit(next: number): void {
    this.ink = next
    this.storage.set(KEY, next)
    this.onChange.emit()
  }
}
