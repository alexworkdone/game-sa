import type { SfxSpec } from '@sa/core'

export const SFX = {
  tap: { kind: 'tone', wave: 'triangle', frequency: 660, duration: 0.05, attack: 0.002, volume: 0.18, pitchVariance: 0.06 },
  select: { kind: 'tone', wave: 'triangle', frequency: 880, duration: 0.07, attack: 0.002, volume: 0.2, pitchVariance: 0.04 },
  deselect: { kind: 'tone', wave: 'triangle', frequency: 520, duration: 0.06, attack: 0.002, volume: 0.16, pitchVariance: 0.04 },
  shuffle: { kind: 'noise', duration: 0.22, attack: 0.01, volume: 0.14, highpass: 1800, pitchVariance: 0.1 },
  correct: { kind: 'tone', wave: 'sine', frequency: 784, duration: 0.18, attack: 0.004, volume: 0.32, pitchVariance: 0 },
  wrong: { kind: 'sweep', wave: 'sawtooth', frequency: 260, endFrequency: 110, duration: 0.32, attack: 0.004, volume: 0.22, lowpass: 1200, pitchVariance: 0 },
  almost: { kind: 'sweep', wave: 'triangle', frequency: 440, endFrequency: 520, duration: 0.2, attack: 0.004, volume: 0.24, pitchVariance: 0 },
  star: { kind: 'tone', wave: 'sine', frequency: 988, duration: 0.3, attack: 0.004, volume: 0.3, pitchVariance: 0 },
  coin: { kind: 'tone', wave: 'square', frequency: 1318, duration: 0.08, attack: 0.002, volume: 0.1, lowpass: 4000, pitchVariance: 0.05 },
  charge: { kind: 'sweep', wave: 'sawtooth', frequency: 120, endFrequency: 880, duration: 1.4, attack: 0.2, volume: 0.22, lowpass: 2400, pitchVariance: 0 },
  reveal: { kind: 'sweep', wave: 'triangle', frequency: 520, endFrequency: 1560, duration: 0.6, attack: 0.01, volume: 0.36, pitchVariance: 0 },
  portion: { kind: 'sweep', wave: 'sine', frequency: 380, endFrequency: 760, duration: 0.14, attack: 0.004, volume: 0.24, pitchVariance: 0.05 },
  whoosh: { kind: 'noise', duration: 0.35, attack: 0.08, volume: 0.12, lowpass: 2600, highpass: 300, pitchVariance: 0.05 },
} as const satisfies Record<string, SfxSpec>

export type SfxName = keyof typeof SFX
