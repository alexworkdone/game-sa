import type { Cell, TileMap } from './TileMap.js'

export class NavGrid {
  readonly size: number

  private readonly map: TileMap
  private readonly forward: number[][]
  private readonly reverse: number[][]
  private readonly queue: Int32Array

  private readonly drops: boolean

  constructor(map: TileMap, options: { readonly drops?: boolean } = {}) {
    this.map = map
    this.drops = options.drops ?? true
    this.size = map.cols * map.rows
    this.forward = Array.from({ length: this.size }, () => [])
    this.reverse = Array.from({ length: this.size }, () => [])
    this.queue = new Int32Array(this.size)
    this.build()
  }

  private build(): void {
    const map = this.map
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        if (map.isSolid(c, r)) continue
        const from = map.index(c, r)
        const link = (tc: number, tr: number): void => {
          if (map.isSolid(tc, tr)) return
          const to = map.index(tc, tr)
          ;(this.forward[from] as number[]).push(to)
          ;(this.reverse[to] as number[]).push(from)
        }
        const ladder = map.isLadder(c, r)
        if (!ladder && !map.isSupport(c, r + 1)) {
          link(c, r + 1)
          continue
        }
        const step = (tc: number): void => {
          if (this.drops || map.isLadder(tc, r) || map.isSupport(tc, r + 1)) link(tc, r)
        }
        step(c - 1)
        step(c + 1)
        if (ladder) link(c, r - 1)
        if (map.isLadder(c, r + 1)) link(c, r + 1)
      }
    }
  }

  indexOf(cell: Cell): number {
    const r = Math.max(0, Math.min(this.map.rows - 1, cell.r))
    return this.map.index(cell.c, r)
  }

  createField(): Int16Array {
    return new Int16Array(this.size).fill(-1)
  }

  reachableFrom(start: Cell, lowestRow = Number.POSITIVE_INFINITY): Uint8Array {
    const seen = new Uint8Array(this.size)
    const origin = this.indexOf(start)
    let head = 0
    let tail = 0
    this.queue[tail++] = origin
    seen[origin] = 1
    while (head < tail) {
      const at = this.queue[head++] as number
      for (const next of this.forward[at] as number[]) {
        if (seen[next] || Math.floor(next / this.map.cols) > lowestRow) continue
        seen[next] = 1
        this.queue[tail++] = next
      }
    }
    return seen
  }

  distanceField(goal: Cell, out: Int16Array): void {
    out.fill(-1)
    const origin = this.indexOf(goal)
    if (this.map.isSolid(origin % this.map.cols, Math.floor(origin / this.map.cols))) return
    let head = 0
    let tail = 0
    this.queue[tail++] = origin
    out[origin] = 0
    while (head < tail) {
      const at = this.queue[head++] as number
      const distance = (out[at] as number) + 1
      for (const prev of this.reverse[at] as number[]) {
        if ((out[prev] as number) >= 0) continue
        out[prev] = distance
        this.queue[tail++] = prev
      }
    }
  }

  nextStep(from: number, field: Int16Array): number {
    let best = -1
    let bestDistance = Number.POSITIVE_INFINITY
    for (const next of this.forward[from] as number[]) {
      const distance = field[next] as number
      if (distance < 0 || distance >= bestDistance) continue
      best = next
      bestDistance = distance
    }
    return best
  }
}
