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

const P = Math.PI

export const sunShape = (): GlyphOp[] => [
  disc(0, 0, 0.46, CORE),
  disc(0, 0, 0.3, LIGHT),
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * P * 2
    return bar(Math.cos(a) * 0.62, Math.sin(a) * 0.62, Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.11, CORE)
  }),
]

export const crescentShape = (): GlyphOp[] => [
  disc(-0.05, 0, 0.72, CORE),
  disc(0.34, -0.14, 0.62, DEEP),
  disc(-0.34, 0.18, 0.1, LIGHT),
]

export const starShape = (): GlyphOp[] => [
  poly(CORE, 0, -0.95, 0.24, -0.26, 0.95, -0.26, 0.36, 0.2, 0.6, 0.92, 0, 0.48, -0.6, 0.92, -0.36, 0.2, -0.95, -0.26, -0.24, -0.26),
  disc(0, -0.08, 0.2, LIGHT),
]

export const boltShape = (): GlyphOp[] => [
  poly(LIGHT, 0.18, -0.96, -0.58, 0.1, -0.06, 0.1, -0.28, 0.96, 0.58, -0.18, 0.06, -0.18),
]

export const flakeShape = (): GlyphOp[] => [
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * P * 2
    return bar(0, 0, Math.cos(a) * 0.88, Math.sin(a) * 0.88, 0.1, LIGHT)
  }),
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * P * 2
    return disc(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.12, CORE)
  }),
  disc(0, 0, 0.16, LIGHT),
]

export const gemShape = (): GlyphOp[] => [
  poly(CORE, 0, -0.9, 0.66, -0.2, 0.36, 0.86, -0.36, 0.86, -0.66, -0.2),
  poly(LIGHT, 0, -0.9, 0.2, -0.2, -0.2, -0.2),
  bar(-0.66, -0.2, 0.66, -0.2, 0.06, DEEP),
]

export const mountainShape = (): GlyphOp[] => [
  poly(CORE, -1, 0.72, -0.34, -0.36, 0.1, 0.16, 0.56, -0.62, 1, 0.72),
  poly(LIGHT, 0.56, -0.62, 0.86, -0.1, 0.26, -0.1),
  poly(LIGHT, -0.34, -0.36, -0.08, 0.02, -0.6, 0.02),
]

export const wavesShape = (): GlyphOp[] => [
  crestUp(-0.5, -0.36, 0.3, 0.13, CORE),
  crestDown(0.1, -0.36, 0.3, 0.13, CORE),
  crestUp(0.7, -0.36, 0.3, 0.13, CORE),
  crestUp(-0.5, 0.16, 0.3, 0.13, LIGHT),
  crestDown(0.1, 0.16, 0.3, 0.13, LIGHT),
  crestUp(0.7, 0.16, 0.3, 0.13, LIGHT),
  crestUp(-0.2, 0.66, 0.3, 0.13, CORE),
  crestDown(0.4, 0.66, 0.3, 0.13, CORE),
]

export const dropShape = (): GlyphOp[] => [
  disc(0, 0.26, 0.66, CORE),
  poly(CORE, 0, -0.96, 0.6, 0.3, -0.6, 0.3),
  disc(-0.24, 0.4, 0.17, LIGHT),
]

export const blobShape = (): GlyphOp[] => [
  disc(0, 0.18, 0.72, CORE),
  disc(-0.52, -0.1, 0.4, CORE),
  disc(0.5, -0.05, 0.36, CORE),
  disc(-0.2, -0.1, 0.16, LIGHT),
  disc(0.24, 0.3, 0.12, LIGHT),
]

export const rockShape = (): GlyphOp[] => [
  poly(CORE, -0.82, 0.1, -0.44, -0.66, 0.36, -0.72, 0.86, -0.06, 0.6, 0.68, -0.5, 0.72),
  bar(-0.44, -0.66, -0.1, -0.06, 0.07, LIGHT),
  bar(-0.1, -0.06, 0.86, -0.06, 0.07, LIGHT),
]

export const barsShape = (): GlyphOp[] => [
  poly(CORE, -0.86, -0.5, 0.86, -0.5, 0.62, -0.06, -0.62, -0.06),
  poly(LIGHT, -0.62, 0.02, 0.62, 0.02, 0.4, 0.46, -0.4, 0.46),
  bar(-0.86, -0.5, 0.86, -0.5, 0.08, LIGHT),
]

export const bricksShape = (): GlyphOp[] => [
  poly(CORE, -0.9, -0.6, 0.9, -0.6, 0.9, 0.7, -0.9, 0.7),
  bar(-0.9, -0.16, 0.9, -0.16, 0.08, DEEP),
  bar(-0.9, 0.28, 0.9, 0.28, 0.08, DEEP),
  bar(0, -0.6, 0, -0.16, 0.08, DEEP),
  bar(-0.44, -0.16, -0.44, 0.28, 0.08, DEEP),
  bar(0.44, -0.16, 0.44, 0.28, 0.08, DEEP),
  bar(0, 0.28, 0, 0.7, 0.08, DEEP),
]

export const grassShape = (): GlyphOp[] => [
  bar(-0.6, 0.8, -0.72, -0.4, 0.11, CORE),
  bar(-0.2, 0.8, -0.24, -0.72, 0.11, LIGHT),
  bar(0.2, 0.8, 0.34, -0.5, 0.11, CORE),
  bar(0.6, 0.8, 0.78, -0.2, 0.11, LIGHT),
  bar(-0.95, 0.8, 0.95, 0.8, 0.14, DEEP),
]

export const flowerShape = (): GlyphOp[] => [
  bar(0, 0.92, 0, 0.1, 0.1, DEEP),
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * P * 2
    return disc(Math.cos(a) * 0.42, Math.sin(a) * 0.42 - 0.24, 0.28, CORE)
  }),
  disc(0, -0.24, 0.24, LIGHT),
]

export const leafShape = (): GlyphOp[] => [
  poly(CORE, 0, -0.9, 0.62, -0.1, 0, 0.88, -0.62, -0.1),
  bar(0, -0.9, 0, 0.88, 0.07, LIGHT),
]

export const treeShape = (): GlyphOp[] => [
  bar(0, 0.92, 0, 0.05, 0.19, DEEP),
  disc(-0.42, -0.24, 0.42, CORE),
  disc(0.4, -0.2, 0.38, CORE),
  disc(0, -0.52, 0.46, LIGHT),
]

export const fishShape = (): GlyphOp[] => [
  poly(CORE, -0.3, 0, 0.3, -0.46, 0.86, 0, 0.3, 0.46),
  poly(LIGHT, -0.3, 0, -0.9, -0.42, -0.9, 0.42),
  disc(0.42, -0.12, 0.09, DEEP),
]

export const birdShape = (): GlyphOp[] => [
  poly(CORE, -0.9, -0.1, 0, -0.62, 0.9, -0.1, 0, 0.36),
  disc(0.06, -0.5, 0.24, LIGHT),
  poly(LIGHT, 0.24, -0.52, 0.72, -0.44, 0.26, -0.34),
]

export const bugShape = (): GlyphOp[] => [
  disc(0, 0.16, 0.5, CORE),
  disc(0, -0.5, 0.28, DEEP),
  bar(0, -0.34, 0, 0.62, 0.07, DEEP),
  bar(-0.5, -0.12, 0.5, -0.12, 0.07, DEEP),
  bar(-0.46, 0.3, 0.46, 0.3, 0.07, DEEP),
  disc(-0.2, 0.06, 0.1, LIGHT),
  disc(0.22, 0.34, 0.09, LIGHT),
]

export const pawShape = (): GlyphOp[] => [
  disc(0, 0.32, 0.46, CORE),
  disc(-0.52, -0.22, 0.2, CORE),
  disc(-0.2, -0.56, 0.2, CORE),
  disc(0.2, -0.56, 0.2, CORE),
  disc(0.52, -0.22, 0.2, CORE),
  disc(0, 0.34, 0.16, LIGHT),
]

export const figureShape = (): GlyphOp[] => [
  disc(0, -0.56, 0.28, LIGHT),
  poly(CORE, -0.34, 0.9, -0.24, -0.16, 0.24, -0.16, 0.34, 0.9),
  bar(-0.24, -0.06, -0.72, 0.42, 0.11, CORE),
  bar(0.24, -0.06, 0.72, 0.42, 0.11, CORE),
]

export const houseShape = (): GlyphOp[] => [
  poly(CORE, -0.9, -0.06, 0, -0.84, 0.9, -0.06),
  poly(LIGHT, -0.66, -0.06, 0.66, -0.06, 0.66, 0.82, -0.66, 0.82),
  poly(DEEP, -0.18, 0.28, 0.18, 0.28, 0.18, 0.82, -0.18, 0.82),
]

export const towerShape = (): GlyphOp[] => [
  poly(CORE, -0.92, 0.88, -0.92, -0.2, -0.4, -0.2, -0.4, 0.88),
  poly(LIGHT, -0.26, 0.88, -0.26, -0.72, 0.26, -0.72, 0.26, 0.88),
  poly(CORE, 0.4, 0.88, 0.4, -0.36, 0.92, -0.36, 0.92, 0.88),
  disc(-0.66, 0.16, 0.08, DEEP),
  disc(0, -0.34, 0.08, DEEP),
  disc(0.66, 0.02, 0.08, DEEP),
]

export const wheelShape = (): GlyphOp[] => [
  ring(0, 0, 0.82, 0.2, CORE),
  ring(0, 0, 0.24, 0.16, LIGHT),
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * P * 2
    return bar(Math.cos(a) * 0.22, Math.sin(a) * 0.22, Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.1, LIGHT)
  }),
]

export const gearShape = (): GlyphOp[] => [
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * P * 2
    return disc(Math.cos(a) * 0.76, Math.sin(a) * 0.76, 0.22, CORE)
  }),
  disc(0, 0, 0.66, CORE),
  disc(0, 0, 0.26, DEEP),
  ring(0, 0, 0.46, 0.08, LIGHT),
]

export const bladeShape = (): GlyphOp[] => [
  poly(LIGHT, -0.06, -0.92, 0.16, -0.72, 0.16, 0.24, -0.06, 0.4),
  bar(-0.44, 0.34, 0.5, 0.34, 0.14, CORE),
  bar(0.04, 0.34, 0.04, 0.92, 0.13, CORE),
]

export const sheetShape = (): GlyphOp[] => [
  poly(LIGHT, -0.62, -0.86, 0.62, -0.86, 0.62, 0.86, -0.62, 0.86),
  bar(-0.4, -0.5, 0.4, -0.5, 0.08, DEEP),
  bar(-0.4, -0.16, 0.4, -0.16, 0.08, DEEP),
  bar(-0.4, 0.18, 0.16, 0.18, 0.08, DEEP),
]

export const bookShape = (): GlyphOp[] => [
  poly(CORE, -0.86, -0.7, -0.04, -0.52, -0.04, 0.78, -0.86, 0.6),
  poly(LIGHT, 0.86, -0.7, 0.04, -0.52, 0.04, 0.78, 0.86, 0.6),
  bar(0, -0.52, 0, 0.78, 0.07, DEEP),
]

export const boatShape = (): GlyphOp[] => [
  poly(CORE, -0.88, 0.2, 0.88, 0.2, 0.56, 0.78, -0.56, 0.78),
  bar(0, 0.2, 0, -0.84, 0.1, DEEP),
  poly(LIGHT, 0.06, -0.8, 0.72, -0.1, 0.06, -0.1),
]

export const bulbShape = (): GlyphOp[] => [
  disc(0, -0.2, 0.58, LIGHT),
  poly(CORE, -0.3, 0.26, 0.3, 0.26, 0.26, 0.74, -0.26, 0.74),
  bar(-0.26, 0.46, 0.26, 0.46, 0.07, DEEP),
  bar(-0.26, 0.66, 0.26, 0.66, 0.07, DEEP),
]

export const screenShape = (): GlyphOp[] => [
  poly(CORE, -0.88, -0.72, 0.88, -0.72, 0.88, 0.42, -0.88, 0.42),
  poly(LIGHT, -0.68, -0.52, 0.68, -0.52, 0.68, 0.22, -0.68, 0.22),
  bar(-0.44, 0.72, 0.44, 0.72, 0.16, CORE),
  bar(0, 0.42, 0, 0.66, 0.12, CORE),
]

export const robotShape = (): GlyphOp[] => [
  poly(CORE, -0.66, -0.5, 0.66, -0.5, 0.66, 0.5, -0.66, 0.5),
  disc(-0.28, -0.12, 0.16, LIGHT),
  disc(0.28, -0.12, 0.16, LIGHT),
  bar(-0.3, 0.24, 0.3, 0.24, 0.09, LIGHT),
  bar(0, -0.5, 0, -0.86, 0.08, DEEP),
  disc(0, -0.9, 0.12, LIGHT),
]

export const carShape = (): GlyphOp[] => [
  poly(CORE, -0.92, 0.1, -0.5, -0.46, 0.44, -0.46, 0.92, 0.1, 0.92, 0.42, -0.92, 0.42),
  poly(LIGHT, -0.4, -0.3, 0.36, -0.3, 0.6, 0.04, -0.62, 0.04),
  disc(-0.5, 0.5, 0.26, DEEP),
  disc(0.5, 0.5, 0.26, DEEP),
]

export const planeShape = (): GlyphOp[] => [
  poly(CORE, 0, -0.92, 0.16, 0.3, 0, 0.62, -0.16, 0.3),
  poly(LIGHT, -0.92, 0.18, 0, -0.1, 0.92, 0.18, 0, 0.16),
  poly(LIGHT, -0.4, 0.78, 0, 0.6, 0.4, 0.78, 0, 0.74),
]

export const rocketShape = (): GlyphOp[] => [
  poly(LIGHT, 0, -0.95, 0.34, -0.1, 0.34, 0.46, -0.34, 0.46, -0.34, -0.1),
  poly(CORE, -0.34, 0.1, -0.78, 0.66, -0.34, 0.5),
  poly(CORE, 0.34, 0.1, 0.78, 0.66, 0.34, 0.5),
  disc(0, -0.3, 0.16, DEEP),
  poly(CORE, -0.22, 0.5, 0.22, 0.5, 0, 0.94),
]

export const orbitShape = (): GlyphOp[] => [
  disc(0, 0, 0.44, CORE),
  ring(0, 0, 0.86, 0.09, LIGHT),
  disc(0.82, -0.22, 0.14, LIGHT),
]

export const spiralShape = (): GlyphOp[] => [
  arc(0, 0, 0.86, -P * 0.2, P * 1.1, 0.14, CORE),
  arc(0, 0, 0.56, P * 0.8, P * 2.1, 0.14, LIGHT),
  disc(0, 0, 0.22, LIGHT),
]

export const dotsShape = (): GlyphOp[] => [
  disc(-0.42, -0.3, 0.2, CORE),
  disc(0.24, -0.5, 0.13, LIGHT),
  disc(0.48, 0.12, 0.17, CORE),
  disc(-0.12, 0.28, 0.11, LIGHT),
  disc(-0.56, 0.5, 0.12, CORE),
  disc(0.2, 0.6, 0.09, LIGHT),
]

export const archShape = (): GlyphOp[] => [
  poly(DEEP, -0.95, 0.85, -0.95, -0.2, 0.95, -0.2, 0.95, 0.85),
  arc(0, 0.1, 0.62, P, P * 2, 0.5, CORE),
  disc(0, 0.5, 0.5, CORE),
  disc(0, 0.32, 0.34, DEEP),
]

export const jetShape = (): GlyphOp[] => [
  bar(0, 0.9, 0, -0.76, 0.26, CORE),
  disc(0, -0.72, 0.3, LIGHT),
  disc(-0.34, -0.42, 0.18, LIGHT),
  disc(0.36, -0.3, 0.15, LIGHT),
  bar(-0.8, 0.86, 0.8, 0.86, 0.18, DEEP),
]

export const coilShape = (): GlyphOp[] => [
  curlRight(-0.34, -0.5, 0.3, 0.16, CORE),
  curlLeft(-0.34, 0.1, 0.3, 0.16, LIGHT),
  curlRight(-0.34, 0.7, 0.3, 0.16, CORE),
]

export const clothShape = (): GlyphOp[] => [
  poly(CORE, -0.9, -0.66, 0.9, -0.66, 0.66, 0.82, -0.66, 0.82),
  bar(-0.5, -0.6, -0.34, 0.78, 0.09, LIGHT),
  bar(0.06, -0.62, 0.02, 0.8, 0.09, LIGHT),
  bar(0.62, -0.6, 0.42, 0.78, 0.09, LIGHT),
]

export const loafShape = (): GlyphOp[] => [
  arc(0, 0.34, 0.8, P, P * 2, 0.62, CORE),
  poly(CORE, -0.84, 0.3, 0.84, 0.3, 0.84, 0.68, -0.84, 0.68),
  bar(-0.4, -0.16, -0.22, 0.14, 0.09, DEEP),
  bar(0.04, -0.24, 0.2, 0.08, 0.09, DEEP),
]

export const stalkShape = (): GlyphOp[] => [
  bar(0, 0.92, 0, -0.3, 0.09, CORE),
  ...Array.from({ length: 5 }, (_, i) => {
    const y = -0.72 + i * 0.22
    return disc(i % 2 === 0 ? -0.22 : 0.22, y, 0.18, LIGHT)
  }),
  disc(0, -0.86, 0.16, LIGHT),
]

export const wingShape = (): GlyphOp[] => [
  poly(CORE, -0.1, -0.86, 0.5, -0.5, 0.86, 0.3, 0.2, 0.86, -0.2, 0.3),
  poly(LIGHT, -0.1, -0.86, 0.1, -0.2, -0.2, 0.3),
  bar(-0.2, 0.3, -0.86, 0.8, 0.12, CORE),
]

export const clawShape = (): GlyphOp[] => [
  poly(CORE, -0.8, 0.8, -0.3, -0.86, 0.06, 0.2),
  poly(CORE, -0.1, 0.86, 0.3, -0.8, 0.62, 0.26),
  poly(LIGHT, 0.34, 0.8, 0.8, -0.5, 0.92, 0.4),
]
