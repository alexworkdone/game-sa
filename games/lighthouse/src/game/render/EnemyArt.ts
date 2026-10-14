import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Enemy } from '../entities/Enemy.js'
import { Crab } from '../entities/Crab.js'
import { Jelly } from '../entities/Jelly.js'
import { Octopus } from '../entities/Octopus.js'
import { Urchin } from '../entities/Urchin.js'
import { Guardian } from '../entities/Guardian.js'
import { drawKey, drawShell } from './Icons.js'
import {
  BARNACLE,
  barnacle,
  bolt,
  breath,
  bubbles,
  crack,
  crystal,
  enemySkin,
  glowSpot,
  horn,
  icicle,
  noise,
  pulse,
  smoke,
  strand,
  tinted,
  twinkle,
} from './EnemySkins.js'
import type { EnemySkin, Tone } from './EnemySkins.js'

const bellShape = (): number[] => {
  const points: number[] = []
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI
    points.push(Math.cos(a) * 11, -11 + Math.sin(a) * 11)
  }
  points.push(11, -9, 6, -7, 0, -9, -6, -7, -11, -9)
  return points
}

const BELL: readonly number[] = bellShape()

export class EnemyArt {
  draw(r: IRenderer, enemy: Enemy, time: number, tier: number): void {
    this.figure(r, enemy, time, tier)
    if (enemy.alive && (enemy.isBoss || enemy.hp < enemy.maxHp)) this.health(r, enemy)
  }

  figure(r: IRenderer, enemy: Enemy, time: number, tier: number): void {
    const skin = enemySkin(tier)
    const clock = time + enemy.id * 0.77
    const emerge = enemy.emerge / BALANCE.director.emergeTime
    r.push()
    r.translate(enemy.x, enemy.y)
    r.alpha(1 - emerge * 0.8)
    if (emerge > 0) {
      r.ring(0, -2, 8 + (1 - emerge) * 16, 2, { stroke: skin.foam, alpha: emerge })
      r.translate(0, emerge * 10)
      r.scale(1 - emerge * 0.4, 1 - emerge * 0.4)
    }
    const tint = enemy.flash > 0 ? '#ffffff' : enemy.frozen > 0 ? PALETTE.frost : null
    switch (enemy.kind) {
      case 'crab':
        this.crab(r, enemy as Crab, skin, tint, clock)
        break
      case 'jelly':
        this.jelly(r, enemy as Jelly, skin, tint, clock)
        break
      case 'octopus':
        this.octopus(r, enemy as Octopus, skin, tint, clock)
        break
      case 'urchin':
        this.urchin(r, enemy as Urchin, skin, tint, clock)
        break
      case 'guardian':
        this.guardian(r, enemy as Guardian, skin, tint, clock)
        break
    }
    if (enemy.frozen > 0) this.ice(r, enemy, time)
    r.pop()
  }

  private ice(r: IRenderer, enemy: Enemy, time: number): void {
    const radius = Math.max(enemy.width, enemy.height) * 0.62
    const cy = -enemy.height / 2
    const blink = enemy.frozen < 0.6 && Math.sin(time * 30) > 0 ? 0.15 : 0.32
    r.circle(0, cy, radius, { fill: PALETTE.frost, alpha: blink })
    r.ring(0, cy, radius, 1.5, { stroke: '#ffffff', alpha: 0.7 })
    r.line(-radius * 0.5, cy - radius * 0.4, -radius * 0.1, cy - radius * 0.7, 1.5, { stroke: '#ffffff', alpha: 0.8 })
  }

  private health(r: IRenderer, enemy: Enemy): void {
    const w = enemy.isBoss ? 48 : 20
    const h = enemy.isBoss ? 5 : 3
    const x = enemy.x - w / 2
    const lift = enemy.isBoss ? 12 : enemy.loot === 'key' ? 16 : enemy.loot === 'shell' ? 11 : 8
    const y = enemy.y - enemy.height - lift
    r.rect(x, y, w, h, { fill: PALETTE.stoneDark, alpha: 0.8 })
    r.rect(x, y, (w * Math.max(0, enemy.hp)) / enemy.maxHp, h, { fill: enemy.isBoss ? PALETTE.octopus : PALETTE.danger })
  }

  private eye(r: IRenderer, skin: EnemySkin, x: number, y: number, size: number, look: number): void {
    r.circle(x, y, size, {
      fill: skin.eye,
      ...(skin.eyeGlow === null ? {} : { glow: skin.eyeGlow, glowSize: size * 2.2 }),
    })
    r.circle(x + look, y + size * 0.15, size * 0.48, { fill: skin.pupil })
  }

  private crab(r: IRenderer, enemy: Crab, skin: EnemySkin, tint: string | null, time: number): void {
    const dragging = enemy.big && enemy.loot === 'shell'
    if (dragging) this.draggedShell(r, enemy, skin.foam)
    r.push()
    if (enemy.big) r.scale(1.45, 1.45)
    this.crabBody(r, enemy, skin, tinted(skin.crab, tint), tint, time, dragging)
    r.pop()
  }

  private crabBody(
    r: IRenderer,
    enemy: Crab,
    skin: EnemySkin,
    tone: Tone,
    tint: string | null,
    time: number,
    dragging: boolean,
  ): void {
    const step = enemy.moving ? Math.sin(enemy.age * 18) : 0
    const pinch = Math.sin(enemy.age * 5) * 1.5
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const lift = (i % 2 === 0 ? step : -step) * 1.5
        const knee = side * (11 + i * 2.2)
        const kneeY = -8.5 - lift * 0.5
        r.line(side * (4 + i * 2.6), -7, knee, kneeY, 1.9, { stroke: tone.shade })
        r.line(knee, kneeY, knee + side * 2.2, -Math.max(0, lift), 1.5, { stroke: tone.shade })
      }
    }
    r.roundRect(-11.5, -14, 23, 10, 5, { fill: tone.body })
    r.arc(0, -5, 8, Math.PI * 1.15, Math.PI * 1.55, 1.6, { stroke: tone.light, alpha: 0.55 })
    r.roundRect(-9, -6.5, 18, 2.5, 1.2, { fill: tone.shade })
    this.crabShell(r, skin, tone, tint, time, enemy.facing)
    if (enemy.big) this.crabScars(r, tone, tint)
    if (enemy.loot === 'key') this.keyPack(r, enemy, time)
    for (const side of [-1, 1]) {
      const grip = dragging && side === -enemy.facing
      const cx = grip ? side * 17 : side * 14
      const cy = grip ? -8.5 : -16 - pinch
      const open = grip ? 0.35 : 1
      r.line(side * 9, -10, cx - side, grip ? cy : cy + 2, 2.4, { stroke: tone.shade })
      r.circle(cx, cy, 4.2, { fill: tone.body })
      r.polygon([cx, cy, cx + side * 5, cy - 3 * open, cx + side * 4, cy + 2 * open], { fill: skin.gap })
      this.clawDecor(r, skin, tone, cx, cy, side, time)
    }
    for (const side of [-1, 1]) {
      r.line(side * 3, -12, side * 4, -17, 1.6, { stroke: tone.shade })
      this.eye(r, skin, side * 4, -18, 2.2, enemy.facing * 0.8)
      if (enemy.big) r.line(side * 1.8, -20.4, side * 6.4, -21.8, 1.3, { stroke: tone.shade })
    }
  }

  private crabShell(
    r: IRenderer,
    skin: EnemySkin,
    tone: Tone,
    tint: string | null,
    time: number,
    facing: number,
  ): void {
    switch (skin.style) {
      case 'storm':
        r.circle(-5, -10.5, 1.4, { fill: tone.accent, alpha: 0.5 })
        r.circle(0.5, -12, 1.1, { fill: tone.accent, alpha: 0.5 })
        r.circle(5, -10, 1.5, { fill: tone.accent, alpha: 0.5 })
        return
      case 'ice':
        r.roundRect(-9.5, -14.6, 19, 3.8, 1.9, { fill: tone.light, alpha: 0.92 })
        for (let i = 0; i < 4; i++) icicle(r, -7.5 + i * 5, -4.3, 2.4 + (i % 2) * 1.6, 2, tone.accent)
        twinkle(r, 5, -13.6, 2.4, '#ffffff', time * 2.2)
        return
      case 'ember':
        crack(r, [-7.5, -9.5, -3, -12, 1, -9, 6, -11.6], tone.light, 0.5 + pulse(time, 3) * 0.5)
        for (const x of [-5, 0, 5]) {
          r.polygon([x - 1.6, -13.4, x + 1.6, -13.4, x - facing * 0.8, x === 0 ? -18.5 : -17], { fill: tone.accent })
        }
        smoke(r, -facing * 6, -15, time, 0.3, skin.haze)
        return
      case 'abyss':
        barnacle(r, -6, -11.6, 1.8, tint ?? BARNACLE, tone.shade)
        barnacle(r, 5.5, -12.2, 1.4, tint ?? BARNACLE, tone.shade)
        glowSpot(r, -1.5, -9, 1.1, tone.light, pulse(time, 2.5))
        glowSpot(r, 2.5, -8.6, 0.9, tone.light, pulse(time, 2.5, 1.7))
        strand(r, -facing * 9, -12.5, -facing * 4, 7, Math.sin(time * 3) * 1.5, tint ?? PALETTE.kelp)
        return
    }
  }

  private clawDecor(
    r: IRenderer,
    skin: EnemySkin,
    tone: Tone,
    x: number,
    y: number,
    side: number,
    time: number,
  ): void {
    switch (skin.style) {
      case 'storm':
        r.circle(x - side * 1.2, y - 1.6, 1.2, { fill: tone.light, alpha: 0.6 })
        return
      case 'ice':
        crystal(r, x - side * 0.5, y - 4.6, 2.4, tone.accent)
        return
      case 'ember':
        r.polygon([x - 1.5, y - 3.4, x + 1.5, y - 3.4, x - side * 0.6, y - 7.4], { fill: tone.accent })
        return
      case 'abyss':
        glowSpot(r, x - side * 1.2, y + 1.2, 0.9, tone.light, pulse(time, 3, side))
        return
    }
  }

  private crabScars(r: IRenderer, tone: Tone, tint: string | null): void {
    const scar = { stroke: tone.light, alpha: 0.8 }
    r.line(-8.5, -12.5, -4.5, -7.5, 1, scar)
    r.line(-7.8, -9, -5.2, -11, 0.8, scar)
    r.line(4, -13.2, 7.5, -10, 1, scar)
    barnacle(r, 8, -8, 1.6, tint ?? BARNACLE, tone.shade)
    barnacle(r, -1.5, -13, 1.3, tint ?? BARNACLE, tone.shade)
  }

  private draggedShell(r: IRenderer, enemy: Crab, foam: string): void {
    const back = -enemy.facing
    const hop = enemy.moving ? Math.abs(Math.sin(enemy.age * 9)) : 0
    if (enemy.moving) {
      for (let i = 0; i < 2; i++) {
        const t = (enemy.age * 2.2 + i * 0.5) % 1
        r.circle(back * (40 + t * 8), -1.5 - t * 3, 1.4 + t * 2, { fill: foam, alpha: 0.4 * (1 - t) })
      }
    }
    r.push()
    r.translate(back * 29, -hop * 1.2)
    r.rotate(back * (0.08 + hop * 0.08))
    drawShell(r, 0, -6.5, 22)
    r.pop()
  }

  private keyPack(r: IRenderer, enemy: Crab, time: number): void {
    const bob = enemy.moving ? Math.abs(Math.sin(enemy.age * 18)) * 0.8 : 0
    const y = -20 - bob
    const shine = pulse(time, 3)
    r.circle(0, y - 3, 7, { fill: PALETTE.key, alpha: 0.1 + shine * 0.12, glow: PALETTE.key, glowSize: 10 + shine * 8 })
    r.push()
    r.translate(0, y)
    r.scale(enemy.facing * (0.6 + Math.abs(Math.cos(time * 2.4)) * 0.4), 1)
    r.rotate(Math.PI / 2)
    drawKey(r, 0, 0, 14, true)
    r.pop()
    r.line(-9.5, -12.2, 9.5, -11.4, 1.6, { stroke: PALETTE.plankDark })
    r.rect(-1.6, -13.3, 3.2, 3, { fill: PALETTE.keyShade })
    twinkle(r, 1.5, y - 5.5, 3.2, PALETTE.keyGlint, time * 2.6)
  }

  private jelly(r: IRenderer, enemy: Jelly, skin: EnemySkin, tint: string | null, time: number): void {
    const tone = tinted(skin.jelly, tint)
    const charge = enemy.chargeProgress
    const charging = enemy.charge > 0
    const beat = Math.sin(time * 3.2)
    if (charging) this.chargeField(r, charge, time)
    for (let i = 0; i < 4; i++) {
      const tx = -6 + i * 4
      const wave = Math.sin(time * 4 + i * 1.3) * 2.5 * (1 - charge * 0.6)
      const flare = tx * charge * 0.5
      const mx = tx + wave * 0.4 + flare * 0.5
      const ex = tx + wave + flare
      const ey = -1 + beat * 0.6
      r.line(tx, -10, mx, -5.5, 1.5, { stroke: tone.body, alpha: 0.75 })
      r.line(mx, -5.5, ex, ey, 1.1, { stroke: tone.body, alpha: 0.6 })
      this.tentacleTip(r, skin, tone, ex, ey, i, time)
    }
    for (const side of [-1, 1]) {
      r.line(side * 1.5, -9, side * 2 + Math.sin(time * 3 + side) * 1.5, -3.5, 2.6, { stroke: tone.light, alpha: 0.5 })
    }
    r.push()
    r.translate(0, -10)
    r.scale(1 + beat * 0.05, 1 - beat * 0.05)
    r.translate(0, 10)
    r.polygon(BELL, { fill: tone.body, alpha: 0.82, glow: tone.glow, glowSize: 10 })
    r.circle(0, -13.5, 7, { fill: tone.light, alpha: 0.2 })
    r.line(-10.5, -8.6, 10.5, -8.6, 1.3, { stroke: tone.shade, alpha: 0.55 })
    this.bellDecor(r, skin, tone, time)
    r.circle(-4, -17, 1.6, { fill: '#ffffff', alpha: 0.8 })
    if (charging) {
      r.polygon(BELL, { fill: PALETTE.shock, alpha: charge * 0.55, glow: PALETTE.shock, glowSize: 6 + charge * 16 })
    }
    r.pop()
    if (enemy.shocking) this.shock(r, enemy, time)
  }

  private tentacleTip(
    r: IRenderer,
    skin: EnemySkin,
    tone: Tone,
    x: number,
    y: number,
    index: number,
    time: number,
  ): void {
    switch (skin.style) {
      case 'storm':
        return
      case 'ice':
        crystal(r, x, y + 0.5, 1.6, tone.accent, 0.9)
        return
      case 'ember':
        if (index === 0 || index === 3) glowSpot(r, x, y, 0.9, tone.light, pulse(time, 4, index))
        return
      case 'abyss':
        glowSpot(r, x, y, 0.9, tone.accent, pulse(time, 3, index * 1.4))
        return
    }
  }

  private bellDecor(r: IRenderer, skin: EnemySkin, tone: Tone, time: number): void {
    switch (skin.style) {
      case 'storm':
        r.circle(0, -14, 3.8, { fill: tone.light, alpha: 0.85 })
        r.ring(-4.4, -12.2, 1.2, 0.9, { stroke: tone.accent, alpha: 0.5 })
        r.ring(4.4, -12.2, 1.2, 0.9, { stroke: tone.accent, alpha: 0.5 })
        r.ring(0, -18.6, 1.2, 0.9, { stroke: tone.accent, alpha: 0.5 })
        return
      case 'ice':
        r.circle(0, -14, 3.2, { fill: tone.light, alpha: 0.7, glow: tone.glow, glowSize: 6 })
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI) / 3 + time * 0.5
          const dx = Math.cos(a) * 4.4
          const dy = Math.sin(a) * 4.4
          r.line(-dx, -14 - dy, dx, -14 + dy, 1, { stroke: '#ffffff', alpha: 0.9 })
        }
        for (const x of [-6.5, 0, 6.5]) icicle(r, x, -8.4, x === 0 ? 3.4 : 2.6, 1.8, tone.accent)
        twinkle(r, 6, -17, 2.4, '#ffffff', time * 2)
        return
      case 'ember': {
        const heat = 0.5 + pulse(time, 3) * 0.5
        r.circle(0, -14, 3.8, { fill: tone.light, alpha: 0.9, glow: tone.glow, glowSize: 8 + heat * 8 })
        crack(r, [-8.5, -10.5, -5.5, -14.5, -2.5, -17.5], tone.light, heat)
        crack(r, [3, -18.5, 5.5, -14.8, 8.8, -11.5], tone.light, heat)
        smoke(r, 0, -22, time, 0.5, skin.haze)
        return
      }
      case 'abyss':
        r.circle(0, -14, 3.4, { fill: tone.light, alpha: 0.8, glow: tone.accent, glowSize: 8 })
        for (let k = 0; k < 5; k++) {
          const a = Math.PI + ((k + 0.5) / 5) * Math.PI
          const lit = Math.max(0, Math.sin(time * 4 - k * 1.2))
          glowSpot(r, Math.cos(a) * 8.6, -11 + Math.sin(a) * 8.6, 1.1, tone.accent, lit)
        }
        return
    }
  }

  private chargeField(r: IRenderer, charge: number, time: number): void {
    const radius = BALANCE.jellyShock.radius
    const flicker = noise(Math.floor(time * 24))
    r.ring(0, -12, radius, 1.5, { stroke: PALETTE.shock, alpha: 0.1 + charge * 0.3 })
    r.ring(0, -12, 14 + (radius - 14) * (1 - charge), 2, {
      stroke: PALETTE.shock,
      alpha: 0.25 + charge * 0.5,
      glow: PALETTE.shock,
      glowSize: 8,
    })
    r.circle(0, -12, 13 + charge * 7 + flicker * 2, {
      fill: PALETTE.shock,
      alpha: 0.12 + charge * 0.28,
      glow: PALETTE.shock,
      glowSize: 8 + charge * 22,
    })
  }

  private shock(r: IRenderer, enemy: Jelly, time: number): void {
    if (enemy.zap > 0) {
      this.zap(r, enemy)
      return
    }
    if (enemy.charge > 0) {
      const charge = enemy.chargeProgress
      const tick = Math.floor(time * 22)
      const count = 2 + Math.floor(charge * 4.99)
      for (let k = 0; k < count; k++) {
        const seed = tick * 7.3 + k * 3.1 + enemy.id * 1.9
        const a = (k / count) * Math.PI * 2 + noise(seed) * 1.2
        const reach = 14 + charge * 10 + noise(seed + 1) * 4
        const c = Math.cos(a)
        const s = Math.sin(a)
        bolt(r, c * 9, -12 + s * 9, c * reach, -12 + s * reach, (noise(seed + 2) - 0.5) * 0.8, 0.55 + charge * 0.45, 1 + charge * 0.6)
      }
      return
    }
    const hum = pulse(time, 6)
    r.arc(0, -11, 12.5, Math.PI * 1.08, Math.PI * 1.92, 1.1, {
      stroke: PALETTE.shock,
      alpha: 0.3 + hum * 0.35,
      glow: PALETTE.shock,
      glowSize: 6,
    })
    const orbit = time * 4.2
    r.circle(Math.cos(orbit) * 13, -12 + Math.sin(orbit) * 7, 1.2, { fill: '#ffffff', glow: PALETTE.shock, glowSize: 6 })
    if (Math.sin(time * 2.3) > 0.6) bolt(r, -6, -5, 6, -3.5, (noise(Math.floor(time * 18)) - 0.5) * 0.9, 0.85, 1)
  }

  private zap(r: IRenderer, enemy: Jelly): void {
    const z = Math.min(1, enemy.zap / BALANCE.jellyShock.flash)
    const spread = 1 - z
    const radius = BALANCE.jellyShock.radius
    r.ring(0, -12, 14 + (radius - 14) * spread, 1 + z * 3, {
      stroke: PALETTE.shock,
      alpha: z,
      glow: PALETTE.shock,
      glowSize: 12,
    })
    r.circle(0, -12, 13 + spread * 6, { fill: '#ffffff', alpha: z * 0.85, glow: PALETTE.shock, glowSize: 28 })
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + noise(enemy.id + k) * 0.8
      const c = Math.cos(a)
      const s = Math.sin(a)
      const near = 12 + spread * 12
      const far = 18 + spread * 26
      r.line(c * near, -12 + s * near, c * far, -12 + s * far, 1.4, {
        stroke: '#ffffff',
        alpha: z,
        glow: PALETTE.shock,
        glowSize: 8,
      })
    }
  }

  private octopus(r: IRenderer, enemy: Octopus, skin: EnemySkin, tint: string | null, time: number): void {
    const tone = tinted(skin.octopus, tint)
    const ink = tint ?? PALETTE.inkBlot
    const facing = enemy.facing
    const climbing = enemy.isClimbing
    const swimming = enemy.swimming && !climbing
    const swing = Math.sin(enemy.age * (enemy.moving ? 12 : 4))
    const jet = Math.sin(enemy.age * 8)
    if (swimming) {
      r.push()
      r.translate(0, -14)
      r.rotate(facing * 0.3)
      r.translate(0, 14)
      if (enemy.inky) r.circle(-facing * 12, -6, 2.6 + jet, { fill: ink, alpha: 0.35 })
    }
    for (let i = 0; i < 4; i++) {
      const tx = -7 + i * 4.6
      const curl = (i % 2 === 0 ? swing : -swing) * 3
      let mx = tx + curl * 0.45
      let my = -5
      let ex = tx * 1.2 + curl
      let ey = 0
      if (climbing) {
        my = -19
        ex = tx + curl
        ey = -26 - Math.abs(curl)
      } else if (swimming) {
        mx = tx * (0.85 + jet * 0.15) - facing * 3
        my = -4
        ex = tx * (0.6 + jet * 0.35) - facing * 8
        ey = 1.5 + jet
      }
      r.line(tx, climbing ? -12 : -10, mx, my, 2.8, { stroke: tone.shade })
      r.line(mx, my, ex, ey, 2.2, { stroke: tone.shade })
      if (enemy.inky) r.circle(ex, ey, 1.8, { fill: ink })
      this.sucker(r, skin, tone, mx, my, i, time)
    }
    r.circle(0, -15, 10, { fill: tone.body })
    if (enemy.inky) {
      if (tint === null) r.circle(0, -15, 10, { fill: PALETTE.inkBlot, alpha: 0.3 })
      const sx = -facing * 2.5
      r.circle(sx, -20.5, 3.6, { fill: ink, glow: tint ?? PALETTE.inkGlow, glowSize: 6 })
      r.ring(sx, -20.5, 3.6, 0.9, { stroke: tint ?? PALETTE.inkGlow, alpha: 0.8 })
      r.circle(sx - 1.2, -21.8, 0.9, { fill: tint ?? PALETTE.inkGlow, alpha: 0.9 })
    } else {
      r.circle(-3, -19, 3, { fill: tone.shade, alpha: 0.6 })
      r.circle(4, -21, 1.6, { fill: tone.shade, alpha: 0.5 })
    }
    r.circle(-5.5, -20.5, 1.4, { fill: tone.light, alpha: 0.5 })
    this.octopusHead(r, skin, tone, tint, time, facing)
    for (const side of [-1, 1]) {
      this.eye(r, skin, side * 4, -14, 2.8, facing * 1.1)
      r.line(side * 1.4, -17.4, side * 6.6, -18.8, 1.4, { stroke: tone.shade })
    }
    r.line(-3, -9.5, 3, -9.5, 1.4, { stroke: tone.shade })
    if (skin.style === 'ice') breath(r, facing * 3.5, -9.5, facing, time, skin.haze)
    if (swimming) {
      r.pop()
      bubbles(r, -facing * 3, -26, time, skin.foam)
    }
  }

  private sucker(r: IRenderer, skin: EnemySkin, tone: Tone, x: number, y: number, index: number, time: number): void {
    switch (skin.style) {
      case 'storm':
        r.circle(x, y, 0.9, { fill: tone.accent, alpha: 0.7 })
        return
      case 'ice':
        r.circle(x, y, 1, { fill: tone.light, alpha: 0.85 })
        return
      case 'ember':
        if (index === 1 || index === 2) glowSpot(r, x, y, 0.9, tone.light, pulse(time, 3, index))
        return
      case 'abyss':
        glowSpot(r, x, y, 1, tone.glow, pulse(time, 3, index * 1.1))
        return
    }
  }

  private octopusHead(
    r: IRenderer,
    skin: EnemySkin,
    tone: Tone,
    tint: string | null,
    time: number,
    facing: number,
  ): void {
    switch (skin.style) {
      case 'storm':
        return
      case 'ice':
        r.arc(0, -15, 8.6, Math.PI * 1.2, Math.PI * 1.8, 3, { stroke: tone.light, alpha: 0.85 })
        crystal(r, -4.5, -24.2, 2.4, tone.accent)
        crystal(r, 0, -26.2, 3.4, tone.accent)
        crystal(r, 4.5, -24.2, 2.4, tone.accent)
        twinkle(r, 1.5, -28, 2.2, '#ffffff', time * 2)
        return
      case 'ember':
        for (const side of [-1, 1]) horn(r, side * 5, -22.5, side, 7, tone.accent)
        crack(r, [-6.5, -18.5, -3, -21.5, 0.5, -19.5, 4, -22.5], tone.light, 0.5 + pulse(time, 3) * 0.5)
        smoke(r, 0, -25, time, 0.1, skin.haze)
        return
      case 'abyss': {
        const bx = facing * 8.5 + Math.sin(time * 2.2) * 1.5
        const glow = pulse(time, 3)
        r.line(facing * 1.5, -24.5, facing * 3.5, -31, 1.3, { stroke: tone.shade })
        r.line(facing * 3.5, -31, bx, -30, 1.1, { stroke: tone.shade })
        r.circle(bx, -28.3, 3.6 + glow, { fill: tone.light, alpha: 0.15 + glow * 0.15, glow: tone.light, glowSize: 12 })
        r.circle(bx, -28.3, 1.7, { fill: tone.light, glow: tone.light, glowSize: 6 + glow * 6 })
        barnacle(r, 6.5, -19, 1.5, tint ?? BARNACLE, tone.shade)
        glowSpot(r, -2, -22, 0.8, tone.glow, pulse(time, 2.5, 1))
        glowSpot(r, -6.8, -17.5, 0.8, tone.glow, pulse(time, 2.5, 2))
        return
      }
    }
  }

  private urchin(r: IRenderer, enemy: Urchin, skin: EnemySkin, tint: string | null, time: number): void {
    const tone = tinted(skin.urchin, tint)
    const style = skin.style
    const facing = enemy.facing
    const charging = enemy.telegraph > 0
    const grow = charging ? 1 - enemy.telegraph / BALANCE.urchin.telegraph : 0
    const quiver = charging ? Math.sin(time * 40) * 1.5 : 0
    const spike = tint ?? (charging ? skin.urchin.glow : skin.urchin.accent)
    const spread = style === 'ice' ? 0.11 : style === 'ember' ? 0.2 : 0.15
    const extra = style === 'ice' ? 1.5 : 0
    if (charging) {
      r.circle(0, -11, 15 + grow * 5, {
        fill: skin.urchin.glow,
        alpha: 0.1 + grow * 0.25,
        glow: skin.urchin.glow,
        glowSize: 10 + grow * 14,
      })
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + enemy.age * 0.3
      const tip = 9 + (i % 2 === 0 ? 6 : 4.5) + extra + (charging ? 3 + quiver + grow * 2 : 0)
      const tx = Math.cos(a) * tip
      const ty = -11 + Math.sin(a) * tip
      r.polygon(
        [
          Math.cos(a - spread) * 7.5,
          -11 + Math.sin(a - spread) * 7.5,
          tx,
          ty,
          Math.cos(a + spread) * 7.5,
          -11 + Math.sin(a + spread) * 7.5,
        ],
        { fill: spike, ...(charging ? { glow: spike, glowSize: 6 } : {}) },
      )
      if (style === 'abyss' && !charging && i % 3 === 0) glowSpot(r, tx, ty, 0.9, tone.light, pulse(time, 3, i))
    }
    r.circle(0, -11, 9, { fill: tone.body })
    r.arc(0, -11, 6.8, Math.PI * 0.15, Math.PI * 0.85, 3.4, { stroke: tone.shade, alpha: 0.6 })
    r.circle(-3.5, -15, 2, { fill: tone.light, alpha: 0.35 })
    this.urchinDecor(r, skin, tone, tint, time, facing)
    this.eye(r, skin, facing * 3, -12, 2.2, facing * 0.8)
    if (charging) {
      const reach = 14 + grow * 12
      r.line(facing * 0.6, -15.8, facing * 5.4, -14.6, 1.3, { stroke: spike })
      r.polygon([facing * 8, -12.8, facing * reach, -11, facing * 8, -9.2], {
        fill: '#ffffff',
        alpha: 0.6 + grow * 0.4,
        glow: skin.urchin.glow,
        glowSize: 8 + grow * 8,
      })
    }
  }

  private urchinDecor(
    r: IRenderer,
    skin: EnemySkin,
    tone: Tone,
    tint: string | null,
    time: number,
    facing: number,
  ): void {
    switch (skin.style) {
      case 'storm':
        return
      case 'ice':
        r.arc(0, -11, 6.8, Math.PI * 1.15, Math.PI * 1.85, 3.2, { stroke: tone.light, alpha: 0.8 })
        twinkle(r, -5, -17, 2.4, '#ffffff', time * 2.3)
        return
      case 'ember':
        crack(r, [-6.5, -7.5, -3, -9.8, 0, -6.5, 4.5, -8.6], tone.light, 0.5 + pulse(time, 3.4) * 0.5)
        crack(r, [-facing * 1.5, -18.5, -facing * 4.5, -15, -facing * 3, -12.5], tone.light, 0.5 + pulse(time, 3.4, 1.4) * 0.5)
        smoke(r, -facing * 2, -20, time, 0.7, skin.haze)
        return
      case 'abyss':
        barnacle(r, -4.5, -6.5, 1.6, tint ?? BARNACLE, tone.shade)
        glowSpot(r, 4, -6, 0.9, tone.light, pulse(time, 2.6))
        glowSpot(r, -5.5, -14.5, 0.8, tone.light, pulse(time, 2.6, 2))
        return
    }
  }

  private guardian(r: IRenderer, enemy: Guardian, skin: EnemySkin, tint: string | null, time: number): void {
    const tone = tinted(skin.guardian, tint)
    const style = skin.style
    const facing = enemy.facing
    const charging = enemy.telegraph > 0
    const grow = charging ? 1 - enemy.telegraph / BALANCE.guardian.telegraph : 0
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const y0 = -12 - i * 9
        const ey = y0 + 5 + Math.sin(time * 3 + i + side) * 3
        r.line(side * 12, y0, side * 25, ey, 4.5, { stroke: tone.shade })
        if (style === 'abyss') glowSpot(r, side * 25, ey, 2.8, tone.glow, pulse(time, 2.4, i * 1.3 + side))
        else r.circle(side * 25, ey, 3, { fill: tone.shade })
      }
    }
    for (let i = 0; i < 4; i++) {
      const tx = -12 + i * 8
      r.line(tx, -14, tx + Math.sin(enemy.age * 4 + i) * 3, 0, 5, { stroke: tone.shade })
    }
    if (style === 'ember') {
      for (const side of [-1, 1]) horn(r, side * 12.5, -37, side, 11, tone.accent)
    }
    r.circle(0, -26, 18, { fill: tone.body, ...(charging ? { glow: PALETTE.inkGlow, glowSize: 22 } : {}) })
    r.circle(-6, -33, 5, { fill: tone.shade, alpha: 0.5 })
    r.circle(8, -35, 2.4, { fill: tone.shade, alpha: 0.45 })
    r.circle(-11, -31, 2.2, { fill: tone.light, alpha: 0.45 })
    this.guardianFace(r, skin, tone, tint, time)
    for (const side of [-1, 1]) {
      this.eye(r, skin, side * 7, -25, 4.8, facing * 1.6)
      r.line(side * 2.5, -31 + (charging ? 1 : 0), side * 11.5, -29.5 - (charging ? 2 : 0), 2.6, { stroke: tone.shade })
    }
    r.line(-5, -15.5, 5, -15.5, 2.2, { stroke: tone.shade })
    if (style === 'ice') breath(r, facing * 6, -15.5, facing, time, skin.haze)
    this.cap(r, skin, time, facing)
    if (charging) {
      const bx = facing * 6
      r.ring(bx, -12, 5 + grow * 7, 1.4, {
        stroke: PALETTE.inkGlow,
        alpha: 0.35 + grow * 0.6,
        glow: PALETTE.inkGlow,
        glowSize: 8,
      })
      r.circle(bx, -12, 3 + grow * 4, { fill: PALETTE.inkBlot, glow: PALETTE.inkGlow, glowSize: 10 })
    }
  }

  private guardianFace(r: IRenderer, skin: EnemySkin, tone: Tone, tint: string | null, time: number): void {
    switch (skin.style) {
      case 'storm':
        return
      case 'ice':
        crystal(r, -14, -17, 2.6, tone.accent, 0.85)
        crystal(r, 14.5, -19, 2.2, tone.accent, 0.85)
        return
      case 'ember': {
        const heat = 0.5 + pulse(time, 2.6) * 0.5
        crack(r, [-16.5, -21, -12.5, -17.5, -14, -12.5], tone.light, heat, 1.6)
        crack(r, [14.5, -33, 16.5, -28, 13.5, -23], tone.light, heat, 1.6)
        return
      }
      case 'abyss':
        glowSpot(r, -14, -17, 1.2, tone.glow, pulse(time, 2.2))
        glowSpot(r, 14.5, -19, 1, tone.glow, pulse(time, 2.2, 1.5))
        barnacle(r, 12.5, -11.5, 1.8, tint ?? BARNACLE, tone.shade)
        return
    }
  }

  private cap(r: IRenderer, skin: EnemySkin, time: number, facing: number): void {
    const cap = skin.cap
    switch (skin.style) {
      case 'storm':
        for (let k = 0; k < 2; k++) {
          const sway = Math.sin(time * 3 + k * 1.3) * 1.6
          r.line(-facing * (9 + k * 2), -40.5, -facing * (14 + k * 2.5) + sway, -32 + k * 1.5, 1.6, { stroke: cap.band })
        }
        r.roundRect(-11, -48, 22, 7, 2.5, { fill: cap.crown })
        r.rect(-13, -42, 26, 3, { fill: cap.band })
        r.rect(-3, -45.5, 6, 2.4, { fill: cap.badge })
        return
      case 'ice':
        for (const side of [-1, 1]) r.roundRect(side * 13 - 3, -42, 6, 11, 3, { fill: cap.band })
        r.roundRect(-12, -50, 24, 10, 4.5, { fill: cap.crown })
        r.roundRect(-14.5, -43, 29, 5, 2.5, { fill: cap.band })
        crystal(r, 0, -46.5, 3, cap.badge)
        for (let i = 0; i < 4; i++) icicle(r, -9 + i * 6, -38.2, 2.8 + (i % 2) * 1.6, 2, skin.guardian.accent)
        twinkle(r, 7, -48, 2.6, '#ffffff', time * 1.7)
        return
      case 'ember':
        r.roundRect(-12.5, -51, 25, 9, 3.5, { fill: cap.crown })
        r.line(-9.5, -50.2, 9.5, -50.2, 1, { stroke: '#6b3d47' })
        r.rect(-12.5, -44, 25, 3, { fill: cap.band })
        r.roundRect(-14.5, -41.8, 29, 3, 1.5, { fill: '#120a0e' })
        r.circle(0, -47, 2.6, { fill: cap.badge, glow: '#ff7a3a', glowSize: 8 + pulse(time, 3) * 8 })
        smoke(r, -facing * 6, -51, time, 0.2, skin.haze, 3)
        return
      case 'abyss': {
        const sway = Math.sin(time * 2.4) * 1.5
        const lx = facing * 24 + sway
        const glow = pulse(time, 3)
        strand(r, -facing * 13.5, -40, -facing * 2, 11, sway, PALETTE.kelp, 1.7)
        strand(r, -facing * 9.5, -40, -facing, 7.5, -sway, PALETTE.kelpDark, 1.3)
        r.roundRect(-11, -48, 22, 7, 2.5, { fill: cap.crown })
        r.rect(-13, -42, 26, 3, { fill: cap.band })
        barnacle(r, -6.5, -45.5, 2, BARNACLE, cap.band)
        barnacle(r, 5.5, -47, 1.6, BARNACLE, cap.band)
        barnacle(r, 10, -43.6, 1.3, BARNACLE, cap.band)
        glowSpot(r, 0, -44.6, 1.6, cap.badge, pulse(time, 2.2))
        r.line(facing * 9.5, -45, facing * 18, -50, 1.4, { stroke: PALETTE.kelpDark })
        r.line(facing * 18, -50, lx, -46, 1.2, { stroke: PALETTE.kelpDark })
        r.circle(lx, -44.5, 4.2 + glow, {
          fill: skin.guardian.light,
          alpha: 0.15 + glow * 0.15,
          glow: skin.guardian.light,
          glowSize: 14,
        })
        r.circle(lx, -44.5, 2.2, { fill: skin.guardian.light, glow: skin.guardian.light, glowSize: 8 })
        return
      }
    }
  }
}
