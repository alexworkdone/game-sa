import { BALANCE } from '../config/balance.js'
import { ringDelta } from '../level/Ring.js'
import type { EnemyWorld } from './Enemy.js'
import { GridWalker } from './GridWalker.js'

export class Urchin extends GridWalker {
  readonly kind = 'urchin' as const

  private cooldown: number = BALANCE.urchin.interval * 0.6
  telegraph = 0

  protected override think(dt: number, world: EnemyWorld): void {
    super.think(dt, world)
    if (this.telegraph > 0) {
      this.telegraph -= dt
      if (this.telegraph <= 0) {
        this.telegraph = 0
        this.cooldown = BALANCE.urchin.interval
        world.fireSpine(this.x + this.facing * this.width * 0.5, this.centerY, this.facing)
      }
      return
    }
    this.cooldown -= dt
    if (this.cooldown > 0) return
    const hero = world.hero
    const range = BALANCE.urchin.rangeCells * world.map.tile
    const dx = ringDelta(this.x, hero.x, world.map.width)
    if (hero.alive && Math.abs(hero.y - this.y) < 8 && Math.abs(dx) < range) {
      this.facing = dx > 0 ? 1 : -1
      this.telegraph = BALANCE.urchin.telegraph
    } else {
      this.cooldown = 0.35
    }
  }

  protected chooseNext(): number {
    return -1
  }
}
