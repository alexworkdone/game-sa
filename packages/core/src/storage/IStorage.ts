export interface IStorage {
  readonly persistent: boolean
  has(key: string): boolean
  get<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): boolean
  remove(key: string): void
  clear(): void
  keys(): string[]
}
