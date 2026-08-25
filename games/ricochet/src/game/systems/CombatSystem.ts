import { BALANCE } from '../config/balance.js'
import type { Bullet } from '../entities/Bullet.js'
import type { Field } from '../entities/Field.js'
import type { Paddle } from '../entities/Paddle.js'
import type { Container } from '../entities/Container.js'
import type { BulletPool } from './BulletPool.js'

export interface CombatListener {
  onAbsorb(bullet: Bullet, distance: number): void
  onContainerHit(bullet: Bullet): void
}

export interface CombatDependencies {
  readonly field: Field
  readonly container: Container
  readonly paddle: Paddle
  readonly bullets: BulletPool
  readonly listener: CombatListener
}

export class CombatSystem {
  private readonly field: Field
  private readonly container: Container
  private readonly paddle: Paddle
  private readonly bullets: BulletPool
  private readonly listener: CombatListener

  constructor(dependencies: CombatDependencies) {
    this.field = dependencies.field
    this.container = dependencies.container
    this.paddle = dependencies.paddle
    this.bullets = dependencies.bullets
    this.listener = dependencies.listener
  }

  update(dt: number): void {
    this.bullets.advance(dt)

    const orbit = this.field.paddleOrbit
    const band = BALANCE.paddle.screenHeight / 2

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

      if (distance <= BALANCE.container.radius + bullet.radius) {
        bullet.kill()
        if (this.container.takeDamage()) this.listener.onContainerHit(bullet)
      }
    }
  }
}
