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

  resize(width: number, height: number): void {
    const available = height - BALANCE.field.topMargin - BALANCE.field.bottomMargin
    this.outerRadius = Math.max(
      40,
      Math.min(width * BALANCE.field.radiusWidthRatio, available),
    )
    this.pivotX = width / 2
    this.pivotY = Math.min(
      height - BALANCE.field.bottomMargin,
      (height + this.outerRadius) / 2 + this.outerRadius * 0.1,
    )
  }

  get paddleOrbit(): number {
    return this.outerRadius * BALANCE.field.paddleOrbitRatio
  }

  get laneSpan(): number {
    return Math.PI / this.laneCount
  }

  laneAngle(index: number): number {
    return -Math.PI + (index + 0.5) * this.laneSpan
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
    let angle = Math.atan2(y - this.pivotY, x - this.pivotX)
    if (angle > 0) angle = angle > Math.PI / 2 ? -Math.PI : 0
    const normalized = (angle + Math.PI) / Math.PI
    return clamp(Math.floor(normalized * this.laneCount), 0, this.laneCount - 1)
  }

  distanceFromPivot(x: number, y: number): number {
    return Math.hypot(x - this.pivotX, y - this.pivotY)
  }
}
