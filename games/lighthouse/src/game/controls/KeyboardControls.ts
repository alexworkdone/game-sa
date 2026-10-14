import type { IInput } from '@sa/core'
import type { IControls } from './IControls.js'

export interface KeyBindings {
  readonly fire: readonly string[]
  readonly reload: readonly string[]
  readonly pause: readonly string[]
}

export const DEFAULT_BINDINGS: KeyBindings = {
  fire: ['Space', 'KeyJ', 'KeyX'],
  reload: ['KeyR'],
  pause: ['Escape', 'KeyP'],
}

export class KeyboardControls implements IControls {
  private readonly input: IInput
  private readonly bindings: KeyBindings

  constructor(input: IInput, bindings: KeyBindings = DEFAULT_BINDINGS) {
    this.input = input
    this.bindings = bindings
  }

  get moveX(): number {
    return this.input.axisX()
  }

  get moveY(): number {
    return this.input.axisY()
  }

  get fireHeld(): boolean {
    return this.bindings.fire.some((code) => this.input.isKeyDown(code))
  }

  get firePressed(): boolean {
    return this.bindings.fire.some((code) => this.input.wasKeyPressed(code))
  }

  get reloadPressed(): boolean {
    return this.bindings.reload.some((code) => this.input.wasKeyPressed(code))
  }

  get pausePressed(): boolean {
    return this.bindings.pause.some((code) => this.input.wasKeyPressed(code))
  }

  endStep(): void {}

  dispose(): void {}
}
