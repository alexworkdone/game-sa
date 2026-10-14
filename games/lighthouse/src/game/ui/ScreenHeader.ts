import type { Button, IReadonlySignal, IRenderer, Rect } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { BUTTON_SIZES, createButton } from './Buttons.js'

export const HEADER = {
  side: 24,
  backW: 116,
  titleY: 42,
  subtitleY: 78,
  bottom: 98,
} as const

export interface HeaderLine {
  readonly text: string
  readonly fill: string
}

export class ScreenHeader {
  readonly back: Button

  constructor(backLabel = 'Меню') {
    this.back = createButton('', 'ghost', 'sm', HEADER.backW)
    this.backLabel = backLabel
  }

  set backLabel(label: string) {
    this.back.label = `← ${label}`
  }

  get onBack(): IReadonlySignal<Button> {
    return this.back.onActivate
  }

  get titleX(): number {
    return HEADER.side + HEADER.backW + 20
  }

  layout(safe: Rect): void {
    this.back.setBounds({ x: safe.x + HEADER.side, y: safe.y + HEADER.titleY - BUTTON_SIZES.sm.height / 2 })
  }

  render(r: IRenderer, safe: Rect, title: string, line: HeaderLine | null = null): void {
    r.text(title, safe.x + this.titleX, safe.y + HEADER.titleY, {
      fill: PALETTE.accent,
      size: 32,
      weight: 900,
      baseline: 'middle',
    })
    if (!line) return
    r.text(line.text, safe.x + HEADER.side + 2, safe.y + HEADER.subtitleY, {
      fill: line.fill,
      size: 14,
      weight: 700,
      baseline: 'middle',
    })
  }
}
