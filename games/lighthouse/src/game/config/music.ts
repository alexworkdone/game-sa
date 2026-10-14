export interface MusicVoice {
  readonly wave: OscillatorType
  readonly volume: number
  readonly attack: number
  readonly length: number
  readonly octave: number
  readonly lowpass: number
  readonly detune?: number
}

export type Pattern = readonly (number | null)[]

export interface MusicPart {
  readonly voice: MusicVoice
  readonly pattern: Pattern
}

export interface MusicTrack {
  readonly name: string
  readonly bpm: number
  readonly root: number
  readonly scale: readonly number[]
  readonly chords: readonly number[]
  readonly pad: MusicVoice
  readonly parts: readonly MusicPart[]
}

export const STEPS_PER_BAR = 8

const MINOR = [0, 2, 3, 5, 7, 8, 10]
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10]
const MAJOR_PENTATONIC = [0, 2, 4, 7, 9]
const MINOR_PENTATONIC = [0, 3, 5, 7, 10]

export const MUSIC_TRACKS: readonly MusicTrack[] = [
  {
    name: 'Нічний шторм',
    bpm: 84,
    root: 50,
    scale: MINOR,
    chords: [0, 5, 2, 6],
    pad: { wave: 'triangle', volume: 0.07, attack: 0.8, length: 2.6, octave: 0, lowpass: 900, detune: 6 },
    parts: [
      {
        voice: { wave: 'sine', volume: 0.22, attack: 0.01, length: 0.6, octave: -1, lowpass: 600 },
        pattern: [0, null, null, 0, null, null, 4, null],
      },
      {
        voice: { wave: 'triangle', volume: 0.09, attack: 0.01, length: 0.45, octave: 1, lowpass: 2200 },
        pattern: [0, 2, 4, 7, 4, 2, null, null, 0, 2, 4, 5, 4, null, 2, null],
      },
    ],
  },
  {
    name: 'Крижана буря',
    bpm: 72,
    root: 52,
    scale: MAJOR_PENTATONIC,
    chords: [0, 3, 1, 4],
    pad: { wave: 'sine', volume: 0.07, attack: 1.2, length: 3.2, octave: 0, lowpass: 1600, detune: 4 },
    parts: [
      {
        voice: { wave: 'sine', volume: 0.16, attack: 0.02, length: 1.6, octave: -1, lowpass: 500 },
        pattern: [0, null, null, null, null, null, null, null],
      },
      {
        voice: { wave: 'sine', volume: 0.08, attack: 0.005, length: 1.4, octave: 2, lowpass: 6000 },
        pattern: [0, null, 4, null, 2, null, null, 7, null, 5, null, 3, null, null, 1, null],
      },
    ],
  },
  {
    name: 'Багряний шторм',
    bpm: 104,
    root: 48,
    scale: PHRYGIAN,
    chords: [0, 1, 0, 6],
    pad: { wave: 'sawtooth', volume: 0.035, attack: 0.5, length: 2.2, octave: 0, lowpass: 650, detune: 8 },
    parts: [
      {
        voice: { wave: 'sawtooth', volume: 0.12, attack: 0.005, length: 0.22, octave: -1, lowpass: 420 },
        pattern: [0, 0, null, 0, 0, null, 1, null],
      },
      {
        voice: { wave: 'square', volume: 0.045, attack: 0.01, length: 0.3, octave: 1, lowpass: 1300 },
        pattern: [4, null, 3, 1, 0, null, null, null, 4, null, 5, 4, 3, null, 1, null],
      },
    ],
  },
  {
    name: 'Смарагдова безодня',
    bpm: 66,
    root: 45,
    scale: MINOR_PENTATONIC,
    chords: [0, 3, 2, 0],
    pad: { wave: 'triangle', volume: 0.07, attack: 1.6, length: 3.6, octave: 0, lowpass: 700, detune: 10 },
    parts: [
      {
        voice: { wave: 'sine', volume: 0.2, attack: 0.3, length: 3.4, octave: -1, lowpass: 300 },
        pattern: [0, null, null, null, null, null, null, null],
      },
      {
        voice: { wave: 'sine', volume: 0.08, attack: 0.005, length: 0.35, octave: 2, lowpass: 3000 },
        pattern: [0, null, null, 3, null, 1, null, null, null, 4, null, null, 2, null, 5, null],
      },
    ],
  },
]
