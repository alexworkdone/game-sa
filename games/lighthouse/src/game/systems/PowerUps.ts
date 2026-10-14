import { POWER_UPS, TIMED_POWER_UPS } from '../config/powerups.js'
import type { TimedPowerUp } from '../config/powerups.js'

export type { TimedPowerUp } from '../config/powerups.js'

export class PowerUps {
  private readonly timers = new Map<TimedPowerUp, number>(TIMED_POWER_UPS.map((kind) => [kind, 0]))
  private readonly durationScale: number

  constructor(durationScale = 1) {
    this.durationScale = durationScale
  }

  duration(kind: TimedPowerUp): number {
    return POWER_UPS[kind].duration * this.durationScale
  }

  activate(kind: TimedPowerUp): void {
    this.timers.set(kind, this.duration(kind))
  }

  active(kind: TimedPowerUp): boolean {
    return this.remaining(kind) > 0
  }

  remaining(kind: TimedPowerUp): number {
    return this.timers.get(kind) ?? 0
  }

  fraction(kind: TimedPowerUp): number {
    return this.remaining(kind) / this.duration(kind)
  }

  update(dt: number): TimedPowerUp[] {
    const expired: TimedPowerUp[] = []
    for (const [kind, time] of this.timers) {
      if (time <= 0) continue
      const next = Math.max(0, time - dt)
      this.timers.set(kind, next)
      if (next === 0) expired.push(kind)
    }
    return expired
  }

  list(): TimedPowerUp[] {
    return TIMED_POWER_UPS.filter((kind) => this.active(kind))
  }

  clear(): void {
    for (const kind of this.timers.keys()) this.timers.set(kind, 0)
  }
}
