import type { IRenderer } from '../render/IRenderer.js'
import type { IWidget, UiTheme } from './IWidget.js'
import { defaultTheme } from './IWidget.js'

export interface WidgetBounds {
  x: number
  y: number
  width: number
  height: number
}

export abstract class Widget implements IWidget {
  visible = true
  enabled = true

  x: number
  y: number
  width: number
  height: number

  protected theme: UiTheme
  protected pressed = false

  constructor(bounds: WidgetBounds, theme: UiTheme = defaultTheme) {
    this.x = bounds.x
    this.y = bounds.y
    this.width = bounds.width
    this.height = bounds.height
    this.theme = theme
  }

  setTheme(theme: UiTheme): void {
    this.theme = theme
  }

  setBounds(bounds: Partial<WidgetBounds>): void {
    if (bounds.x !== undefined) this.x = bounds.x
    if (bounds.y !== undefined) this.y = bounds.y
    if (bounds.width !== undefined) this.width = bounds.width
    if (bounds.height !== undefined) this.height = bounds.height
  }

  hitTest(px: number, py: number): boolean {
    if (!this.visible || !this.enabled) return false
    const minSize = this.theme.minTouchSize
    const padX = Math.max(0, (minSize - this.width) / 2)
    const padY = Math.max(0, (minSize - this.height) / 2)
    return (
      px >= this.x - padX &&
      px <= this.x + this.width + padX &&
      py >= this.y - padY &&
      py <= this.y + this.height + padY
    )
  }

  pointerDown(px: number, py: number): boolean {
    if (!this.hitTest(px, py)) return false
    this.pressed = true
    return true
  }

  pointerUp(px: number, py: number, inside: boolean): void {
    const wasPressed = this.pressed
    this.pressed = false
    if (wasPressed && inside && this.hitTest(px, py)) this.activate()
  }

  protected activate(): void {
    /* override */
  }

  update(_dt: number): void {
    /* override */
  }

  abstract render(renderer: IRenderer): void
}
