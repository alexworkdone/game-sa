import { Signal } from '@sa/core'
import type { IStorage } from '@sa/core'
import { PARTICLE_COLORS, emptyAmounts } from '../shared/ParticleColor.js'
import type { ParticleAmounts, ParticleColor } from '../shared/ParticleColor.js'

interface WalletState {
  readonly particles: Record<ParticleColor, number>
  readonly hints: number
}

const KEY = 'v1.wallet'
const STARTING_HINTS = 3

export class Wallet {
  readonly onChange = new Signal<void>()

  private readonly storage: IStorage
  private state: WalletState

  constructor(storage: IStorage) {
    this.storage = storage
    const saved = storage.get<WalletState | null>(KEY, null)
    this.state = {
      particles: { ...emptyAmounts(), ...(saved?.particles ?? {}) },
      hints: saved?.hints ?? STARTING_HINTS,
    }
  }

  get particles(): ParticleAmounts {
    return this.state.particles
  }

  get hints(): number {
    return this.state.hints
  }

  amount(color: ParticleColor): number {
    return this.state.particles[color]
  }

  canAfford(cost: Partial<ParticleAmounts>): boolean {
    return PARTICLE_COLORS.every((color) => this.state.particles[color] >= (cost[color] ?? 0))
  }

  add(amounts: Partial<ParticleAmounts>): void {
    const particles = { ...this.state.particles }
    for (const color of PARTICLE_COLORS) particles[color] += Math.max(0, amounts[color] ?? 0)
    this.commit({ ...this.state, particles })
  }

  spend(cost: Partial<ParticleAmounts>): boolean {
    if (!this.canAfford(cost)) return false
    const particles = { ...this.state.particles }
    for (const color of PARTICLE_COLORS) particles[color] -= cost[color] ?? 0
    this.commit({ ...this.state, particles })
    return true
  }

  addHints(count: number): void {
    this.commit({ ...this.state, hints: this.state.hints + count })
  }

  useHint(): boolean {
    if (this.state.hints <= 0) return false
    this.commit({ ...this.state, hints: this.state.hints - 1 })
    return true
  }

  private commit(next: WalletState): void {
    this.state = next
    this.storage.set(KEY, next)
    this.onChange.emit()
  }
}
