export const TILE_EMPTY = 0
export const TILE_SOLID = 1
export const TILE_LADDER = 2

export type TileKind = typeof TILE_EMPTY | typeof TILE_SOLID | typeof TILE_LADDER

import { wrap } from './Ring.js'

export interface Cell {
  readonly c: number
  readonly r: number
}

export class TileMap {
  readonly cols: number
  readonly rows: number
  readonly tile: number

  private readonly cells: Uint8Array

  constructor(cols: number, rows: number, tile: number) {
    this.cols = cols
    this.rows = rows
    this.tile = tile
    this.cells = new Uint8Array(cols * rows)
  }

  get width(): number {
    return this.cols * this.tile
  }

  get height(): number {
    return this.rows * this.tile
  }

  wrapCol(c: number): number {
    return wrap(c, this.cols)
  }

  wrapX(x: number): number {
    return wrap(x, this.width)
  }

  get(c: number, r: number): TileKind {
    if (r < 0 || r >= this.rows) return TILE_SOLID
    return this.cells[this.index(c, r)] as TileKind
  }

  set(c: number, r: number, kind: TileKind): void {
    if (r >= 0 && r < this.rows) this.cells[this.index(c, r)] = kind
  }

  isSolid(c: number, r: number): boolean {
    return this.get(c, r) === TILE_SOLID
  }

  isLadder(c: number, r: number): boolean {
    return this.get(c, r) === TILE_LADDER
  }

  isLadderTop(c: number, r: number): boolean {
    return this.isLadder(c, r) && !this.isLadder(c, r - 1)
  }

  isSupport(c: number, r: number): boolean {
    return this.isSolid(c, r) || this.isLadderTop(c, r)
  }

  canStand(c: number, r: number): boolean {
    return !this.isSolid(c, r) && this.isSupport(c, r + 1)
  }

  colAt(x: number): number {
    return Math.floor(x / this.tile)
  }

  rowAt(y: number): number {
    return Math.floor(y / this.tile)
  }

  centerX(c: number): number {
    return c * this.tile + this.tile / 2
  }

  feetY(r: number): number {
    return (r + 1) * this.tile
  }

  index(c: number, r: number): number {
    return r * this.cols + this.wrapCol(c)
  }

  cellOf(index: number): Cell {
    return { c: index % this.cols, r: Math.floor(index / this.cols) }
  }
}
