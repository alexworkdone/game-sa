import { Signal, Widget } from '@sa/core'
import type { IReadonlySignal, IRenderer, UiTheme, WidgetBounds } from '@sa/core'
import { damp } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'

export type IconKind = 'pause' | 'restart'

export interface IconButtonOptions extends WidgetBounds {
  readonly icon: IconKind
  readonly theme?: UiTheme
}

export class IconButton extends Widget {
  private readonly icon: IconKind
  private readonly activated = new Signal<IconButton>()
  private scaleValue = 1

  constructor(options: IconButtonOptions) {
    super(options, options.theme ?? UI_THEME)
    this.icon = options.icon
  }

  get onActivate(): IReadonlySignal<IconButton> {
    return this.activated
  }

  protected override activate(): void {
    this.activated.emit(this)
  }

  override update(dt: number): void {
    this.scaleValue = damp(this.scaleValue, this.pressed ? 0.9 : 1, 0.0001, dt)
  }

  render(renderer: IRenderer): void {
    if (!this.visible) return
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2
    const unit = Math.min(this.width, this.height) * 0.26

    renderer.push()
    renderer.translate(centerX, centerY)
    renderer.scale(this.scaleValue, this.scaleValue)

    renderer.circle(0, 0, Math.min(this.width, this.height) / 2, {
      fill: this.pressed ? this.theme.surfaceActive : this.theme.surface,
      alpha: 0.55,
    })

    if (this.icon === 'pause') {
      const barWidth = unit * 0.42
      const barHeight = unit * 1.5
      renderer.roundRect(-unit * 0.55, -barHeight / 2, barWidth, barHeight, barWidth / 2, {
        fill: PALETTE.ink,
      })
      renderer.roundRect(unit * 0.13, -barHeight / 2, barWidth, barHeight, barWidth / 2, {
        fill: PALETTE.ink,
      })
    } else {
      const radius = unit * 0.82
      renderer.arc(0, 0, radius, -Math.PI * 0.62, Math.PI * 1.1, unit * 0.34, {
        stroke: PALETTE.ink,
      })
      const tipX = Math.cos(-Math.PI * 0.62) * radius
      const tipY = Math.sin(-Math.PI * 0.62) * radius
      const size = unit * 0.52
      renderer.polygon(
        [tipX - size * 0.2, tipY - size, tipX + size, tipY - size * 0.1, tipX - size * 0.5, tipY + size * 0.3],
        { fill: PALETTE.ink },
      )
    }

    renderer.pop()
  }

  dispose(): void {
    this.activated.dispose()
  }
}
