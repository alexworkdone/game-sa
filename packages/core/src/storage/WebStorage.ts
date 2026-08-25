import type { IStorage } from './IStorage.js'
import { MemoryStorage } from './MemoryStorage.js'

export class WebStorage implements IStorage {
  readonly persistent: boolean
  private readonly namespace: string
  private readonly backend: Storage | null
  private readonly fallback = new MemoryStorage()

  constructor(namespace: string, backend: Storage | null = WebStorage.probe()) {
    this.namespace = namespace
    this.backend = backend
    this.persistent = backend !== null
  }

  static probe(): Storage | null {
    try {
      const probeKey = '__sa_probe__'
      window.localStorage.setItem(probeKey, '1')
      window.localStorage.removeItem(probeKey)
      return window.localStorage
    } catch {
      return null
    }
  }

  private prefixed(key: string): string {
    return `${this.namespace}:${key}`
  }

  has(key: string): boolean {
    if (!this.backend) return this.fallback.has(key)
    try {
      return this.backend.getItem(this.prefixed(key)) !== null
    } catch {
      return this.fallback.has(key)
    }
  }

  get<T>(key: string, fallback: T): T {
    if (!this.backend) return this.fallback.get(key, fallback)
    try {
      const raw = this.backend.getItem(this.prefixed(key))
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return this.fallback.get(key, fallback)
    }
  }

  set<T>(key: string, value: T): boolean {
    this.fallback.set(key, value)
    if (!this.backend) return false
    try {
      this.backend.setItem(this.prefixed(key), JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  remove(key: string): void {
    this.fallback.remove(key)
    try {
      this.backend?.removeItem(this.prefixed(key))
    } catch {
      /* storage unavailable */
    }
  }

  clear(): void {
    this.fallback.clear()
    if (!this.backend) return
    try {
      for (const key of this.keys()) this.backend.removeItem(this.prefixed(key))
    } catch {
      /* storage unavailable */
    }
  }

  keys(): string[] {
    if (!this.backend) return this.fallback.keys()
    try {
      const prefix = `${this.namespace}:`
      const found: string[] = []
      for (let i = 0; i < this.backend.length; i++) {
        const key = this.backend.key(i)
        if (key?.startsWith(prefix)) found.push(key.slice(prefix.length))
      }
      return found
    } catch {
      return this.fallback.keys()
    }
  }
}
