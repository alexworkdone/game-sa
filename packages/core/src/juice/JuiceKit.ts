import type { IUpdatable } from '../types.js'
import type { IRenderer } from '../render/IRenderer.js'
import { ScreenShake } from './ScreenShake.js'
import type { ScreenShakeOptions } from './ScreenShake.js'
import { HitStop } from './HitStop.js'
import { ParticleSystem } from './ParticleSystem.js'
import { TweenManager } from './TweenManager.js'
import { FloatingTextSystem } from './FloatingTextSystem.js'

export interface JuiceKitOptions {
  readonly shake?: ScreenShakeOptions
  readonly particleCapacity?: number
  readonly floatingTextCapacity?: number
}

export class JuiceKit implements IUpdatable {
  readonly shake: ScreenShake
  readonly hitStop = new HitStop()
  readonly particles: ParticleSystem
  readonly tweens = new TweenManager()
  readonly texts: FloatingTextSystem

  constructor(options: JuiceKitOptions = {}) {
    this.shake = new ScreenShake(options.shake ?? {})
    this.particles = new ParticleSystem(options.particleCapacity ?? 512)
    this.texts = new FloatingTextSystem(options.floatingTextCapacity ?? 32)
  }

  update(dt: number): void {
    this.shake.update(dt)
    this.particles.update(dt)
    this.tweens.update(dt)
    this.texts.update(dt)
  }

  renderEffects(renderer: IRenderer): void {
    this.particles.render(renderer)
    this.texts.render(renderer)
  }

  clear(): void {
    this.shake.reset()
    this.hitStop.reset()
    this.particles.clear()
    this.tweens.clear()
    this.texts.clear()
  }
}
