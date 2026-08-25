import type { IDisposable, IReadonlySignal } from '../types.js'

export type ViewportMode = 'fit' | 'expand'

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface ViewportMetrics {
  readonly width: number
  readonly height: number
  readonly scale: number
  readonly dpr: number
}

export interface IViewport extends IDisposable {
  readonly canvas: HTMLCanvasElement
  readonly mode: ViewportMode
  readonly width: number
  readonly height: number
  readonly safeArea: Rect
  readonly scale: number
  readonly offsetX: number
  readonly offsetY: number
  readonly dpr: number
  readonly onResize: IReadonlySignal<ViewportMetrics>
  toDesignX(clientX: number): number
  toDesignY(clientY: number): number
  refresh(): void
}
