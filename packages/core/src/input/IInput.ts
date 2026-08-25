import type { IDisposable, IReadonlySignal, IUpdatable } from '../types.js'

export interface PointerSample {
  readonly x: number
  readonly y: number
  readonly pointerId: number
}

export interface IInput extends IDisposable, IUpdatable {
  readonly x: number
  readonly y: number
  readonly isDown: boolean
  readonly justPressed: boolean
  readonly justReleased: boolean
  readonly hasInteracted: boolean
  readonly onFirstInteraction: IReadonlySignal<PointerSample>
  readonly onPress: IReadonlySignal<PointerSample>
  readonly onRelease: IReadonlySignal<PointerSample>
  isKeyDown(code: string): boolean
  wasKeyPressed(code: string): boolean
  axisX(): number
  axisY(): number
  setEnabled(enabled: boolean): void
}
