import type { IRandom } from '@sa/core'
import type { Enemy } from '../../entities/Enemy.js'
import type { Hero } from '../../entities/Hero.js'
import type { Water } from '../../entities/Water.js'
import type { PowerUps } from '../PowerUps.js'
import type { TileMap } from '../../level/TileMap.js'
import type { HurtCause, WorldListener } from '../World.js'

export interface HazardHost {
  readonly map: TileMap
  readonly tierRows: readonly number[]
  readonly hero: Hero
  readonly water: Water
  readonly enemies: readonly Enemy[]
  readonly random: IRandom
  readonly listener: WorldListener
  readonly powerUps: PowerUps
  readonly active: boolean
  hurtHero(cause: HurtCause): void
  hurtEnemy(enemy: Enemy, amount: number): void
}

export interface IHazard {
  update(dt: number, host: HazardHost): void
}
