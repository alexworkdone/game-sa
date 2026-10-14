import type { CarrierLoot, EnemyDef, EnemyWorld } from './Enemy.js'
import { GridWalker } from './GridWalker.js'

export interface CrabOptions {
  readonly big?: boolean
  readonly loot?: CarrierLoot
  readonly lootValue?: number
}

export class Crab extends GridWalker {
  readonly kind = 'crab' as const
  readonly big: boolean

  constructor(def: EnemyDef, speedScale: number, options: CrabOptions = {}) {
    super(def, speedScale)
    this.big = options.big ?? false
    this.loot = options.loot ?? null
    this.lootValue = options.lootValue ?? 0
  }

  protected chooseNext(world: EnemyWorld, c: number, r: number): number {
    return this.patrol(world.map, c, r)
  }
}
