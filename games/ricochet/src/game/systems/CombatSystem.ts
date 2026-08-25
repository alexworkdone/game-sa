import { BALANCE } from '../config/balance.js'
import type { Bullet } from '../entities/Bullet.js'
import type { Field } from '../entities/Field.js'
import { Paddle } from '../entities/Paddle.js'
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
    const antennaHalf = Paddle.antennaLength / 2
    const reachOut = antennaHalf
    const reachIn = antennaHalf + BALANCE.paddle.catchGrace

    for (const bullet of this.bullets.items) {
      if (!bullet.active) continue
      const distance = this.field.distanceFromPivot(bullet.x, bullet.y)

      if (this.container.alive) {
        if (
          bullet.lane === this.paddle.lane &&
          distance <= orbit + reachOut + bullet.radius &&
          distance >= orbit - reachIn - bullet.radius
        ) {
          bullet.kill()
          this.paddle.registerImpact()
          this.listener.onAbsorb(bullet, orbit)
          continue
        }

        if (distance <= this.container.impactRadius + bullet.radius) {
          bullet.kill()
          if (this.container.takeDamage()) this.listener.onContainerHit(bullet)
          continue
        }
      }

      const outward =
        (bullet.x - this.field.pivotX) * bullet.vx +
          (bullet.y - this.field.pivotY) * bullet.vy >
        0
      if (outward && distance > this.field.outerRadius * 1.35) bullet.kill()
    }
  }
}
