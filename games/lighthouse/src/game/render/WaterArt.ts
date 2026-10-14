import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { Water } from '../entities/Water.js'
import type { LevelTheme } from '../config/tiers.js'

const STEP = 24

export class WaterArt {
  private readonly surface: number[] = []

  private drawNotice(r: IRenderer, text: string, x: number, y: number): void {
    const style = { size: 13, weight: 800 } as const
    const width = r.measureText(text, style) + 22
    r.roundRect(x - width / 2, y - 12, width, 24, 12, { fill: PALETTE.night, alpha: 0.85 })
    r.roundRect(x - width / 2, y - 12, width, 24, 12, { stroke: PALETTE.hourglass, lineWidth: 1.5 })
    r.text(text, x, y + 1, { ...style, fill: PALETTE.hourglass, align: 'center', baseline: 'middle' })
  }

  draw(
    r: IRenderer,
    water: Water,
    width: number,
    height: number,
    time: number,
    notice: string | null,
    theme: LevelTheme,
  ): void {
    const level = water.level
    if (notice) this.drawNotice(r, notice, width / 2, Math.max(48, Math.min(height - 14, level - 16)))
    if (level >= height + 4) return
    const calm = water.frozen > 0 ? 0.35 : 1
    this.surface.length = 0
    for (let x = 0; x <= width + STEP; x += STEP) {
      const y =
        level +
        (Math.sin(x * 0.028 + time * 2.1) * 2.6 + Math.sin(x * 0.071 - time * 1.4) * 1.6) * calm
      this.surface.push(Math.min(x, width), y)
    }
    const body = [...this.surface, width, height, 0, height]
    r.polygon(body, { fill: theme.waterDeep, alpha: 0.6 })
    const band: number[] = [...this.surface]
    for (let i = this.surface.length - 2; i >= 0; i -= 2) {
      band.push(this.surface[i] as number, (this.surface[i + 1] as number) + 14)
    }
    r.polygon(band, { fill: theme.water, alpha: 0.45 })
    const foam: number[] = [...this.surface]
    for (let i = this.surface.length - 2; i >= 0; i -= 2) {
      foam.push(this.surface[i] as number, (this.surface[i + 1] as number) + 2.2)
    }
    r.polygon(foam, {
      fill: water.frozen > 0 ? PALETTE.hourglass : theme.waterFoam,
      alpha: 0.75,
    })
    for (let i = 0; i < 14; i++) {
      const bx = ((i * 97.3) % (width - 40)) + 20
      const travel = (time * (18 + (i % 4) * 7) + i * 31) % Math.max(40, height - level)
      const by = height - travel
      if (by < level + 6) continue
      r.circle(bx + Math.sin(time * 3 + i) * 3, by, 1.5 + (i % 3) * 0.6, {
        stroke: theme.waterFoam,
        lineWidth: 1,
        alpha: 0.45,
      })
    }
  }
}
