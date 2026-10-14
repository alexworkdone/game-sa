import type { IStorage } from '@sa/core'
import { PERKS, emptyPerkLevels, relicPrice, resolvePerks } from '../config/perks.js'
import { emptyWallets, pearlKindOf } from '../config/pearls.js'
import type { ExchangeRate, PearlKind, PearlPrice, Wallets } from '../config/pearls.js'
import type { PerkDef, PerkEffects, PerkId, PerkLevels } from '../config/perks.js'
import { tierCostScale } from '../config/tiers.js'
import { UPGRADES } from '../config/upgrades.js'
import type { StatId } from '../config/achievements.js'
import type { UpgradeDef, UpgradeId } from '../config/upgrades.js'
import type { UpgradeLevels } from './HeroStats.js'

interface TierData {
  bestFloor: number
  startFloor: number | null
  levels: Record<UpgradeId, number>
  savedRun: SavedRun | null
}

export interface SavedRun {
  readonly tier: number
  readonly startFloor: number
  readonly floor: number
  readonly hp: number
  readonly runPearls: number
  readonly kills: number
  readonly secondWinds?: number
  readonly secondWindReady?: boolean
  readonly bestBefore?: number
}

interface ProgressData {
  pearls: Wallets
  runs: number
  totalPearls: number
  totalKills: number
  stats: Partial<Record<StatId, number>>
  deaths: Record<string, number>
  tier: number
  maxTier: number
  tiers: Record<string, TierData>
  perks: Record<PerkId, number>
}

interface LegacyData {
  savedRun?: SavedRun | null
  pearls?: number | Partial<Wallets>
  bestFloor?: number
  startFloor?: number | null
  levels?: Partial<Record<UpgradeId, number>>
}

const STORAGE_KEY = 'progress.v1'

const emptyLevels = (): Record<UpgradeId, number> => ({
  caliber: 0,
  trigger: 0,
  drum: 0,
  heart: 0,
  boots: 0,
  pump: 0,
  lungs: 0,
  magnet: 0,
  volley: 0,
})

const emptyTier = (): TierData => ({ bestFloor: 0, startFloor: null, levels: emptyLevels(), savedRun: null })

export interface RunOutcome {
  readonly floorReached: number
  readonly previousBest: number
  readonly pearls: number
  readonly kills: number
}

export interface RunRecordResult {
  readonly newBest: boolean
  readonly previousBest: number
  readonly unlockedCheckpoint: number | null
}

export class Progress {
  private readonly storage: IStorage
  private data: ProgressData

  constructor(storage: IStorage) {
    this.storage = storage
    const stored = storage.get<Omit<Partial<ProgressData>, 'pearls'> & LegacyData>(STORAGE_KEY, {})
    const tiers: Record<string, TierData> = {}
    for (const [key, tier] of Object.entries(stored.tiers ?? {})) {
      tiers[key] = {
        bestFloor: tier.bestFloor ?? 0,
        startFloor: tier.startFloor ?? null,
        levels: { ...emptyLevels(), ...tier.levels },
        savedRun: tier.savedRun ?? null,
      }
    }
    tiers['1'] ??= {
      bestFloor: stored.bestFloor ?? 0,
      startFloor: stored.startFloor && stored.startFloor > 1 ? stored.startFloor : null,
      levels: { ...emptyLevels(), ...(stored.levels ?? {}) },
      savedRun: null,
    }
    const legacyRun = stored.savedRun
    if (legacyRun) {
      const owner = (tiers[String(legacyRun.tier)] ??= emptyTier())
      owner.savedRun ??= legacyRun
    }
    const maxTier = Math.max(1, stored.maxTier ?? 1)
    this.data = {
      pearls:
        typeof stored.pearls === 'number'
          ? { ...emptyWallets(), white: stored.pearls }
          : { ...emptyWallets(), ...(stored.pearls ?? {}) },
      runs: stored.runs ?? 0,
      totalPearls: stored.totalPearls ?? 0,
      totalKills: stored.totalKills ?? 0,
      stats: { ...(stored.stats ?? {}) },
      deaths: { ...(stored.deaths ?? {}) },
      tier: Math.min(maxTier, Math.max(1, stored.tier ?? 1)),
      maxTier,
      tiers,
      perks: { ...emptyPerkLevels(), ...(stored.perks ?? {}) },
    }
  }

  private get current(): TierData {
    const key = String(this.data.tier)
    const existing = this.data.tiers[key]
    if (existing) return existing
    const created = emptyTier()
    this.data.tiers[key] = created
    return created
  }

  get pearlKind(): PearlKind {
    return pearlKindOf(this.data.tier)
  }

  get pearls(): number {
    return this.wallet(this.pearlKind)
  }

  wallet(kind: PearlKind): number {
    return this.data.pearls[kind]
  }

  canPay(price: PearlPrice): boolean {
    return price.every((tag) => this.wallet(tag.kind) >= tag.amount)
  }

  exchangeLots(rate: ExchangeRate): number {
    return Math.floor(this.wallet(rate.from) / rate.give)
  }

  exchange(rate: ExchangeRate, lots: number): number {
    const done = Math.min(lots, this.exchangeLots(rate))
    if (done <= 0) return 0
    this.data.pearls[rate.from] -= rate.give * done
    this.data.pearls[rate.to] += rate.get * done
    this.save()
    return done
  }

  private pay(price: PearlPrice): void {
    for (const tag of price) this.data.pearls[tag.kind] -= tag.amount
  }

  get savedRun(): SavedRun | null {
    return this.current.savedRun
  }

  saveRun(run: SavedRun): void {
    const key = String(run.tier)
    const owner = (this.data.tiers[key] ??= emptyTier())
    owner.savedRun = run
    this.save()
  }

  clearRun(): void {
    if (this.current.savedRun === null) return
    this.current.savedRun = null
    this.save()
  }

  get runs(): number {
    return this.data.runs
  }

  get totalPearls(): number {
    return this.data.totalPearls
  }

  get totalKills(): number {
    return this.data.totalKills
  }

  get deaths(): Readonly<Record<string, number>> {
    return this.data.deaths
  }

  get bestFloorEver(): number {
    return Math.max(0, ...Object.values(this.data.tiers).map((tier) => tier.bestFloor))
  }

  get floorsPassed(): number {
    return Math.max(0, this.bestFloorEver - 1)
  }

  get anyUpgradeMaxed(): boolean {
    return Object.values(this.data.tiers).some((tier) =>
      UPGRADES.some((def) => tier.levels[def.id] >= def.costs.length),
    )
  }

  stat(id: StatId): number {
    return this.data.stats[id] ?? 0
  }

  bump(id: StatId, amount = 1): void {
    if (amount === 0) return
    this.data.stats[id] = this.stat(id) + amount
    this.save()
  }

  raise(id: StatId, value: number): void {
    if (value <= this.stat(id)) return
    this.data.stats[id] = value
    this.save()
  }

  lower(id: StatId, value: number): void {
    const current = this.data.stats[id]
    if (current !== undefined && current <= value) return
    this.data.stats[id] = value
    this.save()
  }

  addKills(amount: number): void {
    if (amount === 0) return
    this.data.totalKills += amount
    this.save()
  }

  recordDeath(cause: string): void {
    this.data.deaths[cause] = (this.data.deaths[cause] ?? 0) + 1
    this.save()
  }

  get tier(): number {
    return this.data.tier
  }

  get maxTier(): number {
    return this.data.maxTier
  }

  get bestFloor(): number {
    return this.current.bestFloor
  }

  get levels(): UpgradeLevels {
    return this.current.levels
  }

  get perks(): PerkLevels {
    return this.data.perks
  }

  get effects(): PerkEffects {
    return resolvePerks(this.data.perks)
  }

  get perksUnlocked(): boolean {
    return this.data.maxTier >= 2
  }

  setTier(tier: number): void {
    if (tier < 1 || tier > this.data.maxTier || tier === this.data.tier) return
    this.data.tier = tier
    this.save()
  }

  get allMaxed(): boolean {
    return UPGRADES.every((def) => this.isMaxed(def))
  }

  get canAdvance(): boolean {
    return this.data.tier === this.data.maxTier && this.allMaxed
  }

  advanceTier(): number {
    if (!this.canAdvance) return this.data.tier
    this.data.maxTier += 1
    this.data.tier = this.data.maxTier
    this.data.tiers[String(this.data.tier)] ??= emptyTier()
    this.save()
    return this.data.tier
  }

  unlockTiers(upTo: number): void {
    if (upTo <= this.data.maxTier) return
    this.data.maxTier = upTo
    this.save()
  }

  private get checkpointEvery(): number {
    return this.effects.checkpointEvery
  }

  private checkpointAt(floor: number): number {
    const every = this.checkpointEvery
    return Math.max(1, Math.floor(floor / every) * every)
  }

  get highestCheckpoint(): number {
    return this.checkpointAt(this.current.bestFloor)
  }

  get startFloor(): number {
    const chosen = this.current.startFloor
    if (chosen === null || !this.checkpoints().includes(chosen)) return this.highestCheckpoint
    return chosen
  }

  checkpoints(): number[] {
    const list = [1]
    const every = this.checkpointEvery
    for (let floor = every; floor <= this.highestCheckpoint; floor += every) list.push(floor)
    return list
  }

  lockedCheckpoints(count: number): number[] {
    const every = this.checkpointEvery
    const first = this.highestCheckpoint === 1 ? every : this.highestCheckpoint + every
    return Array.from({ length: count }, (_, i) => first + i * every)
  }

  setStartFloor(floor: number): void {
    this.current.startFloor = floor >= this.highestCheckpoint ? null : floor
    this.save()
  }

  level(id: UpgradeId): number {
    return this.current.levels[id]
  }

  isMaxed(def: UpgradeDef): boolean {
    return this.level(def.id) >= def.costs.length
  }

  nextCost(def: UpgradeDef): number | null {
    const base = def.costs[this.level(def.id)]
    if (base === undefined) return null
    return Math.round(base * tierCostScale(this.data.tier) * (1 - this.effects.discount))
  }

  canAfford(def: UpgradeDef): boolean {
    const cost = this.nextCost(def)
    return cost !== null && cost <= this.pearls
  }

  buy(id: UpgradeId): boolean {
    const def = UPGRADES.find((candidate) => candidate.id === id)
    if (!def) return false
    const cost = this.nextCost(def)
    if (cost === null || cost > this.pearls) return false
    this.data.pearls[this.pearlKind] -= cost
    this.current.levels[id] += 1
    this.data.stats.upgradesBought = this.stat('upgradesBought') + 1
    this.save()
    return true
  }

  perkLevel(id: PerkId): number {
    return this.data.perks[id]
  }

  perkPrice(def: PerkDef): PearlPrice | null {
    const next = this.perkLevel(def.id) + 1
    return next > def.maxLevel ? null : relicPrice(def, next)
  }

  canAffordPerk(def: PerkDef): boolean {
    const price = this.perkPrice(def)
    return this.perksUnlocked && price !== null && this.canPay(price)
  }

  buyPerk(id: PerkId): boolean {
    const def = PERKS.find((candidate) => candidate.id === id)
    const price = def ? this.perkPrice(def) : null
    if (!def || !price || !this.canAffordPerk(def)) return false
    this.pay(price)
    this.data.perks[id] += 1
    this.save()
    return true
  }

  addPearls(amount: number): void {
    this.data.pearls[this.pearlKind] += amount
    this.data.totalPearls += amount
    this.save()
  }

  reachFloor(floor: number): void {
    const tier = this.current
    if (floor <= tier.bestFloor) return
    const previousCheckpoint = this.highestCheckpoint
    tier.bestFloor = floor
    if (this.highestCheckpoint > previousCheckpoint) tier.startFloor = null
    this.save()
  }

  recordRun(outcome: RunOutcome): RunRecordResult {
    const previousBest = Math.min(outcome.previousBest, this.current.bestFloor)
    this.data.runs += 1
    this.reachFloor(outcome.floorReached)
    this.save()
    const checkpoint = this.highestCheckpoint
    return {
      newBest: outcome.floorReached > previousBest,
      previousBest,
      unlockedCheckpoint: checkpoint > this.checkpointAt(previousBest) ? checkpoint : null,
    }
  }

  reset(): void {
    this.data = {
      pearls: emptyWallets(),
      runs: 0,
      totalPearls: 0,
      totalKills: 0,
      stats: {},
      deaths: {},
      tier: 1,
      maxTier: 1,
      tiers: { '1': emptyTier() },
      perks: emptyPerkLevels(),
    }
    this.save()
  }

  private save(): void {
    this.storage.set(STORAGE_KEY, this.data)
  }
}
