import type { IReadonlySignal, Unsubscribe } from '@sa/core'
import { clear, h } from './dom.js'
import type { UiKit } from './UiKit.js'

export interface IScreen<P = void> {
  readonly element: HTMLElement
  enter(params: P): void
  leave(): void
}

export abstract class Screen<P = void> implements IScreen<P> {
  readonly element: HTMLElement

  protected readonly kit: UiKit
  protected params!: P

  private subscriptions: Unsubscribe[] = []

  constructor(kit: UiKit, className: string) {
    this.kit = kit
    this.element = h('section', { class: `screen ${className}` })
  }

  enter(params: P): void {
    this.params = params
    this.refresh()
    this.bind()
  }

  leave(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe()
    this.subscriptions = []
  }

  protected refresh(): void {
    clear(this.element)
    this.render()
  }

  protected abstract render(): void

  protected bind(): void {}

  protected listen<T>(signal: IReadonlySignal<T>, listener: (payload: T) => void): void {
    this.subscriptions.push(signal.on(listener))
  }

  protected cleanup(callback: () => void): void {
    this.subscriptions.push(callback)
  }
}
