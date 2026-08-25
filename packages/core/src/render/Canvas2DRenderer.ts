import type { IViewport } from '../viewport/IViewport.js'
import type { IRenderer, ShapeStyle, TextStyle } from './IRenderer.js'

export interface Canvas2DRendererOptions {
  readonly viewport: IViewport
  readonly defaultFontFamily?: string
  readonly alpha?: boolean
}

export class Canvas2DRenderer implements IRenderer {
  private readonly viewport: IViewport
  private readonly context: CanvasRenderingContext2D
  private readonly fontFamily: string

  constructor(options: Canvas2DRendererOptions) {
    const context = options.viewport.canvas.getContext('2d', {
      alpha: options.alpha ?? false,
      desynchronized: true,
    })
    if (!context) throw new Error('Canvas2DRenderer: 2d context unavailable')
    this.viewport = options.viewport
    this.context = context
    this.fontFamily =
      options.defaultFontFamily ??
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  }

  get width(): number {
    return this.viewport.width
  }

  get height(): number {
    return this.viewport.height
  }

  begin(): void {
    const { scale, offsetX, offsetY } = this.viewport
    this.context.setTransform(scale, 0, 0, scale, offsetX, offsetY)
    this.context.globalAlpha = 1
    this.context.globalCompositeOperation = 'source-over'
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
  }

  end(): void {
    this.context.setTransform(1, 0, 0, 1, 0, 0)
  }

  clear(color?: string): void {
    const { canvas } = this.viewport
    this.context.save()
    this.context.setTransform(1, 0, 0, 1, 0, 0)
    if (color) {
      this.context.fillStyle = color
      this.context.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      this.context.clearRect(0, 0, canvas.width, canvas.height)
    }
    this.context.restore()
  }

  push(): void {
    this.context.save()
  }

  pop(): void {
    this.context.restore()
  }

  translate(x: number, y: number): void {
    this.context.translate(x, y)
  }

  rotate(radians: number): void {
    this.context.rotate(radians)
  }

  scale(x: number, y: number): void {
    this.context.scale(x, y)
  }

  alpha(value: number): void {
    this.context.globalAlpha = value
  }

  private applyStyle(style: ShapeStyle): void {
    this.context.globalAlpha = style.alpha ?? 1
    this.context.globalCompositeOperation = style.blend ?? 'source-over'
    if (style.glow) {
      this.context.shadowColor = style.glow
      this.context.shadowBlur = style.glowSize ?? 12
    } else {
      this.context.shadowBlur = 0
      this.context.shadowColor = 'transparent'
    }
  }

  private paint(style: ShapeStyle): void {
    if (style.fill) {
      this.context.fillStyle = style.fill
      this.context.fill()
    }
    if (style.stroke) {
      this.context.strokeStyle = style.stroke
      this.context.lineWidth = style.lineWidth ?? 1
      this.context.stroke()
    }
    this.context.globalAlpha = 1
    this.context.globalCompositeOperation = 'source-over'
    this.context.shadowBlur = 0
  }

  circle(x: number, y: number, radius: number, style: ShapeStyle): void {
    this.applyStyle(style)
    this.context.beginPath()
    this.context.arc(x, y, Math.max(0, radius), 0, Math.PI * 2)
    this.paint(style)
  }

  ring(x: number, y: number, radius: number, thickness: number, style: ShapeStyle): void {
    this.arc(x, y, radius, 0, Math.PI * 2, thickness, style)
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    thickness: number,
    style: ShapeStyle,
  ): void {
    this.applyStyle(style)
    this.context.beginPath()
    this.context.arc(x, y, Math.max(0, radius), startAngle, endAngle)
    this.context.strokeStyle = style.stroke ?? style.fill ?? '#fff'
    this.context.lineWidth = thickness
    this.context.stroke()
    this.context.globalAlpha = 1
    this.context.globalCompositeOperation = 'source-over'
    this.context.shadowBlur = 0
  }

  rect(x: number, y: number, width: number, height: number, style: ShapeStyle): void {
    this.applyStyle(style)
    this.context.beginPath()
    this.context.rect(x, y, width, height)
    this.paint(style)
  }

  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    style: ShapeStyle,
  ): void {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2)
    this.applyStyle(style)
    this.context.beginPath()
    this.context.moveTo(x + r, y)
    this.context.arcTo(x + width, y, x + width, y + height, r)
    this.context.arcTo(x + width, y + height, x, y + height, r)
    this.context.arcTo(x, y + height, x, y, r)
    this.context.arcTo(x, y, x + width, y, r)
    this.context.closePath()
    this.paint(style)
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number,
    style: ShapeStyle,
  ): void {
    this.applyStyle(style)
    this.context.beginPath()
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.strokeStyle = style.stroke ?? style.fill ?? '#fff'
    this.context.lineWidth = thickness
    this.context.stroke()
    this.context.globalAlpha = 1
    this.context.globalCompositeOperation = 'source-over'
    this.context.shadowBlur = 0
  }

  capsule(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
    style: ShapeStyle,
  ): void {
    this.line(x1, y1, x2, y2, radius * 2, {
      ...style,
      stroke: style.stroke ?? style.fill ?? '#fff',
    })
  }

  polygon(points: ArrayLike<number>, style: ShapeStyle): void {
    if (points.length < 4) return
    this.applyStyle(style)
    this.context.beginPath()
    this.context.moveTo(points[0] as number, points[1] as number)
    for (let i = 2; i < points.length; i += 2) {
      this.context.lineTo(points[i] as number, points[i + 1] as number)
    }
    this.context.closePath()
    this.paint(style)
  }

  private applyFont(style: TextStyle): void {
    const weight = style.weight ?? 400
    const size = style.size ?? 16
    this.context.font = `${weight} ${size}px ${style.family ?? this.fontFamily}`
    this.context.textAlign = style.align ?? 'left'
    this.context.textBaseline = style.baseline ?? 'alphabetic'
  }

  text(value: string, x: number, y: number, style: TextStyle): void {
    this.applyStyle(style)
    this.applyFont(style)
    if (style.stroke) {
      this.context.strokeStyle = style.stroke
      this.context.lineWidth = style.lineWidth ?? 1
      this.context.strokeText(value, x, y)
    }
    if (style.fill || !style.stroke) {
      this.context.fillStyle = style.fill ?? '#fff'
      this.context.fillText(value, x, y)
    }
    this.context.globalAlpha = 1
    this.context.globalCompositeOperation = 'source-over'
    this.context.shadowBlur = 0
  }

  measureText(value: string, style: TextStyle): number {
    this.applyFont(style)
    return this.context.measureText(value).width
  }

  dispose(): void {
    this.context.setTransform(1, 0, 0, 1, 0, 0)
  }
}
