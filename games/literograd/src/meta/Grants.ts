import type { IStorage } from '@sa/core'

const KEY = 'v1.grants'

export class Grants {
  private readonly storage: IStorage
  private claimed: Set<string>

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = storage.get<unknown>(KEY, [])
    this.claimed = new Set(Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : [])
  }

  has(id: string): boolean {
    return this.claimed.has(id)
  }

  claim(id: string): boolean {
    if (this.claimed.has(id)) return false
    this.claimed.add(id)
    this.storage.set(KEY, [...this.claimed])
    return true
  }
}
