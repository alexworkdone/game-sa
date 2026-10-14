import { penFor } from '../../content/pens.js'
import { UK } from '../../i18n/uk.js'
import { button } from '../components.js'
import { h } from '../dom.js'
import type { OverlayHandle } from '../OverlayHost.js'
import type { UiKit } from '../UiKit.js'

export const showCelebration = (kit: UiKit, onClose: () => void): OverlayHandle => {
  const { city, painter } = kit.services
  const content = h(
    'div',
    { class: 'sheet sheet--celebrate' },
    h('p', { class: 'sheet__mode' }, UK.album.subtitle(city.book, penFor(city.book).name)),
    h('h2', { id: 'celebrate-title' }, UK.celebrate.title),
    h('div', { class: 'sheet__town', html: painter.town(city.snapshot) }),
    h('p', null, UK.celebrate.text),
    h('p', null, UK.celebrate.next(penFor(city.book + 1).instrumental)),
  )
  const handle = kit.overlays.show(content, { className: 'overlay--sheet', labelledBy: 'celebrate-title' })
  content.append(h('div', { class: 'sheet__actions' }, button(UK.celebrate.ok, () => void handle.close())))
  handle.onClose.on(onClose)
  content.querySelector<HTMLButtonElement>('.btn')?.focus()
  return handle
}
