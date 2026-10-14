import { BUILDINGS, DECOR, costAt, upgradeAt } from '../../content/buildings.js'
import type { BuildingId } from '../../content/buildings.js'
import { penFor } from '../../content/pens.js'
import { UK } from '../../i18n/uk.js'
import { STARTING_INK } from '../../meta/Wallet.js'
import { button, card, cost, progressBar } from '../components.js'
import { append, formatNumber, h, prefersReducedMotion } from '../dom.js'
import { Screen } from '../Screen.js'
import { TownPanner } from '../TownPanner.js'
import type { UiKit } from '../UiKit.js'

export class TownScreen extends Screen<void> {
  private readonly panner = new TownPanner()
  private confirmBook = false

  constructor(kit: UiKit) {
    super(kit, 'screen--town')
  }

  override leave(): void {
    this.confirmBook = false
    super.leave()
  }

  protected render(): void {
    const { city, painter } = this.kit.services
    const scroller = h('div', {
      class: 'town__scroll',
      html: painter.town(city.snapshot, { drawing: this.kit.actions.drawing, interactive: true }),
      on: {
        click: (event) => {
          const target = (event.target as Element).closest('[data-building]')
          const id = target?.getAttribute('data-building') as BuildingId | null
          if (id) this.kit.nav.go({ name: 'build', focus: id })
        },
      },
    })
    const hint = h('span', { class: 'pan-hint' }, UK.town.panHint)
    append(this.element, h('div', { class: 'town' }, scroller, hint), this.progress(), this.goal(), this.decor())
    this.panner.attach(scroller, hint)
    this.panner.restore()
  }

  protected override bind(): void {
    const { city, wallet } = this.kit.services
    this.listen(city.onChange, () => this.refresh())
    this.listen(wallet.onChange, () => this.refresh())
    this.listen(this.kit.actions.onDrawing, (target) => this.scrollTo(target))
  }

  private scrollTo(target: string): void {
    const building = BUILDINGS.find((spec) => spec.id === target)
    if (building) this.panner.scrollToViewBoxX(building.x, !prefersReducedMotion())
  }

  private progress(): HTMLElement {
    const { city } = this.kit.services
    const percent = Math.round((city.levelSum / city.maxLevels) * 100)
    return card(
      'progress-card',
      h('div', { class: 'progress-card__top' }, h('span', null, UK.town.ready), h('b', null, `${percent} %`)),
      progressBar(percent, UK.town.progressAria),
      h(
        'p',
        { class: 'progress-card__sub' },
        UK.town.progress(city.builtCount, BUILDINGS.length, city.levelSum, city.maxLevels, city.decor.length, city.book, penFor(city.book).name),
      ),
    )
  }

  private goal(): HTMLElement {
    const { city, builder, wallet, painter } = this.kit.services
    if (city.complete) return this.completeCard()
    const spec = builder.nextGoal()
    if (!spec) return h('div')
    const level = city.level(spec.id)
    const price = costAt(spec, level) ?? 0
    const canPay = wallet.canAfford(price)
    const action = canPay
      ? button([level > 0 ? UK.build.upgrade : UK.build.draw, ' ', cost(price)], () => this.kit.actions.upgrade(spec.id))
      : [
          button(UK.town.earn, () => {
            this.kit.services.prefs.update({ tab: 'play' })
            this.kit.nav.go({ name: 'play' })
          }),
          h('span', { class: 'need' }, UK.town.lacking(formatNumber(price - wallet.balance))),
        ]
    return card(
      'goal',
      h(
        'div',
        { class: 'goal__row' },
        h('div', { class: 'goal__pic', html: painter.building(spec.id, level) }),
        h(
          'div',
          { class: 'goal__body' },
          h('span', { class: 'eyebrow' }, UK.town.nextGoal),
          h('h3', null, spec.name, level > 0 ? UK.town.toLevel(level + 1) : ''),
          h('p', null, upgradeAt(spec, level)),
        ),
      ),
      h('div', { class: 'row-btns' }, action),
    )
  }

  private completeCard(): HTMLElement {
    const { city, wallet } = this.kit.services
    const nextPen = penFor(city.book + 1)
    if (this.confirmBook) {
      return card(
        'goal goal--done',
        h('h3', null, UK.town.confirmTitle),
        h('p', null, UK.town.confirmLead, cost(wallet.balance), UK.town.confirmTail, cost(STARTING_INK), '.'),
        h(
          'div',
          { class: 'row-btns' },
          button(UK.town.confirmYes, () => {
            this.confirmBook = false
            this.kit.actions.startNewBook()
            this.panner.reset()
          }),
          button(UK.town.cancel, () => {
            this.confirmBook = false
            this.refresh()
          }, 'line'),
        ),
      )
    }
    return card(
      'goal goal--done',
      h('h3', null, UK.town.completeTitle),
      h('p', null, UK.town.completeText(nextPen.instrumental)),
      h(
        'div',
        { class: 'row-btns' },
        button(UK.town.newBook, () => {
          this.confirmBook = true
          this.refresh()
        }),
      ),
    )
  }

  private decor(): HTMLElement {
    const { city, builder } = this.kit.services
    const full = city.freeSlots <= 0
    return card(
      'decor-card',
      h(
        'div',
        { class: 'decor-card__head' },
        h('h3', null, UK.town.decorTitle),
        h('span', null, full ? UK.town.decorFull : UK.town.decorFree(city.freeSlots)),
      ),
      h(
        'div',
        { class: 'decor-card__buttons' },
        DECOR.map((spec) =>
          button([spec.name, ' ', cost(spec.cost)], () => this.kit.actions.place(spec.id), 'line', {
            small: true,
            disabled: !builder.canPlace(spec.id),
          }),
        ),
      ),
    )
  }
}
