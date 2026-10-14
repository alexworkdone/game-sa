export const wrap = (value: number, size: number): number => ((value % size) + size) % size

export const ringDelta = (from: number, to: number, size: number): number => {
  const delta = wrap(to - from, size)
  return delta > size / 2 ? delta - size : delta
}

export const ringDistance = (a: number, b: number, size: number): number => Math.abs(ringDelta(a, b, size))
