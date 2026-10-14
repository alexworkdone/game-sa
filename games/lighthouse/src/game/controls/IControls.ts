import type { IDisposable } from '@sa/core'

export interface IControls extends IDisposable {
  readonly moveX: number
  readonly moveY: number
  readonly fireHeld: boolean
  readonly firePressed: boolean
  readonly reloadPressed: boolean
  readonly pausePressed: boolean
  endStep(): void
}
