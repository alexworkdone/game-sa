import { clamp } from '@sa/core'
import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { TEXT } from '../config/layout.js'
import type { Stage } from '../entities/Stage.js'

const MESSAGE_LIFE = 1.6

export class Hud {
  private message = ''
  private timer = 0

  showMessage(text: string): void {
    this.message = text
    this.timer = MESSAGE_LIFE
  }

  clear(): void {
    this.message = ''
    this.timer = 0
  }

  update(dt: number): void {
    if (this.timer > 0) this.timer = Math.max(0, this.timer - dt)
  }

  render(renderer: IRenderer, stage: Stage): void {
    if (this.timer <= 0) return
    const alpha = clamp(this.timer / 0.4, 0, 1)
    const y = stage.height - 34
    const width = renderer.measureText(this.message, { size: TEXT.message, weight: 600 }) + 40
    renderer.roundRect(stage.centerX - width / 2, y - 22, width, 44, 22, {
      fill: PALETTE.backdrop,
      stroke: PALETTE.frame,
      lineWidth: 1,
      alpha: alpha * 0.96,
    })
    renderer.text(this.message, stage.centerX, y, {
      size: TEXT.message,
      weight: 600,
      align: 'center',
      baseline: 'middle',
      fill: PALETTE.ink,
      alpha,
    })
  }
}
