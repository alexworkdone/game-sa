import type { Cell, TileMap } from '../level/TileMap.js'

export class ExitDoor {
  x = 0
  y = 0
  open = false
  openAnim = 0
  readonly width = 26
  readonly height = 30

  place(map: TileMap, cell: Cell): void {
    this.x = map.centerX(cell.c)
    this.y = map.feetY(cell.r)
    this.open = false
    this.openAnim = 0
  }

  update(dt: number): void {
    if (this.open) this.openAnim = Math.min(1, this.openAnim + dt * 2.2)
  }
}
