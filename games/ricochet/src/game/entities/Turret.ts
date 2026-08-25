import type { IRenderer } from '@sa/core'
import { Ease } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Arena } from './Arena.js'

export type TurretPhase = 'idle' | 'telegraph' | 'fired'

export class Turret {
  angle = 0
  x = 0
  y = 0
  alive = false
  cooldown: number = BALANCE.waves.baseCooldown
  burstsLeft = 0
  burstGap = 0.16

  private fireTimer = 0
  private spawnProgress = 0
  private recoil = 0

  place(angle: number, arena: Arena, firstDelay: number, cooldown: number): void {
    this.angle = angle
    this.alive = true
    this.cooldown = cooldown
    this.fireTimer = firstDelay
    this.spawnProgress = 0
    this.recoil = 0
    this.burstsLeft = 0
    this.syncPosition(arena)
  }

  syncPosition(arena: Arena): void {
    const point = arena.pointAt(this.angle, arena.radius)
    this.x = point.x
    this.y = point.y
  }

  get spawning(): boolean {
    return this.spawnProgress < 1
  }

  get charging(): boolean {
    return this.fireTimer <= BALANCE.turret.telegraph
  }

  get chargeRatio(): number {
    if (!this.charging) return 0
    return 1 - Math.max(0, this.fireTimer) / BALANCE.turret.telegraph
  }

  update(dt: number): TurretPhase {
    if (!this.alive) return 'idle'
    this.recoil = Math.max(0, this.recoil - dt * 6)

    if (this.spawnProgress < 1) {
      this.spawnProgress = Math.min(1, this.spawnProgress + dt / BALANCE.turret.spawnRise)
      return 'idle'
    }

    const wasCharging = this.charging
    this.fireTimer -= dt
    if (this.fireTimer <= 0) {
      if (this.burstsLeft > 0) {
        this.burstsLeft -= 1
        this.fireTimer = this.burstGap
      } else {
        this.fireTimer = this.cooldown
      }
      this.recoil = 1
      return 'fired'
    }
    return !wasCharging && this.charging ? 'telegraph' : 'idle'
  }

  kill(): void {
    this.alive = false
  }

  render(renderer: IRenderer, arena: Arena): void {
    if (!this.alive) return
    const rise = Ease.outBack(this.spawnProgress)
    const radius = BALANCE.turret.radius * rise
    if (radius <= 0.5) return

    const inward = -BALANCE.turret.recoil * this.recoil
    const x = this.x + Math.cos(this.angle) * -inward
    const y = this.y + Math.sin(this.angle) * -inward
    const charge = this.chargeRatio

    if (charge > 0) {
      renderer.circle(x, y, radius * (1.6 + charge * 1.4), {
        fill: PALETTE.hostile,
        alpha: 0.08 + charge * 0.22,
      })
    }

    const tx = -Math.sin(this.angle)
    const ty = Math.cos(this.angle)
    const barrelLength = radius * 1.5
    renderer.line(
      x,
      y,
      x - Math.cos(this.angle) * barrelLength,
      y - Math.sin(this.angle) * barrelLength,
      radius * 0.55,
      { stroke: PALETTE.hostile, alpha: 0.55 + charge * 0.45 },
    )

    renderer.polygon(
      [
        x + tx * radius,
        y + ty * radius,
        x - tx * radius,
        y - ty * radius,
        x - Math.cos(this.angle) * radius * 1.1,
        y - Math.sin(this.angle) * radius * 1.1,
      ],
      {
        fill: PALETTE.hostile,
        ...(charge > 0.5 ? { glow: PALETTE.hostile, glowSize: charge * 22 } : {}),
      },
    )

    renderer.circle(x, y, radius * 0.34, {
      fill: charge > 0 ? PALETTE.ink : PALETTE.background,
      alpha: 0.5 + charge * 0.5,
    })
  }
}
