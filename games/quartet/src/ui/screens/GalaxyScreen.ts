import { PLANET_TYPES, RARITIES } from '../../forge/Planet.js'
import type { PlanetTypeDef } from '../../forge/Planet.js'
import { UK } from '../../i18n/uk.js'
import { plural } from '../../i18n/plural.js'
import { particleDot, planetView, progressBar } from '../components.js'
import { append, cx, h } from '../dom.js'
import { showPlanetDetails } from '../overlays/PlanetOverlays.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

type GalaxyTab = 'atlas' | 'mine'

const ORBITS = [
  { radius: 21, period: 38 },
  { radius: 31, period: 62 },
  { radius: 41, period: 96 },
]

export class GalaxyScreen extends Screen {
  private tab: GalaxyTab = 'atlas'

  constructor(kit: UiKit) {
    super(kit, 'galaxy')
  }

  protected override bind(): void {
    this.listen(this.kit.services.galaxy.onChange, () => this.refresh())
  }

  protected render(): void {
    const { galaxy } = this.kit.services
    const slots = galaxy.collectionSlots()
    append(this.element,
      h(
        'header',
        { class: 'screen__header' },
        h('h1', { class: 'screen__title' }, UK.galaxy.title),
        h('span', { class: 'stat-pill' }, UK.galaxy.worlds(galaxy.count, plural(galaxy.count, UK.forms.planets))),
      ),
      this.system(),
      h(
        'div',
        { class: 'collection' },
        h('div', { class: 'collection__head' }, h('span', null, UK.galaxy.collection), h('strong', null, `${slots.filled}/${slots.total}`)),
        progressBar(slots.filled / slots.total),
      ),
      h(
        'div',
        { class: 'segmented', role: 'tablist' },
        (['atlas', 'mine'] as const).map((tab) =>
          h(
            'button',
            {
              type: 'button',
              role: 'tab',
              class: cx('segmented__item', this.tab === tab && 'segmented__item--active'),
              'aria-selected': String(this.tab === tab),
              on: {
                click: () => {
                  if (this.tab === tab) return
                  this.tab = tab
                  this.kit.feedback('tap', 'tap')
                  this.refresh()
                },
              },
            },
            tab === 'atlas' ? UK.galaxy.atlas : UK.galaxy.mine,
          ),
        ),
      ),
      this.tab === 'atlas' ? this.atlas() : this.mine(),
    )
  }

  private system(): HTMLElement {
    const { galaxy, painter } = this.kit.services
    const planets = galaxy.newest(6)
    return h(
      'div',
      { class: 'system' },
      h('div', { class: 'system__sun' }),
      ORBITS.map((orbit) => h('div', { class: 'system__orbit', style: `--r:${orbit.radius}` })),
      planets.map((planet, index) => {
        const orbit = ORBITS[index % ORBITS.length] ?? { radius: 31, period: 60 }
        const phase = (index * 137) % 360
        return h(
          'div',
          { class: 'system__track', style: `--r:${orbit.radius};--period:${orbit.period}s;--phase:${phase}deg` },
          h(
            'button',
            {
              type: 'button',
              class: 'system__planet',
              'aria-label': planet.name,
              on: { click: () => showPlanetDetails(this.kit, planet) },
            },
            planetView(painter, planet, { animated: false }),
          ),
        )
      }),
      planets.length === 0 ? h('p', { class: 'system__empty' }, UK.galaxy.empty) : null,
    )
  }

  private atlas(): HTMLElement {
    return h('div', { class: 'atlas' }, PLANET_TYPES.map((type) => this.atlasCard(type)))
  }

  private atlasCard(type: PlanetTypeDef): HTMLElement {
    const { galaxy, painter } = this.kit.services
    const best = galaxy.best(type.id)
    const rarities = galaxy.rarities(type.id)
    const count = galaxy.ofType(type.id).length
    return h(
      'button',
      {
        type: 'button',
        class: cx('atlas-card', !best && 'atlas-card--locked', best && `atlas-card--${best.rarity}`, type.secret && 'atlas-card--secret'),
        on: {
          click: () => {
            if (best) showPlanetDetails(this.kit, best)
            else this.kit.toast.show(type.secret ? UK.galaxy.secretHint : UK.galaxy.hintRecipe)
          },
        },
      },
      planetView(painter, best, { animated: false, className: 'atlas-card__planet' }),
      h('span', { class: 'atlas-card__name' }, best ? UK.planetTypes[type.id].name : type.secret ? '???' : UK.galaxy.locked),
      best
        ? h(
            'span',
            { class: 'atlas-card__rarities' },
            RARITIES.map((rarity) => h('span', { class: cx('pip', `pip--${rarity}`, rarities.has(rarity) && 'pip--on'), title: UK.rarity[rarity] })),
            h('span', { class: 'atlas-card__count' }, UK.galaxy.rarityCount(count)),
          )
        : type.secret
          ? h('span', { class: 'atlas-card__hint' }, '✦')
          : h('span', { class: 'atlas-card__recipe' }, type.recipe.map((color) => particleDot(color, 'particle--sm'))),
    )
  }

  private mine(): HTMLElement {
    const { galaxy, painter } = this.kit.services
    const planets = galaxy.newest(90)
    if (planets.length === 0) return h('p', { class: 'galaxy__empty' }, UK.galaxy.empty)
    return h(
      'div',
      { class: 'worlds' },
      planets.map((planet) =>
        h(
          'button',
          { type: 'button', class: cx('world', `world--${planet.rarity}`), on: { click: () => showPlanetDetails(this.kit, planet) } },
          planetView(painter, planet, { animated: false, className: 'world__planet' }),
          h('span', { class: 'world__name' }, planet.name),
        ),
      ),
    )
  }
}
