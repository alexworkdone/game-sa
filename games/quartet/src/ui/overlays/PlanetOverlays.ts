import type { Planet } from '../../forge/Planet.js'
import type { AddResult } from '../../forge/Galaxy.js'
import { UK } from '../../i18n/uk.js'
import { button, cssColor, particleDot, planetView } from '../components.js'
import { cx, h } from '../dom.js'
import type { UiKit } from '../UiKit.js'

const tags = (planet: Planet): HTMLElement =>
  h(
    'div',
    { class: 'planet-tags' },
    h('span', { class: 'planet-tags__type' }, UK.planetTypes[planet.type].name),
    h('span', { class: cx('rarity-tag', `rarity-tag--${planet.rarity}`) }, UK.rarity[planet.rarity]),
  )

export type RevealChoice = 'galaxy' | 'again' | 'close'

export const showPlanetReveal = (kit: UiKit, planet: Planet, result: AddResult, canAgain: boolean): Promise<RevealChoice> =>
  new Promise((resolve) => {
    let choice: RevealChoice = 'close'
    const choose = (value: RevealChoice): void => {
      choice = value
      kit.feedback('tap', 'tap')
      void handle.close()
    }
    const badge = result.newType ? UK.forge.newType : result.newRarity ? UK.forge.newRarity : null
    const content = h(
      'div',
      { class: cx('reveal', `reveal--${planet.rarity}`) },
      h('div', { class: 'reveal__rays' }),
      badge ? h('div', { class: 'reveal__badge' }, badge) : null,
      planetView(kit.services.painter, planet, { className: 'reveal__planet' }),
      h('h2', { class: 'reveal__name' }, planet.name),
      tags(planet),
      h('p', { class: 'reveal__lore' }, UK.planetTypes[planet.type].lore),
      h(
        'div',
        { class: 'reveal__actions' },
        button({ label: UK.forge.toGalaxy, variant: 'secondary', icon: 'galaxy', onClick: () => choose('galaxy') }),
        button({
          label: canAgain ? UK.forge.again : UK.forge.great,
          variant: 'primary',
          icon: canAgain ? 'forge' : 'check',
          onClick: () => choose(canAgain ? 'again' : 'close'),
        }),
      ),
    )
    const handle = kit.overlays.show(content, { variant: 'full', dismissible: false, className: 'overlay--reveal' })
    handle.onClose.on(() => resolve(choice))

    const colors = planet.rarity === 'legendary'
      ? [cssColor('gold'), '#ffffff', cssColor('yellow'), cssColor('purple')]
      : [cssColor(`rarity-${planet.rarity}`), '#ffffff']
    const center = { x: window.innerWidth / 2, y: window.innerHeight * 0.38 }
    window.setTimeout(() => {
      kit.feedback('reveal', planet.rarity === 'legendary' || planet.rarity === 'epic' ? 'heavy' : 'success')
      kit.fx.burst(center, colors, planet.rarity === 'common' ? 30 : 60, planet.rarity === 'legendary' ? 1.6 : 1.1)
      if (planet.rarity === 'legendary' || result.newType) kit.fx.confetti(colors, planet.rarity === 'legendary' ? 160 : 90)
    }, 120)
  })

export const showPlanetDetails = (kit: UiKit, planet: Planet): void => {
  const created = new Date(planet.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  const content = h(
    'div',
    { class: cx('planet-card', `planet-card--${planet.rarity}`) },
    planetView(kit.services.painter, planet, { className: 'planet-card__planet' }),
    h('h2', { class: 'planet-card__name' }, planet.name),
    tags(planet),
    h('p', { class: 'planet-card__lore' }, UK.planetTypes[planet.type].lore),
    h(
      'dl',
      { class: 'planet-card__facts' },
      h('div', null, h('dt', null, UK.forge.madeOf), h('dd', { class: 'planet-card__portions' }, planet.portions.map((color) => particleDot(color)))),
      h('div', null, h('dt', null, UK.galaxy.created), h('dd', null, created)),
    ),
    button({ label: UK.common.close, variant: 'secondary', onClick: () => void handle.close() }),
  )
  const handle = kit.overlays.show(content, { variant: 'sheet' })
}
