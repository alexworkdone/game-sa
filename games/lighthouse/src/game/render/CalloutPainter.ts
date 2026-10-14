import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { Callout } from '../systems/Tutorial.js'

const SIZE = 13
const HEIGHT = 26
const POINTER = 8

export class CalloutPainter {
  draw(r: IRenderer, callouts: readonly Callout[], width: number, time: number): void {
    callouts.forEach((callout, index) => {
      const bob = Math.sin(time * 3 + index * 1.7) * 2
      const textWidth = r.measureText(callout.text, { size: SIZE, weight: 700 })
      const w = textWidth + 22
      const bx = Math.max(4, Math.min(width - w - 4, callout.x - w / 2))
      let by = callout.y - HEIGHT - POINTER + bob
      const below = by < 4
      if (below) by = callout.fallbackY + POINTER + bob
      const px = Math.max(bx + 10, Math.min(bx + w - 10, callout.x))
      const tip = below
        ? [px - 6, by, px + 6, by, px, by - POINTER]
        : [px - 6, by + HEIGHT, px + 6, by + HEIGHT, px, by + HEIGHT + POINTER]
      r.polygon(tip, { fill: callout.color, alpha: 0.95 })
      r.roundRect(bx, by, w, HEIGHT, 8, { fill: PALETTE.night, alpha: 0.94 })
      r.roundRect(bx, by, w, HEIGHT, 8, { stroke: callout.color, lineWidth: 1.5, alpha: 0.95 })
      r.text(callout.text, bx + w / 2, by + HEIGHT / 2 + 1, {
        fill: PALETTE.ink,
        size: SIZE,
        weight: 700,
        align: 'center',
        baseline: 'middle',
      })
    })
  }
}
