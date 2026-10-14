import { STEPS_PER_BAR } from '../../config/music.js'
import type { MusicTrack, MusicVoice } from '../../config/music.js'
import type { IMusic, MusicSource } from './IMusic.js'

const LOOKAHEAD = 0.6
const TICK_MS = 100
const VOLUME_FADE = 0.4
const CROSSFADE = 1.4
const START_DELAY = 0.08
const ECHO_TIME = 0.36
const ECHO_FEEDBACK = 0.32
const ECHO_MIX = 0.28
const PAD_DEGREES = [0, 2, 4] as const

interface Deck {
  readonly track: MusicTrack
  readonly index: number
  readonly bus: GainNode
  step: number
  nextTime: number
}

export class SynthMusic implements IMusic {
  private readonly tracks: readonly MusicTrack[]
  private readonly source: MusicSource
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private input: GainNode | null = null
  private deck: Deck | null = null
  private timer: number | null = null
  private volume = 0
  private applied = 0

  constructor(tracks: readonly MusicTrack[], source: MusicSource) {
    this.tracks = tracks
    this.source = source
  }

  unlock(): void {
    if (this.context) return
    try {
      const context = new AudioContext()
      const master = context.createGain()
      master.gain.value = 0
      master.connect(context.destination)
      const input = context.createGain()
      const echo = context.createDelay(1)
      echo.delayTime.value = ECHO_TIME
      const feedback = context.createGain()
      feedback.gain.value = ECHO_FEEDBACK
      const wet = context.createGain()
      wet.gain.value = ECHO_MIX
      input.connect(master)
      input.connect(echo)
      echo.connect(feedback)
      feedback.connect(echo)
      echo.connect(wet)
      wet.connect(master)
      this.context = context
      this.master = master
      this.input = input
      void context.resume()
      this.timer = window.setInterval(() => this.tick(), TICK_MS)
    } catch {
      this.context = null
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    this.tick()
  }

  suspend(): void {
    void this.context?.suspend()
  }

  resume(): void {
    void this.context?.resume()
  }

  private tick(): void {
    const { context, master } = this
    if (!context || !master || context.state !== 'running') return
    if (this.volume !== this.applied) {
      this.applied = this.volume
      const now = context.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(this.volume, now + VOLUME_FADE)
    }
    if (this.volume <= 0) return
    const count = this.tracks.length
    const index = ((this.source.track() % count) + count) % count
    if (!this.deck || this.deck.index !== index) this.switchTo(context, index)
    this.schedule(context)
  }

  private switchTo(context: AudioContext, index: number): void {
    const track = this.tracks[index]
    if (!track || !this.input) return
    const now = context.currentTime
    const previous = this.deck
    if (previous) {
      previous.bus.gain.cancelScheduledValues(now)
      previous.bus.gain.setValueAtTime(previous.bus.gain.value, now)
      previous.bus.gain.linearRampToValueAtTime(0, now + CROSSFADE)
      window.setTimeout(() => previous.bus.disconnect(), (CROSSFADE + LOOKAHEAD + 4) * 1000)
    }
    const bus = context.createGain()
    bus.gain.setValueAtTime(0, now)
    bus.gain.linearRampToValueAtTime(1, now + CROSSFADE)
    bus.connect(this.input)
    this.deck = { track, index, bus, step: 0, nextTime: now + START_DELAY }
  }

  private schedule(context: AudioContext): void {
    const deck = this.deck
    if (!deck) return
    const now = context.currentTime
    if (deck.nextTime < now) deck.nextTime = now + START_DELAY
    const stepTime = 60 / deck.track.bpm / 2
    while (deck.nextTime < now + LOOKAHEAD) {
      this.playStep(context, deck, deck.nextTime)
      deck.step += 1
      deck.nextTime += stepTime
    }
  }

  private playStep(context: AudioContext, deck: Deck, time: number): void {
    const { track, step, bus } = deck
    const bar = Math.floor(step / STEPS_PER_BAR)
    const chord = track.chords[bar % track.chords.length] ?? 0
    if (step % STEPS_PER_BAR === 0) {
      for (const degree of PAD_DEGREES) this.note(context, bus, track, track.pad, chord + degree, time)
    }
    for (const part of track.parts) {
      const offset = part.pattern[step % part.pattern.length]
      if (offset !== null && offset !== undefined) this.note(context, bus, track, part.voice, chord + offset, time)
    }
  }

  private note(context: AudioContext, bus: GainNode, track: MusicTrack, voice: MusicVoice, degree: number, time: number): void {
    const end = time + Math.max(voice.length, voice.attack + 0.05)
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, time)
    envelope.gain.linearRampToValueAtTime(voice.volume, time + voice.attack)
    envelope.gain.exponentialRampToValueAtTime(0.0001, end)
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = voice.lowpass
    envelope.connect(filter)
    filter.connect(bus)
    const frequency = this.frequency(track, voice.octave, degree)
    for (const cents of voice.detune ? [-voice.detune, voice.detune] : [0]) {
      const oscillator = context.createOscillator()
      oscillator.type = voice.wave
      oscillator.frequency.value = frequency
      oscillator.detune.value = cents
      oscillator.connect(envelope)
      oscillator.start(time)
      oscillator.stop(end + 0.05)
    }
  }

  private frequency(track: MusicTrack, octave: number, degree: number): number {
    const size = track.scale.length
    const wrapped = ((degree % size) + size) % size
    const midi = track.root + 12 * (octave + Math.floor(degree / size)) + (track.scale[wrapped] ?? 0)
    return 440 * 2 ** ((midi - 69) / 12)
  }

  dispose(): void {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    void this.context?.close()
    this.context = null
    this.master = null
    this.input = null
    this.deck = null
  }
}
