import { ringDelta } from '../level/Ring.js'

export interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export const boxesOverlap = (a: Box, b: Box, worldWidth: number, inset = 0): boolean =>
  Math.abs(ringDelta(a.x, b.x, worldWidth)) * 2 < a.width + b.width - inset * 2 &&
  Math.abs(a.y - a.height / 2 - (b.y - b.height / 2)) * 2 < a.height + b.height - inset * 2

export const pointInBox = (px: number, py: number, box: Box, worldWidth: number, pad = 0): boolean =>
  Math.abs(ringDelta(box.x, px, worldWidth)) <= box.width / 2 + pad &&
  py >= box.y - box.height - pad &&
  py <= box.y + pad
