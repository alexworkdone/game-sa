import type { IRenderer, Rect } from '@sa/core'
import { PALETTE } from '../config/palette.js'

export interface HudData {
  readonly score: number
  readonly combo: number
  readonly multiplier: number
  readonly comboRatio: number
  readonly label: string
  readonly safe: Rect
}

export class Hud {
  render(renderer: IRenderer, data: HudData): void {
    const { safe } = data
    const top = safe.y + 22
    const centerX = safe.x + safe.width / 2

    renderer.text(String(data.score), centerX, top, {
      fill: PALETTE.ink,
      size: 46,
      weight: 800,
      align: 'center',
      baseline: 'top',
    })

    renderer.text(data.label, safe.x + 22, top + 6, {
      fill: PALETTE.inkMuted,
      size: 14,
      weight: 600,
      align: 'left',
      baseline: 'top',
    })

    if (data.multiplier > 1) {
      renderer.text(`x${data.multiplier}`, centerX, top + 52, {
        fill: PALETTE.reward,
        size: 20,
        weight: 800,
        align: 'center',
        baseline: 'top',
        glow: PALETTE.reward,
        glowSize: 10,
      })
    }

    if (data.combo >= 2) {
      const barWidth = 110
      const barX = centerX - barWidth / 2
      const barY = top + (data.multiplier > 1 ? 78 : 56)
      renderer.roundRect(barX, barY, barWidth, 4, 2, { fill: PALETTE.grid })
      renderer.roundRect(barX, barY, barWidth * data.comboRatio, 4, 2, {
        fill: PALETTE.reward,
        glow: PALETTE.reward,
        glowSize: 8,
      })
    }
  }
}
