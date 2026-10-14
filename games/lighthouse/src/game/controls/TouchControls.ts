import type { IRenderer, IViewport } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { IControls } from './IControls.js'

type TouchButtonId = 'left' | 'right' | 'up' | 'down' | 'fire' | 'reload'

interface TouchButton {
  readonly id: TouchButtonId
  x: number
  y: number
  radius: number
  held: boolean
}

interface Area {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

const HIT_SLACK = 1.35

export class TouchControls implements IControls {
  visible = false

  private readonly viewport: IViewport
  private readonly target: HTMLElement
  private readonly pointers = new Map<number, { x: number; y: number }>()
  private readonly buttons: TouchButton[] = (
    ['left', 'right', 'up', 'down', 'fire', 'reload'] as const
  ).map((id) => ({ id, x: 0, y: 0, radius: 0, held: false }))

  private fireEdge = false
  private reloadEdge = false
  private enabled = true

  constructor(viewport: IViewport) {
    this.viewport = viewport
    this.target = viewport.canvas
    this.target.addEventListener('pointerdown', this.onDown)
    this.target.addEventListener('pointermove', this.onMove)
    this.target.addEventListener('pointerup', this.onUp)
    this.target.addEventListener('pointercancel', this.onUp)
  }

  layout(area: Area): void {
    const unit = this.viewport.dpr / this.viewport.scale
    const pad = 34 * unit
    const step = 62 * unit
    const padX = area.x + pad + step * 1.15
    const padY = area.y + area.height - pad - step * 1.15
    const place = (id: TouchButtonId, x: number, y: number, radius: number): void => {
      const button = this.button(id)
      button.x = x
      button.y = y
      button.radius = radius
    }
    place('left', padX - step, padY, 30 * unit)
    place('right', padX + step, padY, 30 * unit)
    place('up', padX, padY - step, 30 * unit)
    place('down', padX, padY + step, 30 * unit)
    place('fire', area.x + area.width - pad - 52 * unit, area.y + area.height - pad - 52 * unit, 48 * unit)
    place('reload', area.x + area.width - pad - 150 * unit, area.y + area.height - pad - 20 * unit, 26 * unit)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.pointers.clear()
      this.refresh()
    }
  }

  private button(id: TouchButtonId): TouchButton {
    return this.buttons.find((button) => button.id === id) as TouchButton
  }

  private held(id: TouchButtonId): boolean {
    return this.button(id).held
  }

  get moveX(): number {
    return (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0)
  }

  get moveY(): number {
    return (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0)
  }

  get fireHeld(): boolean {
    return this.held('fire')
  }

  get firePressed(): boolean {
    return this.fireEdge
  }

  get reloadPressed(): boolean {
    return this.reloadEdge
  }

  get pausePressed(): boolean {
    return false
  }

  endStep(): void {
    this.fireEdge = false
    this.reloadEdge = false
  }

  private isTouch(event: PointerEvent): boolean {
    return event.pointerType === 'touch' || event.pointerType === 'pen'
  }

  private readonly onDown = (event: PointerEvent): void => {
    if (!this.isTouch(event)) return
    this.visible = true
    if (!this.enabled) return
    this.pointers.set(event.pointerId, this.toDesign(event))
    this.refresh()
  }

  private readonly onMove = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) return
    this.pointers.set(event.pointerId, this.toDesign(event))
    this.refresh()
  }

  private readonly onUp = (event: PointerEvent): void => {
    if (!this.pointers.delete(event.pointerId)) return
    this.refresh()
  }

  private toDesign(event: PointerEvent): { x: number; y: number } {
    return {
      x: this.viewport.toDesignX(event.clientX),
      y: this.viewport.toDesignY(event.clientY),
    }
  }

  private refresh(): void {
    const wasFire = this.held('fire')
    const wasReload = this.held('reload')
    for (const button of this.buttons) button.held = false
    for (const point of this.pointers.values()) {
      let best: TouchButton | null = null
      let bestDistance = Number.POSITIVE_INFINITY
      for (const button of this.buttons) {
        const distance = Math.hypot(point.x - button.x, point.y - button.y)
        if (distance > button.radius * HIT_SLACK || distance >= bestDistance) continue
        best = button
        bestDistance = distance
      }
      if (best) best.held = true
    }
    if (!wasFire && this.held('fire')) this.fireEdge = true
    if (!wasReload && this.held('reload')) this.reloadEdge = true
  }

  render(renderer: IRenderer): void {
    if (!this.visible) return
    for (const button of this.buttons) {
      const { x, y, radius } = button
      renderer.circle(x, y, radius, {
        fill: button.id === 'fire' ? PALETTE.flare : PALETTE.ink,
        alpha: button.held ? 0.32 : 0.12,
      })
      renderer.ring(x, y, radius, Math.max(1.5, radius * 0.06), {
        stroke: PALETTE.ink,
        alpha: button.held ? 0.7 : 0.35,
      })
      this.drawGlyph(renderer, button)
    }
  }

  private drawGlyph(renderer: IRenderer, button: TouchButton): void {
    const { x, y, radius } = button
    const s = radius * 0.42
    const style = { fill: PALETTE.ink, alpha: button.held ? 0.95 : 0.7 }
    switch (button.id) {
      case 'left':
        renderer.polygon([x - s, y, x + s * 0.6, y - s, x + s * 0.6, y + s], style)
        return
      case 'right':
        renderer.polygon([x + s, y, x - s * 0.6, y - s, x - s * 0.6, y + s], style)
        return
      case 'up':
        renderer.polygon([x, y - s, x - s, y + s * 0.6, x + s, y + s * 0.6], style)
        return
      case 'down':
        renderer.polygon([x, y + s, x - s, y - s * 0.6, x + s, y - s * 0.6], style)
        return
      case 'fire':
        renderer.circle(x, y, s * 0.7, { fill: PALETTE.flareCore, alpha: style.alpha })
        renderer.ring(x, y, s * 1.25, s * 0.18, { stroke: PALETTE.flareCore, alpha: style.alpha })
        return
      case 'reload':
        renderer.arc(x, y, s, -Math.PI * 0.2, Math.PI * 1.4, s * 0.28, {
          stroke: PALETTE.ink,
          alpha: style.alpha,
        })
        renderer.polygon(
          [x + s * 1.05, y - s * 0.9, x + s * 1.2, y + s * 0.05, x + s * 0.35, y - s * 0.35],
          style,
        )
        return
    }
  }

  dispose(): void {
    this.target.removeEventListener('pointerdown', this.onDown)
    this.target.removeEventListener('pointermove', this.onMove)
    this.target.removeEventListener('pointerup', this.onUp)
    this.target.removeEventListener('pointercancel', this.onUp)
    this.pointers.clear()
  }
}
