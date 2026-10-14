import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'

export interface RankInfo {
  readonly index: number
  readonly title: string
  readonly from: number
  readonly to: number
}

export interface XpGain {
  readonly before: RankInfo
  readonly after: RankInfo
  readonly xpBefore: number
  readonly xpAfter: number
  readonly rankUps: number
}

const KEY = 'v1.rank'
const LATE_STEP = 9000

export class RankSystem {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private readonly titles: readonly string[]
  private readonly thresholds: readonly number[]
  private total: number

  constructor(storage: IStorage, titles: readonly string[], thresholds: readonly number[]) {
    this.storage = storage
    this.titles = titles
    this.thresholds = thresholds
    this.total = storage.get(KEY, 0)
  }

  get xp(): number {
    return this.total
  }

  get current(): RankInfo {
    return this.rankFor(this.total)
  }

  progress(info: RankInfo = this.current, xp: number = this.total): number {
    return Math.min(1, Math.max(0, (xp - info.from) / (info.to - info.from)))
  }

  rankFor(xp: number): RankInfo {
    let index = 0
    while (this.threshold(index + 1) <= xp) index++
    return {
      index,
      title: this.title(index),
      from: this.threshold(index),
      to: this.threshold(index + 1),
    }
  }

  rankAt(index: number): RankInfo {
    return {
      index,
      title: this.title(index),
      from: this.threshold(index),
      to: this.threshold(index + 1),
    }
  }

  add(amount: number): XpGain {
    const before = this.current
    const xpBefore = this.total
    this.total += Math.max(0, Math.round(amount))
    this.storage.set(KEY, this.total)
    const after = this.current
    this.onChange.emit()
    return { before, after, xpBefore, xpAfter: this.total, rankUps: after.index - before.index }
  }

  private threshold(index: number): number {
    const known = this.thresholds[index]
    if (known !== undefined) return known
    const last = this.thresholds[this.thresholds.length - 1] ?? 0
    return last + (index - this.thresholds.length + 1) * LATE_STEP
  }

  private title(index: number): string {
    const known = this.titles[index]
    if (known !== undefined) return known
    const last = this.titles[this.titles.length - 1] ?? ''
    return `${last} ${index - this.titles.length + 2}`
  }
}
