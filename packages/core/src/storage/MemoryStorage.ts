import type { IStorage } from './IStorage.js'

export class MemoryStorage implements IStorage {
  readonly persistent = false
  private readonly map = new Map<string, unknown>()

  has(key: string): boolean {
    return this.map.has(key)
  }

  get<T>(key: string, fallback: T): T {
    return this.map.has(key) ? (this.map.get(key) as T) : fallback
  }

  set<T>(key: string, value: T): boolean {
    this.map.set(key, value)
    return true
  }

  remove(key: string): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  keys(): string[] {
    return [...this.map.keys()]
  }
}
