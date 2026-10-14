import { Signal } from '@sa/core'
import type { IReadonlySignal, IStorage } from '@sa/core'
import { ACHIEVEMENTS } from '../config/achievements.js'
import type { AchievementDef, FeatView, StatId } from '../config/achievements.js'
import type { Progress } from './Progress.js'

const STORAGE_KEY = 'achievements.v1'

export interface FeatProgress {
  readonly value: number
  readonly target: number
  readonly fraction: number
}

export class Achievements {
  private readonly storage: IStorage
  private readonly progress: Progress
  private readonly unlocked: Map<string, number>
  private readonly unlockedSignal = new Signal<readonly AchievementDef[]>()

  constructor(storage: IStorage, progress: Progress) {
    this.storage = storage
    this.progress = progress
    this.unlocked = new Map(Object.entries(storage.get<Record<string, number>>(STORAGE_KEY, {})))
  }

  get onUnlock(): IReadonlySignal<readonly AchievementDef[]> {
    return this.unlockedSignal
  }

  get count(): number {
    return ACHIEVEMENTS.filter((def) => this.unlocked.has(def.id)).length
  }

  get total(): number {
    return ACHIEVEMENTS.length
  }

  isUnlocked(def: AchievementDef): boolean {
    return this.unlocked.has(def.id)
  }

  unlockedAt(def: AchievementDef): number | null {
    return this.unlocked.get(def.id) ?? null
  }

  progressOf(def: AchievementDef): FeatProgress {
    const value = def.measure(this.view())
    if (def.lowerIsBetter) {
      const done = value > 0 && value <= def.target
      return { value, target: def.target, fraction: done ? 1 : value > 0 ? Math.min(0.95, def.target / value) : 0 }
    }
    return { value, target: def.target, fraction: Math.min(1, value / def.target) }
  }

  check(): AchievementDef[] {
    const view = this.view()
    const fresh: AchievementDef[] = []
    for (const def of ACHIEVEMENTS) {
      if (this.unlocked.has(def.id)) continue
      const value = def.measure(view)
      const done = def.lowerIsBetter ? value > 0 && value <= def.target : value >= def.target
      if (!done) continue
      this.unlocked.set(def.id, Date.now())
      fresh.push(def)
    }
    if (fresh.length === 0) return fresh
    this.storage.set(STORAGE_KEY, Object.fromEntries(this.unlocked))
    this.unlockedSignal.emit(this.headline(fresh))
    return fresh
  }

  private headline(fresh: readonly AchievementDef[]): AchievementDef[] {
    const best = new Map<string, AchievementDef>()
    for (const def of fresh) best.set(def.chain ?? def.id, def)
    return [...best.values()]
  }

  private view(): FeatView {
    const progress = this.progress
    return {
      totalPearls: progress.totalPearls,
      kills: progress.totalKills,
      runs: progress.runs,
      bestFloor: progress.bestFloorEver,
      maxTier: progress.maxTier,
      anyUpgradeMaxed: progress.anyUpgradeMaxed,
      relicKinds: Object.values(progress.perks).filter((level) => level > 0).length,
      deaths: progress.deaths,
      stat: (id: StatId) => progress.stat(id),
    }
  }
}
