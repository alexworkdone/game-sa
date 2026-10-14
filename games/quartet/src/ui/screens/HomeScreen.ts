import { UK } from '../../i18n/uk.js'
import { plural } from '../../i18n/plural.js'
import { PLANET_TYPES, RARITIES } from '../../forge/Planet.js'
import type { Planet } from '../../forge/Planet.js'
import { icon } from '../../render/icons.js'
import { PARTICLE_COLORS } from '../../shared/ParticleColor.js'
import { button, iconSpan, particleChip, planetView, progressBar } from '../components.js'
import { append, cx, formatDuration, h } from '../dom.js'
import { showTutorial } from '../overlays/TutorialOverlay.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

const SHOWCASE = { seed: 7, type: 'pearl', rarity: 'legendary' } as const

export class HomeScreen extends Screen {
  private countdown: HTMLElement | null = null
  private dailyDone = false

  constructor(kit: UiKit) {
    super(kit, 'home')
  }

  protected override bind(): void {
    const { wallet, galaxy, dailyTracker, progress, settings } = this.kit.services
    for (const signal of [wallet.onChange, galaxy.onChange, dailyTracker.onChange, progress.onChange]) {
      this.listen(signal, () => this.refresh())
    }
    this.every(1000, () => this.tick())
    if (!settings.values.tutorialSeen) {
      void showTutorial(this.kit).then(() => settings.update({ tutorialSeen: true }))
    }
  }

  protected render(): void {
    const { progress, dailyTracker, forge, galaxy, painter } = this.kit.services
    const hero = this.heroPlanet()
    const level = progress.current
    const affordable = forge.affordablePlanets()
    const visible = PLANET_TYPES.filter((type) => !type.secret)
    const discovered = visible.filter((type) => galaxy.discovered(type.id)).length
    const visibleTypes = visible.length
    const streak = dailyTracker.streak
    this.dailyDone = dailyTracker.doneToday
    this.countdown = h('span', { class: 'home-card__timer' }, formatDuration(dailyTracker.msUntilNext))

    append(this.element,
      h(
        'div',
        { class: 'home__hero' },
        h('div', { class: 'home__orbit' }),
        planetView(painter, hero ?? SHOWCASE, { className: 'home__planet' }),
        h(
          'div',
          { class: 'home__brand' },
          h('span', { class: 'logo-mark', 'aria-hidden': 'true' }, PARTICLE_COLORS.map((color) => h('span', { class: `logo-mark__cell logo-mark__cell--${color}` }))),
          h('h1', { class: 'home__logo' }, UK.appName),
        ),
        h('p', { class: 'home__tagline' }, hero ? UK.tagline : UK.home.firstPlanet),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'play-button',
          on: {
            click: () => {
              this.kit.feedback('tap', 'select')
              this.kit.nav.go({ name: 'game', mode: 'level', level })
            },
          },
        },
        h('span', { class: 'play-button__icon', html: icon('play') }),
        h('span', { class: 'play-button__body' }, h('span', { class: 'play-button__label' }, UK.home.play), h('span', { class: 'play-button__level' }, UK.home.level(level))),
      ),
      h(
        'div',
        { class: 'home__cards' },
        h(
          'button',
          {
            type: 'button',
            class: cx('home-card', 'home-card--daily', !dailyTracker.doneToday && 'home-card--ready'),
            on: { click: () => this.openDaily() },
          },
          h('span', { class: 'home-card__head' }, iconSpan('calendar', 'home-card__icon'), streak > 0 ? h('span', { class: 'streak' }, iconSpan('flame'), String(streak)) : null),
          h('span', { class: 'home-card__title' }, UK.home.dailyTitle),
          dailyTracker.doneToday
            ? h('span', { class: 'home-card__text' }, UK.home.dailyDone, ' ', this.countdown)
            : h('span', { class: 'home-card__text' }, UK.home.dailyReady, h('span', { class: 'home-card__reward' }, UK.home.dailyReward)),
        ),
        h(
          'button',
          {
            type: 'button',
            class: cx('home-card', 'home-card--forge', affordable > 0 && 'home-card--ready'),
            on: { click: () => this.kit.nav.go({ name: 'forge' }) },
          },
          h('span', { class: 'home-card__head' }, iconSpan('forge', 'home-card__icon'), affordable > 0 ? h('span', { class: 'badge badge--static' }, String(affordable)) : null),
          h('span', { class: 'home-card__title' }, UK.home.forgeTitle),
          h('span', { class: 'home-card__particles' }, PARTICLE_COLORS.map((color) => particleChip(color, this.kit.services.wallet.amount(color), 'particle-chip--sm'))),
          h('span', { class: 'home-card__text' }, affordable > 0 ? UK.home.forgeReady(affordable) : UK.home.forgeNotReady),
        ),
      ),
      h(
        'button',
        { type: 'button', class: 'home-card home-card--galaxy', on: { click: () => this.kit.nav.go({ name: 'galaxy' }) } },
        h('span', { class: 'home-card__head' }, iconSpan('galaxy', 'home-card__icon'), h('span', { class: 'home-card__title' }, UK.home.galaxyTitle)),
        h(
          'span',
          { class: 'home-card__planets' },
          galaxy.count
            ? galaxy.newest(5).map((planet) => planetView(painter, planet, { animated: false, className: 'home-card__planet' }))
            : Array.from({ length: 5 }, () => planetView(painter, null, { className: 'home-card__planet' })),
        ),
        h('span', { class: 'home-card__text' }, UK.home.galaxyProgress(discovered, visibleTypes)),
        progressBar(discovered / visibleTypes),
      ),
      this.chestBanner(),
    )
  }

  private heroPlanet(): Planet | null {
    const planets = this.kit.services.galaxy.newest(12)
    if (planets.length === 0) return null
    return planets.reduce((best, planet) =>
      RARITIES.indexOf(planet.rarity) > RARITIES.indexOf(best.rarity) ? planet : best,
    )
  }

  private chestBanner(): HTMLElement | null {
    const { progress } = this.kit.services
    const chapters = progress.chapterOf(progress.current)
    for (let index = 0; index <= chapters; index++) {
      if (progress.chapter(index).chestReady) {
        return button({
          label: UK.home.chestReady,
          icon: 'gift',
          variant: 'accent',
          size: 'lg',
          className: 'home__chest',
          onClick: () => this.kit.nav.go({ name: 'levels' }),
        })
      }
    }
    return null
  }

  private openDaily(): void {
    const { dailyTracker } = this.kit.services
    if (dailyTracker.doneToday) {
      const result = dailyTracker.resultFor()
      const stars = result?.stars ?? 0
      this.kit.toast.show(`${UK.home.dailyDone} ${formatDuration(dailyTracker.msUntilNext)} · ${stars}\u00a0${plural(stars, UK.forms.stars)}`)
      return
    }
    this.kit.feedback('tap', 'select')
    this.kit.nav.go({ name: 'game', mode: 'daily' })
  }

  private tick(): void {
    const { dailyTracker } = this.kit.services
    if (dailyTracker.doneToday !== this.dailyDone) {
      this.refresh()
      return
    }
    if (this.countdown) this.countdown.textContent = formatDuration(dailyTracker.msUntilNext)
  }
}
