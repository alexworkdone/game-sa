import type { IPortal } from './IPortal.js'

export interface NullPortalOptions {
  readonly verbose?: boolean
  readonly rewardedResult?: boolean
}

export class NullPortal implements IPortal {
  readonly name = 'null'
  ready = false

  private readonly verbose: boolean
  private readonly rewardedResult: boolean

  constructor(options: NullPortalOptions = {}) {
    this.verbose = options.verbose ?? false
    this.rewardedResult = options.rewardedResult ?? true
  }

  private log(message: string): void {
    if (this.verbose) console.info(`[portal] ${message}`)
  }

  async init(): Promise<void> {
    this.ready = true
    this.log('init')
  }

  gameplayStart(): void {
    this.log('gameplayStart')
  }

  gameplayStop(): void {
    this.log('gameplayStop')
  }

  async commercialBreak(): Promise<void> {
    this.log('commercialBreak')
  }

  async rewardedBreak(): Promise<boolean> {
    this.log('rewardedBreak')
    return this.rewardedResult
  }

  happyMoment(intensity = 1): void {
    this.log(`happyMoment(${intensity})`)
  }

  isAdBlocked(): boolean {
    return false
  }

  dispose(): void {
    this.ready = false
  }
}
