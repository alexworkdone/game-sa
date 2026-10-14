import type { IAudio, IStorage } from '@sa/core'
import type { IMusic } from './music/IMusic.js'

export const VOLUME_LEVELS = 3

const SOUND_KEY = 'audio.level'
const MUSIC_KEY = 'music.level'
const DEFAULT_LEVEL = 2
const SOUND_VOLUMES: readonly number[] = [0, 0.04, 0.18, 0.6]
const MUSIC_VOLUMES: readonly number[] = [0, 0.04, 0.16, 0.5]

export interface IVolumeControls {
  readonly soundLevel: number
  readonly musicLevel: number
  cycleSound(): number
  cycleMusic(): number
}

const clampLevel = (level: number): number => Math.max(0, Math.min(VOLUME_LEVELS, Math.round(level)))

const nextLevel = (level: number): number => (level + 1) % (VOLUME_LEVELS + 1)

export class VolumeControls implements IVolumeControls {
  private readonly storage: IStorage
  private readonly audio: IAudio
  private readonly music: IMusic
  private sound: number
  private tune: number

  constructor(storage: IStorage, audio: IAudio, music: IMusic) {
    this.storage = storage
    this.audio = audio
    this.music = music
    this.sound = clampLevel(storage.get(SOUND_KEY, audio.muted ? 0 : DEFAULT_LEVEL))
    this.tune = clampLevel(storage.get(MUSIC_KEY, DEFAULT_LEVEL))
    this.apply()
  }

  get soundLevel(): number {
    return this.sound
  }

  get musicLevel(): number {
    return this.tune
  }

  cycleSound(): number {
    this.sound = nextLevel(this.sound)
    this.storage.set(SOUND_KEY, this.sound)
    this.apply()
    return this.sound
  }

  cycleMusic(): number {
    this.tune = nextLevel(this.tune)
    this.storage.set(MUSIC_KEY, this.tune)
    this.apply()
    return this.tune
  }

  private apply(): void {
    this.audio.setMuted(this.sound === 0)
    if (this.sound > 0) this.audio.setMasterVolume(SOUND_VOLUMES[this.sound] ?? 0)
    this.music.setVolume(MUSIC_VOLUMES[this.tune] ?? 0)
  }
}
