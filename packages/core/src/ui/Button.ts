import { Signal } from '../types.js'
import type { IReadonlySignal } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'
import { damp } from '../math/index.js'
import { Widget } from './Widget.js'
import type { WidgetBounds } from './Widget.js'
import type { UiTheme } from './IWidget.js'
import { defaultTheme } from './IWidget.js'

export interface ButtonOptions extends WidgetBounds {
  readonly label: string
  readonly theme?: UiTheme
  readonly fontSize?: number
  readonly variant?: 'solid' | 'ghost'
}

export class Button extends Widget {
  label: string

  private readonly activated = new Signal<Button>()
  private readonly fontSize: number
  private readonly variant: 'solid' | 'ghost'
  private scaleValue = 1

  constructor(options: ButtonOptions) {
    super(options, options.theme ?? defaultTheme)
    this.label = options.label
    this.fontSize = options.fontSize ?? 20
    this.variant = options.variant ?? 'solid'
  }

  get onActivate(): IReadonlySignal<Button> {
    return this.activated
  }

  protected override activate(): void {
    this.activated.emit(this)
  }

  override update(dt: number): void {
    const target = this.pressed ? 0.94 : 1
    this.scaleValue = damp(this.scaleValue, target, 0.0001, dt)
  }

  render(renderer: IRenderer): void {
    if (!this.visible) return
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2

    renderer.push()
    renderer.translate(centerX, centerY)
    renderer.scale(this.scaleValue, this.scaleValue)

    const alpha = this.enabled ? 1 : 0.4
    if (this.variant === 'solid') {
      renderer.roundRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
        this.theme.radius,
        { fill: this.pressed ? this.theme.surfaceActive : this.theme.surface, alpha },
      )
    } else {
      renderer.roundRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
        this.theme.radius,
        { stroke: this.theme.surfaceActive, lineWidth: 2, alpha },
      )
    }

    renderer.text(this.label, 0, 1, {
      fill: this.theme.text,
      size: this.fontSize,
      weight: 600,
      align: 'center',
      baseline: 'middle',
      alpha,
      ...(this.theme.fontFamily ? { family: this.theme.fontFamily } : {}),
    })

    renderer.pop()
  }

  dispose(): void {
    this.activated.dispose()
  }
}
