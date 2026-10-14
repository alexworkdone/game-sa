import { ringDelta } from '../level/Ring.js'
import type { TileMap } from '../level/TileMap.js'
import { Enemy } from './Enemy.js'
import type { EnemyWorld } from './Enemy.js'

const FALL_SPEED = 280

export abstract class GridWalker extends Enemy {
  protected cell = 0
  protected target = -1
  protected falling = false
  protected climbing = false

  override place(map: TileMap, c: number, r: number): void {
    super.place(map, c, r)
    this.cell = map.index(c, r)
    this.target = -1
  }

  protected think(dt: number, world: EnemyWorld): void {
    const map = world.map
    if (this.target < 0) {
      this.target = this.pickTarget(world)
      if (this.target < 0) {
        this.moving = false
        return
      }
    }
    const goal = map.cellOf(this.target)
    const goalX = map.centerX(goal.c)
    const goalY = map.feetY(goal.r)
    const speed = this.falling ? FALL_SPEED : this.speed * this.speedFactor(world)
    const budget = speed * dt
    const dx = ringDelta(this.x, goalX, map.width)
    const dy = goalY - this.y
    const distance = Math.hypot(dx, dy)
    this.moving = true
    if (dx !== 0) this.facing = dx > 0 ? 1 : -1
    if (distance <= budget) {
      this.x = goalX
      this.y = goalY
      this.cell = this.target
      this.target = -1
      return
    }
    this.x = map.wrapX(this.x + (dx / distance) * budget)
    this.y += (dy / distance) * budget
  }

  private pickTarget(world: EnemyWorld): number {
    const map = world.map
    const { c, r } = map.cellOf(this.cell)
    this.falling = false
    this.climbing = false
    if (!map.isLadder(c, r) && !map.isSupport(c, r + 1)) {
      if (map.isSolid(c, r + 1)) return -1
      this.falling = true
      return map.index(c, r + 1)
    }
    const next = this.chooseNext(world, c, r)
    if (next >= 0) this.climbing = map.cellOf(next).c === c
    return next
  }

  protected speedFactor(_world: EnemyWorld): number {
    return 1
  }

  protected patrol(map: TileMap, c: number, r: number): number {
    for (let attempt = 0; attempt < 2; attempt++) {
      const nc = c + this.facing
      if (!map.isSolid(nc, r) && map.isSupport(nc, r + 1)) return map.index(nc, r)
      this.facing = this.facing === 1 ? -1 : 1
    }
    return -1
  }

  protected abstract chooseNext(world: EnemyWorld, c: number, r: number): number
}
