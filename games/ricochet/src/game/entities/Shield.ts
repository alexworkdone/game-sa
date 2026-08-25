import type { IRenderer } from '@sa/core'
import { angleDelta, clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Arena } from './Arena.js'
import type { Bullet } from './Bullet.js'

export interface DeflectResult {
  readonly x: number
  readonly y: number
  readonly offset: number
}

export class Shield {
  angle = -Math.PI / 2
  targetAngle = -Math.PI / 2

  private impact = 0

  reset(): void {
    this.angle = -Math.PI / 2
    this.targetAngle = -Math.PI / 2
    this.impact = 0
  }

  setTargetAngle(angle: number): void {
    this.targetAngle = angle
  }

  rotateBy(delta: number): void {
    this.targetAngle += delta
  }

  update(dt: number): void {
    const delta = angleDelta(this.angle, this.targetAngle)
    const maxStep = BALANCE.shield.maxAngularSpeed * dt
    this.angle += clamp(delta, -maxStep, maxStep)
    this.impact = Math.max(0, this.impact - dt * 4)
  }

  get normalX(): number {
    return Math.cos(this.angle)
  }

  get normalY(): number {
    return Math.sin(this.angle)
  }

  tryDeflect(bullet: Bullet, arena: Arena): DeflectResult | null {
    const nx = this.normalX
    const ny = this.normalY
    const tx = -ny
    const ty = nx

    const orbit = arena.shieldOrbit
    const plateX = arena.centerX + nx * orbit
    const plateY = arena.centerY + ny * orbit

    const dx = bullet.x - plateX
    const dy = bullet.y - plateY
    const along = dx * tx + dy * ty
    const across = dx * nx + dy * ny

    const halfLength = BALANCE.shield.length / 2 + bullet.radius * 0.5
    const halfThickness = BALANCE.shield.thickness / 2 + bullet.radius
    if (Math.abs(along) > halfLength || Math.abs(across) > halfThickness) return null

    const approach = bullet.vx * nx + bullet.vy * ny
    if (approach >= 0) return null

    const speed = Math.hypot(bullet.vx, bullet.vy)
    const reflectedX = bullet.vx - 2 * approach * nx
    const reflectedY = bullet.vy - 2 * approach * ny
    const length = Math.hypot(reflectedX, reflectedY) || 1

    bullet.vx = (reflectedX / length) * speed * BALANCE.bullet.chargedSpeedMultiplier
    bullet.vy = (reflectedY / length) * speed * BALANCE.bullet.chargedSpeedMultiplier
    bullet.x = plateX + nx * (halfThickness + 1) + tx * along
    bullet.y = plateY + ny * (halfThickness + 1) + ty * along

    this.impact = 1
    return { x: bullet.x, y: bullet.y, offset: along / halfLength }
  }

  render(renderer: IRenderer, arena: Arena): void {
    const nx = this.normalX
    const ny = this.normalY
    const tx = -ny
    const ty = nx
    const orbit = arena.shieldOrbit
    const plateX = arena.centerX + nx * orbit
    const plateY = arena.centerY + ny * orbit
    const half = BALANCE.shield.length / 2
    const thickness = BALANCE.shield.thickness + this.impact * 5

    renderer.line(
      plateX - tx * half,
      plateY - ty * half,
      plateX + tx * half,
      plateY + ty * half,
      thickness,
      {
        stroke: PALETTE.ink,
        glow: PALETTE.friendly,
        glowSize: 10 + this.impact * 26,
      },
    )

    renderer.line(
      plateX - tx * half * 0.94,
      plateY - ty * half * 0.94,
      plateX + tx * half * 0.94,
      plateY + ty * half * 0.94,
      Math.max(1, thickness * 0.28),
      { stroke: PALETTE.friendly, alpha: 0.65 + this.impact * 0.35 },
    )
  }
}
