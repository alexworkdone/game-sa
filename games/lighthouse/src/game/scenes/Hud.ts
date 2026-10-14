import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { pearlKindOf } from '../config/pearls.js'
import { tierNumeral } from '../config/tiers.js'
import type { World } from '../systems/World.js'
import { drawBullet, drawHeartSlot, drawPearl, drawPowerGlyph, drawKey, powerColor } from '../render/Icons.js'

const HEART_SLOTS = 3

export interface HudFrame {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface HudView {
  readonly world: World
  readonly pearls: number
  readonly time: number
  readonly tier: number
}

export class Hud {
  private keyBump = 0
  private pearlBump = 0
  private heartBump = 0

  bumpKey(): void {
    this.keyBump = 1
  }

  bumpPearl(): void {
    this.pearlBump = 1
  }

  bumpHeart(): void {
    this.heartBump = 1
  }

  update(dt: number): void {
    this.keyBump = Math.max(0, this.keyBump - dt * 3)
    this.pearlBump = Math.max(0, this.pearlBump - dt * 4)
    this.heartBump = Math.max(0, this.heartBump - dt * 3)
  }

  draw(r: IRenderer, frame: HudFrame, view: HudView): void {
    const { world } = view
    const hero = world.hero
    const cy = frame.y + frame.height / 2
    let x = frame.x + 14

    const heartShake = this.heartBump > 0 ? Math.sin(view.time * 60) * 2 * this.heartBump : 0
    if (hero.hp <= HEART_SLOTS) {
      for (let i = 0; i < HEART_SLOTS; i++) {
        drawHeartSlot(r, x + 9 + heartShake, cy, 18, i < hero.hp)
        x += 23
      }
    } else {
      drawHeartSlot(r, x + 9 + heartShake, cy, 20, true)
      const label = `×${hero.hp}`
      const style = { fill: PALETTE.ink, size: 19, weight: 900, baseline: 'middle' } as const
      r.text(label, x + 23, cy + 1, style)
      x += 27 + r.measureText(label, style)
    }

    x += 12
    const gun = world.gun
    if (world.powerUps.active('hotgun')) {
      r.text('∞', x + 4, cy + 1, { fill: PALETTE.hotgun, size: 26, weight: 800, baseline: 'middle' })
    } else {
      const total = gun.stats.magazine
      for (let i = 0; i < total; i++) drawBullet(r, x + 4 + i * 9, cy, 15, i < gun.ammo && !gun.reloading)
      if (gun.reloading) {
        const w = total * 9
        r.rect(x, cy + 11, w, 3, { fill: PALETTE.surfaceActive })
        r.rect(x, cy + 11, w * gun.reloadProgress, 3, { fill: PALETTE.flare })
      }
    }

    const centerX = frame.x + frame.width / 2
    const floorLabel = view.tier > 1 ? `ПОВЕРХ ${world.floor} · ${tierNumeral(view.tier)}` : `ПОВЕРХ ${world.floor}`
    r.text(floorLabel, centerX, cy + 1, {
      fill: PALETTE.accent,
      size: 20,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })

    let rx = centerX + 92
    const keyScale = 1 + this.keyBump * 0.35
    drawKey(r, rx, cy, 18 * keyScale, world.keysLeft === 0)
    const collected = world.keysTotal - world.keysLeft
    r.text(`${collected}/${world.keysTotal}`, rx + 14, cy + 1, {
      fill: world.keysLeft === 0 ? PALETTE.good : PALETTE.ink,
      size: 18,
      weight: 800,
      baseline: 'middle',
    })

    if (world.keysUnderwater > 0) {
      const dx = rx + 50
      r.polygon([dx, cy - 8, dx + 5, cy, dx - 5, cy], { fill: PALETTE.waterFoam })
      r.circle(dx, cy + 1.5, 5, { fill: PALETTE.waterFoam })
      r.text(String(world.keysUnderwater), dx + 8, cy + 1, {
        fill: PALETTE.waterFoam,
        size: 14,
        weight: 800,
        baseline: 'middle',
      })
    }

    rx += 84
    drawPearl(r, rx, cy, 15 * (1 + this.pearlBump * 0.3), 1, pearlKindOf(view.tier))
    r.text(String(view.pearls), rx + 13, cy + 1, { fill: PALETTE.ink, size: 18, weight: 800, baseline: 'middle' })
  }
}
