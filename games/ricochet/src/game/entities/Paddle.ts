import type { IRenderer } from '@sa/core'
import { Ease, angleDelta, clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Field } from './Field.js'

export class Paddle {
  lane = 0

  private displayAngle = 0
  private ghostAngle = 0
  private ghostFade = 0
  private impact = 0

  reset(field: Field): void {
    this.lane = Math.floor(field.laneCount / 2)
    this.displayAngle = field.laneAngle(this.lane)
    this.ghostFade = 0
    this.impact = 0
  }

  setLane(index: number, field: Field): boolean {
    const next = clamp(index, 0, field.laneCount - 1)
    if (next === this.lane) return false
    this.ghostAngle = this.displayAngle
    this.ghostFade = 1
    this.lane = next
    return true
  }

  step(delta: number, field: Field): boolean {
    return this.setLane(this.lane + delta, field)
  }

  registerImpact(): void {
    this.impact = 1
  }

  update(dt: number, field: Field): void {
    const target = field.laneAngle(this.lane)
    const remaining = angleDelta(this.displayAngle, target)
    const step = (dt / BALANCE.paddle.snapTime) * Math.abs(remaining)
    this.displayAngle += clamp(remaining, -step, step)
    this.ghostFade = Math.max(0, this.ghostFade - dt / BALANCE.paddle.ghostFade)
    this.impact = Math.max(0, this.impact - dt * 5)
  }

  private plateEnds(field: Field, angle: number): [number, number, number, number] {
    const orbit = field.paddleOrbit
    const half = (field.laneSpan * BALANCE.paddle.arcRatio) / 2
    const start = field.pointAt(angle - half, orbit)
    const end = field.pointAt(angle + half, orbit)
    return [start.x, start.y, end.x, end.y]
  }

  render(renderer: IRenderer, field: Field): void {
    const orbit = field.paddleOrbit
    const half = (field.laneSpan * BALANCE.paddle.arcRatio) / 2

    if (this.ghostFade > 0) {
      const fade = Ease.outQuad(this.ghostFade)
      renderer.arc(
        field.pivotX,
        field.pivotY,
        orbit,
        this.ghostAngle - half,
        this.ghostAngle + half,
        BALANCE.paddle.thickness * 0.7,
        { stroke: PALETTE.friendly, alpha: fade * 0.28 },
      )
    }

    const thickness = BALANCE.paddle.thickness + this.impact * 7
    renderer.arc(
      field.pivotX,
      field.pivotY,
      orbit,
      this.displayAngle - half,
      this.displayAngle + half,
      thickness,
      {
        stroke: PALETTE.ink,
        glow: PALETTE.friendly,
        glowSize: 12 + this.impact * 28,
      },
    )
    renderer.arc(
      field.pivotX,
      field.pivotY,
      orbit,
      this.displayAngle - half * 0.92,
      this.displayAngle + half * 0.92,
      Math.max(1, thickness * 0.3),
      { stroke: PALETTE.friendly, alpha: 0.7 + this.impact * 0.3 },
    )

    const arm = field.pointAt(this.displayAngle, orbit)
    renderer.line(field.pivotX, field.pivotY, arm.x, arm.y, 2, {
      stroke: PALETTE.friendly,
      alpha: 0.18,
    })
    void this.plateEnds
  }
}
