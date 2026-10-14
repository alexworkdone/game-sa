import { Signal } from '@sa/core'
import type { ParticleColor } from '../shared/ParticleColor.js'
import { PARTICLE_COLORS, emptyAmounts } from '../shared/ParticleColor.js'
import type { Wallet } from '../meta/Wallet.js'
import type { AddResult, Galaxy } from './Galaxy.js'
import type { Planet, PlanetTypeId } from './Planet.js'
import { PORTION_SIZE, PORTIONS_PER_PLANET } from './PlanetForge.js'
import type { PlanetForge } from './PlanetForge.js'
import type { RarityWeights } from './RarityOdds.js'

export interface Creation {
  readonly planet: Planet
  readonly result: AddResult
}

export class ForgeService {
  readonly onChange = new Signal<void>()

  private readonly forge: PlanetForge
  private readonly wallet: Wallet
  private readonly galaxy: Galaxy
  private slots: ParticleColor[] = []

  constructor(forge: PlanetForge, wallet: Wallet, galaxy: Galaxy) {
    this.forge = forge
    this.wallet = wallet
    this.galaxy = galaxy
  }

  get portions(): readonly ParticleColor[] {
    return this.slots
  }

  get full(): boolean {
    return this.slots.length === PORTIONS_PER_PLANET
  }

  get prediction(): PlanetTypeId | null {
    return this.full ? this.forge.resolveType(this.slots) : null
  }

  get weights(): RarityWeights {
    return this.forge.weights(this.slots, this.galaxy.pityReady)
  }

  available(color: ParticleColor): number {
    const reserved = this.slots.filter((slot) => slot === color).length * PORTION_SIZE
    return this.wallet.amount(color) - reserved
  }

  canAdd(color: ParticleColor): boolean {
    return !this.full && this.available(color) >= PORTION_SIZE
  }

  affordablePlanets(): number {
    const portions = PARTICLE_COLORS.reduce(
      (sum, color) => sum + Math.floor(this.wallet.amount(color) / PORTION_SIZE),
      0,
    )
    return Math.floor(portions / PORTIONS_PER_PLANET)
  }

  add(color: ParticleColor): boolean {
    if (!this.canAdd(color)) return false
    this.slots = [...this.slots, color]
    this.onChange.emit()
    return true
  }

  removeAt(index: number): void {
    if (index < 0 || index >= this.slots.length) return
    this.slots = this.slots.filter((_, slot) => slot !== index)
    this.onChange.emit()
  }

  clear(): void {
    if (this.slots.length === 0) return
    this.slots = []
    this.onChange.emit()
  }

  create(): Creation | null {
    if (!this.full) return null
    const cost = emptyAmounts()
    for (const color of this.slots) cost[color] += PORTION_SIZE
    if (!this.wallet.spend(cost)) return null
    const { planet } = this.forge.create(this.slots, this.galaxy.pityReady)
    const result = this.galaxy.add(planet)
    this.slots = []
    this.onChange.emit()
    return { planet, result }
  }
}
