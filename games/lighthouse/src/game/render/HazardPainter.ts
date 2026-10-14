import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { LevelTheme } from '../config/tiers.js'
import { ringDelta } from '../level/Ring.js'
import type { World } from '../systems/World.js'
import { CurrentHazard } from '../systems/hazards/CurrentHazard.js'
import { IceHazard } from '../systems/hazards/IceHazard.js'
import { LightningHazard } from '../systems/hazards/LightningHazard.js'
import { drawKey } from './Icons.js'

const DARKNESS = '#02040a'
const GLAZE = '#9fecff'
const DARK_ALPHA = 0.93
const SOFT_STEPS = 6
const LANTERN_REACH = 2
const CURRENT_STREAKS = 26
const BOLT_SEGMENTS = 14

const find = <T>(world: World, type: new (...args: never[]) => T): T | null =>
  (world.hazards.find((hazard) => hazard instanceof type) as T | undefined) ?? null

const hash = (value: number): number => {
  const s = Math.sin(value * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

export class HazardPainter {
  drawTerrain(r: IRenderer, world: World, time: number, theme: LevelTheme): void {
    const ice = find(world, IceHazard)
    if (ice) this.drawIcyPlanks(r, world, ice, time)
    const currents = find(world, CurrentHazard)
    if (currents) this.drawKelp(r, world, currents, time, theme)
  }

  drawFront(r: IRenderer, world: World, time: number): void {
    const lightning = find(world, LightningHazard)
    if (lightning) this.drawLightning(r, world, lightning, time)
  }

  drawOverlay(r: IRenderer, world: World, time: number, theme: LevelTheme): void {
    const ice = find(world, IceHazard)
    if (ice) this.drawFloes(r, world, ice, time)
    const currents = find(world, CurrentHazard)
    if (currents) this.drawCurrents(r, world, currents, time, theme)
    this.drawInk(r, world, time)
    this.drawShocks(r, world)
    if (world.variant === 'dark') this.drawDarkness(r, world, time)
  }

  private drawIcyPlanks(r: IRenderer, world: World, ice: IceHazard, time: number): void {
    const map = world.map
    const tile = map.tile
    for (const index of ice.icy) {
      const { c, r: row } = map.cellOf(index)
      const x = c * tile
      const y = row * tile
      r.rect(x, y, tile, 11, { fill: GLAZE, alpha: 0.62 })
      r.rect(x, y, tile, 2.5, { fill: '#ffffff', alpha: 0.95 })
      r.rect(x, y + 11, tile, 2, { fill: PALETTE.iceShade, alpha: 0.85 })
      const shine = 0.45 + Math.max(0, Math.sin(time * 2.2 - c * 0.6)) * 0.5
      r.line(x + 5, y + 9, x + 11, y + 3, 1.6, { stroke: '#ffffff', alpha: shine })
      r.line(x + 15, y + 9, x + 19, y + 5, 1.2, { stroke: '#ffffff', alpha: shine * 0.7 })
      const hang = 4 + hash(index) * 7
      r.polygon([x + 8, y + tile - 2, x + 13, y + tile - 2, x + 10.5, y + tile - 2 + hang], {
        fill: PALETTE.ice,
        alpha: 0.85,
      })
      if (hash(index + 7) > 0.5) {
        r.polygon([x + 21, y + tile - 2, x + 25, y + tile - 2, x + 23, y + tile + 3], { fill: PALETTE.ice, alpha: 0.8 })
      }
    }
  }

  private drawKelp(r: IRenderer, world: World, currents: CurrentHazard, time: number, theme: LevelTheme): void {
    const width = world.map.width
    for (const patch of currents.kelp) {
      const strands = 6
      for (let i = 0; i < strands; i++) {
        const baseX = patch.x - patch.width / 2 + ((i + 0.5) / strands) * patch.width
        const height = (patch.bottom - patch.top) * (0.65 + hash(patch.x + i) * 0.35)
        let px = baseX
        let py = patch.bottom
        for (let step = 1; step <= 6; step++) {
          const k = step / 6
          const nx = baseX + Math.sin(time * 1.4 + i + k * 3.5) * 7 * k
          const ny = patch.bottom - height * k
          const color = step % 2 === 0 ? PALETTE.kelp : PALETTE.kelpDark
          const draw = (shift: number): void => r.line(px + shift, py, nx + shift, ny, 4 - k * 2.4, { stroke: color })
          draw(0)
          if (baseX < 20) draw(width)
          if (baseX > width - 20) draw(-width)
          px = nx
          py = ny
        }
        r.circle(px, py, 2.2, { fill: theme.tower.beam, alpha: 0.6 + Math.sin(time * 3 + i) * 0.3 })
      }
    }
  }

  private drawLightning(r: IRenderer, world: World, lightning: LightningHazard, time: number): void {
    const map = world.map
    const config = BALANCE.lightning
    if (lightning.warning) {
      const progress = lightning.warnProgress
      const flicker = Math.sin(time * (18 + progress * 30)) > 0 ? 1 : 0.55
      r.rect(lightning.x - config.width / 2, 0, config.width, map.height, {
        fill: PALETTE.lightning,
        alpha: (0.12 + progress * 0.28) * flicker,
      })
      r.line(lightning.x - config.width / 2, 0, lightning.x - config.width / 2, map.height, 1.5, {
        stroke: PALETTE.lightning,
        alpha: 0.5 * flicker,
      })
      r.line(lightning.x + config.width / 2, 0, lightning.x + config.width / 2, map.height, 1.5, {
        stroke: PALETTE.lightning,
        alpha: 0.5 * flicker,
      })
    }
    if (lightning.flash <= 0) return
    const alpha = lightning.flash / config.flash
    const points: number[] = []
    for (let i = 0; i <= BOLT_SEGMENTS; i++) {
      const y = (i / BOLT_SEGMENTS) * map.height
      const jitter = i === 0 || i === BOLT_SEGMENTS ? 0 : (hash(lightning.strikeX + i * 3.1) - 0.5) * 22
      points.push(lightning.strikeX + jitter, y)
    }
    r.rect(lightning.strikeX - config.width / 2, 0, config.width, map.height, { fill: PALETTE.lightning, alpha: 0.25 * alpha })
    for (let i = 0; i + 3 < points.length; i += 2) {
      const x1 = points[i] as number
      const y1 = points[i + 1] as number
      const x2 = points[i + 2] as number
      const y2 = points[i + 3] as number
      r.line(x1, y1, x2, y2, 6, { stroke: PALETTE.lightning, alpha, glow: PALETTE.lightning, glowSize: 18 })
      r.line(x1, y1, x2, y2, 2.4, { stroke: PALETTE.lightningCore, alpha })
    }
  }

  private drawFloes(r: IRenderer, world: World, ice: IceHazard, time: number): void {
    const map = world.map
    const level = world.water.level
    if (level >= map.height - 2) return
    for (const floe of ice.floes) {
      const draw = (x: number): void => {
        const half = floe.width / 2
        const bob = Math.sin(time * 1.6 + floe.width) * 1.2
        const y = level - 3 + bob
        r.polygon([x - half, y + 2, x - half + 6, y - 2, x + half - 5, y - 3, x + half, y + 1, x + half - 4, y + 7, x - half + 3, y + 7], {
          fill: PALETTE.ice,
          alpha: 0.95,
        })
        r.line(x - half + 8, y - 1, x + half - 10, y - 2, 1.4, { stroke: '#ffffff', alpha: 0.85 })
        r.line(x - half * 0.3, y + 1, x - half * 0.1, y + 6, 1, { stroke: PALETTE.iceShade, alpha: 0.9 })
        r.line(x + half * 0.35, y, x + half * 0.2, y + 6, 1, { stroke: PALETTE.iceShade, alpha: 0.9 })
      }
      draw(floe.x)
      if (floe.x < floe.width) draw(floe.x + map.width)
      if (floe.x > map.width - floe.width) draw(floe.x - map.width)
    }
  }

  private drawCurrents(r: IRenderer, world: World, currents: CurrentHazard, time: number, theme: LevelTheme): void {
    const map = world.map
    const level = world.water.level
    if (level >= map.height - 4) return
    for (let i = 0; i < CURRENT_STREAKS; i++) {
      const y = level + 10 + hash(i + 0.5) * (map.height - level - 14)
      const flow = currents.flowAt(y)
      const x = map.wrapX(hash(i + 1.7) * map.width + time * flow * 1.4)
      const length = 10 + hash(i + 2.3) * 14
      r.line(x, y, x - Math.sign(flow) * length, y, 1.3, { stroke: theme.waterFoam, alpha: 0.32 })
    }
  }

  private drawInk(r: IRenderer, world: World, time: number): void {
    if (world.inkClouds.length === 0) return
    const config = BALANCE.octopusInk
    const map = world.map
    const level = world.water.level
    r.push()
    r.clip({ kind: 'rect', x: 0, y: level, width: map.width, height: Math.max(0, map.height - level) })
    for (const cloud of world.inkClouds) {
      const appear = Math.min(1, cloud.age / 0.5)
      const fade = Math.min(1, (config.cloudTime - cloud.age) / 1.6)
      const alpha = Math.min(appear, fade)
      const radius = config.cloudRadius * (0.55 + 0.45 * appear)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + cloud.age * 0.4
        const ox = Math.cos(a) * radius * 0.42
        const oy = Math.sin(a) * radius * 0.3 + Math.sin(time + i) * 2
        r.circle(cloud.x + ox, cloud.y + oy, radius * 0.62, { fill: PALETTE.inkBlot, alpha: 0.5 * alpha })
      }
      r.circle(cloud.x, cloud.y, radius * 0.55, { fill: '#120a1a', alpha: 0.75 * alpha })
    }
    r.pop()
  }

  private drawShocks(r: IRenderer, world: World): void {
    for (const wave of world.shocks) {
      const t = wave.age / 0.45
      const radius = wave.radius * Math.min(1, t * 1.4)
      const alpha = 1 - t
      r.ring(wave.x, wave.y, radius, 2, { stroke: PALETTE.shock, alpha, glow: PALETTE.shock, glowSize: 12 })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + hash(wave.x + i) * 0.8
        const mid = radius * 0.55
        const kink = (hash(wave.y + i) - 0.5) * 0.6
        r.line(wave.x, wave.y, wave.x + Math.cos(a + kink) * mid, wave.y + Math.sin(a + kink) * mid, 1.6, {
          stroke: PALETTE.shock,
          alpha,
        })
        r.line(
          wave.x + Math.cos(a + kink) * mid,
          wave.y + Math.sin(a + kink) * mid,
          wave.x + Math.cos(a) * radius,
          wave.y + Math.sin(a) * radius,
          1.2,
          { stroke: '#ffffff', alpha },
        )
      }
    }
  }

  private drawDarkness(r: IRenderer, world: World, time: number): void {
    const map = world.map
    const hero = world.hero
    const config = BALANCE.dark
    const flicker = Math.sin(time * 7) * 2 + Math.sin(time * 13) * 1.2
    const inner = config.lightRadius * (world.powerUps.active('lantern') ? LANTERN_REACH : 1) + flicker
    const far = Math.hypot(map.width, map.height) + 40
    const cx = hero.x
    const cy = hero.centerY
    const solidFrom = inner + config.softEdge
    r.ring(cx, cy, (solidFrom + far) / 2, far - solidFrom + 2, { stroke: DARKNESS, alpha: DARK_ALPHA })
    const band = config.softEdge / SOFT_STEPS
    for (let i = 0; i < SOFT_STEPS; i++) {
      r.ring(cx, cy, inner + band * (i + 0.5), band + 0.6, {
        stroke: DARKNESS,
        alpha: (DARK_ALPHA * (i + 1)) / (SOFT_STEPS + 1),
      })
    }
    for (const pickup of world.pickups) {
      if (!pickup.alive || pickup.kind !== 'key') continue
      if (Math.hypot(ringDelta(cx, pickup.x, map.width), cy - pickup.y) < inner) continue
      const pulse = 0.55 + Math.sin(time * 4 + pickup.age) * 0.35
      r.circle(pickup.x, pickup.y - 10, 9, { fill: PALETTE.key, alpha: 0.18 * pulse, glow: PALETTE.key, glowSize: 16 })
      drawKey(r, pickup.x, pickup.y - 10, 14, true, pulse)
    }
    const door = world.door
    const lamp = door.open ? PALETTE.lampOn : PALETTE.lampOff
    r.circle(door.x, door.y - 39, 3.6, { fill: lamp, glow: lamp, glowSize: 14 })
    for (const enemy of world.enemies) {
      if (!enemy.alive || enemy.emerge > 0) continue
      if (Math.hypot(ringDelta(cx, enemy.x, map.width), cy - enemy.centerY) < inner) continue
      const blink = Math.sin(time * 1.3 + enemy.id) > 0.92 ? 0 : 1
      for (const side of [-1, 1]) {
        r.circle(enemy.x + side * 3, enemy.centerY - enemy.height * 0.15, 1.5, {
          fill: PALETTE.danger,
          alpha: 0.85 * blink,
          glow: PALETTE.danger,
          glowSize: 6,
        })
      }
    }
    for (const projectile of world.projectiles.items) {
      if (!projectile.active || projectile.owner !== 'hero') continue
      r.circle(projectile.x, projectile.y, 3, { fill: PALETTE.flare, glow: PALETTE.flare, glowSize: 14 })
    }
  }
}
