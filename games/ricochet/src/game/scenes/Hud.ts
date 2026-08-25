import type { IRenderer, Rect } from '@sa/core'
import { PALETTE } from '../config/palette.js'

export interface HudData {
  readonly score: number
  readonly wave: number
  readonly combo: number
  readonly comboRatio: number
  readonly label: string
  readonly safe: Rect
}

export class Hud {
  render(renderer: IRenderer, data: HudData): void {
    const { safe } = data
    const top = safe.y + 26
    const centerX = safe.x + safe.width / 2

    renderer.text(String(data.score), centerX, top, {
      fill: PALETTE.ink,
      size: 44,
      weight: 800,
      align: 'center',
      baseline: 'top',
    })

    renderer.text(data.label, safe.x + 22, top + 6, {
      fill: PALETTE.inkMuted,
      size: 15,
      weight: 600,
      align: 'left',
      baseline: 'top',
    })

    renderer.text(`ХВИЛЯ ${data.wave + 1}`, safe.x + safe.width - 22, top + 6, {
      fill: PALETTE.inkMuted,
      size: 15,
      weight: 600,
      align: 'right',
      baseline: 'top',
    })

    if (data.combo >= 2) {
      const barWidth = 92
      const barX = centerX - barWidth / 2
      const barY = top + 56
      renderer.roundRect(barX, barY, barWidth, 5, 3, { fill: PALETTE.grid })
      renderer.roundRect(barX, barY, barWidth * data.comboRatio, 5, 3, {
        fill: PALETTE.reward,
        glow: PALETTE.reward,
        glowSize: 8,
      })
      renderer.text(`x${data.combo}`, centerX, barY + 20, {
        fill: PALETTE.reward,
        size: 16,
        weight: 700,
        align: 'center',
        baseline: 'top',
      })
    }
  }
}
