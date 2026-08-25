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

  private renderScreen(
    renderer: IRenderer,
    field: Field,
    angle: number,
    alpha: number,
    grow: number,
  ): void {
    const point = field.pointAt(angle, field.paddleOrbit)
    const width = BALANCE.paddle.screenWidth * (1 + grow * 0.12)
    const height = BALANCE.paddle.screenHeight * (1 + grow * 0.3)

    renderer.push()
    renderer.translate(point.x, point.y)
    renderer.rotate(angle + Math.PI / 2)
    renderer.roundRect(-width / 2, -height / 2, width, height, 5, {
      fill: PALETTE.ink,
      alpha,
      glow: PALETTE.friendly,
      glowSize: 10 + grow * 26,
    })
    renderer.roundRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, 3, {
      fill: PALETTE.friendly,
      alpha: alpha * (0.6 + grow * 0.4),
    })
    renderer.pop()
  }

  render(renderer: IRenderer, field: Field, damage = 0): void {
    const orbit = field.paddleOrbit

    if (this.ghostFade > 0) {
      const fade = Ease.outQuad(this.ghostFade)
      this.renderScreen(renderer, field, this.ghostAngle, fade * 0.3, 0)
    }

    this.renderScreen(renderer, field, this.displayAngle, 1, this.impact)

    const base = field.pointAt(this.displayAngle, BALANCE.container.height * 0.4)
    const tip = field.pointAt(this.displayAngle, orbit - BALANCE.paddle.screenHeight * 0.4)
    const flicker = damage > 0 && Math.random() < damage * 0.35
    renderer.line(base.x, base.y, tip.x, tip.y, 6, {
      stroke: PALETTE.grid,
      alpha: flicker ? 0.35 : 1,
    })
    renderer.line(base.x, base.y, tip.x, tip.y, 2, {
      stroke: damage > 0.6 ? PALETTE.hostile : PALETTE.friendly,
      alpha: flicker ? 0.15 : 0.35 - damage * 0.15,
    })
    if (damage > 0) {
      const spot = 0.3 + Math.random() * 0.5
      const sparkX = base.x + (tip.x - base.x) * spot
      const sparkY = base.y + (tip.y - base.y) * spot
      if (Math.random() < damage * 0.25) {
        renderer.circle(sparkX, sparkY, 2 + Math.random() * 2, {
          fill: PALETTE.hostile,
          glow: PALETTE.hostile,
          glowSize: 10,
        })
      }
    }
    renderer.circle(base.x, base.y, 5, { fill: PALETTE.grid })
  }
}
