export class CanvasPresenter {
  #canvas
  #context
  pixelRatio = 1
  cssWidth = 0
  cssHeight = 0

  constructor(canvas) {
    this.#canvas = canvas
    this.#context = canvas.getContext('2d', { alpha: false })
  }

  resize(cssWidth, cssHeight, pixelRatio) {
    this.cssWidth = cssWidth
    this.cssHeight = cssHeight
    this.pixelRatio = pixelRatio
    this.#canvas.width = Math.round(cssWidth * pixelRatio)
    this.#canvas.height = Math.round(cssHeight * pixelRatio)
  }

  present(buffer, viewWidth, viewHeight, pixelScale, roll) {
    const context = this.#context
    const scale = pixelScale * this.pixelRatio
    const width = viewWidth * scale
    const height = viewHeight * scale
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.translate(this.#canvas.width / 2, this.#canvas.height / 2)
    context.rotate(-roll)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'medium'
    context.drawImage(buffer.canvas, 0, 0, viewWidth, viewHeight, -width / 2, -height / 2, width, height)
  }

  overlay(roll, draw) {
    const context = this.#context
    context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
    context.translate(this.cssWidth / 2, this.cssHeight / 2)
    context.rotate(-roll)
    draw(context)
  }
}
