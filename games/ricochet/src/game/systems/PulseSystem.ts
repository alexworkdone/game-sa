import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Field } from '../entities/Field.js'

interface Pulse {
  active: boolean
  lane: number
  distance: number
}

export class PulseSystem {
  private readonly pool: Pulse[]
  private cursor = 0

  constructor(capacity = 24) {
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      lane: 0,
      distance: 0,
    }))
  }

  spawn(lane: number, distance: number): void {
    const pulse = this.pool[this.cursor] as Pulse
    this.cursor = (this.cursor + 1) % this.pool.length
    pulse.active = true
    pulse.lane = lane
    pulse.distance = distance
  }

  update(dt: number, onArrive: (lane: number) => void): void {
    for (const pulse of this.pool) {
      if (!pulse.active) continue
      pulse.distance -= BALANCE.charge.pulseSpeed * dt
      if (pulse.distance > BALANCE.core.radius) continue
      pulse.active = false
      onArrive(pulse.lane)
    }
  }

  render(renderer: IRenderer, field: Field): void {
    for (const pulse of this.pool) {
      if (!pulse.active) continue
      const head = field.lanePoint(pulse.lane, pulse.distance)
      const tail = field.lanePoint(pulse.lane, pulse.distance + 26)
      renderer.line(tail.x, tail.y, head.x, head.y, 4, {
        stroke: PALETTE.friendly,
        alpha: 0.75,
        glow: PALETTE.friendly,
        glowSize: 12,
      })
      renderer.circle(head.x, head.y, 4, {
        fill: PALETTE.ink,
        glow: PALETTE.friendly,
        glowSize: 10,
      })
    }
  }

  clear(): void {
    for (const pulse of this.pool) pulse.active = false
  }
}
