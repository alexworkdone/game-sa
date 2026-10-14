import { BALANCE } from '../config/balance.js'
import { ringDelta } from '../level/Ring.js'
import { Enemy } from './Enemy.js'
import type { EnemyWorld } from './Enemy.js'

export class Guardian extends Enemy {
  readonly kind = 'guardian' as const
  override readonly isBoss = true

  telegraph = 0
  private cooldown: number = BALANCE.guardian.interval
  private readonly burst: number
  private burstLeft = 0
  private burstTimer = 0

  constructor(def: ConstructorParameters<typeof Enemy>[0], floor: number) {
    super(def, 1)
    this.burst = floor >= BALANCE.guardian.burstFromFloor ? 3 : 1
  }

  protected override get frostShare(): number {
    return BALANCE.guardian.frostShare
  }

  protected think(dt: number, world: EnemyWorld): void {
    const hero = world.hero
    const dx = ringDelta(this.x, hero.x, world.map.width)
    const dy = hero.centerY - this.centerY
    if (Math.abs(dx) > 2) this.facing = dx > 0 ? 1 : -1
    if (this.burstLeft > 0) {
      this.burstTimer -= dt
      if (this.burstTimer > 0) return
      this.spit(world, dx, dy)
      return
    }
    if (this.telegraph > 0) {
      this.telegraph -= dt
      if (this.telegraph > 0) return
      this.telegraph = 0
      this.cooldown = BALANCE.guardian.interval
      this.burstLeft = this.burst
      this.spit(world, dx, dy)
      return
    }
    this.cooldown -= dt
    if (this.cooldown > 0) return
    const inSight = Math.hypot(dx, dy) < BALANCE.guardian.reach && dy <= BALANCE.guardian.maxDrop
    if (hero.alive && inSight) this.telegraph = BALANCE.guardian.telegraph
    else this.cooldown = 0.4
  }

  private spit(world: EnemyWorld, dx: number, dy: number): void {
    this.burstLeft -= 1
    this.burstTimer = BALANCE.guardian.burstGap
    const aim = Math.atan2(Math.min(0, dy), dx)
    world.fireInk(this.x + Math.cos(aim) * 18, this.centerY + Math.sin(aim) * 12, aim)
  }
}
