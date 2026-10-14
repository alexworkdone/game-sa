import type { IPortal } from '@sa/core'

export interface AdPacerOptions {
  readonly minIntervalMs: number
  readonly now?: () => number
}

export class AdPacer {
  private readonly portal: IPortal
  private readonly minIntervalMs: number
  private readonly now: () => number
  private lastBreak: number

  constructor(portal: IPortal, options: AdPacerOptions) {
    this.portal = portal
    this.minIntervalMs = options.minIntervalMs
    this.now = options.now ?? Date.now
    this.lastBreak = this.now()
  }

  async maybeBreak(): Promise<void> {
    if (this.now() - this.lastBreak < this.minIntervalMs) return
    this.lastBreak = this.now()
    await this.portal.commercialBreak()
  }

  async rewarded(): Promise<boolean> {
    const granted = await this.portal.rewardedBreak()
    if (granted) this.lastBreak = this.now()
    return granted
  }
}
