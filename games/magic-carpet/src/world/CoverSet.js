export class CoverSet {
  #parts

  constructor(parts) {
    this.#parts = parts
  }

  clear(x, y, radius, size) {
    for (const part of this.#parts) part.clear(x, y, radius, size)
  }

  settle(mesh, x, y, radius, size) {
    for (const part of this.#parts) part.settle(mesh, x, y, radius, size)
  }
}
