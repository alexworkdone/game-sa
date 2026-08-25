import { Signal, Widget } from '@sa/core'
import type { IReadonlySignal, IRenderer, WidgetBounds } from '@sa/core'
import { damp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'

interface TextRun {
  readonly text: string
  readonly color: string
}

export class ExtractButton extends Widget {
  energy = 0

  private readonly activated = new Signal<ExtractButton>()
  private scaleValue = 1
  private blink = 0

  constructor(bounds: WidgetBounds) {
    super(bounds, UI_THEME)
  }

  get onActivate(): IReadonlySignal<ExtractButton> {
    return this.activated
  }

  get ready(): boolean {
    return this.energy >= BALANCE.plasma.teleportCost
  }

  get delivered(): number {
    return Math.max(0, this.energy - BALANCE.plasma.teleportCost)
  }

  protected override activate(): void {
    if (this.ready) this.activated.emit(this)
  }

  override hitTest(px: number, py: number): boolean {
    return this.ready && super.hitTest(px, py)
  }

  override update(dt: number): void {
    this.enabled = this.ready
    this.blink += dt
    this.scaleValue = damp(this.scaleValue, this.pressed ? 0.95 : 1, 0.0001, dt)
  }

  private runs(): TextRun[] {
    const required = BALANCE.plasma.teleportCost
    if (this.ready) {
      return [
        { text: 'Повернутися на базу — ', color: PALETTE.ink },
        { text: `${this.delivered.toFixed(1)} ГДж`, color: PALETTE.reward },
      ]
    }
    return [
      { text: 'Потрібен ', color: PALETTE.inkMuted },
      { text: `${required} ГДж`, color: PALETTE.hostile },
      { text: ' для телепортації', color: PALETTE.inkMuted },
    ]
  }

  render(renderer: IRenderer): void {
    if (!this.visible) return
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2
    const size = 14

    renderer.push()
    renderer.translate(centerX, centerY)
    renderer.scale(this.scaleValue, this.scaleValue)

    renderer.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 13, {
      fill: this.pressed ? this.theme.surfaceActive : this.theme.surface,
      alpha: this.ready ? 1 : 0.45,
      ...(this.ready ? {} : { stroke: PALETTE.hostile, lineWidth: 1 }),
    })

    const runs = this.runs()
    const style = { size, weight: 600 as const, align: 'left' as const, baseline: 'middle' as const }
    let total = 0
    for (const run of runs) total += renderer.measureText(run.text, style)

    let cursor = -total / 2
    for (const run of runs) {
      renderer.text(run.text, cursor, 1, { ...style, fill: run.color })
      cursor += renderer.measureText(run.text, style)
    }

    if (!this.ready) {
      const alpha = 0.35 + Math.sin(this.blink * 7) * 0.35
      renderer.circle(this.width / 2 - 11, -this.height / 2 + 11, 3.5, {
        fill: PALETTE.hostile,
        alpha: Math.max(0, alpha),
        glow: PALETTE.hostile,
        glowSize: 10,
      })
    }

    renderer.pop()
  }

  dispose(): void {
    this.activated.dispose()
  }
}
