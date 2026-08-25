export const TAU = Math.PI * 2

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const invLerp = (a: number, b: number, v: number): number =>
  a === b ? 0 : (v - a) / (b - a)

export const remap = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => lerp(outMin, outMax, invLerp(inMin, inMax, v))

export const approach = (current: number, target: number, maxDelta: number): number => {
  const diff = target - current
  if (Math.abs(diff) <= maxDelta) return target
  return current + Math.sign(diff) * maxDelta
}

export const damp = (current: number, target: number, smoothing: number, dt: number): number =>
  lerp(current, target, 1 - Math.pow(smoothing, dt))

export const wrapAngle = (a: number): number => {
  let r = (a + Math.PI) % TAU
  if (r < 0) r += TAU
  return r - Math.PI
}

export const angleDelta = (from: number, to: number): number => wrapAngle(to - from)

export const dist = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(bx - ax, by - ay)

export const dist2 = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax
  const dy = by - ay
  return dx * dx + dy * dy
}

export type Easing = (t: number) => number

export const Ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t
    const c4 = TAU / 3
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  outBounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
} as const satisfies Record<string, Easing>
