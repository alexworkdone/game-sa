import type { IRenderer } from '@sa/core'
import { TAU, clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Field } from '../entities/Field.js'

interface Local {
  x: number
  y: number
}

const APPROACH_SAMPLES = 6
const SEGMENT_SAMPLES = 5
const LOOP_SAMPLES = 16

export interface VeinPoint {
  readonly x: number
  readonly y: number
}

export class VeinNetwork {
  private readonly paths: number[][] = []
  private readonly cumulative: number[][] = []
  private readonly nodes: number[][] = []
  private insideStart = APPROACH_SAMPLES

  rebuild(field: Field): void {
    this.paths.length = 0
    this.cumulative.length = 0
    this.nodes.length = 0

    for (let lane = 0; lane < field.laneCount; lane++) {
      const points = this.buildRoute(field, lane)
      const lengths: number[] = [0]
      for (let i = 2; i < points.length; i += 2) {
        const dx = (points[i] as number) - (points[i - 2] as number)
        const dy = (points[i + 1] as number) - (points[i - 1] as number)
        lengths.push((lengths[lengths.length - 1] as number) + Math.hypot(dx, dy))
      }
      this.paths.push(points)
      this.cumulative.push(lengths)
    }
  }

  private buildRoute(field: Field, lane: number): number[] {
    const radius = BALANCE.container.radius
    const angle = field.laneAngle(lane)
    const start = field.pointAt(angle, field.paddleOrbit)

    const middle = (field.laneCount - 1) / 2
    const side = lane === middle ? (lane % 2 === 0 ? 1 : -1) : lane < middle ? -1 : 1
    const drop = radius * 0.48 + Math.abs(lane - middle) * radius * 0.04

    const entry: Local = {
      x: Math.cos(angle) * radius * 0.94,
      y: Math.sin(angle) * radius * 0.94,
    }
    const a: Local = { x: Math.cos(angle) * radius * 0.6, y: Math.sin(angle) * radius * 0.6 }
    const b: Local = { x: side * drop, y: a.y }
    const c: Local = { x: b.x, y: radius * 0.26 }
    const loopRadius = radius * 0.1
    const loopCenter: Local = { x: b.x - side * loopRadius, y: c.y }
    const sink: Local = { x: 0, y: radius * 0.58 }

    const points: number[] = []
    const push = (p: Local): void => {
      points.push(field.pivotX + p.x, field.pivotY + p.y)
    }
    const line = (from: Local, to: Local, samples: number): void => {
      for (let i = 1; i <= samples; i++) {
        const t = i / samples
        push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })
      }
    }

    const startLocal: Local = { x: start.x - field.pivotX, y: start.y - field.pivotY }
    push(startLocal)
    line(startLocal, entry, APPROACH_SAMPLES)
    this.insideStart = APPROACH_SAMPLES

    line(entry, a, SEGMENT_SAMPLES)
    line(a, b, SEGMENT_SAMPLES)
    line(b, c, SEGMENT_SAMPLES)

    const loopStart = side > 0 ? 0 : Math.PI
    for (let i = 1; i <= LOOP_SAMPLES; i++) {
      const theta = loopStart + side * Math.PI * (i / LOOP_SAMPLES)
      push({
        x: loopCenter.x + Math.cos(theta) * loopRadius,
        y: loopCenter.y + Math.sin(theta) * loopRadius,
      })
    }

    const loopEnd: Local = {
      x: loopCenter.x + Math.cos(loopStart + side * Math.PI) * loopRadius,
      y: loopCenter.y + Math.sin(loopStart + side * Math.PI) * loopRadius,
    }
    line(loopEnd, sink, SEGMENT_SAMPLES + 2)

    this.nodes.push([a.x, a.y, b.x, b.y, c.x, c.y])
    return points
  }

  length(lane: number): number {
    const lengths = this.cumulative[lane]
    if (!lengths) return 0
    return lengths[lengths.length - 1] as number
  }

  pointAt(lane: number, distance: number): VeinPoint {
    const points = this.paths[lane]
    const lengths = this.cumulative[lane]
    if (!points || !lengths) return { x: 0, y: 0 }

    const total = lengths[lengths.length - 1] as number
    const target = clamp(distance, 0, total)

    let index = 1
    while (index < lengths.length && (lengths[index] as number) < target) index++
    const prev = lengths[index - 1] as number
    const next = lengths[index] as number
    const span = next - prev || 1
    const k = (target - prev) / span

    const ax = points[(index - 1) * 2] as number
    const ay = points[(index - 1) * 2 + 1] as number
    const bx = points[index * 2] as number
    const by = points[index * 2 + 1] as number
    return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k }
  }

  render(renderer: IRenderer, field: Field): void {
    const skip = this.insideStart * 2
    for (let lane = 0; lane < this.paths.length; lane++) {
      const points = this.paths[lane] as number[]
      for (let i = skip + 2; i < points.length; i += 2) {
        renderer.line(
          points[i - 2] as number,
          points[i - 1] as number,
          points[i] as number,
          points[i + 1] as number,
          1.2,
          { stroke: PALETTE.friendly, alpha: 0.2 },
        )
      }
      const pads = this.nodes[lane]
      if (!pads) continue
      for (let i = 0; i < pads.length; i += 2) {
        renderer.rect(
          field.pivotX + (pads[i] as number) - 2,
          field.pivotY + (pads[i + 1] as number) - 2,
          4,
          4,
          { fill: PALETTE.friendly, alpha: 0.34 },
        )
      }
    }
  }
}
