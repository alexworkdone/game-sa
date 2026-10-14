import { Signal, Widget, damp } from '@sa/core'
import type { IReadonlySignal, IRenderer, UiTheme, WidgetBounds } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'

export type IconKind = 'pause' | 'sound' | 'music' | 'profile' | 'exchange'

export interface IconButtonOptions extends WidgetBounds {
  readonly icon: IconKind
  readonly theme?: UiTheme
}

export class IconButton extends Widget {
  icon: IconKind
  level = 3

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
    this.scaleValue = damp(this.scaleValue, this.pressed ? 0.88 : 1, 0.0001, dt)
  }

  render(r: IRenderer): void {
    if (!this.visible) return
    const size = Math.min(this.width, this.height)
    const u = size * 0.26
    r.push()
    r.translate(this.x + this.width / 2, this.y + this.height / 2)
    r.scale(this.scaleValue, this.scaleValue)
    r.circle(0, 0, size / 2, {
      fill: this.pressed ? this.theme.surfaceActive : this.theme.surface,
      alpha: 0.8,
    })
    const ink = { fill: PALETTE.ink }
    switch (this.icon) {
      case 'pause':
        r.roundRect(-u * 0.6, -u * 0.75, u * 0.42, u * 1.5, u * 0.2, ink)
        r.roundRect(u * 0.18, -u * 0.75, u * 0.42, u * 1.5, u * 0.2, ink)
        break
      case 'profile':
        r.ring(0, -u * 0.46, u * 0.42, u * 0.15, { stroke: PALETTE.ink })
        r.arc(0, u * 0.92, u * 0.8, Math.PI * 1.08, Math.PI * 1.92, u * 0.15, { stroke: PALETTE.ink })
        break
      case 'sound':
        this.drawSound(r, u)
        break
      case 'music':
        this.drawMusic(r, u)
        break
      case 'exchange':
        this.drawExchange(r, u)
        break
    }
    r.pop()
  }

  private drawSound(r: IRenderer, u: number): void {
    const x = -u * 0.35
    r.polygon(
      [x - u * 0.9, -u * 0.35, x - u * 0.4, -u * 0.35, x + u * 0.1, -u * 0.8, x + u * 0.1, u * 0.8, x - u * 0.4, u * 0.35, x - u * 0.9, u * 0.35],
      { fill: PALETTE.ink },
    )
    if (this.level === 0) {
      r.line(x + u * 0.45, -u * 0.4, x + u * 1.15, u * 0.4, u * 0.18, { stroke: PALETTE.danger })
      r.line(x + u * 0.45, u * 0.4, x + u * 1.15, -u * 0.4, u * 0.18, { stroke: PALETTE.danger })
      return
    }
    for (let i = 0; i < this.level; i++) {
      r.arc(x + u * 0.2, 0, u * (0.5 + i * 0.4), -0.8, 0.8, u * 0.16, { stroke: PALETTE.ink })
    }
  }

  private drawExchange(r: IRenderer, u: number): void {
    const stroke = { stroke: PALETTE.ink }
    const width = u * 0.16
    r.line(-u * 0.85, -u * 0.4, u * 0.75, -u * 0.4, width, stroke)
    r.line(u * 0.75, -u * 0.4, u * 0.4, -u * 0.75, width, stroke)
    r.line(-u * 0.75, u * 0.4, u * 0.85, u * 0.4, width, stroke)
    r.line(-u * 0.75, u * 0.4, -u * 0.4, u * 0.75, width, stroke)
  }

  private drawMusic(r: IRenderer, u: number): void {
    const x = -u * 0.3
    r.circle(x - u * 0.38, u * 0.55, u * 0.3, { fill: PALETTE.ink })
    r.line(x - u * 0.1, u * 0.55, x - u * 0.1, -u * 0.85, u * 0.15, { stroke: PALETTE.ink })
    r.line(x - u * 0.1, -u * 0.85, x + u * 0.55, -u * 0.5, u * 0.15, { stroke: PALETTE.ink })
    if (this.level === 0) {
      r.line(-u * 0.95, -u * 0.85, u * 0.75, u * 0.85, u * 0.18, { stroke: PALETTE.danger })
      return
    }
    for (let i = 0; i < 3; i++) {
      const height = u * (0.35 + i * 0.25)
      r.roundRect(u * (0.45 + i * 0.3), u * 0.85 - height, u * 0.18, height, u * 0.06, {
        fill: i < this.level ? PALETTE.ink : PALETTE.inkMuted,
        alpha: i < this.level ? 1 : 0.4,
      })
    }
  }

  dispose(): void {
    this.activated.dispose()
  }
}
