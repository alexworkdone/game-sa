import { SeededRandom } from '@sa/core'
import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { TileMap } from '../level/TileMap.js'
import { LEVEL_THEMES } from '../config/tiers.js'
import type { LevelTheme } from '../config/tiers.js'

interface Run {
  readonly r: number
  readonly c0: number
  readonly c1: number
  readonly openLeft: boolean
  readonly openRight: boolean
}

interface LadderRun {
  readonly c: number
  readonly r0: number
  readonly r1: number
}

interface Brick {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly shade: boolean
}

interface WindowSpot {
  readonly x: number
  readonly y: number
  readonly moon: boolean
}

export class LevelPainter {
  private map: TileMap | null = null
  private theme: LevelTheme = LEVEL_THEMES[0] as LevelTheme
  private runs: Run[] = []
  private ladders: LadderRun[] = []
  private hatches: { c: number; r: number }[] = []
  private bricks: Brick[] = []
  private windows: WindowSpot[] = []
  private seams: number[] = []

  prepare(map: TileMap, floor: number, theme: LevelTheme): void {
    this.map = map
    this.theme = theme
    this.runs = []
    this.ladders = []
    this.hatches = []
    const walkable = (c: number, r: number): boolean => map.isSolid(c, r) || map.isLadderTop(c, r)
    this.seams = []
    for (let r = 1; r < map.rows; r++) {
      let start = -1
      for (let c = 0; c <= map.cols; c++) {
        const hatch = c < map.cols && map.isLadderTop(c, r) && (map.isSolid(c - 1, r) || map.isSolid(c + 1, r))
        if (hatch) this.hatches.push({ c, r })
        const solid = c < map.cols && (map.isSolid(c, r) || hatch)
        if (solid && start < 0) start = c
        if (!solid && start >= 0) {
          const c1 = c - 1
          this.runs.push({
            r,
            c0: start,
            c1,
            openLeft: start === 0 && walkable(map.cols - 1, r),
            openRight: c1 === map.cols - 1 && walkable(0, r),
          })
          start = -1
        }
      }
      if (r < map.rows - 1 && walkable(0, r) && walkable(map.cols - 1, r)) this.seams.push(r)
    }
    for (let c = 0; c < map.cols; c++) {
      let start = -1
      for (let r = 0; r <= map.rows; r++) {
        const ladder = r < map.rows && map.isLadder(c, r)
        if (ladder && start < 0) start = r
        if (!ladder && start >= 0) {
          this.ladders.push({ c, r0: start, r1: r - 1 })
          start = -1
        }
      }
    }
    const random = new SeededRandom(`backdrop-${floor}`)
    this.bricks = []
    const t = map.tile
    for (let i = 0; i < 70; i++) {
      const row = random.int(2, map.rows * 2 - 2)
      const y = row * (t / 2)
      const x = random.int(0, map.cols * 2) * (t / 2) + (row % 2 === 0 ? 0 : t / 4)
      this.bricks.push({ x, y, w: random.bool(0.5) ? t : t * 0.75, shade: random.bool(0.5) })
    }
    this.windows = [
      { x: t * random.int(4, 10), y: t * 3.2, moon: true },
      { x: t * random.int(18, 25), y: t * 9.2, moon: false },
    ]
  }

  drawBackdrop(r: IRenderer, time: number, flash: number): void {
    const map = this.map
    if (!map) return
    const t = map.tile
    r.rect(0, 0, map.width, map.height, { fill: this.theme.wall })
    for (const brick of this.bricks) {
      r.rect(brick.x + 1, brick.y + 1, brick.w - 2, t / 2 - 2, {
        fill: brick.shade ? this.theme.wallBrick : this.theme.wallMortar,
        alpha: 0.75,
      })
    }
    for (const spot of this.windows) this.drawWindow(r, spot, time, flash)
  }

  private drawWindow(r: IRenderer, spot: WindowSpot, time: number, flash: number): void {
    const t = this.map?.tile ?? 32
    const w = t * 1.6
    const h = t * 2.4
    const x = spot.x - w / 2
    const y = spot.y
    r.roundRect(x - 5, y - 5, w + 10, h + 8, w / 2 + 4, { fill: this.theme.stoneDark })
    r.roundRect(x, y, w, h, w / 2, { fill: flash > 0 ? '#5d6f9e' : this.theme.window })
    if (spot.moon) {
      r.circle(x + w * 0.62, y + h * 0.3, w * 0.18, { fill: PALETTE.moon, alpha: 0.85, glow: PALETTE.moon, glowSize: 14 })
      r.circle(x + w * 0.68, y + h * 0.27, w * 0.15, { fill: flash > 0 ? '#5d6f9e' : this.theme.window })
    }
    r.push()
    r.clip({ kind: 'rect', x, y, width: w, height: h, radius: w / 2 })
    for (let i = 0; i < 7; i++) {
      const phase = (time * 1.6 + i * 0.37) % 1
      const rx = x + ((i * 13.7) % w)
      const ry = y + phase * (h + 20) - 10
      r.line(rx, ry, rx - 4, ry + 10, 1.2, { stroke: '#9fb4e6', alpha: 0.45 })
    }
    r.pop()
    r.line(spot.x, y, spot.x, y + h, 3, { stroke: this.theme.stoneDark })
    r.line(x, y + h * 0.55, x + w, y + h * 0.55, 3, { stroke: this.theme.stoneDark })
    r.rect(x - 8, y + h, w + 16, 6, { fill: this.theme.stone })
  }

  drawTiles(r: IRenderer, time: number): void {
    const map = this.map
    if (!map) return
    const t = map.tile
    this.drawCeiling(r, map)
    for (const run of this.runs) {
      if (run.r === map.rows - 1) this.drawGround(r, run, t)
      else this.drawPlatform(r, run, t)
    }
    for (const hatch of this.hatches) {
      const x = hatch.c * t
      const y = hatch.r * t
      r.rect(x + 4, y + 3, t - 8, t * 0.62 - 3, { fill: PALETTE.night })
      r.rect(x + 2, y, t - 4, 3, { fill: this.theme.plankLight })
    }
    for (const ladder of this.ladders) this.drawLadder(r, ladder, t)
    this.drawEdges(r, map, time)
  }

  private drawCeiling(r: IRenderer, map: TileMap): void {
    const t = map.tile
    r.rect(0, 0, map.width, t, { fill: this.theme.stone })
    r.rect(0, t - 3, map.width, 3, { fill: this.theme.stoneDark })
    r.line(0, t / 2, map.width, t / 2, 1, { stroke: this.theme.stoneDark, alpha: 0.8 })
    for (let c = 0; c < map.cols; c++) {
      const x = c * t + (c % 2 === 0 ? 0 : t / 2)
      r.line(x, 0, x, t / 2, 1, { stroke: this.theme.stoneDark, alpha: 0.6 })
      r.line(x + t / 4, t / 2, x + t / 4, t - 3, 1, { stroke: this.theme.stoneDark, alpha: 0.6 })
    }
  }

  private drawEdges(r: IRenderer, map: TileMap, time: number): void {
    const t = map.tile
    for (let i = 0; i < 5; i++) {
      const w = 6
      const alpha = 0.22 - i * 0.04
      r.rect(i * w, t, w, map.height - t, { fill: PALETTE.background, alpha })
      r.rect(map.width - (i + 1) * w, t, w, map.height - t, { fill: PALETTE.background, alpha })
    }
    const pulse = 0.35 + Math.sin(time * 3) * 0.15
    for (const row of this.seams) {
      const y = row * t - 14
      r.polygon([map.width - 12, y - 5, map.width - 4, y, map.width - 12, y + 5], { fill: PALETTE.accent, alpha: pulse })
      r.polygon([12, y - 5, 4, y, 12, y + 5], { fill: PALETTE.accent, alpha: pulse })
    }
  }

  private drawGround(r: IRenderer, run: Run, t: number): void {
    const x = run.c0 * t
    const y = run.r * t
    const w = (run.c1 - run.c0 + 1) * t
    r.rect(x, y, w, t, { fill: this.theme.stone })
    r.rect(x, y, w, 4, { fill: this.theme.stoneLight })
    for (let c = run.c0; c <= run.c1; c++) {
      const sx = c * t + (c % 2 === 0 ? 0 : t / 2)
      r.line(sx, y + 4, sx, y + t, 1, { stroke: this.theme.stoneDark, alpha: 0.7 })
    }
    r.line(x, y + t / 2 + 2, x + w, y + t / 2 + 2, 1, { stroke: this.theme.stoneDark, alpha: 0.7 })
  }

  private drawPlatform(r: IRenderer, run: Run, t: number): void {
    const x = run.c0 * t
    const y = run.r * t
    const w = (run.c1 - run.c0 + 1) * t
    const h = t * 0.62
    r.rect(x, y, w, h, { fill: this.theme.plank })
    r.rect(x, y, w, 4, { fill: this.theme.plankLight })
    r.rect(x, y + h - 4, w, 4, { fill: this.theme.plankDark })
    r.line(x, y + h * 0.5, x + w, y + h * 0.5, 1, { stroke: this.theme.plankDark, alpha: 0.6 })
    for (let c = run.c0; c <= run.c1; c++) {
      const sx = c * t + ((c * 7) % 3) * 6 + 6
      if (sx > x + 3 && sx < x + w - 3) r.line(sx, y + 4, sx, y + h - 4, 1, { stroke: this.theme.plankDark, alpha: 0.7 })
    }
    const braceY = y + h
    const ends: number[] = []
    if (!run.openLeft) ends.push(x + 6)
    if (!run.openRight) ends.push(x + w - 6)
    for (const bx of ends) {
      r.polygon([bx - 3, braceY, bx + 3, braceY, bx + 3, braceY + 7, bx - 3, braceY + 3], {
        fill: this.theme.plankDark,
      })
    }
    if (!run.openLeft) r.rect(x - 1, y, 3, h, { fill: this.theme.plankDark })
    if (!run.openRight) r.rect(x + w - 2, y, 3, h, { fill: this.theme.plankDark })
  }

  private drawLadder(r: IRenderer, ladder: LadderRun, t: number): void {
    const cx = ladder.c * t + t / 2
    const top = ladder.r0 * t - 9
    const bottom = (ladder.r1 + 1) * t
    const half = t * 0.32
    for (let y = bottom - 6; y > top + 3; y -= 8) {
      r.line(cx - half, y, cx + half, y, 3, { stroke: this.theme.ladderDark })
      r.line(cx - half, y - 1, cx + half, y - 1, 1.5, { stroke: this.theme.ladder })
    }
    r.line(cx - half, top, cx - half, bottom, 4, { stroke: this.theme.ladder })
    r.line(cx + half, top, cx + half, bottom, 4, { stroke: this.theme.ladder })
    r.line(cx - half + 1.5, top, cx - half + 1.5, bottom, 1, { stroke: this.theme.ladderDark, alpha: 0.7 })
    r.line(cx + half + 1.5, top, cx + half + 1.5, bottom, 1, { stroke: this.theme.ladderDark, alpha: 0.7 })
  }
}
