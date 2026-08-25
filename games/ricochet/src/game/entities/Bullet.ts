import { BALANCE } from '../config/balance.js'

export class Bullet {
  active = false
  lane = 0
  x = 0
  y = 0
  prevX = 0
  prevY = 0
  vx = 0
  vy = 0
  radius = BALANCE.bullet.radius
  life = 0
  spawnFade = 0
  energy = 0

  launch(lane: number, x: number, y: number, vx: number, vy: number): void {
    this.active = true
    this.lane = lane
    this.x = x
    this.y = y
    this.prevX = x
    this.prevY = y
    this.vx = vx
    this.vy = vy
    this.radius = BALANCE.bullet.radius
    this.life = 0
    this.spawnFade = 0
    this.energy = 0
  }

  advance(dt: number): void {
    this.prevX = this.x
    this.prevY = this.y
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.life += dt
    this.spawnFade = Math.min(1, this.spawnFade + dt * 7)
  }

  kill(): void {
    this.active = false
  }
}
