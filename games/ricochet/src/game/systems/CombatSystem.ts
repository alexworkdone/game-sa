import { BALANCE } from '../config/balance.js'
import type { Arena } from '../entities/Arena.js'
import type { Bullet } from '../entities/Bullet.js'
import type { PlayerCore } from '../entities/PlayerCore.js'
import type { Shield } from '../entities/Shield.js'
import type { Turret } from '../entities/Turret.js'
import type { BulletPool } from './BulletPool.js'
import type { TurretField } from './TurretField.js'

export interface CombatListener {
  onDeflect(bullet: Bullet, offset: number): void
  onWallBounce(bullet: Bullet): void
  onTurretDestroyed(turret: Turret, bullet: Bullet, chainIndex: number): void
  onBulletIntercepted(bullet: Bullet): void
  onCoreHit(x: number, y: number): void
}

export interface CombatDependencies {
  readonly arena: Arena
  readonly core: PlayerCore
  readonly shield: Shield
  readonly bullets: BulletPool
  readonly turrets: TurretField
  readonly listener: CombatListener
}

export class CombatSystem {
  private readonly arena: Arena
  private readonly core: PlayerCore
  private readonly shield: Shield
  private readonly bullets: BulletPool
  private readonly turrets: TurretField
  private readonly listener: CombatListener

  constructor(dependencies: CombatDependencies) {
    this.arena = dependencies.arena
    this.core = dependencies.core
    this.shield = dependencies.shield
    this.bullets = dependencies.bullets
    this.turrets = dependencies.turrets
    this.listener = dependencies.listener
  }

  update(dt: number): void {
    this.bullets.advance(dt)

    for (const bullet of this.bullets.items) {
      if (!bullet.active) continue

      if (bullet.faction === 'hostile') {
        const deflect = this.shield.tryDeflect(bullet, this.arena)
        if (deflect) {
          bullet.charge()
          this.listener.onDeflect(bullet, deflect.offset)
          continue
        }
        if (this.hitsCore(bullet)) {
          bullet.kill()
          if (this.core.takeDamage()) this.listener.onCoreHit(bullet.x, bullet.y)
          continue
        }
      }

      if (bullet.faction === 'charged') {
        if (bullet.life > BALANCE.bullet.chargedLifetime) {
          bullet.kill()
          continue
        }
        this.resolveCharged(bullet)
        if (!bullet.active) continue
      }

      this.resolveWall(bullet)
    }
  }

  private hitsCore(bullet: Bullet): boolean {
    const distance = this.arena.distanceFromCenter(bullet.x, bullet.y)
    return distance <= BALANCE.core.radius + bullet.radius
  }

  private resolveCharged(bullet: Bullet): void {
    for (const turret of this.turrets.items) {
      if (!turret.alive) continue
      const dx = turret.x - bullet.x
      const dy = turret.y - bullet.y
      const reach = BALANCE.turret.radius + bullet.radius
      if (dx * dx + dy * dy > reach * reach) continue

      turret.kill()
      this.listener.onTurretDestroyed(turret, bullet, bullet.chainKills)
      bullet.chainKills += 1
    }

    for (const other of this.bullets.items) {
      if (!other.active || other === bullet || other.faction !== 'hostile') continue
      const dx = other.x - bullet.x
      const dy = other.y - bullet.y
      const reach = other.radius + bullet.radius
      if (dx * dx + dy * dy > reach * reach) continue
      other.kill()
      this.listener.onBulletIntercepted(other)
    }
  }

  private resolveWall(bullet: Bullet): void {
    const dx = bullet.x - this.arena.centerX
    const dy = bullet.y - this.arena.centerY
    const distance = Math.hypot(dx, dy)
    const limit = this.arena.radius - bullet.radius
    if (distance <= limit) return

    if (bullet.faction === 'hostile') {
      bullet.kill()
      return
    }
    if (bullet.bounces >= BALANCE.bullet.maxWallBounces) {
      bullet.kill()
      return
    }

    const nx = dx / (distance || 1)
    const ny = dy / (distance || 1)
    const dot = bullet.vx * nx + bullet.vy * ny
    bullet.vx -= 2 * dot * nx
    bullet.vy -= 2 * dot * ny
    bullet.x = this.arena.centerX + nx * limit
    bullet.y = this.arena.centerY + ny * limit
    bullet.prevX = bullet.x
    bullet.prevY = bullet.y
    bullet.bounces += 1
    this.listener.onWallBounce(bullet)
  }
}
