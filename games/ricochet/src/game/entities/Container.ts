import type { IRenderer } from '@sa/core'
import { Ease, TAU, clamp } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import type { Field } from './Field.js'

export interface ContainerReadout {
  readonly energy: number
  readonly capacity: number
}

const LIQUID_SEGMENTS = 22

export class Container {
  hp: number = BALANCE.container.maxHp

  private invulnerability = 0
  private hitFlash = 0
  private pulse = 0
  private generateFlash = 0
  private teleport = 0
  private teleporting = false
  private shieldBreak = 0

  get alive(): boolean {
    return this.hp > 0
  }

  get shieldsLeft(): number {
    return Math.max(0, this.hp - 1)
  }

  get exposed(): boolean {
    return this.alive && this.shieldsLeft === 0
  }

  get impactRadius(): number {
    const { shieldInnerRadius, shieldSpacing, radius } = BALANCE.container
    const shields = this.shieldsLeft
    if (shields <= 0) return radius
    return shieldInnerRadius + (shields - 1) * shieldSpacing
  }

  get vanished(): boolean {
    return 1 - Ease.inCubic(this.teleport) <= 0.02
  }

  get topY(): number {
    return -BALANCE.container.radius
  }

  reset(): void {
    this.hp = BALANCE.container.maxHp
    this.invulnerability = 0
    this.hitFlash = 0
    this.pulse = 0
    this.generateFlash = 0
    this.teleport = 0
    this.teleporting = false
    this.shieldBreak = 0
  }

  takeDamage(): boolean {
    if (this.invulnerability > 0 || !this.alive) return false
    this.hp -= 1
    this.invulnerability = BALANCE.container.invulnerability
    this.hitFlash = 1
    this.shieldBreak = 1
    return true
  }

  flashGeneration(): void {
    this.generateFlash = 1
  }

  beginTeleport(): void {
    this.teleporting = true
    this.teleport = 0
  }

  update(dt: number): void {
    this.invulnerability = Math.max(0, this.invulnerability - dt)
    this.hitFlash = Math.max(0, this.hitFlash - dt / BALANCE.container.hitFlashTime)
    this.generateFlash = Math.max(0, this.generateFlash - dt * 1.6)
    this.shieldBreak = Math.max(0, this.shieldBreak - dt * 2.6)
    this.pulse += dt * BALANCE.container.pulseSpeed
    if (!this.teleporting) return
    this.teleport += dt / BALANCE.container.teleportTime
    if (this.teleport >= 1) {
      this.teleport = 1
      this.teleporting = false
    }
  }

  render(renderer: IRenderer, field: Field, readout: ContainerReadout): void {
    const radius = BALANCE.container.radius
    const centerX = field.pivotX
    const centerY = field.pivotY

    if (this.teleporting) this.renderBeam(renderer, centerX, centerY, radius)

    const shrink = 1 - Ease.inCubic(this.teleport)
    if (shrink <= 0.02) return

    const accent = this.hitFlash > 0.15 ? PALETTE.hostile : PALETTE.friendly

    renderer.push()
    renderer.translate(centerX, centerY)
    renderer.scale(shrink, shrink)
    renderer.translate(-centerX, -centerY)

    this.renderShields(renderer, field)

    renderer.circle(centerX, centerY, radius * 1.28, {
      fill: accent,
      alpha: 0.05 + this.hitFlash * 0.14 + this.generateFlash * 0.16,
    })
    renderer.circle(centerX, centerY, radius, {
      fill: PALETTE.surface,
      glow: accent,
      glowSize: 12 + this.hitFlash * 24 + this.generateFlash * 26,
    })

    this.renderLiquid(renderer, centerX, centerY, radius, readout)
    this.renderGloss(renderer, centerX, centerY, radius, accent)
    this.renderReadout(renderer, centerX, centerY, radius, readout)

    renderer.pop()
  }

  private renderLiquid(
    renderer: IRenderer,
    centerX: number,
    centerY: number,
    radius: number,
    readout: ContainerReadout,
  ): void {
    const ratio = clamp(readout.energy / Math.max(1, readout.capacity), 0, 1)
    if (ratio <= 0.001) return

    const inner = radius - 3
    const surfaceY = centerY + inner - ratio * inner * 2
    const offset = clamp((surfaceY - centerY) / inner, -1, 1)
    const halfWidth = inner * Math.sqrt(Math.max(0, 1 - offset * offset))

    const left: number[] = []
    const right: number[] = []
    for (let i = 0; i <= LIQUID_SEGMENTS; i++) {
      const t = i / LIQUID_SEGMENTS
      const y = surfaceY + (centerY + inner - surfaceY) * t
      const dy = clamp((y - centerY) / inner, -1, 1)
      const hw = inner * Math.sqrt(Math.max(0, 1 - dy * dy))
      left.push(centerX - hw, y)
      right.unshift(centerX + hw, y)
    }

    renderer.polygon([...left, ...right], { fill: PALETTE.reward, alpha: 0.34 })
    renderer.line(centerX - halfWidth, surfaceY, centerX + halfWidth, surfaceY, 2, {
      stroke: PALETTE.reward,
      glow: PALETTE.reward,
      glowSize: 12,
    })

    for (let i = 0; i < 3; i++) {
      const drift = (this.pulse * 0.4 + i * 0.33) % 1
      const y = centerY + inner - drift * (centerY + inner - surfaceY)
      if (y <= surfaceY + 3) continue
      const dy = clamp((y - centerY) / inner, -1, 1)
      const hw = inner * Math.sqrt(Math.max(0, 1 - dy * dy)) * 0.55
      renderer.circle(centerX - hw + ((i * 31) % Math.max(1, hw * 2)), y, 1.6, {
        fill: PALETTE.reward,
        alpha: (1 - drift) * 0.55,
      })
    }
  }

  private renderGloss(
    renderer: IRenderer,
    centerX: number,
    centerY: number,
    radius: number,
    accent: string,
  ): void {
    renderer.ring(centerX, centerY, radius, 2, { stroke: accent })
    renderer.arc(centerX, centerY, radius - 5, 0, TAU, 1, {
      stroke: PALETTE.grid,
      alpha: 0.4,
    })
  }

  private renderReadout(
    renderer: IRenderer,
    centerX: number,
    centerY: number,
    radius: number,
    readout: ContainerReadout,
  ): void {
    const ratio = clamp(readout.energy / Math.max(1, readout.capacity), 0, 1)
    renderer.text(readout.energy.toFixed(1), centerX, centerY - radius * 0.12, {
      fill: PALETTE.ink,
      size: 40,
      weight: 800,
      align: 'center',
      baseline: 'middle',
    })
    renderer.text(`${Math.floor(ratio * 100)}%`, centerX, centerY + radius * 0.3, {
      fill: ratio >= 0.85 ? PALETTE.reward : PALETTE.inkMuted,
      size: 17,
      weight: 800,
      align: 'center',
      baseline: 'middle',
    })
  }

  private shieldGeometry(index: number): {
    radius: number
    start: number
    end: number
    thickness: number
  } {
    const {
      shieldInnerRadius,
      shieldSpacing,
      shieldThickness,
      shieldThicknessStep,
      shieldOverhang,
      shieldOverhangStep,
    } = BALANCE.container
    const overhang = shieldOverhang + index * shieldOverhangStep
    return {
      radius: shieldInnerRadius + index * shieldSpacing,
      start: -Math.PI - overhang,
      end: overhang,
      thickness: Math.max(1, shieldThickness - index * shieldThicknessStep),
    }
  }

  private renderShields(renderer: IRenderer, field: Field): void {
    const total = BALANCE.container.shields

    for (let i = 0; i < total; i++) {
      const shape = this.shieldGeometry(i)
      const intact = i < this.shieldsLeft

      if (!intact) {
        if (i === this.shieldsLeft && this.shieldBreak > 0) {
          renderer.arc(
            field.pivotX,
            field.pivotY,
            shape.radius,
            shape.start,
            shape.end,
            shape.thickness + 2,
            {
              stroke: PALETTE.hostile,
              alpha: this.shieldBreak * 0.8,
              glow: PALETTE.hostile,
              glowSize: 18 * this.shieldBreak,
            },
          )
        }
        continue
      }

      const depth = 1 - i / total
      renderer.arc(
        field.pivotX,
        field.pivotY,
        shape.radius,
        shape.start,
        shape.end,
        shape.thickness,
        {
          stroke: PALETTE.friendly,
          alpha: 0.2 + depth * 0.32,
          glow: PALETTE.friendly,
          glowSize: 3 + depth * 6,
        },
      )

      const capRadius = shape.thickness * 0.9
      for (const angle of [shape.start, shape.end]) {
        renderer.circle(
          field.pivotX + Math.cos(angle) * shape.radius,
          field.pivotY + Math.sin(angle) * shape.radius,
          capRadius,
          { fill: PALETTE.friendly, alpha: 0.3 + depth * 0.35 },
        )
      }
    }
  }

  private renderBeam(
    renderer: IRenderer,
    centerX: number,
    centerY: number,
    radius: number,
  ): void {
    const progress = this.teleport
    const wave = Math.sin(progress * Math.PI)
    const beamWidth = radius * 2 * (0.42 + progress * 0.28)

    renderer.rect(centerX - beamWidth / 2, centerY - 1400, beamWidth, 1500, {
      fill: PALETTE.friendly,
      alpha: wave * 0.22,
    })
    renderer.rect(centerX - beamWidth / 6, centerY - 1400, beamWidth / 3, 1500, {
      fill: PALETTE.ink,
      alpha: wave * 0.45,
    })

    for (let i = 0; i < 3; i++) {
      const ring = clamp(progress * 1.7 - i * 0.16, 0, 1)
      if (ring <= 0 || ring >= 1) continue
      renderer.ring(centerX, centerY, 24 + ring * 170, 3 * (1 - ring), {
        stroke: PALETTE.friendly,
        alpha: (1 - ring) * 0.7,
        glow: PALETTE.friendly,
        glowSize: 16,
      })
    }

    for (let i = 0; i < 5; i++) {
      const glint = (progress * 2.4 + i * 0.2) % 1
      const y = centerY + radius - glint * radius * 2.2
      const length = 40 + Math.sin(glint * Math.PI) * 170
      renderer.line(centerX - length / 2, y, centerX + length / 2, y, 2, {
        stroke: PALETTE.ink,
        alpha: Math.sin(glint * Math.PI) * wave * 0.75,
        glow: PALETTE.friendly,
        glowSize: 14,
      })
    }
  }
}
