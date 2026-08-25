import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

export class ChargeSystem {
  segments = 0

  private units = 0

  get fillRatio(): number {
    return clamp(this.units / BALANCE.charge.unitsPerSegment, 0, 1)
  }

  get isFull(): boolean {
    return this.segments >= BALANCE.charge.maxSegments
  }

  add(amount: number = BALANCE.charge.unitsPerCatch): boolean {
    if (this.isFull) {
      this.units = 0
      return false
    }
    this.units += amount
    if (this.units < BALANCE.charge.unitsPerSegment) return false
    this.units -= BALANCE.charge.unitsPerSegment
    this.segments = Math.min(BALANCE.charge.maxSegments, this.segments + 1)
    if (this.isFull) this.units = 0
    return true
  }

  consume(): boolean {
    this.units = 0
    if (this.segments <= 0) return false
    this.segments -= 1
    return true
  }

  reset(): void {
    this.units = 0
    this.segments = 0
  }
}
