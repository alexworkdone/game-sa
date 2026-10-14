import { Signal, Widget, damp } from '@sa/core'
import type { IReadonlySignal, IRenderer, TextStyle, WidgetBounds } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { PearlKind } from '../config/pearls.js'
import type { StatLine } from '../config/stats.js'
import { UI_THEME } from '../config/theme.js'
import { drawPearl } from '../render/Icons.js'
import { NBSP, fitText } from './TextWrap.js'

export interface CardDef {
  readonly title: string
  stats(level: number): readonly StatLine[]
}

export type IconPainter = (r: IRenderer, x: number, y: number, size: number) => void

export interface PriceChip {
  readonly kind: PearlKind
  readonly amount: number
  readonly enough: boolean
}

export interface UpgradeCardState {
  readonly level: number
  readonly maxLevel: number
  readonly price: readonly PriceChip[] | null
  readonly affordable: boolean
  readonly locked: boolean
}

interface StatRow {
  readonly label: string
  readonly from: string
  readonly to: string | null
}

interface Values {
  readonly from: string
  readonly to: string | null
}

const PAD = 12
const HEADER_Y = 30
const ICON_R = 17
const ICON_GAP = 8
const TITLE_LINE = 16
const PIPS_Y = 56
const PIP_H = 5
const STAT_TOP = 64
const LINE_H = 15
const ROW_H = 23
const STACK_H = 29
const INLINE_H = 18
const BUTTON_H = 34
const ARROW = '→'
const ARROW_GAP = 6
const LABEL_GAP = 6
const CHIP_GAP = 8
const PRICE_ROW_H = 15
const SHORT = '#ff8f8f'
const MISSING = '—'

const LABEL: TextStyle = { size: 12.5, weight: 600 }
const NOTE: TextStyle = { size: 12.5, weight: 700 }

const compactFrom = (from: string, to: string): string => {
  const cut = from.search(/\s\S*$/)
  if (cut <= 0) return from
  const unit = from.slice(cut)
  return /\d/.test(from.slice(0, cut)) && to.endsWith(unit) ? from.slice(0, cut) : from
}

const joinNotes = (lines: readonly StatLine[]): string =>
  lines.map((line) => (line.label ? `${line.label}: ${line.value}` : line.value)).join(', ')

export class UpgradeCard<T extends CardDef = CardDef> extends Widget {
  readonly def: T
  state: UpgradeCardState = { level: 0, maxLevel: 1, price: null, affordable: false, locked: false }

  private readonly drawIcon: IconPainter
  private readonly activated = new Signal<UpgradeCard<T>>()
  private scaleValue = 1
  private bump = 0

  constructor(def: T, drawIcon: IconPainter, bounds: WidgetBounds) {
    super(bounds, UI_THEME)
    this.def = def
    this.drawIcon = drawIcon
  }

  get onActivate(): IReadonlySignal<UpgradeCard<T>> {
    return this.activated
  }

  celebrate(): void {
    this.bump = 1
  }

  protected override activate(): void {
    this.activated.emit(this)
  }

  override update(dt: number): void {
    this.scaleValue = damp(this.scaleValue, this.pressed ? 0.96 : 1, 0.0001, dt)
    this.bump = Math.max(0, this.bump - dt * 2.5)
  }

  render(r: IRenderer): void {
    const { width: w, height: h } = this
    const maxed = this.state.price === null
    const locked = this.state.locked
    const done = maxed && !locked
    r.push()
    r.translate(this.x + w / 2, this.y + h / 2)
    const s = this.scaleValue + this.bump * 0.06
    r.scale(s, s)
    r.translate(-w / 2, -h / 2)
    if (locked) r.alpha(0.55)

    r.roundRect(0, 0, w, h, 14, { fill: PALETTE.surface })
    r.roundRect(0, 0, w, h, 14, { stroke: done ? PALETTE.good : PALETTE.surfaceActive, lineWidth: 1.5, alpha: done ? 0.6 : 1 })
    this.drawHeader(r, w)
    this.drawPips(r, w, maxed)
    this.drawStats(r, w, h - PAD - BUTTON_H - 4, maxed)
    this.drawButton(r, w, h, maxed, locked)
    r.pop()
  }

  private drawHeader(r: IRenderer, w: number): void {
    const style = { size: 17, weight: 800 } as const
    const room = w - PAD * 2 - ICON_R * 2 - ICON_GAP
    const single = fitText(r, this.def.title, room, style, 1, 15)
    const oneLine = r.measureText(this.def.title, { ...style, size: single.size }) <= room
    const title = oneLine ? single : fitText(r, this.def.title, room, { ...style, size: 15 }, 2, 12)
    const titleStyle = { ...style, size: title.size }
    const textW = Math.max(...title.rows.map((row) => r.measureText(row, titleStyle)))
    const left = (w - (ICON_R * 2 + ICON_GAP + textW)) / 2
    r.circle(left + ICON_R, HEADER_Y, ICON_R, { fill: PALETTE.night })
    this.drawIcon(r, left + ICON_R, HEADER_Y, 26)
    const textX = left + ICON_R * 2 + ICON_GAP
    const top = HEADER_Y - ((title.rows.length - 1) * TITLE_LINE) / 2
    title.rows.forEach((row, index) => {
      r.text(row, textX, top + index * TITLE_LINE + 1, { ...titleStyle, fill: PALETTE.ink, baseline: 'middle' })
    })
  }

  private drawPips(r: IRenderer, w: number, maxed: boolean): void {
    const total = this.state.maxLevel
    const step = Math.min(20, (w - PAD * 4) / total)
    const left = (w - step * total + 4) / 2
    for (let i = 0; i < total; i++) {
      r.roundRect(left + i * step, PIPS_Y - PIP_H / 2, step - 4, PIP_H, PIP_H / 2, {
        fill: i < this.state.level ? (maxed ? PALETTE.good : PALETTE.accent) : PALETTE.surfaceRaised,
      })
    }
  }

  private rows(maxed: boolean): StatRow[] | null {
    const now = this.def.stats(this.state.level)
    const next = maxed ? null : this.def.stats(this.state.level + 1)
    if ([...now, ...(next ?? [])].some((line) => line.label === null)) return null
    return (next ?? now).map((line) => {
      const label = line.label ?? ''
      return {
        label,
        from: now.find((candidate) => candidate.label === label)?.value ?? MISSING,
        to: next ? line.value : null,
      }
    })
  }

  private drawStats(r: IRenderer, w: number, bottom: number, maxed: boolean): void {
    const rows = this.rows(maxed)
    const room = w - PAD * 2
    const cx = w / 2
    const middle = (STAT_TOP + bottom) / 2
    if (rows === null) this.drawNotes(r, room, cx, middle, maxed)
    else if (rows.length === 1) this.drawSingle(r, rows[0] as StatRow, room, cx, middle)
    else this.drawRows(r, rows, room, cx, middle)
  }

  private drawSingle(r: IRenderer, row: StatRow, room: number, cx: number, middle: number): void {
    const label = fitText(r, row.label, room, LABEL, 2, 10.5)
    const labelH = label.rows.length * LINE_H
    const top = middle - (labelH + 4 + 20) / 2
    label.rows.forEach((text, index) => {
      r.text(text, cx, top + index * LINE_H + LINE_H / 2, {
        ...LABEL,
        size: label.size,
        fill: PALETTE.inkMuted,
        align: 'center',
        baseline: 'middle',
      })
    })
    const values = this.values(row)
    let size = 17
    while (size > 11 && this.valuesWidth(r, values, size) > room) size -= 0.5
    this.drawValueRun(r, values, cx - this.valuesWidth(r, values, size) / 2, top + labelH + 4 + 10, size)
  }

  private drawRows(r: IRenderer, rows: readonly StatRow[], room: number, cx: number, middle: number): void {
    const values = rows.map((row) => this.values(row))
    const labelW = Math.max(...rows.map((row) => r.measureText(row.label, LABEL)))
    const widest = (size: number): number => Math.max(...values.map((run) => this.valuesWidth(r, run, size)))
    let size = 14
    while (size > 11 && labelW + LABEL_GAP + widest(size) > room) size -= 0.5
    if (labelW + LABEL_GAP + widest(size) > room) {
      this.drawStacked(r, rows, values, room, cx, middle)
      return
    }
    const split = cx - (labelW + LABEL_GAP + widest(size)) / 2 + labelW
    const top = middle - (rows.length * ROW_H) / 2
    rows.forEach((row, index) => {
      const y = top + index * ROW_H + ROW_H / 2
      r.text(row.label, split, y, { ...LABEL, fill: PALETTE.inkMuted, align: 'right', baseline: 'middle' })
      this.drawValueRun(r, values[index] as Values, split + LABEL_GAP, y, size)
    })
  }

  private drawStacked(
    r: IRenderer,
    rows: readonly StatRow[],
    values: readonly Values[],
    room: number,
    cx: number,
    middle: number,
  ): void {
    const heights = values.map((run) => (run.to === null ? INLINE_H : STACK_H))
    let y = middle - heights.reduce((sum, height) => sum + height, 0) / 2 + LINE_H / 2
    rows.forEach((row, index) => {
      const run = values[index] as Values
      const label = { ...LABEL, size: 11.5, fill: PALETTE.inkMuted, baseline: 'middle' } as const
      if (run.to === null) {
        const labelW = r.measureText(row.label, label)
        const total = labelW + LABEL_GAP + this.valuesWidth(r, run, 11)
        r.text(row.label, cx - total / 2, y, label)
        this.drawValueRun(r, run, cx - total / 2 + labelW + LABEL_GAP, y, 11)
      } else {
        r.text(row.label, cx, y, { ...label, align: 'center' })
        let size = 13
        while (size > 10 && this.valuesWidth(r, run, size) > room) size -= 0.5
        this.drawValueRun(r, run, cx - this.valuesWidth(r, run, size) / 2, y + LINE_H, size)
      }
      y += heights[index] as number
    })
  }

  private drawNotes(r: IRenderer, room: number, cx: number, middle: number, maxed: boolean): void {
    const now = fitText(r, joinNotes(this.def.stats(this.state.level)), room, NOTE, 2, 10.5)
    const nextText = maxed ? null : `${ARROW}${NBSP}${joinNotes(this.def.stats(this.state.level + 1))}`
    const next = nextText === null ? null : fitText(r, nextText, room, NOTE, 2, 10.5)
    const lines = now.rows.length + (next?.rows.length ?? 0)
    let y = middle - (lines * LINE_H + (next ? 4 : 0)) / 2 + LINE_H / 2
    const line = (text: string, size: number, fill: string): void => {
      r.text(text, cx, y, { ...NOTE, size, fill, align: 'center', baseline: 'middle' })
      y += LINE_H
    }
    for (const text of now.rows) line(text, now.size, maxed ? PALETTE.good : PALETTE.inkMuted)
    if (!next) return
    y += 4
    for (const text of next.rows) line(text, next.size, PALETTE.good)
  }

  private values(row: StatRow): Values {
    if (row.to === null || row.to === row.from) return { from: row.from, to: null }
    return { from: compactFrom(row.from, row.to), to: row.to }
  }

  private valuesWidth(r: IRenderer, values: Values, size: number): number {
    if (values.to === null) return r.measureText(values.from, { size: size + 2, weight: 900 })
    return (
      r.measureText(values.from, { size, weight: 700 }) +
      r.measureText(ARROW, { size, weight: 900 }) +
      r.measureText(values.to, { size: size + 2, weight: 900 }) +
      ARROW_GAP * 2
    )
  }

  private drawValueRun(r: IRenderer, values: Values, x: number, y: number, size: number): void {
    if (values.to === null) {
      const fill = this.state.price === null ? PALETTE.good : PALETTE.ink
      r.text(values.from, x, y, { fill, size: size + 2, weight: 900, baseline: 'middle' })
      return
    }
    r.text(values.from, x, y, { fill: PALETTE.inkMuted, size, weight: 700, baseline: 'middle' })
    let cursor = x + r.measureText(values.from, { size, weight: 700 }) + ARROW_GAP
    r.text(ARROW, cursor, y, { fill: PALETTE.accent, size, weight: 900, baseline: 'middle' })
    cursor += r.measureText(ARROW, { size, weight: 900 }) + ARROW_GAP
    r.text(values.to, cursor, y, { fill: PALETTE.good, size: size + 2, weight: 900, baseline: 'middle' })
  }

  private drawButton(r: IRenderer, w: number, h: number, maxed: boolean, locked: boolean): void {
    const by = h - PAD - BUTTON_H
    const bw = w - PAD * 2
    const cy = by + BUTTON_H / 2
    if (locked) {
      r.roundRect(PAD, by, bw, BUTTON_H, 10, { fill: PALETTE.surfaceActive })
      r.roundRect(w / 2 - 36, cy - 2, 10, 8, 2, { fill: PALETTE.inkMuted })
      r.arc(w / 2 - 31, cy - 2, 3.6, Math.PI, Math.PI * 2, 1.6, { stroke: PALETTE.inkMuted })
      r.text('Закрито', w / 2 + 8, cy + 0.5, { fill: PALETTE.inkMuted, size: 15, weight: 800, align: 'center', baseline: 'middle' })
      return
    }
    if (maxed) {
      r.roundRect(PAD, by, bw, BUTTON_H, 10, { stroke: PALETTE.good, lineWidth: 1.5, alpha: 0.7 })
      r.text('Максимум', w / 2, cy + 0.5, { fill: PALETTE.good, size: 15, weight: 800, align: 'center', baseline: 'middle' })
      return
    }
    if (this.state.affordable) r.roundRect(PAD, by, bw, BUTTON_H, 10, { fill: PALETTE.accent })
    else r.roundRect(PAD, by, bw, BUTTON_H, 10, { stroke: PALETTE.surfaceRaised, lineWidth: 1.5 })
    this.drawPrice(r, this.state.price ?? [], w, cy)
  }

  private drawPrice(r: IRenderer, price: readonly PriceChip[], w: number, cy: number): void {
    const rows = price.length > 2 ? [price.slice(0, 2), price.slice(2)] : [price]
    const widthAt = (row: readonly PriceChip[], fontSize: number): number =>
      row.reduce((sum, chip) => sum + fontSize * 0.85 + 4 + r.measureText(String(chip.amount), { size: fontSize, weight: 800 }), 0) +
      CHIP_GAP * (row.length - 1)
    let size = rows.length > 1 ? 13 : 16
    while (size > 10 && Math.max(...rows.map((row) => widthAt(row, size))) > w - PAD * 2 - 16) size -= 0.5
    rows.forEach((row, index) => {
      const y = cy + (index - (rows.length - 1) / 2) * PRICE_ROW_H
      this.drawPriceRow(r, row, w / 2 - widthAt(row, size) / 2, y, size)
    })
  }

  private drawPriceRow(r: IRenderer, row: readonly PriceChip[], left: number, cy: number, size: number): void {
    let x = left
    for (const chip of row) {
      const icon = size * 0.85
      drawPearl(r, x + icon / 2, cy, icon, 1, chip.kind)
      x += icon + 4
      const label = String(chip.amount)
      const fill = this.state.affordable ? PALETTE.night : chip.enough ? PALETTE.ink : SHORT
      r.text(label, x, cy + 0.5, { fill, size, weight: 800, baseline: 'middle' })
      x += r.measureText(label, { size, weight: 800 }) + CHIP_GAP
    }
  }

  dispose(): void {
    this.activated.dispose()
  }
}
