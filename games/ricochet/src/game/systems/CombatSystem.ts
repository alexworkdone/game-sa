import { BALANCE } from '../config/balance.js'
import type { Bullet } from '../entities/Bullet.js'
import type { Field } from '../entities/Field.js'
import type { Paddle } from '../entities/Paddle.js'
import type { PlayerCore } from '../entities/PlayerCore.js'
import type { BulletPool } from './BulletPool.js'
import type { ChargeSystem } from './ChargeSystem.js'

export interface CombatListener {
  onAbsorb(bullet: Bullet, distance: number): void
  onShieldSave(bullet: Bullet): void
  onCoreHit(bullet: Bullet): void
}

export interface CombatDependencies {
  readonly field: Field
  readonly core: PlayerCore
  readonly paddle: Paddle
  readonly bullets: BulletPool
  readonly charge: ChargeSystem
  readonly listener: CombatListener
}

export class CombatSystem {
  private readonly field: Field
  private readonly core: PlayerCore
  private readonly paddle: Paddle
  private readonly bullets: BulletPool
  private readonly charge: ChargeSystem
  private readonly listener: CombatListener

  constructor(dependencies: CombatDependencies) {
    this.field = dependencies.field
    this.core = dependencies.core
    this.paddle = dependencies.paddle
    this.bullets = dependencies.bullets
    this.charge = dependencies.charge
    this.listener = dependencies.listener
  }

  update(dt: number): void {
    this.bullets.advance(dt)

    const orbit = this.field.paddleOrbit
    const band = BALANCE.paddle.thickness / 2

    for (const bullet of this.bullets.items) {
      if (!bullet.active) continue
      const distance = this.field.distanceFromPivot(bullet.x, bullet.y)
      const reach = band + bullet.radius

      if (
        bullet.lane === this.paddle.lane &&
        distance <= orbit + reach &&
        distance >= orbit - reach
      ) {
        bullet.kill()
        this.paddle.registerImpact()
        this.listener.onAbsorb(bullet, orbit)
        continue
      }

      if (distance <= BALANCE.core.radius + bullet.radius) {
        bullet.kill()
        if (this.charge.consume()) {
          this.listener.onShieldSave(bullet)
          continue
        }
        if (this.core.takeDamage()) this.listener.onCoreHit(bullet)
      }
    }
  }
}
