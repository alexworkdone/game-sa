import type { IUpdatable } from '../types.js'
import { Ease } from '../math/index.js'
import type { Easing } from '../math/index.js'

export interface TweenOptions {
  readonly easing?: Easing
  readonly delay?: number
  readonly onComplete?: () => void
}

export interface TweenHandle {
  cancel(): void
  readonly done: boolean
}

interface Tween {
  target: Record<string, number>
  keys: string[]
  from: number[]
  to: number[]
  duration: number
  elapsed: number
  delay: number
  easing: Easing
  onComplete: (() => void) | undefined
  onUpdate: ((value: number) => void) | undefined
  cancelled: boolean
  done: boolean
}

export class TweenManager implements IUpdatable {
  private readonly tweens: Tween[] = []

  private push(tween: Tween): TweenHandle {
    this.tweens.push(tween)
    return {
      cancel: () => {
        tween.cancelled = true
      },
      get done() {
        return tween.done
      },
    }
  }

  to<T extends object>(
    target: T,
    props: Partial<Record<Extract<keyof T, string>, number>>,
    duration: number,
    options: TweenOptions = {},
  ): TweenHandle {
    const record = target as unknown as Record<string, number>
    const keys = Object.keys(props)
    return this.push({
      target: record,
      keys,
      from: keys.map((key) => record[key] ?? 0),
      to: keys.map((key) => (props as Record<string, number>)[key] ?? 0),
      duration: Math.max(0.0001, duration),
      elapsed: 0,
      delay: options.delay ?? 0,
      easing: options.easing ?? Ease.outCubic,
      onComplete: options.onComplete,
      onUpdate: undefined,
      cancelled: false,
      done: false,
    })
  }

  value(
    from: number,
    to: number,
    duration: number,
    onUpdate: (value: number) => void,
    options: TweenOptions = {},
  ): TweenHandle {
    return this.push({
      target: {},
      keys: [],
      from: [from],
      to: [to],
      duration: Math.max(0.0001, duration),
      elapsed: 0,
      delay: options.delay ?? 0,
      easing: options.easing ?? Ease.outCubic,
      onComplete: options.onComplete,
      onUpdate,
      cancelled: false,
      done: false,
    })
  }

  update(dt: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tween = this.tweens[i] as Tween
      if (tween.cancelled) {
        this.tweens.splice(i, 1)
        continue
      }
      if (tween.delay > 0) {
        tween.delay -= dt
        continue
      }
      tween.elapsed = Math.min(tween.duration, tween.elapsed + dt)
      const progress = tween.easing(tween.elapsed / tween.duration)

      if (tween.onUpdate) {
        const from = tween.from[0] ?? 0
        const to = tween.to[0] ?? 0
        tween.onUpdate(from + (to - from) * progress)
      } else {
        for (let k = 0; k < tween.keys.length; k++) {
          const key = tween.keys[k] as string
          const from = tween.from[k] ?? 0
          const to = tween.to[k] ?? 0
          tween.target[key] = from + (to - from) * progress
        }
      }

      if (tween.elapsed >= tween.duration) {
        tween.done = true
        tween.onComplete?.()
        this.tweens.splice(i, 1)
      }
    }
  }

  get count(): number {
    return this.tweens.length
  }

  clear(): void {
    this.tweens.length = 0
  }
}
