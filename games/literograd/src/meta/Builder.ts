import { BUILDINGS, buildingSpec, costAt, decorSpec } from '../content/buildings.js'
import type { BuildingId, BuildingSpec, DecorId } from '../content/buildings.js'
import type { City } from './City.js'
import type { Wallet } from './Wallet.js'
import { STARTING_INK } from './Wallet.js'

export type UpgradeResult =
  | { readonly ok: false }
  | { readonly ok: true; readonly spec: BuildingSpec; readonly level: number; readonly cityCompleted: boolean }

export class Builder {
  private readonly wallet: Wallet
  private readonly city: City

  constructor(wallet: Wallet, city: City) {
    this.wallet = wallet
    this.city = city
  }

  costOf(id: BuildingId): number | null {
    return costAt(buildingSpec(id), this.city.level(id))
  }

  canUpgrade(id: BuildingId): boolean {
    const cost = this.costOf(id)
    return cost !== null && this.wallet.canAfford(cost)
  }

  shortfall(id: BuildingId): number {
    const cost = this.costOf(id)
    return cost === null ? 0 : Math.max(0, cost - this.wallet.balance)
  }

  upgrade(id: BuildingId): UpgradeResult {
    const cost = this.costOf(id)
    if (cost === null || !this.wallet.spend(cost)) return { ok: false }
    const wasComplete = this.city.complete
    const level = this.city.raise(id)
    return { ok: true, spec: buildingSpec(id), level, cityCompleted: !wasComplete && this.city.complete }
  }

  canPlace(id: DecorId): boolean {
    return this.city.freeSlots > 0 && this.wallet.canAfford(decorSpec(id).cost)
  }

  place(id: DecorId): boolean {
    if (!this.canPlace(id)) return false
    this.wallet.spend(decorSpec(id).cost)
    return this.city.place(id)
  }

  affordableCount(): number {
    return BUILDINGS.filter((spec) => this.canUpgrade(spec.id)).length
  }

  affordable(): BuildingSpec[] {
    return BUILDINGS.filter((spec) => this.canUpgrade(spec.id)).sort((a, b) => (this.costOf(a.id) ?? 0) - (this.costOf(b.id) ?? 0))
  }

  nextGoal(): BuildingSpec | null {
    const open = BUILDINGS.filter((spec) => this.costOf(spec.id) !== null)
    open.sort((a, b) => (this.costOf(a.id) ?? 0) - (this.costOf(b.id) ?? 0))
    return open[0] ?? null
  }

  startNewBook(now: number): void {
    if (!this.city.complete) return
    this.city.closeBook(now)
    this.wallet.reset(STARTING_INK)
  }
}
