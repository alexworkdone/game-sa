import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { LevelTheme } from '../config/tiers.js'

const FOG_LAYERS = 16
const FOG_WIDTH = 200
const FOG_STEP = 12
const FOG_ALPHA = 0.075

export class WorldSeam {
  draw(r: IRenderer, x: number, height: number, strength: number, theme: LevelTheme): void {
    if (strength <= 0) return
    for (let i = 0; i < FOG_LAYERS; i++) {
      const width = FOG_WIDTH - i * FOG_STEP
      r.rect(x - width / 2, 0, width, height, { fill: PALETTE.background, alpha: FOG_ALPHA * strength })
    }
    const beam = theme.tower.beam
    r.line(x, 0, x, height, 2, { stroke: beam, alpha: 0.4 * strength, glow: beam, glowSize: 24 })
    r.line(x, 0, x, height, 1, { stroke: theme.tower.beamCore, alpha: 0.55 * strength })
  }
}
