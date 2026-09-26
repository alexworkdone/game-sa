import { ELEMENTS } from '../data/elements.js'
import type { ElementDef, ElementId } from '../data/elements.js'
import type { CategoryId } from '../data/categories.js'

export class ElementRegistry {
  private readonly byId = new Map<ElementId, ElementDef>()
  private readonly order = new Map<ElementId, number>()

  constructor(defs: readonly ElementDef[] = ELEMENTS) {
    defs.forEach((def, index) => {
      this.byId.set(def.id, def)
      this.order.set(def.id, index)
    })
  }

  get total(): number {
    return this.byId.size
  }

  get(id: ElementId): ElementDef {
    const def = this.byId.get(id)
    if (!def) throw new Error(`ElementRegistry: unknown element "${id}"`)
    return def
  }

  totalIn(category: CategoryId): number {
    let count = 0
    for (const def of this.byId.values()) if (def.category === category) count += 1
    return count
  }

  rank(id: ElementId): number {
    return this.order.get(id) ?? Number.MAX_SAFE_INTEGER
  }
}
