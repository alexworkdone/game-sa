export const TAU = Math.PI * 2

export const clamp = (value, min, max) => (value < min ? min : value > max ? max : value)

export const lerp = (a, b, t) => a + (b - a) * t

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const damp = (current, target, rate, dt) => target + (current - target) * Math.exp(-rate * dt)

export const mod = (value, size) => ((value % size) + size) % size

export const wrapAngle = (angle) => mod(angle + Math.PI, TAU) - Math.PI

export const wrapDelta = (delta, size) => mod(delta + size / 2, size) - size / 2

export const packRgb = (r, g, b) => (b << 16) | (g << 8) | r

export const unpackRgb = (color) => [color & 255, (color >> 8) & 255, (color >> 16) & 255]
