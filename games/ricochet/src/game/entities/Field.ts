import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

export interface Point {
  readonly x: number
  readonly y: number
}

export class Field {
  pivotX = 0
  pivotY = 0
  outerRadius = 0

  readonly laneCount = BALANCE.field.laneCount

  readonly fanAngle = (BALANCE.field.fanDegrees * Math.PI) / 180

  resize(width: number, height: number): void {
    this.pivotX = width / 2
    this.pivotY = height - BALANCE.field.bottomMargin

    const byHeight = this.pivotY - BALANCE.field.topMargin
    const byWidth =
      (width / 2 - BALANCE.field.sideMargin) / Math.sin(this.fanAngle / 2)
    this.outerRadius = Math.max(60, Math.min(byWidth, byHeight))
  }

  get fanStart(): number {
    return -Math.PI / 2 - this.fanAngle / 2
  }

  get paddleOrbit(): number {
    return this.outerRadius * BALANCE.field.paddleOrbitRatio
  }

  get laneSpan(): number {
    return this.fanAngle / this.laneCount
  }

  laneAngle(index: number): number {
    return this.fanStart + (index + 0.5) * this.laneSpan
  }

  lanePoint(index: number, distance: number): Point {
    const angle = this.laneAngle(index)
    return {
      x: this.pivotX + Math.cos(angle) * distance,
      y: this.pivotY + Math.sin(angle) * distance,
    }
  }

  pointAt(angle: number, distance: number): Point {
    return {
      x: this.pivotX + Math.cos(angle) * distance,
      y: this.pivotY + Math.sin(angle) * distance,
    }
  }

  nearestLane(x: number, y: number): number {
    const dx = x - this.pivotX
    const angle = Math.atan2(y - this.pivotY, dx)
    if (angle >= 0) return dx < 0 ? 0 : this.laneCount - 1
    const normalized = (angle - this.fanStart) / this.fanAngle
    return clamp(Math.floor(normalized * this.laneCount), 0, this.laneCount - 1)
  }

  distanceFromPivot(x: number, y: number): number {
    return Math.hypot(x - this.pivotX, y - this.pivotY)
  }
}
