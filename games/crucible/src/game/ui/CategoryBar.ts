import { clamp, damp } from '@sa/core'
import type { IRenderer, TextStyle } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { LAYOUT, TEXT } from '../config/layout.js'
import { CATEGORIES } from '../data/categories.js'
import type { Settings } from '../systems/Settings.js'
import type { CategoryId } from '../data/categories.js'
import type { Area } from '../entities/Stage.js'

export type FilterId = 'all' | CategoryId

interface Chip {
  readonly id: FilterId
  x: number
  width: number
}

const LABEL_STYLE: TextStyle = { size: TEXT.categoryLabel, weight: 700 }
const COUNT_STYLE: TextStyle = { size: TEXT.categoryCount, weight: 600 }

export class CategoryBar {
  private readonly enabled = new Set<CategoryId>(CATEGORIES.map((category) => category.id))
  private readonly chips: Chip[] = [
    { id: 'all', x: 0, width: 0 },
    ...CATEGORIES.map((category) => ({ id: category.id, x: 0, width: 0 })),
  ]

  private area: Area = { x: 0, y: 0, width: 100, height: LAYOUT.categoryHeight }
  private contentWidth = 0

  scroll = 0

  get scrollable(): boolean {
    return this.contentWidth > this.area.width + 1
  }

  private get maxScroll(): number {
    return Math.max(0, this.contentWidth - this.area.width)
  }

  dragBy(dx: number): void {
    if (!this.scrollable) return
    this.scroll = clamp(this.scroll - dx, 0, this.maxScroll)
    this.place()
  }

  settle(dt: number): void {
    if (!this.scrollable) {
      this.scroll = 0
      return
    }
    const bound = clamp(this.scroll, 0, this.maxScroll)
    if (Math.abs(bound - this.scroll) > 0.4) {
      this.scroll = damp(this.scroll, bound, 0.0006, dt)
      this.place()
    }
  }

  private place(): void {
    const gap = LAYOUT.categoryGap
    let cursor = this.area.x - this.scroll
    if (!this.scrollable) cursor += Math.max(0, (this.area.width - this.contentWidth) / 2)
    for (const chip of this.chips) {
      chip.x = cursor
      cursor += chip.width + gap
    }
  }

  get allOn(): boolean {
    return this.enabled.size === CATEGORIES.length
  }

  get anyOn(): boolean {
    return this.enabled.size > 0
  }

  isOn(id: CategoryId): boolean {
    return this.enabled.has(id)
  }

  toggle(id: FilterId): void {
    if (id === 'all') {
      if (this.allOn) this.enabled.clear()
      else for (const category of CATEGORIES) this.enabled.add(category.id)
      return
    }
    if (this.enabled.has(id)) this.enabled.delete(id)
    else this.enabled.add(id)
  }

  private label(settings: Settings, id: FilterId): string {
    return id === 'all' ? settings.t('allChip') : settings.category(id)
  }

  layout(
    renderer: IRenderer,
    area: Area,
    settings: Settings,
    countOf: (id: FilterId) => number,
    totalOf: (id: FilterId) => number,
  ): void {
    this.area = area
    const gap = LAYOUT.categoryGap
    const widths = this.chips.map((chip) => {
      const count = `${countOf(chip.id)}/${totalOf(chip.id)}`
      const text = Math.max(
        renderer.measureText(this.label(settings, chip.id), LABEL_STYLE),
        renderer.measureText(count, COUNT_STYLE),
      )
      return text + 20
    })
    const gaps = gap * (this.chips.length - 1)
    const chipsWidth = widths.reduce((sum, w) => sum + w, 0)
    const stretch =
      chipsWidth + gaps < area.width ? (area.width - gaps) / chipsWidth : 1
    this.chips.forEach((chip, index) => {
      chip.width = (widths[index] ?? 60) * stretch
    })
    this.contentWidth = chipsWidth * stretch + gaps
    this.scroll = clamp(this.scroll, 0, this.maxScroll)
    this.place()
  }

  hitTest(px: number, py: number): FilterId | null {
    if (py < this.area.y - 6 || py > this.area.y + this.area.height + 6) return null
    if (px < this.area.x - 2 || px > this.area.x + this.area.width + 2) return null
    for (const chip of this.chips) {
      if (px < chip.x || px > chip.x + chip.width) continue
      return chip.id
    }
    return null
  }

  render(
    renderer: IRenderer,
    settings: Settings,
    countOf: (id: FilterId) => number,
    totalOf: (id: FilterId) => number,
  ): void {
    const { x: areaX, y, width: areaWidth, height } = this.area
    renderer.line(areaX, y, areaX + areaWidth, y, 1, { stroke: PALETTE.frame, alpha: 0.6 })
    renderer.line(areaX, y + height, areaX + areaWidth, y + height, 1, {
      stroke: PALETTE.frame,
      alpha: 0.6,
    })

    renderer.push()
    renderer.clip({ kind: 'rect', x: areaX - 2, y, width: areaWidth + 4, height })
    for (const chip of this.chips) {
      const on = chip.id === 'all' ? this.allOn : this.enabled.has(chip.id)
      const centerX = chip.x + chip.width / 2
      renderer.text(this.label(settings, chip.id), centerX, y + height * 0.36, {
        ...LABEL_STYLE,
        align: 'center',
        baseline: 'middle',
        fill: on ? PALETTE.ink : PALETTE.inkMuted,
        alpha: on ? 0.9 : 0.45,
      })
      renderer.text(`${countOf(chip.id)}/${totalOf(chip.id)}`, centerX, y + height * 0.68, {
        ...COUNT_STYLE,
        align: 'center',
        baseline: 'middle',
        fill: PALETTE.inkMuted,
        alpha: on ? 0.7 : 0.35,
      })
      if (on) {
        renderer.line(centerX - chip.width * 0.24, y + height - 5, centerX + chip.width * 0.24, y + height - 5, 2, {
          stroke: PALETTE.beam,
          alpha: 0.75,
        })
      }
    }
    renderer.pop()

    if (!this.scrollable) return
    const fade = { fill: PALETTE.background, alpha: 0.85 } as const
    if (this.scroll > 2) renderer.rect(areaX - 2, y + 1, 10, height - 2, fade)
    if (this.scroll < this.maxScroll - 2) {
      renderer.rect(areaX + areaWidth - 8, y + 1, 10, height - 2, fade)
    }
  }
}
