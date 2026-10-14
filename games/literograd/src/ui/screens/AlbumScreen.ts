import { penFor } from '../../content/pens.js'
import { UK } from '../../i18n/uk.js'
import type { AlbumEntry } from '../../meta/City.js'
import { describeKey } from '../../round/Variant.js'
import { button, emptyNote, iconEl } from '../components.js'
import { append, formatNumber, h } from '../dom.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

export class AlbumScreen extends Screen<void> {
  private confirmReset = false

  constructor(kit: UiKit) {
    super(kit, 'screen--album')
  }

  override leave(): void {
    this.confirmReset = false
    super.leave()
  }

  protected render(): void {
    const { city } = this.kit.services
    append(
      this.element,
      h('div', { class: 'screen__head' }, h('h2', null, UK.album.title), h('p', null, UK.album.subtitle(city.book, penFor(city.book).name))),
      this.stats(),
      h('h3', { class: 'section-title' }, UK.album.records),
      this.records(),
      h('h3', { class: 'section-title' }, UK.album.gallery),
      this.gallery(),
      h('h3', { class: 'section-title' }, UK.album.settings),
      this.settings(),
    )
  }

  protected override bind(): void {
    const { city, records } = this.kit.services
    this.listen(city.onChange, () => this.refresh())
    this.listen(records.onChange, () => this.refresh())
  }

  private stats(): HTMLElement {
    const { records, city } = this.kit.services
    const tile = (value: string, label: string): HTMLElement => h('div', { class: 'stat' }, h('b', null, value), h('span', null, label))
    return h(
      'div',
      { class: 'stats' },
      tile(formatNumber(records.rounds), UK.album.rounds),
      tile(formatNumber(records.totalInk), UK.album.earned),
      tile(String(city.album.length), UK.album.cities),
    )
  }

  private records(): HTMLElement {
    const entries = this.kit.services.records.entries()
    if (entries.length === 0) return emptyNote(UK.album.noRecords)
    return h(
      'div',
      { class: 'records' },
      entries.map(([key, value]) => {
        const label = describeKey(key)
        return h(
          'div',
          { class: 'record' },
          h('span', { class: 'record__name' }, label.mode, h('span', { class: 'record__variant' }, label.variant)),
          h('b', null, formatNumber(value), iconEl('drop')),
        )
      }),
    )
  }

  private gallery(): HTMLElement {
    const { city } = this.kit.services
    if (city.album.length === 0) return emptyNote(UK.album.noCities(city.levelSum, city.maxLevels))
    return h('div', { class: 'gallery' }, [...city.album].reverse().map((entry) => this.albumItem(entry)))
  }

  private albumItem(entry: AlbumEntry): HTMLElement {
    const pen = penFor(entry.book)
    const date = entry.finishedAt > 0 ? new Date(entry.finishedAt).toLocaleDateString('uk-UA') : ''
    return h(
      'figure',
      { class: 'album-item' },
      h('div', { html: this.kit.services.painter.town(entry, { still: true, penClass: `pen-${pen.index}` }) }),
      h('figcaption', null, UK.album.cityCaption(entry.book, pen.name, date)),
    )
  }

  private settings(): HTMLElement {
    const rows: HTMLElement[] = []
    if (this.kit.debug) {
      rows.push(
        this.row(UK.album.testInk, UK.album.testInkNote, button([UK.album.testInkButton, ' ', iconEl('drop')], () => this.kit.actions.grantTestInk(), 'line', { small: true })),
      )
    }
    rows.push(
      this.confirmReset
        ? this.row(
            UK.album.resetAsk,
            UK.album.resetAskNote,
            h(
              'div',
              { class: 'row-btns' },
              button(UK.album.resetYes, () => {
                this.confirmReset = false
                this.kit.actions.resetAll()
              }, 'line', { small: true }),
              button(UK.town.cancel, () => {
                this.confirmReset = false
                this.refresh()
              }, 'ghost', { small: true }),
            ),
          )
        : this.row(
            UK.album.reset,
            UK.album.resetNote,
            button(UK.album.resetButton, () => {
              this.confirmReset = true
              this.refresh()
            }, 'ghost', { small: true }),
          ),
    )
    return h('div', { class: 'settings' }, rows)
  }

  private row(title: string, note: string, control: HTMLElement): HTMLElement {
    return h('div', { class: 'setting' }, h('p', null, title, h('small', null, note)), control)
  }
}
