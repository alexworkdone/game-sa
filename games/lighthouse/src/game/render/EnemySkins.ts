import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'

export type SkinStyle = 'storm' | 'ice' | 'ember' | 'abyss'

export interface Tone {
  readonly body: string
  readonly shade: string
  readonly light: string
  readonly accent: string
  readonly glow: string
}

export interface CapLook {
  readonly crown: string
  readonly band: string
  readonly badge: string
}

export interface EnemySkin {
  readonly style: SkinStyle
  readonly crab: Tone
  readonly jelly: Tone
  readonly octopus: Tone
  readonly urchin: Tone
  readonly guardian: Tone
  readonly cap: CapLook
  readonly eye: string
  readonly pupil: string
  readonly eyeGlow: string | null
  readonly gap: string
  readonly haze: string
  readonly foam: string
}

export const BARNACLE = '#d9e6c8'

export const ENEMY_SKINS: readonly EnemySkin[] = [
  {
    style: 'storm',
    crab: { body: PALETTE.crab, shade: PALETTE.crabShade, light: '#ff9a7e', accent: '#ffd0c2', glow: '#ff8a6e' },
    jelly: { body: PALETTE.jelly, shade: '#9b55d6', light: PALETTE.jellyCore, accent: '#ffffff', glow: PALETTE.jelly },
    octopus: { body: PALETTE.octopus, shade: PALETTE.octopusShade, light: '#e66a9b', accent: '#f6b3cf', glow: PALETTE.inkGlow },
    urchin: { body: PALETTE.urchin, shade: '#271a40', light: '#6a52a0', accent: PALETTE.urchinSpike, glow: PALETTE.spine },
    guardian: { body: PALETTE.octopus, shade: PALETTE.octopusShade, light: '#e66a9b', accent: '#f6b3cf', glow: PALETTE.inkGlow },
    cap: { crown: '#f2f2f2', band: PALETTE.night, badge: PALETTE.accent },
    eye: '#ffffff',
    pupil: PALETTE.boots,
    eyeGlow: null,
    gap: PALETTE.wall,
    haze: PALETTE.waterFoam,
    foam: PALETTE.waterFoam,
  },
  {
    style: 'ice',
    crab: { body: '#5b8fc7', shade: '#33608f', light: '#eef9ff', accent: '#cfeeff', glow: '#9fe6ff' },
    jelly: { body: '#7fb2f0', shade: '#3f78b8', light: '#eaf6ff', accent: '#ffffff', glow: '#bfe9ff' },
    octopus: { body: '#7a7fd6', shade: '#434896', light: '#eef3ff', accent: '#cfeeff', glow: '#9fe6ff' },
    urchin: { body: '#22405f', shade: '#132638', light: '#e8f7ff', accent: '#cfeeff', glow: '#ffffff' },
    guardian: { body: '#6c78cc', shade: '#3b4590', light: '#eef3ff', accent: '#cfeeff', glow: '#9fe6ff' },
    cap: { crown: '#eaf6fc', band: '#a9c8db', badge: '#7fd8ff' },
    eye: '#f2fbff',
    pupil: '#14243a',
    eyeGlow: null,
    gap: '#14212b',
    haze: '#e8fbff',
    foam: '#e8fbff',
  },
  {
    style: 'ember',
    crab: { body: '#7a1f2b', shade: '#561820', light: '#ff7a3a', accent: '#e0b49a', glow: '#ff5a2a' },
    jelly: { body: '#a8243c', shade: '#5c1423', light: '#ffb070', accent: '#ffd9a0', glow: '#ff5a3a' },
    octopus: { body: '#8e1f33', shade: '#5e1626', light: '#ff7a3a', accent: '#e0b49a', glow: '#ff5a2a' },
    urchin: { body: '#33191f', shade: '#1a0c10', light: '#ff7a3a', accent: '#b3302a', glow: '#ffd08a' },
    guardian: { body: '#8e1f33', shade: '#5e1626', light: '#ff7a3a', accent: '#e0b49a', glow: '#ff5a2a' },
    cap: { crown: '#33202a', band: '#9e1f35', badge: '#ffb347' },
    eye: '#ffcf70',
    pupil: '#3a0d10',
    eyeGlow: '#ff7a3a',
    gap: '#1a0a12',
    haze: '#6b5058',
    foam: '#ffb3a6',
  },
  {
    style: 'abyss',
    crab: { body: '#3a9a6e', shade: '#1d5a40', light: '#8dffc8', accent: '#d9e6c8', glow: '#8dffc8' },
    jelly: { body: '#3fd9a0', shade: '#1f8f6a', light: '#d6fff0', accent: '#8dffc8', glow: '#3fd9a0' },
    octopus: { body: '#1d6f7a', shade: '#145058', light: '#c8ff8a', accent: '#d9e6c8', glow: '#8dffc8' },
    urchin: { body: '#173a30', shade: '#0c2219', light: '#8dffc8', accent: '#4fbf95', glow: '#d6fff0' },
    guardian: { body: '#1d6f7a', shade: '#145058', light: '#c8ff8a', accent: '#d9e6c8', glow: '#8dffc8' },
    cap: { crown: '#cfe3c6', band: '#1a3028', badge: '#8dffc8' },
    eye: '#e6fff4',
    pupil: '#06231b',
    eyeGlow: '#8dffc8',
    gap: '#0a1612',
    haze: '#b9ffe2',
    foam: '#b9ffe2',
  },
]

export const enemySkin = (tier: number): EnemySkin =>
  ENEMY_SKINS[(Math.max(1, Math.floor(tier)) - 1) % ENEMY_SKINS.length] as EnemySkin

export const tinted = (tone: Tone, tint: string | null): Tone =>
  tint === null ? tone : { body: tint, shade: tint, light: tint, accent: tint, glow: tint }

export const pulse = (time: number, speed: number, phase = 0): number => 0.5 + Math.sin(time * speed + phase) * 0.5

export const noise = (seed: number): number => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

export const icicle = (
  r: IRenderer,
  x: number,
  y: number,
  length: number,
  width: number,
  color: string,
  alpha = 0.9,
): void => {
  r.polygon([x - width / 2, y, x + width / 2, y, x, y + length], { fill: color, alpha })
}

export const crystal = (r: IRenderer, x: number, y: number, size: number, color: string, alpha = 1): void => {
  r.polygon([x, y - size, x + size * 0.45, y, x, y + size * 0.6, x - size * 0.45, y], { fill: color, alpha })
}

export const twinkle = (r: IRenderer, x: number, y: number, size: number, color: string, phase: number): void => {
  const shine = Math.max(0, Math.sin(phase)) ** 3
  if (shine < 0.05) return
  const s = size * (0.4 + shine * 0.6)
  r.line(x - s, y, x + s, y, 0.9, { stroke: color, alpha: shine, glow: color, glowSize: 4 })
  r.line(x, y - s, x, y + s, 0.9, { stroke: color, alpha: shine })
}

export const crack = (r: IRenderer, points: readonly number[], color: string, alpha: number, width = 1.3): void => {
  for (let i = 0; i + 3 < points.length; i += 2) {
    r.line(points[i] as number, points[i + 1] as number, points[i + 2] as number, points[i + 3] as number, width, {
      stroke: color,
      alpha,
      glow: color,
      glowSize: 6,
    })
  }
}

export const smoke = (
  r: IRenderer,
  x: number,
  y: number,
  time: number,
  phase: number,
  color: string,
  puffs = 2,
): void => {
  for (let i = 0; i < puffs; i++) {
    const t = (time * 0.55 + phase + i / puffs) % 1
    r.circle(x + Math.sin(t * 5 + phase * 3) * 2.2, y - t * 13, 1.5 + t * 2.8, { fill: color, alpha: 0.5 * (1 - t) })
  }
}

export const barnacle = (r: IRenderer, x: number, y: number, size: number, shell: string, hole: string): void => {
  r.circle(x, y, size, { fill: shell })
  r.circle(x, y - size * 0.18, size * 0.42, { fill: hole })
}

export const glowSpot = (r: IRenderer, x: number, y: number, size: number, color: string, glow: number): void => {
  r.circle(x, y, size, { fill: color, alpha: 0.4 + glow * 0.6, glow: color, glowSize: 3 + glow * 7 })
}

export const horn = (r: IRenderer, x: number, y: number, side: number, size: number, color: string): void => {
  const b = size * 0.3
  r.polygon([x - b, y, x + b, y, x + side * size * 0.6, y - size * 0.5, x + side * size * 0.45, y - size], {
    fill: color,
  })
}

export const breath = (r: IRenderer, x: number, y: number, dir: number, time: number, color: string): void => {
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.8 + i / 3) % 1
    r.circle(x + dir * t * 11, y - t * 3 + Math.sin(t * 6 + i) * 0.8, 1 + t * 2.6, {
      fill: color,
      alpha: 0.55 * (1 - t),
    })
  }
}

export const bubbles = (r: IRenderer, x: number, y: number, time: number, color: string, count = 3): void => {
  for (let i = 0; i < count; i++) {
    const t = (time * 0.75 + i / count) % 1
    r.ring(x + Math.sin(t * 9 + i * 2) * 2, y - t * 16, 0.9 + i * 0.4, 0.8, { stroke: color, alpha: 0.8 * (1 - t) })
  }
}

export const strand = (
  r: IRenderer,
  x: number,
  y: number,
  dx: number,
  dy: number,
  sway: number,
  color: string,
  width = 1.3,
): void => {
  const mx = x + dx * 0.5 + sway * 0.4
  const my = y + dy * 0.5
  r.line(x, y, mx, my, width, { stroke: color })
  r.line(mx, my, x + dx + sway, y + dy, width * 0.75, { stroke: color })
}

export const bolt = (
  r: IRenderer,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  jag: number,
  alpha: number,
  width = 1.3,
): void => {
  const mx = (x1 + x2) / 2 + (y2 - y1) * jag
  const my = (y1 + y2) / 2 - (x2 - x1) * jag
  const style = { stroke: '#ffffff', alpha, glow: PALETTE.shock, glowSize: 7 }
  r.line(x1, y1, mx, my, width, style)
  r.line(mx, my, x2, y2, width, style)
}
