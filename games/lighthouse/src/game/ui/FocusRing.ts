import type { IInput, IRenderer, Widget } from '@sa/core'
import { PALETTE } from '../config/palette.js'

interface FocusEntry {
  readonly widget: Widget
  readonly activate: () => void
  readonly adjust?: (delta: number) => void
}

export class FocusRing {
  private entries: FocusEntry[] = []
  private columns = 1
  private keyboard = false
  index = 0

  set(entries: FocusEntry[], columns = 1): void {
    this.entries = entries
    this.columns = Math.max(1, columns)
    this.index = Math.min(this.index, Math.max(0, entries.length - 1))
  }

  focus(index: number): void {
    this.index = Math.max(0, Math.min(this.entries.length - 1, index))
  }

  handle(input: IInput): boolean {
    if (input.justPressed) this.keyboard = false
    if (this.entries.length === 0) return false
    const move = (delta: number): void => {
      this.keyboard = true
      this.index = (this.index + delta + this.entries.length) % this.entries.length
    }
    const horizontal = (delta: number): void => {
      const adjust = this.entries[this.index]?.adjust
      if (!adjust) {
        move(delta)
        return
      }
      this.keyboard = true
      adjust(delta)
    }
    if (input.wasKeyPressed('ArrowRight') || input.wasKeyPressed('KeyD')) horizontal(1)
    if (input.wasKeyPressed('ArrowLeft') || input.wasKeyPressed('KeyA')) horizontal(-1)
    if (input.wasKeyPressed('ArrowDown') || input.wasKeyPressed('KeyS')) move(this.columns)
    if (input.wasKeyPressed('ArrowUp') || input.wasKeyPressed('KeyW')) move(-this.columns)
    if (input.wasKeyPressed('Enter') || input.wasKeyPressed('Space')) {
      this.keyboard = true
      this.entries[this.index]?.activate()
      return true
    }
    return false
  }

  render(r: IRenderer, time: number): void {
    if (!this.keyboard) return
    const entry = this.entries[this.index]
    if (!entry || !entry.widget.visible) return
    const w = entry.widget
    const pad = 4 + Math.sin(time * 6) * 1.2
    r.roundRect(w.x - pad, w.y - pad, w.width + pad * 2, w.height + pad * 2, 14, {
      stroke: PALETTE.accent,
      lineWidth: 2.5,
    })
  }
}
