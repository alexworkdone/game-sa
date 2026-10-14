export class FrameBuffer {
  #context
  canvas
  width = 0
  height = 0
  stride = 0
  imageData = null
  pixels = new Uint32Array(0)
  clearSky = new Uint8Array(0)

  constructor() {
    this.canvas = document.createElement('canvas')
    this.#context = this.canvas.getContext('2d')
  }

  ensure(width, height) {
    if (width <= this.width && height <= this.height) return
    this.width = Math.max(width, this.width)
    this.height = Math.max(height, this.height)
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.stride = this.width
    this.imageData = this.#context.createImageData(this.width, this.height)
    this.pixels = new Uint32Array(this.imageData.data.buffer)
    this.clearSky = new Uint8Array(this.width * this.height)
  }

  flush(width, height) {
    this.#context.putImageData(this.imageData, 0, 0, 0, 0, width, height)
  }
}
