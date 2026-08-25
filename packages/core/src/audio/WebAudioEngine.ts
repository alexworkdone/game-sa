import type { IStorage } from '../storage/IStorage.js'
import type { IAudio, PlayOptions, SfxSpec } from './IAudio.js'

export interface WebAudioEngineOptions {
  readonly storage?: IStorage
  readonly storageKey?: string
  readonly masterVolume?: number
}

export class WebAudioEngine implements IAudio {
  private readonly specs = new Map<string, SfxSpec>()
  private readonly storage: IStorage | null
  private readonly storageKey: string

  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private masterVolume: number

  muted: boolean
  unlocked = false

  constructor(options: WebAudioEngineOptions = {}) {
    this.storage = options.storage ?? null
    this.storageKey = options.storageKey ?? 'audio.muted'
    this.masterVolume = options.masterVolume ?? 0.6
    this.muted = this.storage?.get(this.storageKey, false) ?? false
  }

  register(name: string, spec: SfxSpec): void {
    this.specs.set(name, spec)
  }

  registerAll(specs: Readonly<Record<string, SfxSpec>>): void {
    for (const [name, spec] of Object.entries(specs)) this.specs.set(name, spec)
  }

  unlock(): void {
    if (this.unlocked) return
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.context = new Ctor()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : this.masterVolume
      this.master.connect(this.context.destination)
      this.noiseBuffer = this.createNoiseBuffer(this.context)
      void this.context.resume()
      this.unlocked = true
    } catch {
      this.context = null
      this.master = null
    }
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const length = Math.floor(context.sampleRate * 0.5)
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  play(name: string, options: PlayOptions = {}): void {
    const spec = this.specs.get(name)
    if (!spec || this.muted) return
    if (!this.unlocked) this.unlock()
    const context = this.context
    const master = this.master
    if (!context || !master) return
    if (context.state === 'suspended') void context.resume()

    const now = context.currentTime + (options.delay ?? 0)
    const duration = spec.duration ?? 0.15
    const attack = Math.min(spec.attack ?? 0.005, duration * 0.5)
    const variance = spec.pitchVariance ?? 0.1
    const pitch = (options.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * variance)
    const volume = (spec.volume ?? 1) * (options.volume ?? 1)

    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, now)
    envelope.gain.linearRampToValueAtTime(Math.max(0.0001, volume), now + attack)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    let tail: AudioNode = envelope
    if (spec.lowpass || spec.highpass) {
      const filter = context.createBiquadFilter()
      filter.type = spec.highpass ? 'highpass' : 'lowpass'
      filter.frequency.value = spec.highpass ?? spec.lowpass ?? 20000
      envelope.connect(filter)
      tail = filter
    }
    tail.connect(master)

    if (spec.kind === 'noise') {
      const source = context.createBufferSource()
      source.buffer = this.noiseBuffer
      source.playbackRate.value = pitch
      source.connect(envelope)
      source.start(now)
      source.stop(now + duration)
      return
    }

    const oscillator = context.createOscillator()
    oscillator.type = spec.wave ?? 'square'
    const baseFrequency = (spec.frequency ?? 440) * pitch
    oscillator.frequency.setValueAtTime(baseFrequency, now)
    if (spec.kind === 'sweep') {
      const end = (spec.endFrequency ?? baseFrequency * 0.5) * pitch
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration)
    }
    oscillator.connect(envelope)
    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.storage?.set(this.storageKey, muted)
    if (this.master) this.master.gain.value = muted ? 0 : this.masterVolume
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.master && !this.muted) this.master.gain.value = this.masterVolume
  }

  dispose(): void {
    this.specs.clear()
    void this.context?.close()
    this.context = null
    this.master = null
    this.noiseBuffer = null
    this.unlocked = false
  }
}
