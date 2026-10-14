import type { ParticleColor } from '../shared/ParticleColor.js'
import type { IPlanetPainter, PaintOptions, PlanetLike } from '../render/IPlanetPainter.js'
import type { IconName } from '../render/icons.js'
import { icon } from '../render/icons.js'
import { cx, formatNumber, h } from './dom.js'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonOptions {
  readonly label?: string
  readonly icon?: IconName
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly disabled?: boolean
  readonly className?: string
  readonly ariaLabel?: string
  readonly badge?: string | number | null
  readonly onClick?: (event: Event) => void
}

export const button = (options: ButtonOptions): HTMLButtonElement =>
  h(
    'button',
    {
      type: 'button',
      class: cx(
        'btn',
        `btn--${options.variant ?? 'secondary'}`,
        `btn--${options.size ?? 'md'}`,
        !options.label && 'btn--icon',
        options.className,
      ),
      disabled: options.disabled ?? false,
      'aria-label': options.ariaLabel ?? options.label,
      on: options.onClick ? { click: options.onClick } : undefined,
    },
    options.icon ? h('span', { class: 'btn__icon', html: icon(options.icon) }) : null,
    options.label ? h('span', { class: 'btn__label' }, options.label) : null,
    options.badge !== undefined && options.badge !== null && options.badge !== ''
      ? h('span', { class: 'badge' }, String(options.badge))
      : null,
  )

export const particleDot = (color: ParticleColor, className?: string): HTMLElement =>
  h('span', { class: cx('particle', `particle--${color}`, className) })

export const particleChip = (color: ParticleColor, amount: number, className?: string): HTMLElement =>
  h(
    'span',
    { class: cx('particle-chip', className) },
    particleDot(color),
    h('span', { class: 'particle-chip__value' }, formatNumber(amount)),
  )

export const progressBar = (value: number, className?: string): HTMLElement =>
  h(
    'div',
    { class: cx('progress', className), role: 'progressbar', 'aria-valuenow': Math.round(value * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 },
    h('div', { class: 'progress__fill', style: `width:${(Math.max(0, Math.min(1, value)) * 100).toFixed(1)}%` }),
  )

export const starRow = (stars: number, max = 3, className?: string): HTMLElement =>
  h(
    'div',
    { class: cx('stars', className), 'aria-label': `${stars}/${max}` },
    Array.from({ length: max }, (_, index) =>
      h('span', { class: cx('stars__item', index < stars && 'stars__item--on'), html: icon('star') }),
    ),
  )

export const planetView = (
  painter: IPlanetPainter,
  planet: PlanetLike | null,
  options: PaintOptions & { readonly className?: string } = {},
): HTMLElement => {
  const markup = planet
    ? painter.paint(planet, options)
    : painter.paint({ seed: 0, type: 'desert', rarity: 'common' }, { silhouette: true })
  return h('div', { class: cx('planet-view', options.className), html: markup })
}

export const iconSpan = (name: IconName, className?: string): HTMLElement =>
  h('span', { class: cx('icon-wrap', className), html: icon(name) })

export const cssColor = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || '#ffffff'

export const particleHex = (color: ParticleColor): string => cssColor(color)

export const centerOf = (element: Element): { x: number; y: number } => {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
