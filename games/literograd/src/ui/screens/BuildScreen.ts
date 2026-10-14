import { BUILDINGS, MAX_LEVEL, costAt, effectAt, upgradeAt } from '../../content/buildings.js'
import type { BuildingId, BuildingSpec } from '../../content/buildings.js'
import { UK } from '../../i18n/uk.js'
import { button, cost, emptyNote } from '../components.js'
import { append, cx, formatNumber, h, prefersReducedMotion, restartAnimation } from '../dom.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

export interface BuildParams {
  readonly focus?: BuildingId
}

export class BuildScreen extends Screen<BuildParams> {
  constructor(kit: UiKit) {
    super(kit, 'screen--build')
  }

  override enter(params: BuildParams): void {
    super.enter(params)
    const focus = params.focus
    if (focus) requestAnimationFrame(() => this.focus(focus))
  }

  protected render(): void {
    const { city } = this.kit.services
    const ordered = [...BUILDINGS].sort((a, b) => a.costs[0] - b.costs[0])
    append(
      this.element,
      h('div', { class: 'screen__head' }, h('h2', null, UK.build.title), h('p', null, UK.build.subtitle)),
      city.complete ? emptyNote(UK.build.allDone) : null,
      h('div', { class: 'builds' }, ordered.map((spec) => this.buildingCard(spec))),
    )
  }

  protected override bind(): void {
    const { city, wallet } = this.kit.services
    this.listen(city.onChange, () => this.refresh())
    this.listen(wallet.onChange, () => this.refresh())
  }

  private focus(id: BuildingId): void {
    const target = this.element.querySelector<HTMLElement>(`[data-card="${id}"]`)
    if (!target) return
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
    restartAnimation(target, 'bcard--flash')
  }

  private buildingCard(spec: BuildingSpec): HTMLElement {
    const { city, wallet, painter } = this.kit.services
    const level = city.level(spec.id)
    const maxed = level >= MAX_LEVEL
    const price = costAt(spec, level)
    const canPay = price !== null && wallet.canAfford(price)
    const drawing = this.kit.actions.drawing === spec.id
    return h(
      'article',
      { class: cx('bcard', canPay && 'bcard--afford'), 'data-card': spec.id },
      h('div', { class: 'bcard__pic', html: painter.building(spec.id, level, drawing) }),
      h(
        'div',
        { class: 'bcard__body' },
        h(
          'div',
          { class: 'bcard__head' },
          h('h3', null, spec.name),
          h(
            'span',
            { class: 'pips', role: 'img', 'aria-label': UK.build.pips(level) },
            [1, 2, 3].map((step) => h('i', { class: cx(level >= step && 'on') })),
          ),
        ),
        h('p', { class: 'bcard__now' }, effectAt(spec, level)),
        maxed
          ? h('p', { class: 'bcard__next' }, UK.build.maxLevel)
          : h('p', { class: 'bcard__next' }, h('span', { class: 'lvl' }, UK.build.level(level + 1)), ' ', upgradeAt(spec, level)),
        price === null
          ? null
          : h(
              'div',
              { class: 'bcard__foot' },
              button([level > 0 ? UK.build.upgrade : UK.build.draw, ' ', cost(price)], () => this.kit.actions.upgrade(spec.id), canPay ? 'ink' : 'line', {
                disabled: !canPay,
              }),
              canPay ? null : h('span', { class: 'need' }, UK.town.lacking(formatNumber(price - wallet.balance))),
            ),
      ),
    )
  }
}
