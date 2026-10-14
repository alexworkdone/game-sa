import type { IDisposable } from '@sa/core'

export interface MusicSource {
  track(): number
}

export interface IMusic extends IDisposable {
  setVolume(volume: number): void
  unlock(): void
  suspend(): void
  resume(): void
}
