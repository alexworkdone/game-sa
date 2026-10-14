import { UK } from '../../i18n/uk.js'
import { countOf } from '../../i18n/plural.js'
import type { Bundle } from '../../meta/PlayResolver.js'
import type { IconName } from '../../render/icons.js'
import { PARTICLE_COLORS } from '../../shared/ParticleColor.js'
import { button, iconSpan, particleChip } from '../components.js'
import { h } from '../dom.js'
import type { UiKit } from '../UiKit.js'

export interface BundleOverlayOptions {
  readonly title: string
  readonly subtitle?: string
  readonly icon: IconName
  readonly bundle: Bundle
}

export const showBundle = (kit: UiKit, options: BundleOverlayOptions): Promise<void> =>
  new Promise((resolve) => {
    kit.feedback('reveal', 'success')
    const content = h(
      'div',
      { class: 'bundle' },
      h('div', { class: 'bundle__rays' }),
      iconSpan(options.icon, 'bundle__icon'),
      h('h2', { class: 'bundle__title' }, options.title),
      options.subtitle ? h('p', { class: 'bundle__subtitle' }, options.subtitle) : null,
      h(
        'div',
        { class: 'bundle__items' },
        PARTICLE_COLORS.filter((color) => options.bundle.particles[color] > 0).map((color) =>
          particleChip(color, options.bundle.particles[color], 'particle-chip--lg'),
        ),
        options.bundle.hints > 0
          ? h('span', { class: 'bundle__hints' }, iconSpan('bulb'), countOf(options.bundle.hints, UK.forms.hints))
          : null,
      ),
      button({
        label: UK.rewards.take,
        variant: 'primary',
        size: 'lg',
        onClick: () => {
          kit.feedback('coin', 'tap')
          void handle.close()
        },
      }),
    )
    const handle = kit.overlays.show(content, { className: 'overlay--bundle' })
    handle.onClose.on(() => resolve())
  })
