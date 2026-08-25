import type { IStorage } from '@sa/core'
import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'

const KEY_PARTS = 'partsBuilt.v2'
const KEY_RESERVOIR = 'reservoir.v2'

export interface PartProgress {
  readonly partIndex: number
  readonly partsBuilt: number
  readonly currentTarget: number
  readonly reservoir: number
  readonly capacity: number
}

export interface CommitResult extends PartProgress {
  readonly partBuilt: boolean
  readonly overflow: number
}

const round1 = (value: number): number => Math.round(value * 10) / 10

export class PartLedger {
  private readonly storage: IStorage

  constructor(storage: IStorage) {
    this.storage = storage
  }

  get partsBuilt(): number {
    return this.storage.get(KEY_PARTS, 0)
  }

  get capacity(): number {
    return BALANCE.plasma.reservoirCapacity
  }

  get reservoir(): number {
    return clamp(this.storage.get(KEY_RESERVOIR, 0), 0, this.capacity)
  }

  targetFor(index: number): number {
    return Math.round(BALANCE.plasma.baseTarget * Math.pow(BALANCE.plasma.growth, index))
  }

  get currentTarget(): number {
    return this.targetFor(this.partsBuilt)
  }

  get progress(): PartProgress {
    const partsBuilt = this.partsBuilt
    return {
      partIndex: partsBuilt,
      partsBuilt,
      currentTarget: this.targetFor(partsBuilt),
      reservoir: this.reservoir,
      capacity: this.capacity,
    }
  }

  commit(runEnergy: number): CommitResult {
    const target = this.currentTarget
    let pool = this.reservoir + Math.max(0, runEnergy)
    const partBuilt = pool >= target

    if (partBuilt) {
      pool -= target
      this.storage.set(KEY_PARTS, this.partsBuilt + 1)
    }

    const overflow = Math.max(0, pool - this.capacity)
    this.storage.set(KEY_RESERVOIR, round1(Math.min(pool, this.capacity)))

    return { ...this.progress, partBuilt, overflow: round1(overflow) }
  }
}
