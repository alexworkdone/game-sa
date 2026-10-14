import { damp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { ringDelta } from '../level/Ring.js'
import type { EnemyDef, EnemyWorld } from './Enemy.js'
import { Enemy } from './Enemy.js'

export class Jelly extends Enemy {
  readonly kind = 'jelly' as const
  readonly shocking: boolean

  charge = 0
  zap = 0
  private cooldown: number = BALANCE.jellyShock.cooldown * 0.5
  private vx = 0
  private vy = 0

  constructor(def: EnemyDef, speedScale: number, shocking = false) {
    super(def, speedScale)
    this.shocking = shocking
  }

  get chargeProgress(): number {
    return this.charge > 0 ? 1 - this.charge / BALANCE.jellyShock.charge : 0
  }

  protected think(dt: number, world: EnemyWorld): void {
    const map = world.map
    const hero = world.hero
    this.zap = Math.max(0, this.zap - dt)
    if (this.shocking) this.updateShock(dt, world)
    let wantX = 0
    let wantY = 0
    if (hero.alive && this.charge <= 0) {
      const dx = ringDelta(this.x, hero.x, map.width)
      const dy = hero.centerY - this.centerY
      const distance = Math.hypot(dx, dy) || 1
      wantX = (dx / distance) * this.speed
      wantY = (dy / distance) * this.speed
    }
    this.vx = damp(this.vx, wantX, 0.25, dt)
    this.vy = damp(this.vy, wantY, 0.25, dt)
    const bob = Math.sin(this.age * 2.6) * 16
    this.x = map.wrapX(this.x + this.vx * dt)
    this.y += (this.vy + bob) * dt
    this.y = Math.max(map.tile + this.height, Math.min(map.height - map.tile, this.y))
    this.moving = true
    if (Math.abs(this.vx) > 2) this.facing = this.vx > 0 ? 1 : -1
  }

  private updateShock(dt: number, world: EnemyWorld): void {
    const shock = BALANCE.jellyShock
    if (this.charge > 0) {
      this.charge -= dt
      if (this.charge > 0) return
      this.charge = 0
      this.cooldown = shock.cooldown
      this.zap = shock.flash
      if (this.centerY > world.waterLevel) world.shock(this.x, this.centerY, shock.radius)
      return
    }
    this.cooldown -= dt
    if (this.cooldown > 0) return
    const hero = world.hero
    const inWater = this.centerY > world.waterLevel
    const near = Math.hypot(ringDelta(this.x, hero.x, world.map.width), hero.centerY - this.centerY) < shock.radius
    if (hero.alive && hero.inWater && inWater && near) this.charge = shock.charge
    else this.cooldown = 0.3
  }
}
