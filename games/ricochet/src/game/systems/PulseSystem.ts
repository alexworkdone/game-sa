import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { VeinNetwork } from './VeinNetwork.js'

interface Pulse {
  active: boolean
  lane: number
  travelled: number
  energy: number
}

const TAIL_STEPS = 6

export class PulseSystem {
  private readonly veins: VeinNetwork
  private readonly pool: Pulse[]
  private cursor = 0

  constructor(veins: VeinNetwork, capacity = 24) {
    this.veins = veins
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      lane: 0,
      travelled: 0,
      energy: 0,
    }))
  }

  spawn(lane: number, energy: number): void {
    const pulse = this.pool[this.cursor] as Pulse
    this.cursor = (this.cursor + 1) % this.pool.length
    pulse.active = true
    pulse.lane = lane
    pulse.travelled = 0
    pulse.energy = energy
  }

  update(dt: number, onArrive: (lane: number, energy: number) => void): void {
    for (const pulse of this.pool) {
      if (!pulse.active) continue
      pulse.travelled += BALANCE.charge.pulseSpeed * dt
      if (pulse.travelled < this.veins.length(pulse.lane)) continue
      pulse.active = false
      onArrive(pulse.lane, pulse.energy)
    }
  }

  render(renderer: IRenderer): void {
    for (const pulse of this.pool) {
      if (!pulse.active) continue
      const tail = 30
      for (let i = 0; i < TAIL_STEPS; i++) {
        const from = pulse.travelled - (tail * (i + 1)) / TAIL_STEPS
        const to = pulse.travelled - (tail * i) / TAIL_STEPS
        if (to <= 0) continue
        const a = this.veins.pointAt(pulse.lane, Math.max(0, from))
        const b = this.veins.pointAt(pulse.lane, to)
        const fade = 1 - i / TAIL_STEPS
        renderer.line(a.x, a.y, b.x, b.y, 2 + fade * 2, {
          stroke: PALETTE.friendly,
          alpha: fade * 0.75,
          glow: PALETTE.friendly,
          glowSize: 10 * fade,
        })
      }
      const head = this.veins.pointAt(pulse.lane, pulse.travelled)
      renderer.circle(head.x, head.y, 3.5, {
        fill: PALETTE.ink,
        glow: PALETTE.friendly,
        glowSize: 12,
      })
    }
  }

  clear(): void {
    for (const pulse of this.pool) pulse.active = false
  }
}
