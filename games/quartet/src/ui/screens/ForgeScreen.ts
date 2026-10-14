import { PLANET_TYPES, RARITIES } from '../../forge/Planet.js'
import { PORTION_SIZE, PORTIONS_PER_PLANET } from '../../forge/PlanetForge.js'
import { UK } from '../../i18n/uk.js'
import { PARTICLE_COLORS } from '../../shared/ParticleColor.js'
import type { ParticleColor } from '../../shared/ParticleColor.js'
import { button, centerOf, particleDot, particleHex, planetView } from '../components.js'
import { append, cx, formatNumber, h, wait } from '../dom.js'
import { showPlanetReveal } from '../overlays/PlanetOverlays.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

const SLOT_POSITIONS = ['top', 'right', 'bottom', 'left'] as const

export class ForgeScreen extends Screen {
  private charging = false

  constructor(kit: UiKit) {
    super(kit, 'forge')
  }

  protected override bind(): void {
    const { forge, wallet, galaxy } = this.kit.services
    for (const signal of [forge.onChange, wallet.onChange, galaxy.onChange]) {
      this.listen(signal, () => {
        if (!this.charging) this.refresh()
      })
    }
  }

  protected render(): void {
    const { forge, galaxy, wallet } = this.kit.services
    const portions = forge.portions
    const prediction = forge.prediction
    const empty = PARTICLE_COLORS.every((color) => wallet.amount(color) < PORTION_SIZE) && portions.length === 0

    append(this.element,
      h(
        'header',
        { class: 'screen__header' },
        h('h1', { class: 'screen__title' }, UK.forge.title),
        button({ icon: 'info', variant: 'ghost', ariaLabel: UK.forge.infoTitle, onClick: () => this.showRules() }),
      ),
      h('p', { class: 'forge__intro' }, UK.forge.intro),
      h(
        'div',
        { class: cx('reactor', forge.full && 'reactor--full', this.charging && 'reactor--charging') },
        h('div', { class: 'reactor__ring' }),
        h('div', { class: 'reactor__ring reactor__ring--inner' }),
        h('div', { class: 'reactor__core' }, this.corePreview()),
        SLOT_POSITIONS.map((position, index) => {
          const color = portions[index]
          return h(
            'button',
            {
              type: 'button',
              class: cx('reactor__slot', `reactor__slot--${position}`, color && 'reactor__slot--filled'),
              'aria-label': color ? UK.particles[color] : UK.forge.add,
              disabled: !color || this.charging,
              on: {
                click: () => {
                  this.kit.feedback('deselect', 'tap')
                  forge.removeAt(index)
                },
              },
            },
            color ? particleDot(color, 'particle--xl') : h('span', { class: 'reactor__plus' }, '+'),
          )
        }),
      ),
      h(
        'div',
        { class: 'vials' },
        PARTICLE_COLORS.map((color) => this.vial(color)),
      ),
      empty ? h('p', { class: 'forge__empty' }, UK.forge.empty) : null,
      h(
        'div',
        { class: 'forge__actions' },
        button({
          label: UK.forge.clear,
          variant: 'secondary',
          size: 'lg',
          disabled: portions.length === 0 || this.charging,
          onClick: () => {
            this.kit.feedback('deselect', 'tap')
            forge.clear()
          },
        }),
        button({
          label: UK.forge.create,
          icon: 'forge',
          variant: 'primary',
          size: 'lg',
          disabled: !forge.full || this.charging,
          className: 'forge__create',
          onClick: () => void this.create(),
        }),
      ),
      h(
        'div',
        { class: 'forge__prediction' },
        h('span', { class: 'forge__label' }, UK.forge.prediction),
        h(
          'strong',
          { class: 'forge__type' },
          prediction ? (galaxy.discovered(prediction) ? UK.planetTypes[prediction].name : `${UK.forge.unknown} ✦`) : UK.forge.needMore,
        ),
        this.odds(),
        h('span', { class: 'forge__pity' }, galaxy.pityReady ? UK.forge.pityReady : UK.forge.pity(galaxy.untilPity)),
      ),
    )
  }

  private corePreview(): HTMLElement {
    const { forge, galaxy, painter } = this.kit.services
    const prediction = forge.prediction
    if (!prediction) {
      return h('span', { class: 'reactor__count' }, `${forge.portions.length}/${PORTIONS_PER_PLANET}`)
    }
    if (!galaxy.discovered(prediction)) return planetView(painter, null, { className: 'reactor__planet' })
    return planetView(painter, { seed: 11, type: prediction, rarity: 'common' }, { className: 'reactor__planet reactor__planet--ghost' })
  }

  private odds(): HTMLElement {
    const weights = this.kit.services.forge.weights
    const total = RARITIES.reduce((sum, rarity) => sum + weights[rarity], 0) || 1
    return h(
      'div',
      { class: 'odds' },
      h(
        'div',
        { class: 'odds__bar' },
        RARITIES.filter((rarity) => weights[rarity] > 0).map((rarity) =>
          h('span', { class: `odds__segment odds__segment--${rarity}`, style: `flex-grow:${weights[rarity]}` }),
        ),
      ),
      h(
        'ul',
        { class: 'odds__legend' },
        RARITIES.map((rarity) =>
          h(
            'li',
            { class: `odds__item odds__item--${rarity}` },
            h('span', { class: 'odds__name' }, UK.rarity[rarity]),
            h('span', { class: 'odds__value' }, `${formatNumber(Math.round((weights[rarity] / total) * 1000) / 10)}%`),
          ),
        ),
      ),
    )
  }

  private vial(color: ParticleColor): HTMLElement {
    const { forge } = this.kit.services
    const available = forge.available(color)
    const enabled = forge.canAdd(color) && !this.charging
    return h(
      'button',
      {
        type: 'button',
        class: cx('vial', `vial--${color}`),
        disabled: !enabled,
        'aria-label': `${UK.forge.add}: ${UK.particles[color]}`,
        on: { click: (event) => this.addPortion(color, event) },
      },
      h('span', { class: 'vial__glass' }, h('span', { class: 'vial__fill', style: `--level:${Math.min(1, available / (PORTION_SIZE * 4)).toFixed(2)}` }), particleDot(color, 'particle--lg')),
      h('span', { class: 'vial__amount' }, formatNumber(Math.max(0, available))),
      h('span', { class: 'vial__name' }, UK.particlesShort[color]),
      h('span', { class: 'vial__cost' }, `+${PORTION_SIZE}`),
    )
  }

  private addPortion(color: ParticleColor, event: Event): void {
    const { forge } = this.kit.services
    const origin = event.currentTarget instanceof HTMLElement ? centerOf(event.currentTarget) : null
    const index = forge.portions.length
    if (!forge.add(color)) return
    this.kit.feedback('portion', 'select', 1 + index * 0.1)
    const slot = this.element.querySelector(`.reactor__slot--${SLOT_POSITIONS[index] ?? 'top'}`)
    if (origin && slot) this.kit.fx.fly(origin, centerOf(slot), particleHex(color), 8)
  }

  private async create(): Promise<void> {
    const { forge, analytics } = this.kit.services
    if (!forge.full || this.charging) return
    this.charging = true
    this.refresh()
    const reactor = this.element.querySelector('.reactor')
    const center = reactor ? centerOf(reactor) : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const colors = forge.portions.map((color) => particleHex(color))
    this.kit.feedback('charge', 'heavy')
    await wait(1300)
    this.kit.fx.burst(center, [...colors, '#ffffff'], 70, 1.5)
    this.kit.feedback('whoosh', null)
    const creation = forge.create()
    this.charging = false
    this.refresh()
    if (!creation) return
    analytics.track('planet_created', {
      type: creation.planet.type,
      rarity: creation.planet.rarity,
      total: this.kit.services.galaxy.count,
    })
    const choice = await showPlanetReveal(this.kit, creation.planet, creation.result, forge.affordablePlanets() > 0)
    if (choice === 'galaxy') this.kit.nav.go({ name: 'galaxy' })
  }

  private showRules(): void {
    const { galaxy, painter } = this.kit.services
    const content = h(
      'div',
      { class: 'rules' },
      h('h2', { class: 'dialog__title' }, UK.forge.infoTitle),
      h('p', { class: 'dialog__text' }, UK.forge.rule),
      h(
        'ul',
        { class: 'rules__list' },
        PLANET_TYPES.filter((type) => !type.secret).map((type) => {
          const known = galaxy.discovered(type.id)
          return h(
            'li',
            { class: cx('rules__item', !known && 'rules__item--unknown') },
            planetView(painter, known ? { seed: 5, type: type.id, rarity: 'common' } : null, { animated: false, className: 'rules__planet' }),
            h('span', { class: 'rules__name' }, known ? UK.planetTypes[type.id].name : UK.galaxy.locked),
            h(
              'span',
              { class: 'rules__recipe' },
              type.recipe.length === 4
                ? type.recipe.map((color) => particleDot(color))
                : type.recipe.flatMap((color) => [particleDot(color), particleDot(color)]),
            ),
          )
        }),
      ),
      button({ label: UK.common.ok, variant: 'primary', onClick: () => void handle.close() }),
    )
    const handle = this.kit.overlays.show(content, { variant: 'sheet' })
  }
}
