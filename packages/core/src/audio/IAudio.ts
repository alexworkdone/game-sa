import type { IDisposable } from '../types.js'

export type SfxKind = 'tone' | 'sweep' | 'noise'

export interface SfxSpec {
  readonly kind: SfxKind
  readonly frequency?: number
  readonly endFrequency?: number
  readonly wave?: OscillatorType
  readonly duration?: number
  readonly attack?: number
  readonly volume?: number
  readonly pitchVariance?: number
  readonly lowpass?: number
  readonly highpass?: number
}

export interface PlayOptions {
  readonly volume?: number
  readonly pitch?: number
  readonly delay?: number
}

export interface IAudio extends IDisposable {
  readonly muted: boolean
  readonly unlocked: boolean
  register(name: string, spec: SfxSpec): void
  registerAll(specs: Readonly<Record<string, SfxSpec>>): void
  play(name: string, options?: PlayOptions): void
  setMuted(muted: boolean): void
  toggleMuted(): boolean
  setMasterVolume(volume: number): void
  unlock(): void
}
