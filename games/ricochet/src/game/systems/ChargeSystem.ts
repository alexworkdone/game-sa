import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

export class ChargeSystem {
  modules = 0

  private units = 0

  get fillRatio(): number {
    return clamp(this.units / BALANCE.charge.unitsPerModule, 0, 1)
  }

  get percent(): number {
    return Math.round(this.fillRatio * 100)
  }

  add(amount: number = BALANCE.charge.unitsPerCatch): boolean {
    this.units += amount
    if (this.units < BALANCE.charge.unitsPerModule) return false
    this.units -= BALANCE.charge.unitsPerModule
    this.modules += 1
    return true
  }

  reset(): void {
    this.units = 0
    this.modules = 0
  }
}
