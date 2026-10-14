import { cx, h, wait } from './dom.js'

export type ToastVariant = 'info' | 'warn' | 'success'

export class Toaster {
  readonly element: HTMLElement

  private current: HTMLElement | null = null

  constructor() {
    this.element = h('div', { class: 'toasts', 'aria-live': 'polite' })
  }

  show(text: string, variant: ToastVariant = 'info', duration = 1800): void {
    this.current?.remove()
    const toast = h('div', { class: cx('toast', `toast--${variant}`) }, text)
    this.current = toast
    this.element.appendChild(toast)
    void wait(duration).then(async () => {
      toast.classList.add('toast--leaving')
      await wait(240)
      toast.remove()
      if (this.current === toast) this.current = null
    })
  }
}
