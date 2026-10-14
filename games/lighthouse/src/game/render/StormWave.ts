import type { IRenderer } from '@sa/core'
import type { LevelTheme } from '../config/tiers.js'
import type { Enemy } from '../entities/Enemy.js'
import { EnemyFactory } from '../entities/EnemyFactory.js'
import type { IEnemyFactory } from '../entities/EnemyFactory.js'
import { Octopus } from '../entities/Octopus.js'
import { EnemyArt } from './EnemyArt.js'
import { WAVE_DRESSINGS } from './WaveDressings.js'
import type { CastSlot, WaveDressing, WaveScene } from './WaveDressings.js'

interface Swimmer {
  readonly enemy: Enemy
  readonly slot: CastSlot
  readonly phase: number
}

interface Cast {
  readonly dressing: WaveDressing
  readonly swimmers: readonly Swimmer[]
}

const CAST_FLOOR = 5
const FAR_U = -900
const SHOULDER_U = -170
const WALL_H = 190
const STEP = 10
const DEPTH_SCALE = 0.68
const DEPTH_SHIFT = 18
const FIGURE_SCALE = 1.15
const UNDERWATER = 28
const SHEEN_W = 2.5

const smoother = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10)

export class StormWave {
  private readonly factory: IEnemyFactory
  private readonly art: EnemyArt
  private readonly casts = new Map<number, Cast>()

  constructor(factory: IEnemyFactory = new EnemyFactory(), art: EnemyArt = new EnemyArt()) {
    this.factory = factory
    this.art = art
  }

  update(dt: number): void {
    for (const cast of this.casts.values()) for (const swimmer of cast.swimmers) swimmer.enemy.age += dt
  }

  draw(r: IRenderer, x: number, seaY: number, time: number, theme: LevelTheme, tier: number): void {
    const cast = this.castFor(tier, theme)
    const drift = Math.sin(time * 0.6) * 6
    const height = WALL_H + Math.sin(time * 0.5) * 12
    const surface = this.surface(time, height)
    const body = [...surface, 0, UNDERWATER, FAR_U, UNDERWATER]
    const scene: WaveScene = { time, height, theme, skyTop: -seaY, surfaceY: (u) => this.surfaceY(u, time, height) }
    r.push()
    r.translate(x + drift, seaY)
    r.polygon(body, { fill: theme.water, alpha: 0.95 })
    r.polygon(this.depths(surface), { fill: theme.waterDeep, alpha: 0.75 })
    cast.dressing.behind(r, scene)
    this.drawCast(r, cast.swimmers, time, tier, drift)
    r.polygon(body, { fill: theme.water, alpha: 0.12 })
    this.drawSheen(r, surface, theme, time, height)
    cast.dressing.above(r, scene)
    r.pop()
  }

  private castFor(tier: number, theme: LevelTheme): Cast {
    const cached = this.casts.get(tier)
    if (cached) return cached
    const dressing = WAVE_DRESSINGS[theme.hazard]
    const swimmers = dressing.cast.map((slot, index) => {
      const enemy = this.factory.create(slot.kind, CAST_FLOOR, tier)
      enemy.moving = true
      enemy.facing = slot.facing
      if (enemy instanceof Octopus) enemy.swimming = true
      return { enemy, slot, phase: index * 1.7 }
    })
    const cast = { dressing, swimmers }
    this.casts.set(tier, cast)
    return cast
  }

  private surfaceY(u: number, time: number, height: number): number {
    const fall = u <= SHOULDER_U ? 0 : smoother(Math.min(1, (u - SHOULDER_U) / -SHOULDER_U))
    const level = 1 - fall
    const ripple = Math.sin(u * 0.05 - time * 1.6) * 3 * level
    return -height * level + ripple
  }

  private surface(time: number, height: number): number[] {
    const points: number[] = []
    for (let u = FAR_U; u < 0; u += STEP) points.push(u, this.surfaceY(u, time, height))
    points.push(0, 0)
    return points
  }

  private depths(surface: readonly number[]): number[] {
    const points: number[] = []
    for (let i = 0; i < surface.length; i += 2) {
      points.push((surface[i] as number) - DEPTH_SHIFT, (surface[i + 1] as number) * DEPTH_SCALE)
    }
    points.push(FAR_U - DEPTH_SHIFT, 0)
    return points
  }

  private drawCast(r: IRenderer, swimmers: readonly Swimmer[], time: number, tier: number, drift: number): void {
    for (const { enemy, slot, phase } of swimmers) {
      const bob = Math.sin(time * 1.5 + phase) * 3
      const sway = Math.sin(time * 0.9 + phase) * 4 - drift * 0.4
      r.push()
      r.translate(slot.u + sway, slot.y + bob)
      r.scale(FIGURE_SCALE, FIGURE_SCALE)
      this.art.figure(r, enemy, time, tier)
      r.pop()
    }
  }

  private drawSheen(r: IRenderer, surface: readonly number[], theme: LevelTheme, time: number, height: number): void {
    const band = [...surface]
    for (let i = surface.length - 2; i >= 0; i -= 2) band.push(surface[i] as number, (surface[i + 1] as number) + SHEEN_W)
    r.polygon(band, { fill: theme.waterFoam, alpha: 0.4 })
    for (let i = 0; i < 4; i++) {
      const u = SHOULDER_U + 20 - i * 46 + Math.sin(time * 1.3 + i) * 6
      const y = this.surfaceY(u, time, height) + 20 + i * 5
      r.line(u, y, u + 18, y - 3, 1.6, { stroke: theme.waterFoam, alpha: 0.28 })
    }
  }
}
