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

  static get antennaLength(): number {
    const { blocks, blockSize, blockGap } = BALANCE.paddle
    return blocks * blockSize + (blocks - 1) * blockGap
  }

  private renderScreen(
    renderer: IRenderer,
    field: Field,
    angle: number,
    alpha: number,
    grow: number,
  ): void {
    const point = field.pointAt(angle, field.paddleOrbit)
    const { blocks, blockSize, blockGap } = BALANCE.paddle
    const total = Paddle.antennaLength
    const size = blockSize * (1 + grow * 0.28)

    renderer.push()
    renderer.translate(point.x, point.y)
    renderer.rotate(angle)

    for (let i = 0; i < blocks; i++) {
      const x = -total / 2 + i * (blockSize + blockGap) + (blockSize - size) / 2
      const depth = i / Math.max(1, blocks - 1)
      renderer.roundRect(x, -size / 2, size, size, 2, {
        fill: PALETTE.ink,
        alpha,
        glow: PALETTE.friendly,
        glowSize: 6 + grow * 20,
      })
      renderer.roundRect(x + 2, -size / 2 + 2, size - 4, size - 4, 1.5, {
        fill: PALETTE.friendly,
        alpha: alpha * (0.35 + depth * 0.45 + grow * 0.2),
      })
    }

    renderer.rect(total / 2 + 2, -size / 2 - 2, 2, size + 4, {
      fill: PALETTE.friendly,
      alpha: alpha * 0.9,
    })
    renderer.pop()
  }

  render(renderer: IRenderer, field: Field): void {
    const orbit = field.paddleOrbit

    if (this.ghostFade > 0) {
      const fade = Ease.outQuad(this.ghostFade)
      this.renderScreen(renderer, field, this.ghostAngle, fade * 0.3, 0)
    }

    this.renderScreen(renderer, field, this.displayAngle, 1, this.impact)

    const base = field.pointAt(this.displayAngle, BALANCE.container.radius * 0.55)
    const tip = field.pointAt(this.displayAngle, orbit - Paddle.antennaLength * 0.5)
    renderer.line(base.x, base.y, tip.x, tip.y, 6, { stroke: PALETTE.grid })
    renderer.line(base.x, base.y, tip.x, tip.y, 2, {
      stroke: PALETTE.friendly,
      alpha: 0.35,
    })
    renderer.circle(base.x, base.y, 5, { fill: PALETTE.grid })
  }
}
