import type { IRandom } from '@sa/core'
import type { EnemyKind } from '../level/LevelBlueprint.js'
import type { NavGrid } from '../level/NavGrid.js'
import type { TileMap } from '../level/TileMap.js'

export interface EnemyDef {
  readonly hp: number
  readonly speed: number
  readonly pearls: number
  readonly width: number
  readonly height: number
}

export type CarrierLoot = 'key' | 'shell'

export interface EnemyTarget {
  readonly x: number
  readonly y: number
  readonly centerY: number
  readonly alive: boolean
  readonly inWater: boolean
}

export interface EnemyWorld {
  readonly map: TileMap
  readonly nav: NavGrid
  readonly chaseField: Int16Array
  readonly hero: EnemyTarget
  readonly random: IRandom
  readonly waterLevel: number
  fireSpine(x: number, y: number, direction: 1 | -1): void
  fireInk(x: number, y: number, angle: number): void
  shock(x: number, y: number, radius: number): void
  spillInk(x: number, y: number): void
}

let nextEnemyId = 1

export abstract class Enemy {
  abstract readonly kind: EnemyKind

  readonly id = nextEnemyId++
  readonly width: number
  readonly height: number
  readonly maxHp: number
  readonly pearls: number
  readonly speed: number
  readonly isBoss: boolean = false

  x = 0
  y = 0
  hp: number
  alive = true
  facing: 1 | -1 = 1
  flash = 0
  age = 0
  emerge = 0
  frozen = 0
  moving = false
  loot: CarrierLoot | null = null
  lootValue = 0

  constructor(def: EnemyDef, speedScale: number) {
    this.width = def.width
    this.height = def.height
    this.maxHp = def.hp
    this.hp = def.hp
    this.pearls = def.pearls
    this.speed = def.speed * speedScale
  }

  get centerY(): number {
    return this.y - this.height / 2
  }

  get canBeHit(): boolean {
    return this.emerge <= 0
  }

  get canHurt(): boolean {
    return this.emerge <= 0 && this.frozen <= 0
  }

  protected get frostShare(): number {
    return 1
  }

  freeze(seconds: number): void {
    this.frozen = Math.max(this.frozen, seconds * this.frostShare)
    this.moving = false
  }

  place(map: TileMap, c: number, r: number): void {
    this.x = map.centerX(c)
    this.y = map.feetY(r)
  }

  startEmerging(duration: number): void {
    this.emerge = duration
  }

  damage(amount: number): boolean {
    if (!this.alive || !this.canBeHit) return false
    this.hp -= amount
    this.flash = 0.12
    if (this.hp <= 0) this.alive = false
    return true
  }

  update(dt: number, world: EnemyWorld): void {
    this.age += dt
    this.flash = Math.max(0, this.flash - dt)
    if (this.emerge > 0) {
      this.emerge = Math.max(0, this.emerge - dt)
      return
    }
    if (this.frozen > 0) {
      this.frozen = Math.max(0, this.frozen - dt)
      return
    }
    this.think(dt, world)
  }

  protected abstract think(dt: number, world: EnemyWorld): void
}
