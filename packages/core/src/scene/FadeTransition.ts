import type { IRenderer } from '../render/IRenderer.js'
import type { ISceneTransition } from './IScene.js'

export class FadeTransition implements ISceneTransition {
  readonly duration: number
  private readonly color: string

  constructor(duration = 0.32, color = '#000000') {
    this.duration = duration
    this.color = color
  }

  render(renderer: IRenderer, progress: number, phase: 'out' | 'in'): void {
    const alpha = phase === 'out' ? progress : 1 - progress
    if (alpha <= 0.001) return
    renderer.rect(-renderer.width, -renderer.height, renderer.width * 3, renderer.height * 3, {
      fill: this.color,
      alpha,
    })
  }
}
