import type { IRenderer, Rect } from '@sa/core'
import { PALETTE } from '../config/palette.js'

export interface HudData {
  readonly label: string
  readonly safe: Rect
}

export class Hud {
  render(renderer: IRenderer, data: HudData): void {
    renderer.text(data.label, data.safe.x + 22, data.safe.y + 26, {
      fill: PALETTE.inkMuted,
      size: 14,
      weight: 600,
      align: 'left',
      baseline: 'top',
    })
  }
}
