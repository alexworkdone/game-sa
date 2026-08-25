import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Field } from './Field.js'

export class PlayerCore {
  hp: number = BALANCE.core.maxHp

  private invulnerability = 0
  private hitFlash = 0
  private pulse = 0

  get alive(): boolean {
    return this.hp > 0
  }

  get invulnerable(): boolean {
    return this.invulnerability > 0
  }

  reset(): void {
    this.hp = BALANCE.core.maxHp
    this.invulnerability = 0
    this.hitFlash = 0
    this.pulse = 0
  }

  takeDamage(): boolean {
    if (this.invulnerability > 0 || !this.alive) return false
    this.hp -= 1
    this.invulnerability = BALANCE.core.invulnerability
    this.hitFlash = 1
    return true
  }

  update(dt: number): void {
    this.invulnerability = Math.max(0, this.invulnerability - dt)
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3.4)
    this.pulse += dt * BALANCE.core.pulseSpeed
  }

  render(renderer: IRenderer, field: Field): void {
    const { pivotX, pivotY } = field
    const breathing = 1 + Math.sin(this.pulse * Math.PI * 2) * 0.04
    const radius = BALANCE.core.radius * breathing
    const blinking = this.invulnerable && Math.floor(this.invulnerability * 12) % 2 === 0
    const color = this.hitFlash > 0.1 ? PALETTE.hostile : PALETTE.friendly

    renderer.circle(pivotX, pivotY, radius * 2.4, {
      fill: color,
      alpha: 0.07 + this.hitFlash * 0.2,
    })
    renderer.circle(pivotX, pivotY, radius, {
      fill: blinking ? PALETTE.surface : color,
      glow: color,
      glowSize: 18 + this.hitFlash * 30,
    })
    renderer.circle(pivotX, pivotY, radius * 0.42, { fill: PALETTE.background, alpha: 0.85 })

    const gap = 15
    for (let i = 0; i < BALANCE.core.maxHp; i++) {
      const x = pivotX + (i - (BALANCE.core.maxHp - 1) / 2) * gap
      renderer.circle(x, pivotY + radius * 1.9, 4.5, {
        fill: i < this.hp ? PALETTE.friendly : PALETTE.grid,
      })
    }
  }
}
