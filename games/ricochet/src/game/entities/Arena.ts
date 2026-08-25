import { BALANCE } from '../config/balance.js'

export class Arena {
  centerX = 0
  centerY = 0
  radius = 0

  resize(width: number, height: number): void {
    this.centerX = width / 2
    this.centerY = height / 2
    this.radius = Math.min(width, height) * BALANCE.arena.radiusRatio
  }

  get shieldOrbit(): number {
    return this.radius * BALANCE.shield.orbitRatio
  }

  pointAt(angle: number, distance: number): { x: number; y: number } {
    return {
      x: this.centerX + Math.cos(angle) * distance,
      y: this.centerY + Math.sin(angle) * distance,
    }
  }

  angleTo(x: number, y: number): number {
    return Math.atan2(y - this.centerY, x - this.centerX)
  }

  distanceFromCenter(x: number, y: number): number {
    return Math.hypot(x - this.centerX, y - this.centerY)
  }
}
