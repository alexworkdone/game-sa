import type { IRenderer } from '@sa/core'
import type { ElementDef } from '../data/elements.js'

export class GlyphPainter {
  private readonly scratch: number[] = []

  paint(
    renderer: IRenderer,
    def: ElementDef,
    cx: number,
    cy: number,
    radius: number,
    alpha = 1,
  ): void {
    const fallback = def.tones[0] ?? '#ffffff'
    for (const op of def.ops) {
      const color = def.tones[op.tone] ?? fallback
      switch (op.shape) {
        case 'disc':
          renderer.circle(cx + op.x * radius, cy + op.y * radius, op.r * radius, {
            fill: color,
            alpha,
          })
          break
        case 'ring':
          renderer.ring(
            cx + op.x * radius,
            cy + op.y * radius,
            op.r * radius,
            op.width * radius,
            { stroke: color, alpha },
          )
          break
        case 'arc':
          renderer.arc(
            cx + op.x * radius,
            cy + op.y * radius,
            op.r * radius,
            op.from,
            op.to,
            op.width * radius,
            { stroke: color, alpha },
          )
          break
        case 'bar':
          renderer.line(
            cx + op.x1 * radius,
            cy + op.y1 * radius,
            cx + op.x2 * radius,
            cy + op.y2 * radius,
            op.width * radius,
            { stroke: color, alpha },
          )
          break
        case 'poly': {
          const points = this.scratch
          points.length = op.points.length
          for (let i = 0; i < op.points.length; i += 2) {
            points[i] = cx + (op.points[i] ?? 0) * radius
            points[i + 1] = cy + (op.points[i + 1] ?? 0) * radius
          }
          renderer.polygon(points, { fill: color, alpha })
          break
        }
      }
    }
  }
}
