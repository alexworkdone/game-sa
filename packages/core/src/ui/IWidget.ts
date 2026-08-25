import type { IRenderer } from '../render/IRenderer.js'

export interface IWidget {
  visible: boolean
  enabled: boolean
  update(dt: number): void
  render(renderer: IRenderer): void
  hitTest(x: number, y: number): boolean
  pointerDown(x: number, y: number): boolean
  pointerUp(x: number, y: number, inside: boolean): void
}

export interface UiTheme {
  readonly fontFamily?: string
  readonly text: string
  readonly textMuted: string
  readonly surface: string
  readonly surfaceActive: string
  readonly accent: string
  readonly radius: number
  readonly minTouchSize: number
}

export const defaultTheme: UiTheme = {
  text: '#f4f6fb',
  textMuted: '#8f97ad',
  surface: '#1c2030',
  surfaceActive: '#2a3145',
  accent: '#57e0a8',
  radius: 14,
  minTouchSize: 44,
}
