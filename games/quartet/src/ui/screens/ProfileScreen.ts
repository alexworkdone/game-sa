import { UK } from '../../i18n/uk.js'
import { THEMES } from '../../meta/Themes.js'
import type { ThemeDef } from '../../meta/Themes.js'
import { icon } from '../../render/icons.js'
import type { IconName } from '../../render/icons.js'
import { iconSpan, progressBar } from '../components.js'
import { append, cx, formatNumber, h } from '../dom.js'
import { confirmDialog } from '../overlays/ConfirmDialog.js'
import { showTutorial } from '../overlays/TutorialOverlay.js'
import { offerHint } from '../overlays/HintOffer.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

const RANK_PREVIEW = 10

export class ProfileScreen extends Screen {
  constructor(kit: UiKit) {
    super(kit, 'profile')
  }

  protected override bind(): void {
    const { ranks, stats, settings, galaxy, wallet, dailyTracker } = this.kit.services
    for (const signal of [ranks.onChange, stats.onChange, settings.onChange, galaxy.onChange, wallet.onChange, dailyTracker.onChange]) {
      this.listen(signal, () => this.refresh())
    }
  }

  protected render(): void {
    const { ranks, stats, galaxy, dailyTracker, wallet } = this.kit.services
    const rank = ranks.current
    const snapshot = stats.snapshot
    const tiles: [string, string][] = [
      [UK.profile.played, formatNumber(snapshot.played)],
      [UK.profile.won, formatNumber(snapshot.won)],
      [UK.profile.winRate, `${Math.round(stats.winRate * 100)}%`],
      [UK.profile.perfect, formatNumber(snapshot.perfect)],
      [UK.profile.bestScore, formatNumber(snapshot.bestScore)],
      [UK.profile.streak, formatNumber(dailyTracker.streak)],
      [UK.profile.planets, formatNumber(galaxy.count)],
      [UK.profile.legendary, formatNumber(galaxy.countRarity('legendary'))],
    ]

    append(this.element,
      h('header', { class: 'screen__header' }, h('h1', { class: 'screen__title' }, UK.profile.title)),
      h(
        'div',
        { class: 'rank-card' },
        h('span', { class: 'rank-card__emblem', html: icon('shield') }, h('span', { class: 'rank-card__number' }, String(rank.index + 1))),
        h(
          'div',
          { class: 'rank-card__body' },
          h('h2', { class: 'rank-card__title' }, rank.title),
          h('span', { class: 'rank-card__xp' }, `${UK.profile.xp}: `, h('span', { class: 'nowrap' }, `${formatNumber(ranks.xp)} / ${formatNumber(rank.to)}`)),
          progressBar(ranks.progress(), 'progress--xp progress--lg'),
        ),
      ),
      h(
        'button',
        { type: 'button', class: 'hint-card', on: { click: () => void offerHint(this.kit) } },
        iconSpan('bulb', 'hint-card__icon'),
        h('span', { class: 'hint-card__body' }, h('strong', null, `${UK.game.hint}: ${wallet.hints}`), h('span', null, UK.hintOffer.title)),
        iconSpan('video', 'hint-card__action'),
      ),
      h('h2', { class: 'section-title' }, UK.profile.stats),
      h('div', { class: 'stats' }, tiles.map(([label, value]) => h('div', { class: 'stats__tile' }, h('strong', { class: 'stats__value' }, value), h('span', { class: 'stats__label' }, label)))),
      h('h2', { class: 'section-title' }, UK.profile.themes),
      h('div', { class: 'themes' }, THEMES.map((theme) => this.theme(theme))),
      h('h2', { class: 'section-title' }, UK.profile.settings),
      h(
        'div',
        { class: 'settings' },
        this.toggle(UK.profile.sound, 'soundOn', 'sound'),
        this.toggle(UK.profile.vibration, 'vibrate', 'vibration'),
        this.action(UK.profile.howTo, 'book', () => void showTutorial(this.kit)),
        this.action(UK.profile.reset, 'trash', () => void this.reset(), true),
      ),
      h('h2', { class: 'section-title' }, UK.profile.ranks),
      h(
        'ol',
        { class: 'ranks' },
        Array.from({ length: Math.max(RANK_PREVIEW, rank.index + 2) }, (_, index) => {
          const info = ranks.rankAt(index)
          return h(
            'li',
            { class: cx('ranks__item', index < rank.index && 'ranks__item--done', index === rank.index && 'ranks__item--current') },
            h('span', { class: 'ranks__index' }, String(index + 1)),
            h('span', { class: 'ranks__title' }, info.title),
            h('span', { class: 'ranks__xp' }, formatNumber(info.from)),
          )
        }),
      ),
    )
  }

  private theme(theme: ThemeDef): HTMLElement {
    const { themes, settings } = this.kit.services
    const unlocked = themes.isUnlocked(theme)
    const active = settings.values.theme === theme.id
    return h(
      'button',
      {
        type: 'button',
        class: cx('theme', `theme--${theme.id}`, active && 'theme--active', !unlocked && 'theme--locked'),
        'aria-pressed': String(active),
        on: {
          click: () => {
            if (!unlocked) {
              this.kit.toast.show(theme.requiresSecret ? UK.profile.themeSecret : UK.profile.themeLocked(theme.requiredTypes), 'warn')
              return
            }
            this.kit.feedback('select', 'select')
            settings.update({ theme: theme.id })
          },
        },
      },
      h('span', { class: 'theme__swatch' }, unlocked ? null : h('span', { class: 'theme__lock', html: icon('lock') })),
      h('span', { class: 'theme__name' }, UK.themes[theme.id]),
    )
  }

  private toggle(label: string, iconName: IconName, key: 'sound' | 'vibration'): HTMLElement {
    const { settings } = this.kit.services
    const on = settings.values[key]
    return h(
      'button',
      {
        type: 'button',
        role: 'switch',
        'aria-checked': String(on),
        class: 'settings__row',
        on: {
          click: () => {
            settings.update({ [key]: !on })
            this.kit.feedback('tap', 'tap')
          },
        },
      },
      iconSpan(key === 'sound' && !on ? 'soundOff' : iconName, 'settings__icon'),
      h('span', { class: 'settings__label' }, label),
      h('span', { class: cx('switch', on && 'switch--on') }, h('span', { class: 'switch__knob' })),
    )
  }

  private action(label: string, iconName: IconName, onClick: () => void, danger = false): HTMLElement {
    return h(
      'button',
      { type: 'button', class: cx('settings__row', danger && 'settings__row--danger'), on: { click: onClick } },
      iconSpan(iconName, 'settings__icon'),
      h('span', { class: 'settings__label' }, label),
      h('span', { class: 'settings__chevron', html: icon('arrow') }),
    )
  }

  private async reset(): Promise<void> {
    const agreed = await confirmDialog(this.kit, {
      title: UK.profile.resetTitle,
      text: UK.profile.resetText,
      confirm: UK.profile.resetConfirm,
      cancel: UK.profile.cancel,
      icon: 'trash',
      confirmVariant: 'danger',
    })
    if (!agreed) return
    this.kit.services.storage.clear()
    window.location.reload()
  }
}
