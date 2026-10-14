import { BALANCE } from '../config/balance.js'
import type { EnemyDef, EnemyWorld } from './Enemy.js'
import { GridWalker } from './GridWalker.js'

export class Octopus extends GridWalker {
  readonly kind = 'octopus' as const
  readonly inky: boolean

  swimming = false
  private inkTimer: number = BALANCE.octopusInk.interval * 0.5

  constructor(def: EnemyDef, speedScale: number, inky = false) {
    super(def, speedScale)
    this.inky = inky
  }

  get isClimbing(): boolean {
    return this.climbing && this.moving
  }

  protected override think(dt: number, world: EnemyWorld): void {
    this.swimming = this.centerY > world.waterLevel
    super.think(dt, world)
    if (!this.inky || !this.swimming) return
    this.inkTimer -= dt
    if (this.inkTimer > 0) return
    this.inkTimer = BALANCE.octopusInk.interval
    world.spillInk(this.x, this.centerY)
  }

  protected override speedFactor(): number {
    return this.inky && this.swimming ? BALANCE.octopusInk.swimBoost : 1
  }

  protected chooseNext(world: EnemyWorld, c: number, r: number): number {
    if (world.hero.alive) {
      const next = world.nav.nextStep(this.cell, world.chaseField)
      if (next >= 0) return next
    }
    return this.patrol(world.map, c, r)
  }
}
