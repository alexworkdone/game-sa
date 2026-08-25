import type { IRenderer } from '@sa/core'
import { Turret } from '../entities/Turret.js'
import type { Arena } from '../entities/Arena.js'
import type { WaveSpec } from './WaveGenerator.js'

export interface TurretFieldListener {
  onTelegraph(turret: Turret): void
  onFire(turret: Turret): void
}

export class TurretField {
  private readonly turrets: Turret[] = []
  private listener: TurretFieldListener | null = null

  bulletSpeed = 0

  setListener(listener: TurretFieldListener): void {
    this.listener = listener
  }

  get items(): readonly Turret[] {
    return this.turrets
  }

  get aliveCount(): number {
    let count = 0
    for (const turret of this.turrets) if (turret.alive) count++
    return count
  }

  deploy(spec: WaveSpec, arena: Arena): void {
    this.bulletSpeed = spec.bulletSpeed
    this.turrets.length = 0
    for (const turretSpec of spec.turrets) {
      const turret = new Turret()
      turret.place(turretSpec.angle, arena, turretSpec.firstDelay, turretSpec.cooldown)
      turret.burstsLeft = turretSpec.burstSize
      this.turrets.push(turret)
    }
  }

  syncPositions(arena: Arena): void {
    for (const turret of this.turrets) turret.syncPosition(arena)
  }

  update(dt: number): void {
    for (const turret of this.turrets) {
      const phase = turret.update(dt)
      if (phase === 'telegraph') this.listener?.onTelegraph(turret)
      else if (phase === 'fired') this.listener?.onFire(turret)
    }
  }

  clear(): void {
    this.turrets.length = 0
  }

  render(renderer: IRenderer, arena: Arena): void {
    for (const turret of this.turrets) turret.render(renderer, arena)
  }
}
