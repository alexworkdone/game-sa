const POLYGON = 0
const SHAPE = 1
const CIRCLE = 2
const SPHERE = 3
const GRADIENT = 4

export class PolygonBatch {
  #capacity = 0
  #count = 0
  #used = 0
  #depth
  #kind
  #color
  #color2
  #color3
  #start
  #length
  #coords
  #order
  #colors

  constructor(colors, capacity = 4096) {
    this.#colors = colors
    this.#grow(capacity, capacity * 10)
  }

  get count() {
    return this.#count
  }

  reset() {
    this.#count = 0
    this.#used = 0
  }

  polygon(depth, color, xs, ys, n, outline = true) {
    const coords = this.#reserve(n * 2)
    const offset = this.#used
    for (let k = 0; k < n; k++) {
      coords[offset + k * 2] = xs[k]
      coords[offset + k * 2 + 1] = ys[k]
    }
    this.#commit(depth, outline ? POLYGON : SHAPE, color, n * 2)
  }

  circle(depth, color, x, y, radius) {
    const coords = this.#reserve(3)
    coords[this.#used] = x
    coords[this.#used + 1] = y
    coords[this.#used + 2] = radius
    this.#commit(depth, CIRCLE, color, 3)
  }

  sphere(depth, highlight, lit, shade, x, y, radius, lightX, lightY) {
    const coords = this.#reserve(5)
    const at = this.#used
    coords[at] = x
    coords[at + 1] = y
    coords[at + 2] = radius
    coords[at + 3] = lightX
    coords[at + 4] = lightY
    this.#commit(depth, SPHERE, highlight, 5, lit, shade)
  }

  gradient(depth, xs, ys, n, x0, y0, x1, y1, first, middle, last) {
    const size = n * 2 + 4
    const coords = this.#reserve(size)
    const at = this.#used
    for (let k = 0; k < n; k++) {
      coords[at + k * 2] = xs[k]
      coords[at + k * 2 + 1] = ys[k]
    }
    coords[at + n * 2] = x0
    coords[at + n * 2 + 1] = y0
    coords[at + n * 2 + 2] = x1
    coords[at + n * 2 + 3] = y1
    this.#commit(depth, GRADIENT, first, size, middle, last)
  }

  draw(context, lineWidth) {
    const count = this.#count
    const order = this.#order.subarray(0, count)
    const depth = this.#depth
    for (let i = 0; i < count; i++) order[i] = i
    order.sort((a, b) => depth[b] - depth[a])

    const kind = this.#kind
    const color = this.#color
    const color2 = this.#color2
    const color3 = this.#color3
    const start = this.#start
    const length = this.#length
    const coords = this.#coords
    const colors = this.#colors
    context.lineJoin = 'round'
    context.lineWidth = lineWidth
    let lastStyle = ''

    for (let i = 0; i < count; i++) {
      const item = order[i]
      const offset = start[item]
      const type = kind[item]
      if (type === SPHERE) {
        const x = coords[offset]
        const y = coords[offset + 1]
        const radius = coords[offset + 2]
        const fill = context.createRadialGradient(
          x + coords[offset + 3] * radius * 0.45,
          y + coords[offset + 4] * radius * 0.45,
          radius * 0.05,
          x,
          y,
          radius,
        )
        fill.addColorStop(0, colors.style(color[item]))
        fill.addColorStop(0.45, colors.style(color2[item]))
        fill.addColorStop(1, colors.style(color3[item]))
        context.fillStyle = fill
        lastStyle = ''
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
        continue
      }
      if (type === GRADIENT) {
        const points = (length[item] - 4) / 2
        const g = offset + points * 2
        const fill = context.createLinearGradient(coords[g], coords[g + 1], coords[g + 2], coords[g + 3])
        fill.addColorStop(0, colors.style(color[item]))
        fill.addColorStop(0.4, colors.style(color2[item]))
        fill.addColorStop(1, colors.style(color3[item]))
        context.fillStyle = fill
        lastStyle = ''
        context.beginPath()
        context.moveTo(coords[offset], coords[offset + 1])
        for (let k = 1; k < points; k++) context.lineTo(coords[offset + k * 2], coords[offset + k * 2 + 1])
        context.closePath()
        context.fill()
        continue
      }
      const style = colors.style(color[item])
      if (style !== lastStyle) {
        context.fillStyle = style
        context.strokeStyle = style
        lastStyle = style
      }
      context.beginPath()
      if (type === CIRCLE) {
        context.arc(coords[offset], coords[offset + 1], coords[offset + 2], 0, Math.PI * 2)
        context.fill()
        continue
      }
      const end = offset + length[item]
      context.moveTo(coords[offset], coords[offset + 1])
      for (let k = offset + 2; k < end; k += 2) context.lineTo(coords[k], coords[k + 1])
      context.closePath()
      context.fill()
      if (type === POLYGON) context.stroke()
    }
  }

  #reserve(size) {
    if (this.#count >= this.#capacity || this.#used + size > this.#coords.length) {
      this.#grow(this.#capacity * 2, Math.max(this.#coords.length * 2, this.#used + size))
    }
    return this.#coords
  }

  #commit(depth, type, color, size, color2 = color, color3 = color) {
    const index = this.#count++
    this.#depth[index] = depth
    this.#kind[index] = type
    this.#color[index] = color
    this.#color2[index] = color2
    this.#color3[index] = color3
    this.#start[index] = this.#used
    this.#length[index] = size
    this.#used += size
  }

  #grow(capacity, coordCapacity) {
    const copy = (Type, source, size) => {
      const target = new Type(size)
      if (source) target.set(source.subarray(0, Math.min(source.length, size)))
      return target
    }
    this.#depth = copy(Float32Array, this.#depth, capacity)
    this.#kind = copy(Uint8Array, this.#kind, capacity)
    this.#color = copy(Uint32Array, this.#color, capacity)
    this.#color2 = copy(Uint32Array, this.#color2, capacity)
    this.#color3 = copy(Uint32Array, this.#color3, capacity)
    this.#start = copy(Uint32Array, this.#start, capacity)
    this.#length = copy(Uint8Array, this.#length, capacity)
    this.#order = new Uint32Array(capacity)
    this.#coords = copy(Float32Array, this.#coords, coordCapacity)
    this.#capacity = capacity
  }
}
