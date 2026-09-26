export const DEEP = 0
export const CORE = 1
export const LIGHT = 2

export type GlyphOp =
  | {
      readonly shape: 'disc'
      readonly x: number
      readonly y: number
      readonly r: number
      readonly tone: number
    }
  | {
      readonly shape: 'ring'
      readonly x: number
      readonly y: number
      readonly r: number
      readonly width: number
      readonly tone: number
    }
  | {
      readonly shape: 'arc'
      readonly x: number
      readonly y: number
      readonly r: number
      readonly from: number
      readonly to: number
      readonly width: number
      readonly tone: number
    }
  | {
      readonly shape: 'bar'
      readonly x1: number
      readonly y1: number
      readonly x2: number
      readonly y2: number
      readonly width: number
      readonly tone: number
    }
  | {
      readonly shape: 'poly'
      readonly points: readonly number[]
      readonly tone: number
    }

export const disc = (x: number, y: number, r: number, tone: number): GlyphOp => ({
  shape: 'disc',
  x,
  y,
  r,
  tone,
})

export const ring = (
  x: number,
  y: number,
  r: number,
  width: number,
  tone: number,
): GlyphOp => ({ shape: 'ring', x, y, r, width, tone })

export const arc = (
  x: number,
  y: number,
  r: number,
  from: number,
  to: number,
  width: number,
  tone: number,
): GlyphOp => ({ shape: 'arc', x, y, r, from, to, width, tone })

export const bar = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  tone: number,
): GlyphOp => ({ shape: 'bar', x1, y1, x2, y2, width, tone })

export const poly = (tone: number, ...points: number[]): GlyphOp => ({
  shape: 'poly',
  points,
  tone,
})

const HALF = Math.PI / 2
const FULL = Math.PI

export const crestUp = (x: number, y: number, r: number, width: number, tone: number): GlyphOp =>
  arc(x, y, r, FULL, FULL * 2, width, tone)

export const crestDown = (x: number, y: number, r: number, width: number, tone: number): GlyphOp =>
  arc(x, y, r, 0, FULL, width, tone)

export const curlRight = (x: number, y: number, r: number, width: number, tone: number): GlyphOp =>
  arc(x, y, r, -HALF, HALF, width, tone)

export const curlLeft = (x: number, y: number, r: number, width: number, tone: number): GlyphOp =>
  arc(x, y, r, HALF, HALF * 3, width, tone)
