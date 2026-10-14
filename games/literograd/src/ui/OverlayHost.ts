import { Signal } from '@sa/core'
import { cx, h, wait } from './dom.js'

export interface OverlayOptions {
  readonly dismissible?: boolean
  readonly className?: string
  readonly labelledBy?: string
}

export interface OverlayHandle {
  readonly element: HTMLElement
  readonly onClose: Signal<void>
  close(): Promise<void>
}

const LEAVE_MS = 220

export class OverlayHost {
  readonly element: HTMLElement

  private readonly stack: OverlayHandle[] = []

  constructor() {
    this.element = h('div', { class: 'overlays' })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.dismissTop()
    })
  }

  get open(): boolean {
    return this.stack.length > 0
  }

  show(content: HTMLElement, options: OverlayOptions = {}): OverlayHandle {
    const root = h(
      'div',
      {
        class: cx('overlay', options.className),
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': options.labelledBy,
      },
      h('div', { class: 'overlay__backdrop' }),
      h('div', { class: 'overlay__panel' }, content),
    )
    const onClose = new Signal<void>()
    let closing = false
    const handle: OverlayHandle = {
      element: root,
      onClose,
      close: async () => {
        if (closing) return
        closing = true
        root.classList.add('overlay--leaving')
        await wait(LEAVE_MS)
        root.remove()
        const index = this.stack.indexOf(handle)
        if (index >= 0) this.stack.splice(index, 1)
        onClose.emit()
        onClose.dispose()
      },
    }
    if (options.dismissible ?? true) {
      root.firstElementChild?.addEventListener('click', () => void handle.close())
      root.addEventListener('overlay:dismiss', () => void handle.close())
    }
    this.stack.push(handle)
    this.element.appendChild(root)
    return handle
  }

  dismissTop(): void {
    this.stack[this.stack.length - 1]?.element.dispatchEvent(new CustomEvent('overlay:dismiss'))
  }
}
