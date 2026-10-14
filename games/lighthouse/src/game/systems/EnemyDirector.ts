import type { IRandom } from '@sa/core'
import { BALANCE, maxAliveEnemies, spawnInterval } from '../config/balance.js'
import type { Enemy } from '../entities/Enemy.js'
import type { IEnemyFactory } from '../entities/EnemyFactory.js'
import type { EnemyKind } from '../level/LevelBlueprint.js'
import { ringDistance } from '../level/Ring.js'
import type { TileMap } from '../level/TileMap.js'

export interface DirectorView {
  readonly map: TileMap
  readonly tierRows: readonly number[]
  readonly waterLevel: number
  readonly heroX: number
  readonly heroY: number
  readonly aliveEnemies: number
}

export class EnemyDirector {
  private readonly factory: IEnemyFactory
  private readonly random: IRandom
  private readonly floor: number
  private readonly tier: number
  private timer: number

  constructor(factory: IEnemyFactory, random: IRandom, floor: number, tier: number) {
    this.factory = factory
    this.random = random
    this.floor = floor
    this.tier = tier
    this.timer = spawnInterval(floor) * 0.8
  }

  update(dt: number, view: DirectorView): Enemy | null {
    this.timer -= dt
    if (this.timer > 0) return null
    this.timer = spawnInterval(this.floor) * this.random.float(0.85, 1.15)
    if (view.aliveEnemies >= maxAliveEnemies(this.floor)) return null
    const kind = this.pickKind()
    return kind === 'jelly' ? this.spawnSwimmer(view) : this.spawnWalker(kind, view)
  }

  private pickKind(): EnemyKind {
    const options: { value: EnemyKind; weight: number }[] = [{ value: 'crab', weight: 6 }]
    if (this.floor >= BALANCE.enemies.jelly.fromFloor) options.push({ value: 'jelly', weight: 2 })
    if (this.floor >= BALANCE.enemies.octopus.fromFloor) options.push({ value: 'octopus', weight: 3 })
    return this.random.weighted(options)
  }

  private spawnSwimmer(view: DirectorView): Enemy {
    const map = view.map
    const enemy = this.factory.create('jelly', this.floor, this.tier)
    enemy.x = map.wrapX(view.heroX + map.width / 2 + this.random.float(-120, 120))
    enemy.y = Math.min(map.height - map.tile, view.waterLevel + 30)
    enemy.startEmerging(BALANCE.director.emergeTime)
    return enemy
  }

  private spawnWalker(kind: EnemyKind, view: DirectorView): Enemy | null {
    const map = view.map
    const heroCol = map.colAt(view.heroX)
    const tiers = [...view.tierRows].sort((a, b) => b - a)
    for (const tierRow of tiers) {
      if (tierRow * map.tile > view.waterLevel - 4) continue
      const r = tierRow - 1
      const sameTier = Math.abs(map.feetY(r) - view.heroY) < 4
      const options: number[] = []
      for (let c = 0; c < map.cols; c++) {
        if (!map.canStand(c, r) || map.isLadder(c, r)) continue
        if (sameTier && ringDistance(c, heroCol, map.cols) < 6) continue
        options.push(c)
      }
      if (options.length === 0) continue
      const enemy = this.factory.create(kind, this.floor, this.tier)
      enemy.place(map, this.random.pick(options), r)
      enemy.startEmerging(BALANCE.director.emergeTime)
      return enemy
    }
    return null
  }
}
