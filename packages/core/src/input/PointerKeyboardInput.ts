import { Signal } from '../types.js'
import type { IReadonlySignal } from '../types.js'
import type { IViewport } from '../viewport/IViewport.js'
import type { IInput, PointerSample } from './IInput.js'

export interface PointerKeyboardInputOptions {
  readonly viewport: IViewport
  readonly target?: HTMLElement
  readonly leftKeys?: readonly string[]
  readonly rightKeys?: readonly string[]
  readonly upKeys?: readonly string[]
  readonly downKeys?: readonly string[]
}

export class PointerKeyboardInput implements IInput {
  private readonly viewport: IViewport
  private readonly target: HTMLElement
  private readonly leftKeys: readonly string[]
  private readonly rightKeys: readonly string[]
  private readonly upKeys: readonly string[]
  private readonly downKeys: readonly string[]

  private readonly keysDown = new Set<string>()
  private readonly keysPressed = new Set<string>()
  private readonly firstInteraction = new Signal<PointerSample>()
  private readonly press = new Signal<PointerSample>()
  private readonly release = new Signal<PointerSample>()

  private enabled = true
  private activePointer: number | null = null

  x = 0
  y = 0
  isDown = false
  justPressed = false
  justReleased = false
  hasInteracted = false

  constructor(options: PointerKeyboardInputOptions) {
    this.viewport = options.viewport
    this.target = options.target ?? options.viewport.canvas
    this.leftKeys = options.leftKeys ?? ['ArrowLeft', 'KeyA']
    this.rightKeys = options.rightKeys ?? ['ArrowRight', 'KeyD']
    this.upKeys = options.upKeys ?? ['ArrowUp', 'KeyW']
    this.downKeys = options.downKeys ?? ['ArrowDown', 'KeyS']

    this.target.style.touchAction = 'none'
    this.target.addEventListener('pointerdown', this.onPointerDown)
    this.target.addEventListener('pointermove', this.onPointerMove, { passive: true })
    this.target.addEventListener('pointerup', this.onPointerUp)
    this.target.addEventListener('pointercancel', this.onPointerUp)
    this.target.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  get onFirstInteraction(): IReadonlySignal<PointerSample> {
    return this.firstInteraction
  }

  get onPress(): IReadonlySignal<PointerSample> {
    return this.press
  }

  get onRelease(): IReadonlySignal<PointerSample> {
    return this.release
  }

  private sample(pointerId: number): PointerSample {
    return { x: this.x, y: this.y, pointerId }
  }

  private markInteraction(sample: PointerSample): void {
    if (this.hasInteracted) return
    this.hasInteracted = true
    this.firstInteraction.emit(sample)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return
    event.preventDefault()
    if (this.activePointer !== null) return
    this.activePointer = event.pointerId
    this.x = this.viewport.toDesignX(event.clientX)
    this.y = this.viewport.toDesignY(event.clientY)
    this.isDown = true
    this.justPressed = true
    try {
      this.target.setPointerCapture(event.pointerId)
    } catch {
      /* capture unsupported */
    }
    const sample = this.sample(event.pointerId)
    this.markInteraction(sample)
    this.press.emit(sample)
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return
    if (this.activePointer !== null && event.pointerId !== this.activePointer) return
    this.x = this.viewport.toDesignX(event.clientX)
    this.y = this.viewport.toDesignY(event.clientY)
    if (event.pointerType === 'mouse') this.markInteraction(this.sample(event.pointerId))
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.enabled) return
    if (this.activePointer !== null && event.pointerId !== this.activePointer) return
    this.activePointer = null
    this.isDown = false
    this.justReleased = true
    this.release.emit(this.sample(event.pointerId))
  }

  private readonly onContextMenu = (event: Event): void => {
    event.preventDefault()
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault()
    if (!this.keysDown.has(event.code)) this.keysPressed.add(event.code)
    this.keysDown.add(event.code)
    this.markInteraction(this.sample(-1))
  }

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keysDown.delete(event.code)
  }

  private readonly onBlur = (): void => {
    this.keysDown.clear()
    if (this.isDown) {
      this.isDown = false
      this.justReleased = true
      this.release.emit(this.sample(this.activePointer ?? -1))
    }
    this.activePointer = null
  }

  isKeyDown(code: string): boolean {
    return this.keysDown.has(code)
  }

  wasKeyPressed(code: string): boolean {
    return this.keysPressed.has(code)
  }

  private axis(negative: readonly string[], positive: readonly string[]): number {
    let value = 0
    for (const code of negative) if (this.keysDown.has(code)) value -= 1
    for (const code of positive) if (this.keysDown.has(code)) value += 1
    return Math.sign(value)
  }

  axisX(): number {
    return this.axis(this.leftKeys, this.rightKeys)
  }

  axisY(): number {
    return this.axis(this.upKeys, this.downKeys)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.onBlur()
  }

  update(): void {
    this.justPressed = false
    this.justReleased = false
    this.keysPressed.clear()
  }

  dispose(): void {
    this.target.removeEventListener('pointerdown', this.onPointerDown)
    this.target.removeEventListener('pointermove', this.onPointerMove)
    this.target.removeEventListener('pointerup', this.onPointerUp)
    this.target.removeEventListener('pointercancel', this.onPointerUp)
    this.target.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.firstInteraction.dispose()
    this.press.dispose()
    this.release.dispose()
  }
}
