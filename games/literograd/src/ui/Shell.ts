import type { IDisposable, Unsubscribe } from '@sa/core'
import { UK } from '../i18n/uk.js'
import type { TabId } from '../meta/Preferences.js'
import { TABS } from '../meta/Preferences.js'
import { iconEl } from './components.js'
import { cx, formatNumber, h } from './dom.js'
import type { IconName } from './icons.js'
import type { Route } from './Navigator.js'
import type { UiKit } from './UiKit.js'

const TAB_ICONS: Readonly<Record<TabId, IconName>> = {
  town: 'town',
  play: 'play',
  build: 'pen',
  album: 'book',
}

export class Shell implements IDisposable {
  readonly hud: HTMLElement
  readonly tabbar: HTMLElement

  private readonly kit: UiKit
  private readonly subscriptions: Unsubscribe[] = []

  constructor(kit: UiKit) {
    this.kit = kit
    this.hud = h('header', { class: 'hud' })
    this.tabbar = h('nav', { class: 'tabbar', 'aria-label': UK.appName })
    const { wallet, city } = kit.services
    for (const signal of [wallet.onChange, city.onChange]) {
      this.subscriptions.push(signal.on(() => this.render()))
    }
    this.subscriptions.push(kit.nav.onChange.on((route) => this.onRoute(route)))
    this.render()
  }

  private onRoute(route: Route): void {
    const inGame = route.name === 'game'
    this.hud.classList.toggle('hud--hidden', inGame)
    this.tabbar.classList.toggle('tabbar--hidden', inGame)
    this.renderTabbar()
  }

  private render(): void {
    this.renderHud()
    this.renderTabbar()
  }

  private renderHud(): void {
    const { wallet, city } = this.kit.services
    this.hud.replaceChildren(
      h('h1', { class: 'hud__title' }, UK.appName),
      h(
        'div',
        { class: 'hud__side' },
        h(
          'button',
          { type: 'button', class: 'book-chip', on: { click: () => this.go('album') } },
          UK.hud.book(city.book),
        ),
        h('div', { class: 'ink-pill', title: UK.hud.ink }, iconEl('drop'), h('span', null, formatNumber(wallet.balance))),
      ),
    )
  }

  private renderTabbar(): void {
    const current = this.kit.nav.current.name
    const affordable = this.kit.services.builder.affordableCount()
    this.tabbar.replaceChildren(
      ...TABS.map((tab) =>
        h(
          'button',
          {
            type: 'button',
            class: cx('tab', current === tab && 'tab--active'),
            'aria-current': current === tab ? 'page' : undefined,
            on: { click: () => this.go(tab) },
          },
          iconEl(TAB_ICONS[tab], 'tab__icon'),
          h('span', { class: 'tab__label' }, UK.tabs[tab]),
          tab === 'build' && affordable > 0 ? h('span', { class: 'badge' }, String(affordable)) : null,
        ),
      ),
    )
  }

  private go(tab: TabId): void {
    if (this.kit.nav.current.name === tab) return
    this.kit.services.prefs.update({ tab })
    this.kit.nav.go({ name: tab })
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe()
  }
}
