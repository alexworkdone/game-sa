import { BALANCE } from '../config/balance.js'

export type BulletFaction = 'hostile' | 'charged'

export class Bullet {
  active = false
  x = 0
  y = 0
  prevX = 0
  prevY = 0
  vx = 0
  vy = 0
  radius = BALANCE.bullet.radius
  faction: BulletFaction = 'hostile'
  life = 0
  bounces = 0
  chainKills = 0
  spawnFade = 0

  launch(x: number, y: number, vx: number, vy: number): void {
    this.active = true
    this.x = x
    this.y = y
    this.prevX = x
    this.prevY = y
    this.vx = vx
    this.vy = vy
    this.radius = BALANCE.bullet.radius
    this.faction = 'hostile'
    this.life = 0
    this.bounces = 0
    this.chainKills = 0
    this.spawnFade = 0
  }

  charge(): void {
    this.faction = 'charged'
    this.life = 0
    this.bounces = 0
    this.chainKills = 0
  }

  advance(dt: number): void {
    this.prevX = this.x
    this.prevY = this.y
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.life += dt
    this.spawnFade = Math.min(1, this.spawnFade + dt * 8)
  }

  kill(): void {
    this.active = false
  }

  get speed(): number {
    return Math.hypot(this.vx, this.vy)
  }
}
