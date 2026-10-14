import { cx, formatNumber, h } from './dom.js'
import type { Child } from './dom.js'
import { icon } from './icons.js'
import type { IconName } from './icons.js'

export const iconEl = (name: IconName, className?: string): HTMLElement =>
  h('span', { class: cx('icon-wrap', className), html: icon(name) })

export const cost = (amount: number): HTMLElement => h('span', { class: 'cost' }, formatNumber(amount), iconEl('drop'))

export const nowrap = (text: string): HTMLElement => h('span', { class: 'nw' }, text)

export const card = (className: string | null, ...children: Child[]): HTMLElement =>
  h('div', { class: cx('card', className) }, ...children)

export const button = (
  label: Child,
  onClick: () => void,
  variant: 'ink' | 'line' | 'ghost' = 'ink',
  options: { readonly small?: boolean; readonly disabled?: boolean; readonly className?: string } = {},
): HTMLButtonElement =>
  h(
    'button',
    {
      type: 'button',
      class: cx('btn', `btn--${variant}`, options.small && 'btn--sm', options.className),
      disabled: options.disabled === true,
      on: { click: onClick },
    },
    label,
  )

export interface ChipOptions {
  readonly pressed: boolean
  readonly locked?: string | null
  readonly onLocked?: (label: string) => void
}

export const chip = (label: string, onPress: () => void, options: ChipOptions): HTMLButtonElement => {
  const locked = options.locked ?? null
  return h(
    'button',
    {
      type: 'button',
      class: cx('chip', locked !== null && 'chip--locked'),
      'aria-pressed': String(options.pressed),
      title: locked ?? undefined,
      on: { click: () => (locked !== null ? options.onLocked?.(locked) : onPress()) },
    },
    locked !== null ? iconEl('lock') : null,
    label,
  )
}

export const progressBar = (percent: number, label: string): HTMLElement =>
  h(
    'div',
    {
      class: 'meter',
      role: 'progressbar',
      'aria-label': label,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(percent),
    },
    h('i', { style: `width:${percent}%` }),
  )

export const emptyNote = (text: string): HTMLElement => h('div', { class: 'empty' }, text)
