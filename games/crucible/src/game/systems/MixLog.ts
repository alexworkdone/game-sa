import type { IStorage } from '@sa/core'
import type { ElementId } from '../data/elements.js'

const STORAGE_KEY = 'failedMixes'

const keyOf = (ids: readonly ElementId[]): string => [...ids].sort().join('+')

export class MixLog {
  private readonly storage: IStorage
  private readonly failed: Set<string>

  constructor(storage: IStorage) {
    this.storage = storage
    this.failed = new Set(this.storage.get<string[]>(STORAGE_KEY, []))
  }

  has(ids: readonly ElementId[]): boolean {
    return ids.length >= 2 && this.failed.has(keyOf(ids))
  }

  addFailure(ids: readonly ElementId[]): void {
    if (ids.length < 2) return
    this.failed.add(keyOf(ids))
    this.storage.set(STORAGE_KEY, [...this.failed])
  }
}
