import type { IAudio, SfxSpec } from './IAudio.js'

export class SilentAudio implements IAudio {
  readonly unlocked = true
  muted = true

  register(_name: string, _spec: SfxSpec): void {
    /* no-op */
  }

  registerAll(_specs: Readonly<Record<string, SfxSpec>>): void {
    /* no-op */
  }

  play(): void {
    /* no-op */
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  toggleMuted(): boolean {
    this.muted = !this.muted
    return this.muted
  }

  setMasterVolume(): void {
    /* no-op */
  }

  unlock(): void {
    /* no-op */
  }

  dispose(): void {
    /* no-op */
  }
}
