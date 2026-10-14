import type { IRenderer } from '@sa/core'
import type { TierHazard } from '../config/hazards.js'
import { PALETTE } from '../config/palette.js'
import type { LevelTheme } from '../config/tiers.js'
import type { EnemyKind } from '../level/LevelBlueprint.js'
import { crystal, noise, twinkle } from './EnemySkins.js'

export interface CastSlot {
  readonly kind: EnemyKind
  readonly u: number
  readonly y: number
  readonly facing: 1 | -1
}

export interface WaveScene {
  readonly time: number
  readonly height: number
  readonly theme: LevelTheme
  readonly skyTop: number
  surfaceY(u: number): number
}

export interface WaveDressing {
  readonly cast: readonly CastSlot[]
  behind(r: IRenderer, scene: WaveScene): void
  above(r: IRenderer, scene: WaveScene): void
}

const slope = (scene: WaveScene, u: number): number => Math.atan2(scene.surfaceY(u + 4) - scene.surfaceY(u - 4), 8)

class CalmDressing implements WaveDressing {
  readonly cast: readonly CastSlot[] = [
    { kind: 'crab', u: -68, y: -12, facing: 1 },
    { kind: 'urchin', u: -110, y: -46, facing: 1 },
    { kind: 'octopus', u: -150, y: -86, facing: 1 },
    { kind: 'jelly', u: -184, y: -130, facing: 1 },
  ]

  behind(): void {}

  above(): void {}
}

interface Floe {
  readonly u: number
  readonly width: number
}

const FLOES: readonly Floe[] = [
  { u: -182, width: 38 },
  { u: -124, width: 30 },
  { u: -70, width: 24 },
]

class IceDressing implements WaveDressing {
  readonly cast: readonly CastSlot[] = [
    { kind: 'jelly', u: -126, y: -120, facing: 1 },
    { kind: 'octopus', u: -172, y: -60, facing: 1 },
    { kind: 'urchin', u: -146, y: -16, facing: -1 },
    { kind: 'crab', u: -92, y: -14, facing: 1 },
  ]

  behind(r: IRenderer, scene: WaveScene): void {
    for (let i = 0; i < 5; i++) {
      const u = -200 + i * 34
      const y = scene.surfaceY(u) + 14 + (i % 2) * 18
      crystal(r, u, y, 3, PALETTE.ice, 0.35)
    }
  }

  above(r: IRenderer, scene: WaveScene): void {
    FLOES.forEach((floe, index) => {
      const bob = Math.sin(scene.time * 1.6 + index * 2) * 1.2
      const half = floe.width / 2
      r.push()
      r.translate(floe.u, scene.surfaceY(floe.u) - 1 + bob)
      r.rotate(slope(scene, floe.u))
      r.polygon([-half, 2, -half + 6, -3, half - 5, -4, half, 1, half - 4, 7, -half + 3, 7], { fill: PALETTE.ice, alpha: 0.95 })
      r.line(-half + 8, -2, half - 10, -3, 1.4, { stroke: '#ffffff', alpha: 0.85 })
      r.line(-half * 0.3, 0, -half * 0.1, 6, 1, { stroke: PALETTE.iceShade, alpha: 0.9 })
      r.line(half * 0.35, -1, half * 0.2, 6, 1, { stroke: PALETTE.iceShade, alpha: 0.9 })
      twinkle(r, half * 0.4, -4, 4, '#ffffff', scene.time * 2.2 + index * 1.9)
      r.pop()
    })
  }
}

const STRIKE_PERIOD = 3.2
const STRIKE_FLASH = 0.4
const BOLT_SEGMENTS = 10

class LightningDressing implements WaveDressing {
  readonly cast: readonly CastSlot[] = [
    { kind: 'jelly', u: -140, y: -112, facing: 1 },
    { kind: 'octopus', u: -174, y: -36, facing: 1 },
    { kind: 'urchin', u: -108, y: -22, facing: -1 },
    { kind: 'crab', u: -58, y: -10, facing: -1 },
  ]

  behind(): void {}

  above(r: IRenderer, scene: WaveScene): void {
    const alpha = this.flash(scene.time)
    if (alpha <= 0) return
    const strike = Math.floor(scene.time / STRIKE_PERIOD)
    const u = this.strikeU(scene.time)
    const bottom = scene.surfaceY(u)
    const points: number[] = []
    for (let i = 0; i <= BOLT_SEGMENTS; i++) {
      const k = i / BOLT_SEGMENTS
      const jitter = i === 0 || i === BOLT_SEGMENTS ? 0 : (noise(strike * 13.7 + i * 3.1) - 0.5) * 26
      points.push(u + jitter, scene.skyTop + (bottom - scene.skyTop) * k)
    }
    for (let i = 0; i + 3 < points.length; i += 2) {
      const [x1, y1, x2, y2] = [points[i], points[i + 1], points[i + 2], points[i + 3]] as [number, number, number, number]
      r.line(x1, y1, x2, y2, 5, { stroke: PALETTE.lightning, alpha, glow: PALETTE.lightning, glowSize: 16 })
      r.line(x1, y1, x2, y2, 2, { stroke: PALETTE.lightningCore, alpha })
    }
    r.ring(u, bottom, 6 + (1 - alpha) * 22, 2, { stroke: PALETTE.lightningCore, alpha })
  }

  private flash(time: number): number {
    const phase = time % STRIKE_PERIOD
    return phase < STRIKE_FLASH ? 1 - phase / STRIKE_FLASH : 0
  }

  private strikeU(time: number): number {
    return -190 + noise(Math.floor(time / STRIKE_PERIOD) * 7.3) * 120
  }
}

interface KelpPatch {
  readonly u: number
  readonly height: number
}

const KELP: readonly KelpPatch[] = [
  { u: -196, height: 96 },
  { u: -128, height: 74 },
  { u: -74, height: 40 },
]

const KELP_STRANDS = 3
const KELP_STEPS = 6
const STREAKS = 14
const STREAK_SPAN = 240

class CurrentDressing implements WaveDressing {
  readonly cast: readonly CastSlot[] = [
    { kind: 'octopus', u: -160, y: -106, facing: 1 },
    { kind: 'jelly', u: -108, y: -92, facing: 1 },
    { kind: 'urchin', u: -160, y: -16, facing: 1 },
    { kind: 'crab', u: -100, y: -12, facing: 1 },
  ]

  behind(r: IRenderer, scene: WaveScene): void {
    this.drawStreaks(r, scene)
    this.drawKelp(r, scene)
  }

  above(): void {}

  private drawStreaks(r: IRenderer, scene: WaveScene): void {
    for (let i = 0; i < STREAKS; i++) {
      const y = -14 - noise(i + 0.5) * 160
      const speed = 34 + noise(i + 5.1) * 30
      const u = -220 + ((noise(i + 1.7) * STREAK_SPAN + scene.time * speed) % STREAK_SPAN)
      const length = 12 + noise(i + 2.3) * 14
      if (y < scene.surfaceY(u) + 8) continue
      r.line(u - length, y, u, y, 1.4, { stroke: scene.theme.waterFoam, alpha: 0.32 })
      r.line(u, y, u - 4, y - 3, 1.2, { stroke: scene.theme.waterFoam, alpha: 0.32 })
      r.line(u, y, u - 4, y + 3, 1.2, { stroke: scene.theme.waterFoam, alpha: 0.32 })
    }
  }

  private drawKelp(r: IRenderer, scene: WaveScene): void {
    for (const patch of KELP) {
      for (let s = 0; s < KELP_STRANDS; s++) {
        const baseU = patch.u + (s - 1) * 7
        const height = patch.height * (0.7 + noise(patch.u + s) * 0.3)
        let px = baseU
        let py = 2
        for (let step = 1; step <= KELP_STEPS; step++) {
          const k = step / KELP_STEPS
          const nx = baseU + Math.sin(scene.time * 1.4 + s + k * 3.5) * 7 * k
          const ny = 2 - height * k
          r.line(px, py, nx, ny, 4 - k * 2.4, { stroke: step % 2 === 0 ? PALETTE.kelp : PALETTE.kelpDark })
          px = nx
          py = ny
        }
        r.circle(px, py, 2.2, { fill: scene.theme.tower.beam, alpha: 0.6 + Math.sin(scene.time * 3 + s) * 0.3 })
      }
    }
  }
}

export const WAVE_DRESSINGS: Readonly<Record<TierHazard, WaveDressing>> = {
  none: new CalmDressing(),
  ice: new IceDressing(),
  lightning: new LightningDressing(),
  currents: new CurrentDressing(),
}
