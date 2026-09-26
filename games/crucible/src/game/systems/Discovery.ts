import type { IStorage } from '@sa/core'
import { BASE_ELEMENTS } from '../data/elements.js'
import type { ElementDef, ElementId } from '../data/elements.js'
import type { CategoryId } from '../data/categories.js'
import type { ElementRegistry } from './ElementRegistry.js'

const STORAGE_KEY = 'discovered'

export class Discovery {
  private readonly storage: IStorage
  private readonly registry: ElementRegistry
  private readonly found = new Set<ElementId>()
  private readonly crafted: ElementId[] = []
  private cache: ElementDef[] = []

  constructor(storage: IStorage, registry: ElementRegistry) {
    this.storage = storage
    this.registry = registry
    const saved = this.storage.get<ElementId[]>(STORAGE_KEY, [])
    const bases = BASE_ELEMENTS as readonly ElementId[]
    for (const id of [...bases, ...saved]) {
      if (this.registry.rank(id) >= Number.MAX_SAFE_INTEGER) continue
      if (!this.found.has(id) && !bases.includes(id)) this.crafted.push(id)
      this.found.add(id)
    }
    this.rebuild()
  }

  get count(): number {
    return this.found.size
  }

  get total(): number {
    return this.registry.total
  }

  get list(): readonly ElementDef[] {
    return this.cache
  }

  get history(): readonly ElementId[] {
    return this.crafted
  }

  get order(): readonly ElementId[] {
    const bases = (BASE_ELEMENTS as readonly ElementId[]).filter((id) => this.found.has(id))
    return [...bases, ...this.crafted]
  }

  countIn(category: CategoryId): number {
    let count = 0
    for (const def of this.cache) if (def.category === category) count += 1
    return count
  }

  has(id: ElementId): boolean {
    return this.found.has(id)
  }

  indexOf(id: ElementId): number {
    return this.cache.findIndex((def) => def.id === id)
  }

  add(id: ElementId): boolean {
    if (this.found.has(id)) return false
    this.found.add(id)
    this.crafted.push(id)
    this.rebuild()
    this.storage.set(STORAGE_KEY, [...this.found])
    return true
  }

  private rebuild(): void {
    this.cache = [...this.found]
      .sort((a, b) => this.registry.rank(a) - this.registry.rank(b))
      .map((id) => this.registry.get(id))
  }
}
