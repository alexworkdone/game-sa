import type { IDisposable } from '@sa/core'
import { UK } from '../i18n/uk.js'
import { icon } from '../render/icons.js'
import type { IconName } from '../render/icons.js'
import { PARTICLE_COLORS } from '../shared/ParticleColor.js'
import { progressBar } from './components.js'
import { offerHint } from './overlays/HintOffer.js'
import { cx, formatNumber, h } from './dom.js'
import type { Route, TabId } from './Navigator.js'
import { TAB_ORDER } from './Navigator.js'
import type { UiKit } from './UiKit.js'

const TAB_ICONS: Readonly<Record<TabId, IconName>> = {
  home: 'home',
  levels: 'path',
  forge: 'forge',
  galaxy: 'galaxy',
  profile: 'profile',
}

export class Shell implements IDisposable {
  readonly topbar: HTMLElement
  readonly tabbar: HTMLElement

  private readonly kit: UiKit
  private readonly unsubscribe: (() => void)[] = []

  constructor(kit: UiKit) {
    this.kit = kit
    this.topbar = h('header', { class: 'topbar' })
    this.tabbar = h('nav', { class: 'tabbar', 'aria-label': UK.appName })
    const { wallet, ranks, progress, forge, galaxy } = kit.services
    for (const signal of [wallet.onChange, ranks.onChange]) {
      this.unsubscribe.push(signal.on(() => this.renderTopbar()))
    }
    for (const signal of [wallet.onChange, progress.onChange, forge.onChange, galaxy.onChange]) {
      this.unsubscribe.push(signal.on(() => this.renderTabbar()))
    }
    this.unsubscribe.push(kit.nav.onChange.on((route) => this.onRoute(route)))
    this.renderTopbar()
    this.renderTabbar()
  }

  private onRoute(route: Route): void {
    const inGame = route.name === 'game'
    this.topbar.classList.toggle('topbar--hidden', inGame)
    this.tabbar.classList.toggle('tabbar--hidden', inGame)
    this.renderTabbar()
  }

  private renderTopbar(): void {
    const { wallet, ranks } = this.kit.services
    const rank = ranks.current
    const total = PARTICLE_COLORS.reduce((sum, color) => sum + wallet.amount(color), 0)
    this.topbar.replaceChildren(
      h(
        'button',
        {
          type: 'button',
          class: 'rank-chip',
          on: { click: () => this.kit.nav.go({ name: 'profile' }) },
        },
        h('span', { class: 'rank-chip__badge', html: icon('shield') }, h('span', { class: 'rank-chip__number' }, String(rank.index + 1))),
        h(
          'span',
          { class: 'rank-chip__body' },
          h('span', { class: 'rank-chip__title' }, rank.title),
          progressBar(ranks.progress(), 'progress--xp'),
        ),
      ),
      h(
        'div',
        { class: 'topbar__wallet' },
        h(
          'button',
          {
            type: 'button',
            class: 'pill pill--particles',
            'aria-label': UK.tabs.forge,
            on: { click: () => this.kit.nav.go({ name: 'forge' }) },
          },
          h('span', { class: 'pill__orbs' }, PARTICLE_COLORS.map((color) => h('span', { class: `particle particle--${color}` }))),
          h('span', { class: 'pill__value' }, formatNumber(total)),
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'pill pill--hints',
            'aria-label': UK.game.hint,
            on: { click: () => void offerHint(this.kit) },
          },
          h('span', { class: 'pill__icon', html: icon('bulb') }),
          h('span', { class: 'pill__value' }, String(wallet.hints)),
        ),
      ),
    )
  }

  private renderTabbar(): void {
    const route = this.kit.nav.current
    const { forge, progress } = this.kit.services
    const chapter = progress.chapterOf(progress.current)
    const chestReady = Array.from({ length: chapter + 1 }, (_, index) => progress.chapter(index)).some(
      (info) => info.chestReady,
    )
    const badges: Partial<Record<TabId, string>> = {
      forge: forge.affordablePlanets() > 0 ? String(forge.affordablePlanets()) : '',
      levels: chestReady ? '!' : '',
    }
    this.tabbar.replaceChildren(
      ...TAB_ORDER.map((tab) =>
        h(
          'button',
          {
            type: 'button',
            class: cx('tabbar__item', tab === 'home' && 'tabbar__item--home', route.name === tab && 'tabbar__item--active'),
            'aria-current': route.name === tab ? 'page' : undefined,
            on: {
              click: () => {
                if (this.kit.nav.current.name === tab) return
                this.kit.feedback('tap', 'tap')
                this.kit.nav.go({ name: tab })
              },
            },
          },
          h('span', { class: 'tabbar__icon', html: icon(TAB_ICONS[tab]) }),
          h('span', { class: 'tabbar__label' }, UK.tabs[tab]),
          badges[tab] ? h('span', { class: 'badge' }, badges[tab]) : null,
        ),
      ),
    )
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribe) unsubscribe()
  }
}
