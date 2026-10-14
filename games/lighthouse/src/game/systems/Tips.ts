import type { IStorage } from '@sa/core'
import type { PowerUpKind } from '../level/LevelBlueprint.js'

export type TipId = 'key' | 'door' | 'pearl' | 'air' | 'wrap' | `power.${PowerUpKind}`

export const powerTip = (kind: PowerUpKind): TipId => `power.${kind}`

const STORAGE_KEY = 'tips.v1'

export class Tips {
  private readonly storage: IStorage
  private readonly learned: Set<TipId>

  constructor(storage: IStorage) {
    this.storage = storage
    this.learned = new Set(storage.get<TipId[]>(STORAGE_KEY, []))
  }

  isLearned(id: TipId): boolean {
    return this.learned.has(id)
  }

  learn(id: TipId): void {
    if (this.learned.has(id)) return
    this.learned.add(id)
    this.storage.set(STORAGE_KEY, [...this.learned])
  }

  reset(): void {
    this.learned.clear()
    this.storage.set(STORAGE_KEY, [])
  }
}
