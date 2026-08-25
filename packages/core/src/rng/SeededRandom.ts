import type { IRandom, WeightedItem } from './IRandom.js'

export const hashString = (input: string): number => {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

export const toSeed = (value: number | string): number => {
  const n = typeof value === 'string' ? hashString(value) : value >>> 0
  return n === 0 ? 0x9e3779b9 : n
}

export class SeededRandom implements IRandom {
  readonly seed: number
  private state: number

  constructor(seed: number | string) {
    this.seed = toSeed(seed)
    this.state = this.seed
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(minInclusive: number, maxExclusive: number): number {
    if (maxExclusive <= minInclusive) return minInclusive
    return minInclusive + Math.floor(this.next() * (maxExclusive - minInclusive))
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability
  }

  sign(): number {
    return this.next() < 0.5 ? -1 : 1
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('SeededRandom.pick: empty collection')
    return items[this.int(0, items.length)] as T
  }

  weighted<T>(items: readonly WeightedItem<T>[]): T {
    if (items.length === 0) throw new RangeError('SeededRandom.weighted: empty collection')
    let total = 0
    for (const item of items) total += Math.max(0, item.weight)
    if (total <= 0) return (items[0] as WeightedItem<T>).value
    let roll = this.next() * total
    for (const item of items) {
      roll -= Math.max(0, item.weight)
      if (roll <= 0) return item.value
    }
    return (items[items.length - 1] as WeightedItem<T>).value
  }

  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1)
      const swap = items[i] as T
      items[i] = items[j] as T
      items[j] = swap
    }
    return items
  }

  fork(salt: string | number): IRandom {
    const saltSeed = typeof salt === 'string' ? hashString(salt) : salt >>> 0
    return new SeededRandom((this.seed ^ Math.imul(saltSeed + 1, 0x9e3779b9)) >>> 0)
  }

  reset(): void {
    this.state = this.seed
  }
}
