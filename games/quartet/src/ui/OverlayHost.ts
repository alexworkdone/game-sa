import { Signal } from '@sa/core'
import { cx, h, wait } from './dom.js'

export type OverlayVariant = 'center' | 'sheet' | 'full'

export interface OverlayOptions {
  readonly variant?: OverlayVariant
  readonly dismissible?: boolean
  readonly className?: string
}

export interface OverlayHandle {
  readonly element: HTMLElement
  readonly onClose: Signal<void>
  close(): Promise<void>
}

const LEAVE_MS = 260

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
    const variant = options.variant ?? 'center'
    const panel = h('div', { class: cx('overlay__panel', `overlay__panel--${variant}`) }, content)
    const root = h(
      'div',
      { class: cx('overlay', `overlay--${variant}`, options.className), role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'overlay__backdrop' }),
      panel,
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
    this.top()?.element.dispatchEvent(new CustomEvent('overlay:dismiss'))
  }

  closeAll(): void {
    for (const handle of [...this.stack]) void handle.close()
  }

  private top(): OverlayHandle | undefined {
    return this.stack[this.stack.length - 1]
  }
}
