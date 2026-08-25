import type { IDisposable } from '../types.js'

export interface IPortal extends IDisposable {
  readonly name: string
  readonly ready: boolean
  init(): Promise<void>
  gameplayStart(): void
  gameplayStop(): void
  commercialBreak(): Promise<void>
  rewardedBreak(): Promise<boolean>
  happyMoment(intensity?: number): void
  isAdBlocked(): boolean
}
