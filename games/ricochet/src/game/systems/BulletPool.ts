import type { IRenderer } from '@sa/core'
import { TAU } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import { Bullet } from '../entities/Bullet.js'

export class BulletPool {
  private readonly pool: Bullet[]

  constructor(size: number = BALANCE.bullet.poolSize) {
    this.pool = Array.from({ length: size }, () => new Bullet())
  }

  get items(): readonly Bullet[] {
    return this.pool
  }

  get activeCount(): number {
    let count = 0
    for (const bullet of this.pool) if (bullet.active) count++
    return count
  }

  spawn(lane: number, x: number, y: number, vx: number, vy: number): Bullet | null {
    for (const bullet of this.pool) {
      if (bullet.active) continue
      bullet.launch(lane, x, y, vx, vy)
      return bullet
    }
    return null
  }

  advance(dt: number): void {
    for (const bullet of this.pool) {
      if (bullet.active) bullet.advance(dt)
    }
  }

  clear(): void {
    for (const bullet of this.pool) bullet.active = false
  }

  render(renderer: IRenderer): void {
    for (const bullet of this.pool) {
      if (!bullet.active) continue
      const radius = bullet.radius * bullet.spawnFade

      renderer.line(bullet.prevX, bullet.prevY, bullet.x, bullet.y, radius * 1.4, {
        stroke: PALETTE.hostile,
        alpha: 0.3,
      })

      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * TAU
        const length = BALANCE.bullet.sparkLength * (0.5 + Math.random() * 0.6)
        renderer.line(
          bullet.x,
          bullet.y,
          bullet.x + Math.cos(angle) * length,
          bullet.y + Math.sin(angle) * length,
          1.4,
          { stroke: PALETTE.hostile, alpha: 0.45 },
        )
      }

      renderer.circle(bullet.x, bullet.y, radius, {
        fill: PALETTE.hostile,
        glow: PALETTE.hostile,
        glowSize: 14,
      })
      renderer.circle(bullet.x, bullet.y, radius * 0.42, { fill: PALETTE.ink, alpha: 0.92 })
    }
  }
}
