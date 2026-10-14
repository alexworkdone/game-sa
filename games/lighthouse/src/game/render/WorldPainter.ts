import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { pearlKindOf } from '../config/pearls.js'
import type { PearlKind } from '../config/pearls.js'
import type { Pickup } from '../entities/Pickup.js'
import type { Projectile } from '../entities/Projectile.js'
import type { World } from '../systems/World.js'
import { EnemyArt } from './EnemyArt.js'
import { HazardPainter } from './HazardPainter.js'
import { HeroArt } from './HeroArt.js'
import { drawPearl, drawPowerGlyph, drawKey, drawShell, powerColor } from './Icons.js'
import { isPowerUpKind } from '../entities/Pickup.js'
import { LevelPainter } from './LevelPainter.js'
import { WaterArt } from './WaterArt.js'
import { LEVEL_THEMES } from '../config/tiers.js'
import type { LevelTheme } from '../config/tiers.js'

export class WorldPainter {
  private readonly level = new LevelPainter()
  private readonly heroArt = new HeroArt()
  private readonly enemyArt = new EnemyArt()
  private readonly waterArt = new WaterArt()
  private readonly hazards = new HazardPainter()
  private theme: LevelTheme = LEVEL_THEMES[0] as LevelTheme
  private pearl: PearlKind = 'white'

  prepare(world: World, theme: LevelTheme): void {
    this.theme = theme
    this.pearl = pearlKindOf(world.tier)
    this.level.prepare(world.map, world.floor, theme)
  }

  drawWorld(r: IRenderer, world: World, time: number, flash: number): void {
    const width = world.map.width
    this.level.drawBackdrop(r, time, flash)
    this.mirrored(r, world.door.x, 24, width, () => this.drawDoor(r, world, time))
    this.level.drawTiles(r, time)
    this.hazards.drawTerrain(r, world, time, this.theme)
    for (const pickup of world.pickups) {
      this.mirrored(r, pickup.x, 20, width, () => this.drawPickup(r, pickup, time))
    }
    for (const enemy of world.enemies) {
      this.mirrored(r, enemy.x, 40, width, () => this.enemyArt.draw(r, enemy, time, world.tier))
    }
    const look = { shield: world.powerUps.active('shield'), strider: world.powerUps.active('strider'), time }
    this.mirrored(r, world.hero.x, 32, width, () => this.heroArt.draw(r, world.hero, look))
    for (const projectile of world.projectiles.items) {
      if (!projectile.active) continue
      this.mirrored(r, projectile.x, 30, width, () => this.drawProjectile(r, projectile))
    }
    this.hazards.drawFront(r, world, time)
  }

  drawOverlay(r: IRenderer, world: World, time: number): void {
    this.hazards.drawOverlay(r, world, time, this.theme)
  }

  private mirrored(r: IRenderer, x: number, margin: number, width: number, draw: () => void): void {
    draw()
    const shift = x < margin ? width : x > width - margin ? -width : 0
    if (shift === 0) return
    r.push()
    r.translate(shift, 0)
    draw()
    r.pop()
  }

  drawWater(r: IRenderer, world: World, time: number): void {
    this.waterArt.draw(r, world.water, world.map.width, world.map.height, time, this.waterNotice(world), this.theme)
  }

  private waterNotice(world: World): string | null {
    if (!world.hero.alive || world.cleared) return null
    const held = world.powerUps.remaining('hourglass')
    if (held > 0) return `Вода стоїть: ${Math.ceil(held)} с`
    const start = world.water.startsIn
    if (start > 0) return `Вода рушить через ${Math.ceil(start)} с`
    return null
  }

  private drawDoor(r: IRenderer, world: World, time: number): void {
    const door = world.door
    const x = door.x
    const y = door.y
    r.roundRect(x - 15, y - 34, 30, 34, 13, { fill: PALETTE.doorFrame })
    r.roundRect(x - 12, y - 31, 24, 31, 11, { fill: PALETTE.night })
    if (door.open) {
      const glow = 0.6 + Math.sin(time * 5) * 0.15
      r.roundRect(x - 12, y - 31, 24, 31, 11, {
        fill: PALETTE.light,
        alpha: glow * door.openAnim,
        glow: PALETTE.light,
        glowSize: 22,
      })
      for (let i = 0; i < 3; i++) {
        const sy = y - 6 - i * 8
        r.rect(x - 8 + i * 2, sy, 16 - i * 4, 2, { fill: PALETTE.plankDark, alpha: 0.6 * door.openAnim })
      }
    }
    const slab = 1 - door.openAnim
    if (slab > 0.02) {
      r.roundRect(x - 12, y - 31, 24 * slab, 31, Math.min(11, 12 * slab), { fill: PALETTE.door })
      r.line(x - 12 + 24 * slab * 0.5, y - 28, x - 12 + 24 * slab * 0.5, y - 2, 1, {
        stroke: PALETTE.plankDark,
      })
      r.circle(x - 12 + 24 * slab - 4, y - 14, 1.6, { fill: PALETTE.accent })
    }
    const lamp = door.open ? PALETTE.lampOn : PALETTE.lampOff
    r.circle(x, y - 39, 3.6, { fill: lamp, glow: lamp, glowSize: 12 })
    const remaining = world.keysLeft
    if (!door.open && remaining > 0) {
      drawKey(r, x - 9, y - 50, 14, false, 0.85)
      r.text(String(remaining), x + 7, y - 50, {
        fill: PALETTE.key,
        size: 13,
        weight: 800,
        align: 'center',
        baseline: 'middle',
        alpha: 0.85,
      })
    }
  }

  private drawPickup(r: IRenderer, pickup: Pickup, time: number): void {
    const bob = pickup.resting && !pickup.pulled ? Math.sin(pickup.age * 3) * 2.5 : 0
    const x = pickup.x
    const y = pickup.y - 10 + bob
    switch (pickup.kind) {
      case 'key': {
        const pulse = 1 + Math.sin(time * 5 + pickup.age) * 0.1
        r.circle(x, y, 13 * pulse, { fill: PALETTE.key, alpha: 0.12 })
        r.push()
        r.translate(x, y)
        r.rotate(-0.5 + Math.sin(pickup.age * 2) * 0.15)
        drawKey(r, 0, 0, 22 * pulse, true)
        r.pop()
        return
      }
      case 'pearl': {
        drawPearl(r, x, y + 3, 10, 1, this.pearl)
        const twinkle = Math.sin(pickup.age * 2.3)
        if (twinkle > 0.8) {
          const s = (twinkle - 0.8) * 25
          r.line(x - 3 - s, y, x - 3 + s, y, 1, { stroke: '#ffffff', alpha: 0.9 })
          r.line(x - 3, y - s, x - 3, y + s, 1, { stroke: '#ffffff', alpha: 0.9 })
        }
        return
      }
      case 'shell': {
        const glow = 0.5 + Math.sin(time * 4 + pickup.age) * 0.3
        r.circle(x, y - 2, 15, { fill: PALETTE.shell, alpha: 0.18 * glow, glow: PALETTE.shell, glowSize: 14 })
        drawShell(r, x, y - 2, 24)
        return
      }
      default: {
        if (!isPowerUpKind(pickup.kind)) return
        const color = powerColor(pickup.kind)
        r.circle(x, y - 2, 11, { fill: PALETTE.night, alpha: 0.75 })
        r.ring(x, y - 2, 11, 2, { stroke: color, alpha: 0.9, glow: color, glowSize: 8 })
        drawPowerGlyph(r, pickup.kind, x, y - 2, 15)
      }
    }
  }

  private drawProjectile(r: IRenderer, p: Projectile): void {
    const speed = Math.hypot(p.vx, p.vy) || 1
    const nx = p.vx / speed
    const ny = p.vy / speed
    if (p.owner === 'hero') {
      const fx = p.effects
      const color = fx.frost ? PALETTE.frost : fx.blast ? PALETTE.blast : fx.homing ? PALETTE.homing : PALETTE.flare
      if (fx.harpoon) {
        const length = Math.min(30, p.travelled + 8)
        r.line(p.x - nx * length, p.y - ny * length, p.x, p.y, 2.5, { stroke: PALETTE.harpoon })
        r.polygon(
          [p.x + nx * 6, p.y + ny * 6, p.x - ny * 4, p.y + nx * 4, p.x + ny * 4, p.y - nx * 4],
          { fill: PALETTE.harpoon },
        )
        r.circle(p.x - nx * length, p.y - ny * length, 2.6, { fill: color, glow: color, glowSize: 8 })
        return
      }
      const size = fx.blast ? 4.8 : 3.6
      const tail = Math.min(26, p.travelled)
      r.line(p.x - nx * tail, p.y - ny * tail, p.x, p.y, size, { stroke: color, alpha: 0.55 })
      r.circle(p.x, p.y, size, { fill: color, glow: color, glowSize: 12 })
      r.circle(p.x, p.y, size * 0.5, { fill: PALETTE.flareCore })
      return
    }
    if (p.look === 'ink') {
      r.circle(p.x - nx * 9, p.y - ny * 9, 2.6, { fill: PALETTE.inkBlot, alpha: 0.6 })
      r.circle(p.x - nx * 4, p.y - ny * 4, 3.6, { fill: PALETTE.inkBlot, alpha: 0.8 })
      r.circle(p.x, p.y, 5, { fill: PALETTE.inkBlot, glow: PALETTE.inkGlow, glowSize: 10 })
      r.circle(p.x - 1.5, p.y - 1.5, 1.3, { fill: PALETTE.inkGlow })
      return
    }
    r.line(p.x - nx * 10, p.y - ny * 10, p.x, p.y, 2, { stroke: PALETTE.spine })
    r.circle(p.x, p.y, 1.6, { fill: '#ffffff' })
  }
}
