import type { IDisposable } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'
import type { IInput } from '../input/IInput.js'
import type { IWidget } from './IWidget.js'

export class UiLayer implements IDisposable {
  private readonly widgets: IWidget[] = []
  private captured: IWidget | null = null

  add<T extends IWidget>(widget: T): T {
    this.widgets.push(widget)
    return widget
  }

  remove(widget: IWidget): void {
    const index = this.widgets.indexOf(widget)
    if (index >= 0) this.widgets.splice(index, 1)
    if (this.captured === widget) this.captured = null
  }

  clear(): void {
    this.widgets.length = 0
    this.captured = null
  }

  handleInput(input: IInput): boolean {
    let consumed = false
    if (input.justPressed) {
      for (let i = this.widgets.length - 1; i >= 0; i--) {
        const widget = this.widgets[i] as IWidget
        if (widget.pointerDown(input.x, input.y)) {
          this.captured = widget
          consumed = true
          break
        }
      }
    }
    if (input.justReleased && this.captured) {
      const widget = this.captured
      this.captured = null
      widget.pointerUp(input.x, input.y, true)
      consumed = true
    }
    return consumed
  }

  update(dt: number): void {
    for (const widget of this.widgets) widget.update(dt)
  }

  render(renderer: IRenderer): void {
    for (const widget of this.widgets) {
      if (widget.visible) widget.render(renderer)
    }
  }

  dispose(): void {
    this.clear()
  }
}
