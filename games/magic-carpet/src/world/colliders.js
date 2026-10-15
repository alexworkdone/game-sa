export const heightOf = (shape, x, y) => {
  switch (shape.kind) {
    case 'box':
      return x >= shape.x0 && x <= shape.x1 && y >= shape.y0 && y <= shape.y1 ? shape.top : -Infinity
    case 'cylinder':
      return Math.hypot(x - shape.x, y - shape.y) <= shape.radius ? shape.top : -Infinity
    case 'cone': {
      const distance = Math.hypot(x - shape.x, y - shape.y)
      return distance <= shape.radius ? shape.base + shape.height * (1 - distance / shape.radius) : -Infinity
    }
    case 'pyramid': {
      const ring = Math.max(Math.abs(x - shape.x), Math.abs(y - shape.y))
      return ring <= shape.half ? shape.base + shape.height * (1 - ring / shape.half) : -Infinity
    }
    default:
      return -Infinity
  }
}

export const gapTo = (shape, x, y) => {
  switch (shape.kind) {
    case 'box':
      return Math.hypot(Math.max(shape.x0 - x, 0, x - shape.x1), Math.max(shape.y0 - y, 0, y - shape.y1))
    case 'cylinder':
    case 'cone':
      return Math.max(0, Math.hypot(x - shape.x, y - shape.y) - shape.radius)
    case 'pyramid':
      return Math.max(0, Math.max(Math.abs(x - shape.x), Math.abs(y - shape.y)) - shape.half)
    default:
      return Infinity
  }
}

export const topOf = (shape) => (shape.kind === 'cone' || shape.kind === 'pyramid' ? shape.base + shape.height : shape.top)
