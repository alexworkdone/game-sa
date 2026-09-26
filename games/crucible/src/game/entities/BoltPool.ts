import type { ElementId } from '../data/elements.js'

export interface Bolt {
  active: boolean
  element: ElementId
  fromX: number
  fromY: number
  progress: number
  duration: number
}

export class BoltPool {
  private readonly pool: Bolt[] = []

  get items(): readonly Bolt[] {
    return this.pool
  }

  get flying(): number {
    let count = 0
    for (const bolt of this.pool) if (bolt.active) count += 1
    return count
  }

  launch(element: ElementId, fromX: number, fromY: number, duration: number): void {
    const free = this.pool.find((bolt) => !bolt.active)
    const bolt =
      free ?? { active: false, element, fromX, fromY, progress: 0, duration }
    bolt.active = true
    bolt.element = element
    bolt.fromX = fromX
    bolt.fromY = fromY
    bolt.progress = 0
    bolt.duration = Math.max(0.05, duration)
    if (!free) this.pool.push(bolt)
  }

  holds(id: ElementId): number {
    let count = 0
    for (const bolt of this.pool) if (bolt.active && bolt.element === id) count += 1
    return count
  }

  update(dt: number, onArrive: (element: ElementId) => void): void {
    for (const bolt of this.pool) {
      if (!bolt.active) continue
      bolt.progress += dt / bolt.duration
      if (bolt.progress >= 1) {
        bolt.active = false
        onArrive(bolt.element)
      }
    }
  }

  clear(): void {
    for (const bolt of this.pool) bolt.active = false
  }
}
