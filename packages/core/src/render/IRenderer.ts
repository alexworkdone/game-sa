import type { IDisposable } from '../types.js'

export interface ShapeStyle {
  readonly fill?: string
  readonly stroke?: string
  readonly lineWidth?: number
  readonly alpha?: number
  readonly blend?: GlobalCompositeOperation
  readonly glow?: string
  readonly glowSize?: number
}

export type TextAlign = 'left' | 'center' | 'right'
export type TextBaseline = 'top' | 'middle' | 'bottom' | 'alphabetic'

export interface TextStyle extends ShapeStyle {
  readonly size?: number
  readonly family?: string
  readonly weight?: string | number
  readonly align?: TextAlign
  readonly baseline?: TextBaseline
}

export interface IRenderer extends IDisposable {
  readonly width: number
  readonly height: number

  begin(): void
  end(): void
  clear(color?: string): void

  push(): void
  pop(): void
  translate(x: number, y: number): void
  rotate(radians: number): void
  scale(x: number, y: number): void
  alpha(value: number): void

  circle(x: number, y: number, radius: number, style: ShapeStyle): void
  ring(x: number, y: number, radius: number, thickness: number, style: ShapeStyle): void
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    thickness: number,
    style: ShapeStyle,
  ): void
  rect(x: number, y: number, width: number, height: number, style: ShapeStyle): void
  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    style: ShapeStyle,
  ): void
  line(x1: number, y1: number, x2: number, y2: number, thickness: number, style: ShapeStyle): void
  polygon(points: ArrayLike<number>, style: ShapeStyle): void
  capsule(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
    style: ShapeStyle,
  ): void
  text(value: string, x: number, y: number, style: TextStyle): void
  measureText(value: string, style: TextStyle): number
}
