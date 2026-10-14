import type { IRenderer } from '@sa/core'
import type { AchievementDef } from '../config/achievements.js'
import { PALETTE } from '../config/palette.js'
import { drawTrophy, gradeColor } from '../render/Trophies.js'

interface ToastItem {
  readonly title: string
  readonly caption: string
  readonly def: AchievementDef
}

const SHOW_TIME = 3.2
const SLIDE_TIME = 0.35
const PAUSE_TIME = 6
const WIDTH = 380
const HEIGHT = 64

export class AchievementToast {
  private readonly queue: ToastItem[] = []
  private startedAt = 0
  private readyAt = 0
  private readonly onShow: () => void

  constructor(onShow: () => void = () => {}) {
    this.onShow = onShow
  }

  push(defs: readonly AchievementDef[]): void {
    for (const def of defs) this.queue.push({ title: def.title, caption: 'Досягнення!', def })
  }

  render(r: IRenderer, viewportWidth: number): void {
    const item = this.queue[0]
    if (!item) return
    const now = performance.now() / 1000
    if (this.startedAt === 0) {
      if (now < this.readyAt) return
      this.startedAt = now
      this.onShow()
    }
    const age = now - this.startedAt
    if (age > SHOW_TIME) {
      this.queue.shift()
      this.startedAt = 0
      this.readyAt = now + PAUSE_TIME
      return
    }
    const enter = Math.min(1, age / SLIDE_TIME)
    const leave = Math.min(1, (SHOW_TIME - age) / SLIDE_TIME)
    const visible = Math.min(enter, leave)
    const x = viewportWidth / 2 - WIDTH / 2
    const y = 10 - (1 - visible) * (HEIGHT + 20)
    const color = gradeColor(item.def.grade)
    r.roundRect(x, y, WIDTH, HEIGHT, 16, { fill: PALETTE.surface, alpha: 0.97 })
    r.roundRect(x, y, WIDTH, HEIGHT, 16, { stroke: color, lineWidth: 2, glow: color, glowSize: 10 })
    r.circle(x + 34, y + HEIGHT / 2, 24, { fill: PALETTE.night })
    drawTrophy(r, item.def.trophy, item.def.grade, x + 34, y + HEIGHT / 2, 40, false)
    r.text(item.caption, x + 68, y + 22, { fill: color, size: 13, weight: 800, baseline: 'middle' })
    let size = 18
    while (size > 12 && r.measureText(item.title, { size, weight: 900 }) > WIDTH - 82) size -= 0.5
    r.text(item.title, x + 68, y + 43, { fill: PALETTE.ink, size, weight: 900, baseline: 'middle' })
  }
}
