export interface WeightedItem<T> {
  readonly value: T
  readonly weight: number
}

export interface IRandom {
  readonly seed: number
  next(): number
  int(minInclusive: number, maxExclusive: number): number
  float(min: number, max: number): number
  bool(probability?: number): boolean
  sign(): number
  pick<T>(items: readonly T[]): T
  weighted<T>(items: readonly WeightedItem<T>[]): T
  shuffle<T>(items: T[]): T[]
  fork(salt: string | number): IRandom
  reset(): void
}
