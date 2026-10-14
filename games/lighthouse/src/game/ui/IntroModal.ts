import { Button, Signal, UiLayer } from '@sa/core'
import type { IInput, IReadonlySignal, IRenderer, TextStyle, Widget } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_PRIMARY_THEME } from '../config/theme.js'
import { wrapText } from './TextWrap.js'

export interface IntroContent {
  readonly caption?: string
  readonly title: string
  readonly lines: readonly string[]
}

const WIDTH = 440
const PAD = 28
const LINE_H = 21
const PARAGRAPH_GAP = 10
const BUTTON_W = 190
const BUTTON_H = 46
const INPUT_DELAY = 0.35
const FADE_TIME = 0.22
const BODY: TextStyle = { size: 15, weight: 600 }

export class IntroModal {
  private readonly ui = new UiLayer()
  private readonly ok: Button
  private readonly closed = new Signal<void>()
  private content: IntroContent | null = null
  private spotlight: Widget | null = null
  private age = 0

  constructor() {
    this.ok = new Button({
      x: 0,
      y: 0,
      width: BUTTON_W,
      height: BUTTON_H,
      label: 'Зрозуміло',
      theme: UI_PRIMARY_THEME,
      fontSize: 18,
    })
    this.ok.onActivate.on(() => this.close())
    this.ui.add(this.ok)
  }

  get open(): boolean {
    return this.content !== null
  }

  get onClose(): IReadonlySignal<void> {
    return this.closed
  }

  show(content: IntroContent, spotlight: Widget | null): void {
    this.content = content
    this.spotlight = spotlight
    this.age = 0
  }

  update(dt: number, input: IInput): void {
    if (!this.content) return
    this.age += dt
    this.ui.update(dt)
    if (this.age < INPUT_DELAY) return
    if (this.ui.handleInput(input)) return
    if (input.wasKeyPressed('Enter') || input.wasKeyPressed('Space') || input.wasKeyPressed('Escape')) this.close()
  }

  private close(): void {
    if (!this.content) return
    this.content = null
    this.spotlight = null
    this.closed.emit()
  }

  render(r: IRenderer, width: number, height: number, centerX: number, time: number): void {
    const content = this.content
    if (!content) return
    const fade = Math.min(1, this.age / FADE_TIME)
    r.rect(0, 0, width, height, { fill: PALETTE.background, alpha: 0.8 * fade })
    this.drawSpotlight(r, time, fade)

    const paragraphs = content.lines.map((line) => wrapText(r, line, WIDTH - PAD * 2, BODY))
    const bodyHeight =
      paragraphs.reduce((sum, rows) => sum + rows.length * LINE_H, 0) + PARAGRAPH_GAP * (paragraphs.length - 1)
    const panelH = PAD + 18 + 38 + 18 + bodyHeight + 26 + BUTTON_H + PAD
    const x = centerX - WIDTH / 2
    const y = height / 2 - panelH / 2 + (1 - fade) * 14

    r.push()
    r.alpha(fade)
    r.roundRect(x, y, WIDTH, panelH, 18, { fill: PALETTE.surface, alpha: 0.97 })
    r.roundRect(x, y, WIDTH, panelH, 18, { stroke: PALETTE.accent, lineWidth: 2, glow: PALETTE.accent, glowSize: 12 })
    let cy = y + PAD + 9
    r.text(content.caption ?? 'НОВЕ В МЕНЮ', centerX, cy, {
      fill: PALETTE.accent,
      size: 13,
      weight: 800,
      align: 'center',
      baseline: 'middle',
    })
    cy += 9 + 19
    r.text(content.title, centerX, cy, {
      fill: PALETTE.ink,
      size: 28,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })
    cy += 19 + 18
    for (const rows of paragraphs) {
      for (const row of rows) {
        r.text(row, x + PAD, cy + LINE_H / 2, { ...BODY, fill: PALETTE.ink, baseline: 'middle' })
        cy += LINE_H
      }
      cy += PARAGRAPH_GAP
    }
    this.ok.setBounds({ x: centerX - BUTTON_W / 2, y: y + panelH - PAD - BUTTON_H })
    this.ui.render(r)
    r.pop()
  }

  private drawSpotlight(r: IRenderer, time: number, fade: number): void {
    const target = this.spotlight
    if (!target) return
    target.render(r)
    const pad = 7 + Math.sin(time * 5) * 2
    r.roundRect(target.x - pad, target.y - pad, target.width + pad * 2, target.height + pad * 2, 16, {
      stroke: PALETTE.accent,
      lineWidth: 2.5,
      alpha: fade,
      glow: PALETTE.accent,
      glowSize: 14,
    })
  }
}
