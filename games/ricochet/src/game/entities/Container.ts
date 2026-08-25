import type { IRenderer } from '@sa/core'
import { clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Field } from './Field.js'

export interface ContainerReadout {
  readonly percent: number
  readonly fillRatio: number
  readonly modules: number
  readonly multiplier: number
}

export class Container {
  hp: number = BALANCE.container.maxHp

  private invulnerability = 0
  private hitFlash = 0
  private pulse = 0
  private generateFlash = 0

  get alive(): boolean {
    return this.hp > 0
  }

  get invulnerable(): boolean {
    return this.invulnerability > 0
  }

  reset(): void {
    this.hp = BALANCE.container.maxHp
    this.invulnerability = 0
    this.hitFlash = 0
    this.pulse = 0
    this.generateFlash = 0
  }

  takeDamage(): boolean {
    if (this.invulnerability > 0 || !this.alive) return false
    this.hp -= 1
    this.invulnerability = BALANCE.container.invulnerability
    this.hitFlash = 1
    return true
  }

  flashGeneration(): void {
    this.generateFlash = 1
  }

  update(dt: number): void {
    this.invulnerability = Math.max(0, this.invulnerability - dt)
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3.4)
    this.generateFlash = Math.max(0, this.generateFlash - dt * 1.6)
    this.pulse += dt * BALANCE.container.pulseSpeed
  }

  get topY(): number {
    return -BALANCE.container.height * 0.42
  }

  render(renderer: IRenderer, field: Field, readout: ContainerReadout): void {
    const { width, height } = BALANCE.container
    const centerX = field.pivotX
    const top = field.pivotY + this.topY
    const left = centerX - width / 2
    const blinking = this.invulnerable && Math.floor(this.invulnerability * 12) % 2 === 0
    const integrityColor =
      this.hp >= BALANCE.container.maxHp
        ? PALETTE.friendly
        : this.hp === 1
          ? PALETTE.hostile
          : PALETTE.reward
    const accent = this.hitFlash > 0.1 ? PALETTE.hostile : integrityColor
    const glowSize = 14 + this.hitFlash * 26 + this.generateFlash * 30

    renderer.roundRect(left - 6, top - 6, width + 12, height + 12, 18, {
      fill: accent,
      alpha: 0.05 + this.hitFlash * 0.16 + this.generateFlash * 0.18,
    })
    renderer.roundRect(left, top, width, height, 14, {
      fill: blinking ? PALETTE.grid : PALETTE.surface,
      stroke: accent,
      lineWidth: 2,
      glow: accent,
      glowSize,
    })

    this.renderIntegrity(renderer, centerX, top)
    this.renderWindow(renderer, centerX, left, top, readout)
  }

  private renderIntegrity(renderer: IRenderer, centerX: number, top: number): void {
    const total = BALANCE.container.maxHp
    const segmentWidth = 26
    const gap = 7
    const totalWidth = total * segmentWidth + (total - 1) * gap

    for (let i = 0; i < total; i++) {
      const x = centerX - totalWidth / 2 + i * (segmentWidth + gap)
      const intact = i < this.hp
      const y = top + 8

      if (intact) {
        renderer.roundRect(x, y, segmentWidth, 6, 3, {
          fill: PALETTE.friendly,
          glow: PALETTE.friendly,
          glowSize: 9,
        })
        continue
      }

      renderer.roundRect(x, y, segmentWidth, 6, 3, { fill: PALETTE.grid, alpha: 0.7 })
      const mid = x + segmentWidth / 2
      renderer.polygon(
        [mid - 5, y - 2, mid - 1, y + 3, mid + 2, y - 1, mid + 6, y + 8, mid, y + 4, mid - 3, y + 9],
        { fill: PALETTE.hostile, alpha: 0.85 },
      )
    }
  }

  private renderWindow(
    renderer: IRenderer,
    centerX: number,
    left: number,
    top: number,
    readout: ContainerReadout,
  ): void {
    const { width, height } = BALANCE.container
    const x = left + 12
    const y = top + 22
    const w = width - 24
    const h = height - 44

    renderer.roundRect(x, y, w, h, 8, { fill: PALETTE.background, alpha: 0.9 })

    const fill = clamp(readout.fillRatio, 0, 1) * (h - 4)
    if (fill > 1) {
      renderer.roundRect(x + 2, y + h - 2 - fill, w - 4, fill, 6, {
        fill: PALETTE.reward,
        alpha: 0.22,
      })
      renderer.line(x + 2, y + h - 2 - fill, x + w - 2, y + h - 2 - fill, 2, {
        stroke: PALETTE.reward,
        glow: PALETTE.reward,
        glowSize: 8,
      })
    }

    renderer.text(`${readout.percent}%`, centerX, y + h * 0.42, {
      fill: readout.percent >= 90 ? PALETTE.reward : PALETTE.ink,
      size: 26,
      weight: 800,
      align: 'center',
      baseline: 'middle',
    })

    renderer.text(`МОДУЛІВ ${readout.modules}`, centerX, y + h - 9, {
      fill: readout.modules > 0 ? PALETTE.reward : PALETTE.inkMuted,
      size: 11,
      weight: 700,
      align: 'center',
      baseline: 'middle',
    })

    if (readout.multiplier > 1) {
      renderer.text(`×${readout.multiplier}`, x + w - 6, y + 5, {
        fill: PALETTE.reward,
        size: 13,
        weight: 800,
        align: 'right',
        baseline: 'top',
      })
    }
  }
}
