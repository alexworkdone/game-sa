import { Signal, Widget, damp } from '@sa/core'
import type { IReadonlySignal, IRenderer, WidgetBounds } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'

interface ChipItem {
  readonly value: number
  readonly unlocked: boolean
  grow: number
}

interface ChipWindow {
  readonly items: readonly ChipItem[]
  readonly before: boolean
  readonly after: boolean
}

const SLOT = 44
const RADIUS = 16
const SELECTED_RADIUS = 19
const CHEVRON_W = 22

export const CHIP_LABEL_H = 22
export const CHIP_PICKER_H = CHIP_LABEL_H + 42

export class ChipPicker extends Widget {
  label = ''

  private readonly changed = new Signal<number>()
  private readonly format: (value: number) => string
  private items: ChipItem[] = []
  private selected = 1

  constructor(bounds: WidgetBounds, format: (value: number) => string = String) {
    super(bounds, UI_THEME)
    this.format = format
  }

  get onChange(): IReadonlySignal<number> {
    return this.changed
  }

  get value(): number {
    return this.selected
  }

  setChoices(unlocked: readonly number[], locked: readonly number[], selected: number): void {
    const previous = new Map(this.items.map((item) => [item.value, item.grow]))
    this.items = [
      ...unlocked.map((value) => ({ value, unlocked: true, grow: previous.get(value) ?? (value === selected ? 1 : 0) })),
      ...locked.map((value) => ({ value, unlocked: false, grow: 0 })),
    ]
    this.selected = selected
  }

  step(delta: number): void {
    const next = this.neighbour(delta)
    if (next) this.choose(next.value)
  }

  private neighbour(delta: number): ChipItem | null {
    const open = this.items.filter((item) => item.unlocked)
    const index = open.findIndex((item) => item.value === this.selected)
    const next = open[Math.max(0, Math.min(open.length - 1, index + delta))]
    return next && next.value !== this.selected ? next : null
  }

  private choose(value: number): void {
    this.selected = value
    this.changed.emit(value)
  }

  private window(): ChipWindow {
    if (this.items.length * SLOT <= this.width) return { items: this.items, before: false, after: false }
    const capacity = Math.max(1, Math.floor((this.width - CHEVRON_W * 2) / SLOT))
    const index = this.items.findIndex((item) => item.value === this.selected)
    const start = Math.max(0, Math.min(this.items.length - capacity, index - Math.floor(capacity / 2)))
    return {
      items: this.items.slice(start, start + capacity),
      before: start > 0,
      after: start + capacity < this.items.length,
    }
  }

  private get rowY(): number {
    return this.y + CHIP_LABEL_H + (this.height - CHIP_LABEL_H) / 2
  }

  private slotX(index: number, count: number): number {
    return this.x + this.width / 2 + (index - (count - 1) / 2) * SLOT
  }

  override pointerUp(px: number, py: number, inside: boolean): void {
    const wasPressed = this.pressed
    this.pressed = false
    if (!wasPressed || !inside || !this.hitTest(px, py)) return
    const shown = this.window()
    const count = shown.items.length
    if (shown.before && px < this.slotX(0, count) - SLOT / 2) {
      this.step(-1)
      return
    }
    if (shown.after && px > this.slotX(count - 1, count) + SLOT / 2) {
      this.step(1)
      return
    }
    shown.items.forEach((item, index) => {
      if (item.unlocked && Math.abs(px - this.slotX(index, count)) <= SLOT / 2) this.choose(item.value)
    })
  }

  override update(dt: number): void {
    for (const item of this.items) {
      item.grow = damp(item.grow, item.value === this.selected ? 1 : 0, 0.0005, dt)
    }
  }

  render(r: IRenderer): void {
    if (!this.visible) return
    if (this.label) {
      r.text(this.label, this.x + this.width / 2, this.y + CHIP_LABEL_H / 2 - 2, {
        fill: PALETTE.inkMuted,
        size: 13,
        weight: 700,
        align: 'center',
        baseline: 'middle',
      })
    }
    const shown = this.window()
    const count = shown.items.length
    const cy = this.rowY
    shown.items.forEach((item, index) => this.drawChip(r, item, this.slotX(index, count), cy))
    if (shown.before) this.drawChevron(r, this.slotX(0, count) - SLOT / 2 - CHEVRON_W / 2, cy, -1)
    if (shown.after) this.drawChevron(r, this.slotX(count - 1, count) + SLOT / 2 + CHEVRON_W / 2, cy, 1)
  }

  private drawChip(r: IRenderer, item: ChipItem, x: number, cy: number): void {
    const chosen = item.value === this.selected
    const radius = RADIUS + (SELECTED_RADIUS - RADIUS) * item.grow
    const alpha = item.unlocked ? 1 : 0.4
    if (chosen) {
      r.circle(x, cy, radius, { fill: PALETTE.accent, glow: PALETTE.accent, glowSize: 12 * item.grow })
    } else {
      r.circle(x, cy, radius, { fill: PALETTE.surface, alpha })
      r.ring(x, cy, radius, 1.5, { stroke: PALETTE.surfaceActive, alpha })
    }
    r.text(this.format(item.value), x, cy + 1, {
      fill: chosen ? PALETTE.night : PALETTE.ink,
      size: 15 + item.grow,
      weight: 900,
      align: 'center',
      baseline: 'middle',
      alpha,
    })
    if (item.unlocked) return
    const bx = x + radius * 0.68
    const by = cy + radius * 0.68
    r.circle(bx, by, 7.5, { fill: PALETTE.night })
    r.roundRect(bx - 4, by - 1.5, 8, 6, 1.5, { fill: PALETTE.inkMuted })
    r.arc(bx, by - 1.5, 2.6, Math.PI, Math.PI * 2, 1.4, { stroke: PALETTE.inkMuted })
  }

  private drawChevron(r: IRenderer, x: number, cy: number, direction: -1 | 1): void {
    const alpha = this.neighbour(direction) ? 0.9 : 0.3
    const tip = x + direction * 4
    const tail = x - direction * 4
    r.polygon([tail, cy - 7, tip, cy, tail, cy + 7], { fill: PALETTE.inkMuted, alpha })
  }

  dispose(): void {
    this.changed.dispose()
  }
}
