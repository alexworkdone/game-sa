import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { LEVEL_THEMES } from '../config/tiers.js'
import type { LevelTheme } from '../config/tiers.js'

const DEFAULT_THEME = LEVEL_THEMES[0] as LevelTheme

const TOWER_BANDS = 5
const TOWER_HEIGHT = 210
const BOTTOM_HALF = 48
const TOP_HALF = 31
const EMBERS = 14
const KELP_STEPS = 8
const BARNACLES: readonly [number, number][] = [
  [-38, -34],
  [-20, -42],
  [12, -36],
  [34, -48],
  [-8, -60],
  [26, -66],
]

const MOON_X = 0.16
const MOON_Y = 86
const MOON_R = 22
const CLOUD_DRIFT = 6
const CLOUD_MARGIN = 160
const CLOUDS: readonly (readonly [number, number, number])[] = [
  [0.02, 52, 1],
  [0.24, 96, 0.75],
  [0.47, 40, 1.15],
  [0.7, 82, 0.85],
  [0.9, 50, 1.05],
]
const CLOUD_PUFFS: readonly (readonly [number, number, number])[] = [
  [0, 0, 30],
  [28, -12, 26],
  [56, 0, 24],
  [26, 9, 28],
]

const bandHalf = (index: number): number => BOTTOM_HALF + ((TOP_HALF - BOTTOM_HALF) * index) / TOWER_BANDS

export class LighthouseArt {
  drawSky(r: IRenderer, width: number, height: number, time: number, theme: LevelTheme = DEFAULT_THEME): void {
    r.rect(0, 0, width, height, { fill: theme.sky })
    this.drawMoon(r, width, theme)
    this.drawClouds(r, width, time, theme)
    for (let i = 0; i < 60; i++) {
      const x = (i * 137.7 + time * 220) % (width + 60) - 30
      const y = (i * 71.3 + time * 520) % (height + 60) - 30
      r.line(x, y, x - 6, y + 16, 1.2, { stroke: '#7f93c4', alpha: 0.28 })
    }
  }

  private drawMoon(r: IRenderer, width: number, theme: LevelTheme): void {
    const x = width * MOON_X
    const look = theme.tower
    r.circle(x, MOON_Y, MOON_R * 2.2, { fill: look.beamCore, alpha: 0.04, glow: look.beam, glowSize: 50 })
    r.circle(x, MOON_Y, MOON_R, { fill: look.beamCore, alpha: 0.6 })
    r.circle(x + MOON_R * 0.38, MOON_Y - MOON_R * 0.22, MOON_R * 0.86, { fill: theme.sky })
  }

  private drawClouds(r: IRenderer, width: number, time: number, theme: LevelTheme): void {
    const span = width + CLOUD_MARGIN * 2
    for (const [fraction, y, scale] of CLOUDS) {
      const x = ((fraction * span + time * CLOUD_DRIFT) % span) - CLOUD_MARGIN
      for (const [dx, dy, radius] of CLOUD_PUFFS) {
        r.circle(x + dx * scale, y + dy * scale, radius * scale, { fill: theme.wallBrick, alpha: 0.55 })
      }
    }
  }

  drawTower(r: IRenderer, cx: number, baseY: number, scale: number, time: number, theme: LevelTheme = DEFAULT_THEME): void {
    const look = theme.tower
    r.push()
    r.translate(cx, baseY)
    r.scale(scale, scale)
    const lampY = -262
    const sweep = Math.sin(time * 0.9)
    const length = 900 * sweep
    r.polygon([0, lampY - 5, length, lampY - 70, length, lampY + 50, 0, lampY + 5], {
      fill: look.beam,
      alpha: 0.13 + Math.abs(sweep) * 0.07,
    })
    r.polygon([-70, 0, 80, 0, 60, -26, -48, -30], { fill: theme.stoneDark })
    for (let i = 0; i < TOWER_BANDS; i++) {
      const y0 = -(TOWER_HEIGHT * i) / TOWER_BANDS - 24
      const y1 = -(TOWER_HEIGHT * (i + 1)) / TOWER_BANDS - 24
      const w0 = bandHalf(i)
      const w1 = bandHalf(i + 1)
      r.polygon([-w0, y0, w0, y0, w1, y1, -w1, y1], { fill: i % 2 === 0 ? look.stripe : look.stripeAlt })
    }
    r.polygon([-BOTTOM_HALF, -24, -BOTTOM_HALF + 10, -24, -TOP_HALF + 8, -234, -TOP_HALF, -234], {
      fill: '#000000',
      alpha: 0.18,
    })
    if (look.decor === 'embers') this.drawCracks(r, time)
    if (look.decor === 'kelp') this.drawKelp(r, time)
    r.roundRect(-9, -70, 18, 26, 8, { fill: PALETTE.night })
    r.roundRect(-7, -150, 14, 20, 7, { fill: look.beam, alpha: 0.75 })
    r.rect(-44, -240, 88, 8, { fill: look.trim })
    for (let x = -40; x <= 40; x += 10) r.line(x, -240, x, -252, 1.6, { stroke: look.rail })
    r.line(-42, -252, 42, -252, 2, { stroke: look.rail })
    r.rect(-26, -282, 52, 42, { fill: look.trim })
    const pulse = 0.85 + Math.sin(time * 3) * 0.1
    r.rect(-21, -278, 42, 34, { fill: look.beam, alpha: pulse, glow: look.beam, glowSize: 40 })
    r.circle(0, lampY, 9, { fill: look.beamCore })
    r.line(-7, -278, -7, -244, 2, { stroke: look.trim })
    r.line(7, -278, 7, -244, 2, { stroke: look.trim })
    r.polygon([-32, -282, 32, -282, 0, -312], { fill: look.roof })
    r.circle(0, -314, 4, { fill: look.rail })
    if (look.decor === 'ice') this.drawIce(r, time)
    if (look.decor === 'embers') this.drawEmbers(r, time)
    r.pop()
  }

  private drawIce(r: IRenderer, time: number): void {
    const snow = { fill: '#f4fbff' }
    r.polygon([-12, -300, 0, -313, 12, -300, 6, -302, 0, -298, -6, -302], snow)
    r.roundRect(-35, -286, 70, 6, 3, snow)
    r.roundRect(-46, -244, 92, 6, 3, snow)
    r.polygon([-70, 0, -48, -30, -20, -34, 30, -30, 60, -26, 40, -22, -10, -24, -50, -20], { fill: '#e6f4fb', alpha: 0.85 })
    const icicle = { fill: '#d9f2ff', alpha: 0.9 }
    for (let x = -40; x <= 40; x += 8) {
      const len = 6 + ((x * 7 + 400) % 11)
      r.polygon([x - 2.5, -232, x + 2.5, -232, x, -232 + len], icicle)
    }
    for (let x = -30; x <= 30; x += 10) {
      const len = 5 + ((x * 3 + 300) % 7)
      r.polygon([x - 2, -280, x + 2, -280, x, -280 + len], icicle)
    }
    const glint = 0.4 + Math.sin(time * 2.4) * 0.4
    r.circle(-22, -228, 1.6, { fill: '#ffffff', alpha: glint })
    r.circle(18, -226, 1.4, { fill: '#ffffff', alpha: 0.8 - glint })
  }

  private drawCracks(r: IRenderer, time: number): void {
    const glow = 0.55 + Math.sin(time * 2.2) * 0.3
    const crack = { stroke: '#ff5a3a', alpha: glow, glow: '#ff3a2a', glowSize: 8 }
    const paths = [
      [-30, -40, -22, -62, -27, -80, -18, -104],
      [24, -120, 16, -138, 21, -152, 12, -170],
      [-20, -186, -12, -200, -17, -214],
    ]
    for (const path of paths) {
      for (let i = 0; i + 3 < path.length; i += 2) {
        r.line(path[i] as number, path[i + 1] as number, path[i + 2] as number, path[i + 3] as number, 1.6, crack)
      }
    }
  }

  private drawEmbers(r: IRenderer, time: number): void {
    for (let i = 0; i < EMBERS; i++) {
      const t = (time * 0.22 + i * 0.137) % 1
      const side = i % 2 === 0 ? -1 : 1
      const x = side * (30 + (i % 5) * 9) + Math.sin(time * 1.3 + i * 2.1) * 14
      const y = -24 - t * 300
      r.circle(x, y, 1.4 + (i % 3) * 0.5, { fill: '#ffb36a', alpha: (1 - t) * 0.85, glow: '#ff5a3a', glowSize: 6 })
    }
  }

  private drawKelp(r: IRenderer, time: number): void {
    const strands: readonly [number, number][] = [
      [-46, 70],
      [-36, 104],
      [-26, 58],
      [30, 92],
      [42, 64],
    ]
    for (const [x, height] of strands) {
      let px = x
      let py = -22
      for (let step = 1; step <= KELP_STEPS; step++) {
        const k = step / KELP_STEPS
        const nx = x + Math.sin(time * 1.6 + x * 0.3 + k * 4) * 5 * k
        const ny = -22 - height * k
        r.line(px, py, nx, ny, 3.4 - k * 1.8, { stroke: step % 2 === 0 ? '#3f8f5a' : '#2f7449' })
        px = nx
        py = ny
      }
    }
    const shell = { fill: '#d9e6d0' }
    for (const [x, y] of BARNACLES) r.circle(x, y, 2.6, shell)
  }

  drawSea(r: IRenderer, width: number, y: number, height: number, time: number, theme: LevelTheme = DEFAULT_THEME): void {
    for (let layer = 0; layer < 3; layer++) {
      const points: number[] = []
      const baseY = y + layer * 18
      for (let x = 0; x <= width + 30; x += 30) {
        points.push(x, baseY + Math.sin(x * 0.02 - time * (1.2 + layer * 0.4) + layer) * 6)
      }
      points.push(width, height, 0, height)
      r.polygon(points, {
        fill: layer === 0 ? theme.water : layer === 1 ? theme.waterDeep : PALETTE.background,
        alpha: layer === 2 ? 0.6 : 0.9,
      })
    }
  }
}
