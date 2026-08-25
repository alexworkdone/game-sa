import type { IPortal } from './IPortal.js'

export interface PortalViolation {
  readonly call: string
  readonly reason: string
}

export class GuardedPortal implements IPortal {
  private readonly inner: IPortal
  private readonly onViolation: (violation: PortalViolation) => void

  private gameplayActive = false
  private breakInFlight = false

  constructor(inner: IPortal, onViolation?: (violation: PortalViolation) => void) {
    this.inner = inner
    this.onViolation =
      onViolation ??
      ((violation) => console.warn(`[portal] ${violation.call}: ${violation.reason}`))
  }

  get name(): string {
    return this.inner.name
  }

  get ready(): boolean {
    return this.inner.ready
  }

  get isGameplayActive(): boolean {
    return this.gameplayActive
  }

  init(): Promise<void> {
    return this.inner.init()
  }

  gameplayStart(): void {
    if (this.gameplayActive) {
      this.onViolation({ call: 'gameplayStart', reason: 'called twice without gameplayStop' })
      return
    }
    this.gameplayActive = true
    this.inner.gameplayStart()
  }

  gameplayStop(): void {
    if (!this.gameplayActive) {
      this.onViolation({ call: 'gameplayStop', reason: 'called without gameplayStart' })
      return
    }
    this.gameplayActive = false
    this.inner.gameplayStop()
  }

  async commercialBreak(): Promise<void> {
    if (this.gameplayActive) {
      this.onViolation({ call: 'commercialBreak', reason: 'called during active gameplay' })
      return
    }
    if (this.breakInFlight) return
    this.breakInFlight = true
    try {
      await this.inner.commercialBreak()
    } finally {
      this.breakInFlight = false
    }
  }

  async rewardedBreak(): Promise<boolean> {
    if (this.gameplayActive) {
      this.onViolation({ call: 'rewardedBreak', reason: 'called during active gameplay' })
      return false
    }
    if (this.breakInFlight) return false
    this.breakInFlight = true
    try {
      return await this.inner.rewardedBreak()
    } finally {
      this.breakInFlight = false
    }
  }

  happyMoment(intensity?: number): void {
    this.inner.happyMoment(intensity)
  }

  isAdBlocked(): boolean {
    return this.inner.isAdBlocked()
  }

  dispose(): void {
    this.inner.dispose()
  }
}
