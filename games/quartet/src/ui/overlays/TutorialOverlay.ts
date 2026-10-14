import { UK } from '../../i18n/uk.js'
import { PARTICLE_COLORS } from '../../shared/ParticleColor.js'
import { button, particleDot, planetView } from '../components.js'
import { cx, h } from '../dom.js'
import type { UiKit } from '../UiKit.js'

const illustration = (kit: UiKit, step: number): HTMLElement => {
  if (step === 0) {
    const colors = ['yellow', 'green', 'blue', 'purple', 'green', 'purple', 'yellow', 'blue', 'blue', 'yellow', 'purple', 'green', 'purple', 'blue', 'green', 'yellow']
    return h(
      'div',
      { class: 'tutorial__grid' },
      colors.map((color, index) => h('span', { class: cx('tutorial__cell', `tutorial__cell--${color}`), style: `--i:${index}` })),
    )
  }
  if (step === 1) {
    return h(
      'div',
      { class: 'tutorial__pick' },
      h('div', { class: 'tutorial__row' }, [0, 1, 2, 3].map((index) => h('span', { class: 'tutorial__tile tutorial__tile--on', style: `--i:${index}` }))),
      h('div', { class: 'tutorial__bar' }),
    )
  }
  return h(
    'div',
    { class: 'tutorial__forge' },
    h('div', { class: 'tutorial__orbs' }, PARTICLE_COLORS.map((color) => particleDot(color))),
    planetView(kit.services.painter, { seed: 42, type: 'pearl', rarity: 'epic' }, { className: 'tutorial__planet' }),
  )
}

export const showTutorial = (kit: UiKit): Promise<void> =>
  new Promise((resolve) => {
    let step = 0
    const body = h('div', { class: 'tutorial' })
    const render = (): void => {
      const slide = UK.tutorial[step]
      if (!slide) return
      const last = step === UK.tutorial.length - 1
      body.replaceChildren(
        h('div', { class: 'tutorial__art' }, illustration(kit, step)),
        h('h2', { class: 'tutorial__title' }, slide.title),
        h('p', { class: 'tutorial__text' }, slide.text),
        h('div', { class: 'tutorial__dots' }, UK.tutorial.map((_, index) => h('span', { class: cx('tutorial__dot', index === step && 'tutorial__dot--on') }))),
        button({
          label: last ? UK.tutorialStart : UK.tutorialNext,
          variant: 'primary',
          size: 'lg',
          icon: last ? 'play' : 'arrow',
          onClick: () => {
            kit.feedback('tap', 'tap')
            if (last) void handle.close()
            else {
              step++
              render()
            }
          },
        }),
      )
    }
    render()
    const handle = kit.overlays.show(body, { dismissible: false, className: 'overlay--tutorial' })
    handle.onClose.on(() => resolve())
  })
