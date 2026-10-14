import { button } from '../components.js'
import type { ButtonVariant } from '../components.js'
import { h } from '../dom.js'
import type { IconName } from '../../render/icons.js'
import { iconSpan } from '../components.js'
import type { UiKit } from '../UiKit.js'

export interface ConfirmOptions {
  readonly title: string
  readonly text: string
  readonly confirm: string
  readonly cancel: string
  readonly icon?: IconName
  readonly confirmVariant?: ButtonVariant
  readonly confirmIcon?: IconName
  readonly dismissible?: boolean
}

export const confirmDialog = (kit: UiKit, options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    let answered = false
    const answer = (value: boolean): void => {
      if (answered) return
      answered = true
      kit.feedback('tap', 'tap')
      resolve(value)
      void handle.close()
    }
    const content = h(
      'div',
      { class: 'dialog' },
      options.icon ? iconSpan(options.icon, 'dialog__icon') : null,
      h('h2', { class: 'dialog__title' }, options.title),
      h('p', { class: 'dialog__text' }, options.text),
      h(
        'div',
        { class: 'dialog__actions' },
        button({
          label: options.confirm,
          variant: options.confirmVariant ?? 'primary',
          size: 'lg',
          ...(options.confirmIcon ? { icon: options.confirmIcon } : {}),
          onClick: () => answer(true),
        }),
        button({ label: options.cancel, variant: 'ghost', onClick: () => answer(false) }),
      ),
    )
    const handle = kit.overlays.show(content, { dismissible: options.dismissible ?? true })
    handle.onClose.on(() => {
      if (!answered) {
        answered = true
        resolve(false)
      }
    })
  })
