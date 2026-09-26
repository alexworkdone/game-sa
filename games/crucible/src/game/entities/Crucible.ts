import type { ElementId } from '../data/elements.js'

export type CruciblePhase = 'idle' | 'resolving' | 'crafted' | 'fizzled'

export const MAX_SLOTS = 3

export class Crucible {
  readonly slots: ElementId[] = []

  phase: CruciblePhase = 'idle'
  timer = 0
  elapsed = 0
  flash = 0
  shake = 0
  result: ElementId | null = null
  freshResult = false

  private reserved = 0

  get filled(): number {
    return this.slots.length
  }

  get free(): number {
    return MAX_SLOTS - this.slots.length - this.reserved
  }

  get isEmpty(): boolean {
    return this.slots.length === 0 && this.reserved === 0
  }

  reserve(): boolean {
    if (this.free <= 0 || this.phase !== 'idle') return false
    this.reserved += 1
    return true
  }

  receive(id: ElementId): void {
    if (this.reserved > 0) this.reserved -= 1
    if (this.slots.length < MAX_SLOTS) this.slots.push(id)
  }

  holds(id: ElementId): number {
    let count = 0
    for (const slot of this.slots) if (slot === id) count += 1
    return count
  }

  enter(phase: CruciblePhase, timer: number): void {
    this.phase = phase
    this.timer = timer
    this.elapsed = 0
  }

  take(id: ElementId): boolean {
    const index = this.slots.lastIndexOf(id)
    if (index < 0) return false
    this.slots.splice(index, 1)
    return true
  }

  clear(): void {
    this.slots.length = 0
    this.reserved = 0
    this.phase = 'idle'
    this.timer = 0
    this.elapsed = 0
    this.result = null
    this.freshResult = false
  }

  update(dt: number): void {
    this.elapsed += dt
    if (this.timer > 0) this.timer = Math.max(0, this.timer - dt)
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2)
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.6)
  }
}
