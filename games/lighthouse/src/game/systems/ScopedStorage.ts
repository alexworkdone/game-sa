import type { IStorage } from '@sa/core'

export class ScopedStorage implements IStorage {
  readonly persistent: boolean
  private readonly base: IStorage
  private readonly prefix: string

  constructor(base: IStorage, prefix: string) {
    this.base = base
    this.prefix = prefix
    this.persistent = base.persistent
  }

  has(key: string): boolean {
    return this.base.has(this.prefix + key)
  }

  get<T>(key: string, fallback: T): T {
    return this.base.get(this.prefix + key, fallback)
  }

  set<T>(key: string, value: T): boolean {
    return this.base.set(this.prefix + key, value)
  }

  remove(key: string): void {
    this.base.remove(this.prefix + key)
  }

  clear(): void {
    for (const key of this.keys()) this.remove(key)
  }

  keys(): string[] {
    return this.base
      .keys()
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.slice(this.prefix.length))
  }
}
