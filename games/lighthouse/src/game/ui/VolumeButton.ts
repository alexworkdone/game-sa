import { Signal, Widget, damp } from '@sa/core'
import type { IReadonlySignal, IRenderer, WidgetBounds } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_SECONDARY_THEME } from '../config/theme.js'
import { VOLUME_LEVELS } from '../systems/VolumeControls.js'

const BAR_W = 5
const BAR_GAP = 3
const BAR_BASE = 6
const BAR_STEP = 4
const LABEL_GAP = 10

export class VolumeButton extends Widget {
  level = 0

  private readonly label: string
  private readonly activated = new Signal<VolumeButton>()
  private scaleValue = 1

  constructor(bounds: WidgetBounds, label: string) {
    super(bounds, UI_SECONDARY_THEME)
    this.label = label
  }

  get onActivate(): IReadonlySignal<VolumeButton> {
    return this.activated
  }

  protected override activate(): void {
    this.activated.emit(this)
  }

  override update(dt: number): void {
    this.scaleValue = damp(this.scaleValue, this.pressed ? 0.94 : 1, 0.0001, dt)
  }

  render(r: IRenderer): void {
    if (!this.visible) return
    r.push()
    r.translate(this.x + this.width / 2, this.y + this.height / 2)
    r.scale(this.scaleValue, this.scaleValue)
    r.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, this.theme.radius, {
      fill: this.pressed ? this.theme.surfaceActive : this.theme.surface,
    })
    const style = { size: 16, weight: 700 } as const
    const labelW = r.measureText(this.label, style)
    const barsW = VOLUME_LEVELS * BAR_W + (VOLUME_LEVELS - 1) * BAR_GAP
    const left = -(labelW + LABEL_GAP + barsW) / 2
    r.text(this.label, left, 1, { ...style, fill: this.level > 0 ? PALETTE.ink : PALETTE.inkMuted, baseline: 'middle' })
    const bottom = (BAR_BASE + BAR_STEP * (VOLUME_LEVELS - 1)) / 2
    for (let i = 0; i < VOLUME_LEVELS; i++) {
      const height = BAR_BASE + BAR_STEP * i
      r.roundRect(left + labelW + LABEL_GAP + i * (BAR_W + BAR_GAP), bottom - height, BAR_W, height, 1.5, {
        fill: i < this.level ? PALETTE.accent : PALETTE.night,
        alpha: i < this.level ? 1 : 0.6,
      })
    }
    r.pop()
  }

  dispose(): void {
    this.activated.dispose()
  }
}
