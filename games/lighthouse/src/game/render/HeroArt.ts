import type { IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Hero } from '../entities/Hero.js'

export interface HeroLook {
  readonly shield: boolean
  readonly strider: boolean
  readonly time: number
}

export class HeroArt {
  draw(r: IRenderer, hero: Hero, look: HeroLook): void {
    let alpha = 1
    if (hero.state === 'dead') alpha = Math.max(0, 1 - hero.deadTime / 1.4)
    else if (hero.invulnerable > 0 && Math.sin(look.time * 40) > 0) alpha = 0.35
    if (alpha <= 0) return
    if (look.strider && hero.alive) this.drawStrider(r, hero, look.time)

    r.push()
    r.translate(hero.x, hero.y)
    r.alpha(alpha)
    if (hero.state === 'dead') {
      r.translate(0, -6 + hero.deadTime * 18)
      r.rotate(-Math.min(1.4, hero.deadTime * 3) * hero.facing)
    }
    const climbing = hero.state === 'climb' && hero.recoil <= 0
    if (climbing) this.drawBack(r, hero)
    else {
      if (hero.facing < 0) r.scale(-1, 1)
      this.drawSide(r, hero)
    }
    r.pop()

    if (look.shield && hero.alive) {
      const pulse = 1 + Math.sin(look.time * 6) * 0.05
      r.circle(hero.x, hero.centerY, 21 * pulse, { fill: PALETTE.shield, alpha: 0.12 })
      r.ring(hero.x, hero.centerY, 21 * pulse, 2, { stroke: PALETTE.shield, alpha: 0.75 })
    }
    if (hero.alive && hero.air < hero.maxAir - 0.05) this.drawAir(r, hero, look.time)
  }

  private drawStrider(r: IRenderer, hero: Hero, time: number): void {
    if (hero.onWater) {
      const pulse = (time * 2) % 1
      r.push()
      r.translate(hero.x, hero.y)
      r.scale(1, 0.28)
      r.ring(0, 0, 10 + pulse * 14, 2, { stroke: PALETTE.strider, alpha: 1 - pulse })
      r.ring(0, 0, 6, 2, { stroke: PALETTE.waterFoam, alpha: 0.8 })
      r.pop()
    }
    if (!hero.moving) return
    for (let i = 0; i < 3; i++) {
      const y = hero.y - 6 - i * 8
      const x = hero.x - hero.facing * (14 + ((time * 60 + i * 7) % 10))
      r.line(x, y, x - hero.facing * 10, y, 1.5, { stroke: PALETTE.strider, alpha: 0.6 })
    }
  }

  private drawAir(r: IRenderer, hero: Hero, time: number): void {
    const slots = 5
    const filled = (hero.air / hero.maxAir) * slots
    const low = hero.air <= BALANCE.hero.airWarning
    const flash = low && Math.sin(time * 14) > 0
    const y = hero.y - hero.height - 15
    const spacing = 9.5
    const x0 = hero.x - ((slots - 1) * spacing) / 2
    if (hero.air <= 0) {
      r.text('!', hero.x, y, { fill: PALETTE.danger, size: 18, weight: 900, align: 'center', baseline: 'middle' })
      return
    }
    for (let i = 0; i < slots; i++) {
      const amount = Math.max(0, Math.min(1, filled - i))
      const x = x0 + i * spacing
      if (amount <= 0) {
        r.ring(x, y, 3, 1, { stroke: PALETTE.inkMuted, alpha: 0.35 })
        continue
      }
      const color = low ? (flash ? PALETTE.danger : PALETTE.ink) : PALETTE.waterFoam
      r.circle(x, y, 4 * (0.5 + amount * 0.5), { fill: color, alpha: 0.35 })
      r.ring(x, y, 4 * (0.5 + amount * 0.5), 1.4, { stroke: color })
      r.circle(x - 1, y - 1, 0.9, { fill: '#ffffff', alpha: 0.9 })
    }
  }

  private drawSide(r: IRenderer, hero: Hero): void {
    const swimming = hero.state === 'swim'
    const walking = hero.state === 'ground' && hero.moving
    const falling = hero.state === 'fall'
    const swing = walking ? Math.sin(hero.walkPhase) : swimming ? Math.sin(hero.swimPhase * 1.6) : 0
    const bob = walking ? Math.abs(Math.cos(hero.walkPhase)) * 1.2 : swimming ? Math.sin(hero.swimPhase) * 1.5 : 0
    if (swimming) {
      r.translate(0, -8)
      r.rotate(0.22)
    }

    r.roundRect(-6 + swing * 3.5, -6, 6, 6, 2, { fill: PALETTE.boots })
    r.roundRect(1 - swing * 3.5, -6, 6, 6, 2, { fill: PALETTE.boots })

    r.translate(0, -bob)
    r.polygon([-9, -5, 9, -5, 7, -19, -7, -19], { fill: PALETTE.coat })
    r.rect(-9, -8, 18, 3, { fill: PALETTE.coatShade })
    r.rect(-7, -19, 4, 14, { fill: PALETTE.coatShade, alpha: 0.6 })
    r.circle(3, -12, 1, { fill: PALETTE.coatShade })
    r.circle(3, -16, 1, { fill: PALETTE.coatShade })

    r.circle(1, -22.5, 5.5, { fill: PALETTE.skin })
    r.circle(3.6, -23.2, 1.1, { fill: PALETTE.boots })
    r.polygon([-10, -25, 10, -26, 9, -24, -2, -23.5, -11, -21], { fill: PALETTE.coat })
    r.roundRect(-5, -31.5, 10, 7.5, 4, { fill: PALETTE.coat })
    r.rect(-5, -26, 10, 1.6, { fill: PALETTE.coatShade })

    const recoil = hero.recoil * 2.5
    if (falling) {
      r.line(-3, -17, -8, -27, 3, { stroke: PALETTE.coat })
      r.line(3, -17, 9, -26, 3, { stroke: PALETTE.coat })
      r.rect(7, -29, 7, 3, { fill: PALETTE.pistol })
      return
    }
    r.line(1, -16, 8 - recoil, -15, 3.4, { stroke: PALETTE.coat })
    r.circle(8.5 - recoil, -15, 1.9, { fill: PALETTE.skin })
    r.rect(8 - recoil, -17.5, 9, 3.6, { fill: PALETTE.pistol })
    r.rect(8 - recoil, -15, 3, 4.5, { fill: PALETTE.plankDark })
    r.rect(15 - recoil, -17, 2, 2.6, { fill: PALETTE.flare })
  }

  private drawBack(r: IRenderer, hero: Hero): void {
    const phase = hero.moving ? Math.sin(hero.climbPhase) : 0
    r.roundRect(-6, -6 + phase * 2, 5, 6, 2, { fill: PALETTE.boots })
    r.roundRect(1, -6 - phase * 2, 5, 6, 2, { fill: PALETTE.boots })
    r.polygon([-9, -5, 9, -5, 7, -19, -7, -19], { fill: PALETTE.coat })
    r.rect(-1, -19, 2, 14, { fill: PALETTE.coatShade })
    r.line(-6, -17, -9, -26 - phase * 3, 3.4, { stroke: PALETTE.coat })
    r.line(6, -17, 9, -26 + phase * 3, 3.4, { stroke: PALETTE.coat })
    r.circle(-9, -26.5 - phase * 3, 2, { fill: PALETTE.skin })
    r.circle(9, -26.5 + phase * 3, 2, { fill: PALETTE.skin })
    r.circle(0, -22.5, 5.5, { fill: PALETTE.coatShade })
    r.polygon([-11, -23, 11, -23, 9, -20, -9, -20], { fill: PALETTE.coat })
    r.roundRect(-5, -31.5, 10, 9, 4, { fill: PALETTE.coat })
  }
}
