import { Signal } from '../types.js'
import type { IReadonlySignal } from '../types.js'
import type { IViewport, Rect, ViewportMetrics, ViewportMode } from './IViewport.js'

export interface ScaledViewportOptions {
  readonly canvas: HTMLCanvasElement
  readonly designWidth: number
  readonly designHeight: number
  readonly mode?: ViewportMode
  readonly maxDpr?: number
}

export class ScaledViewport implements IViewport {
  readonly canvas: HTMLCanvasElement
  readonly mode: ViewportMode

  private readonly designWidth: number
  private readonly designHeight: number
  private readonly maxDpr: number
  private readonly resized = new Signal<ViewportMetrics>()
  private readonly handleResize = () => this.refresh()

  private observer: ResizeObserver | null = null

  width: number
  height: number
  scale = 1
  offsetX = 0
  offsetY = 0
  dpr = 1
  safeArea: Rect

  constructor(options: ScaledViewportOptions) {
    this.canvas = options.canvas
    this.designWidth = options.designWidth
    this.designHeight = options.designHeight
    this.mode = options.mode ?? 'expand'
    this.maxDpr = options.maxDpr ?? 2
    this.width = options.designWidth
    this.height = options.designHeight
    this.safeArea = { x: 0, y: 0, width: options.designWidth, height: options.designHeight }

    window.addEventListener('resize', this.handleResize, { passive: true })
    window.addEventListener('orientationchange', this.handleResize, { passive: true })
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.handleResize)
      this.observer.observe(this.canvas)
    }
    this.refresh()
  }

  get onResize(): IReadonlySignal<ViewportMetrics> {
    return this.resized
  }

  refresh(): void {
    const rect = this.canvas.getBoundingClientRect()
    const cssWidth = Math.max(1, Math.round(rect.width || this.canvas.clientWidth || 1))
    const cssHeight = Math.max(1, Math.round(rect.height || this.canvas.clientHeight || 1))
    this.dpr = Math.min(this.maxDpr, window.devicePixelRatio || 1)

    const deviceWidth = Math.round(cssWidth * this.dpr)
    const deviceHeight = Math.round(cssHeight * this.dpr)
    if (this.canvas.width !== deviceWidth) this.canvas.width = deviceWidth
    if (this.canvas.height !== deviceHeight) this.canvas.height = deviceHeight

    const fitScale = Math.min(deviceWidth / this.designWidth, deviceHeight / this.designHeight)
    this.scale = fitScale

    if (this.mode === 'fit') {
      this.width = this.designWidth
      this.height = this.designHeight
      this.offsetX = (deviceWidth - this.designWidth * fitScale) / 2
      this.offsetY = (deviceHeight - this.designHeight * fitScale) / 2
      this.safeArea = { x: 0, y: 0, width: this.designWidth, height: this.designHeight }
    } else {
      this.width = deviceWidth / fitScale
      this.height = deviceHeight / fitScale
      this.offsetX = 0
      this.offsetY = 0
      this.safeArea = {
        x: (this.width - this.designWidth) / 2,
        y: (this.height - this.designHeight) / 2,
        width: this.designWidth,
        height: this.designHeight,
      }
    }

    this.resized.emit({
      width: this.width,
      height: this.height,
      scale: this.scale,
      dpr: this.dpr,
    })
  }

  toDesignX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect()
    const ratio = rect.width > 0 ? this.canvas.width / rect.width : 1
    return ((clientX - rect.left) * ratio - this.offsetX) / this.scale
  }

  toDesignY(clientY: number): number {
    const rect = this.canvas.getBoundingClientRect()
    const ratio = rect.height > 0 ? this.canvas.height / rect.height : 1
    return ((clientY - rect.top) * ratio - this.offsetY) / this.scale
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('orientationchange', this.handleResize)
    this.observer?.disconnect()
    this.observer = null
    this.resized.dispose()
  }
}
