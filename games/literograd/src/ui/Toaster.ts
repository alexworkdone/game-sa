import { h, wait } from './dom.js'

const LEAVE_MS = 240

export class Toaster {
  readonly element: HTMLElement

  private current: HTMLElement | null = null

  constructor() {
    this.element = h('div', { class: 'toasts', 'aria-live': 'polite', role: 'status' })
  }

  show(text: string, duration = 2600): void {
    this.current?.remove()
    const toast = h('div', { class: 'toast' }, text)
    this.current = toast
    this.element.appendChild(toast)
    void wait(duration).then(async () => {
      toast.classList.add('toast--leaving')
      await wait(LEAVE_MS)
      toast.remove()
      if (this.current === toast) this.current = null
    })
  }
}
