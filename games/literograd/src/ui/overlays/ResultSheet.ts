import { costAt } from '../../content/buildings.js'
import { MODE_NAMES } from '../../content/modes.js'
import type { ModeId } from '../../content/modes.js'
import { UK } from '../../i18n/uk.js'
import type { RoundReport } from '../../round/RoundResolver.js'
import { button, cost, iconEl } from '../components.js'
import { cx, formatNumber, h, restartAnimation } from '../dom.js'
import { icon } from '../icons.js'
import type { OverlayHandle } from '../OverlayHost.js'
import type { UiKit } from '../UiKit.js'

export interface ResultHandlers {
  again(): void
  home(): void
}

const COMMENT_THRESHOLDS: readonly number[] = [4, 7, 10]

const commentFor = (grade: number): string => {
  const index = COMMENT_THRESHOLDS.filter((threshold) => grade >= threshold).length
  return UK.result.comments[index] ?? UK.result.comments[0]
}

const row = (label: string, value: HTMLElement | string, muted = false): HTMLElement =>
  h('div', { class: cx('ledger__row', muted && 'ledger__row--muted') }, h('span', null, label), h('b', null, value))

const nextStep = (kit: UiKit): HTMLElement => {
  const { city, builder, wallet } = kit.services
  if (city.complete) return h('p', { class: 'sheet__next' }, UK.result.cityDone)
  const affordable = builder.affordable()
  if (affordable.length > 0) {
    return h('p', { class: 'sheet__next' }, UK.result.canAfford, h('b', null, affordable.map((spec) => spec.name).join(', ')), '.')
  }
  const goal = builder.nextGoal()
  if (!goal) return h('p', { class: 'sheet__next' })
  const price = costAt(goal, city.level(goal.id)) ?? 0
  return h('p', { class: 'sheet__next' }, UK.result.shortfall(goal.name), cost(price - wallet.balance), '.')
}

export const showResult = (kit: UiKit, report: RoundReport, mode: ModeId, handlers: ResultHandlers): OverlayHandle => {
  const { stats } = report
  const percent = Math.round(report.accuracy * 100)
  const ring = h('div', { class: 'grade', 'aria-label': UK.result.grade, html: icon('ring') }, h('span', null, String(report.grade)), h('small', null, UK.result.gradeOf))
  let choice: 'again' | 'home' = 'home'
  const content = h(
    'div',
    { class: 'sheet' },
    h(
      'div',
      { class: 'sheet__head' },
      h(
        'div',
        null,
        h('p', { class: 'sheet__mode' }, `${MODE_NAMES[mode]} · ${report.variant.label}`),
        h('h2', { id: 'result-title' }, commentFor(report.grade)),
        report.record ? h('span', { class: 'stamp' }, UK.result.record) : null,
      ),
      ring,
    ),
    h(
      'dl',
      { class: 'sheet__stats' },
      h('div', null, h('dt', null, UK.result.correct), h('dd', null, String(stats.correct))),
      h('div', null, h('dt', null, UK.result.wrong), h('dd', null, String(stats.wrong))),
      h('div', null, h('dt', null, UK.result.combo), h('dd', null, String(stats.maxCombo))),
    ),
    h(
      'div',
      { class: 'ledger' },
      row(UK.result.base, formatNumber(stats.earned)),
      report.accuracyBonus > 0
        ? row(UK.result.accuracy(percent), `+${Math.round(report.accuracyBonus * 100)} %`)
        : row(UK.result.accuracyMissed(percent), '—', true),
      report.millBonus > 0 ? row(UK.result.mill(report.millLevel), `+${Math.round(report.millBonus * 100)} %`) : null,
      report.bookBonus > 0 ? row(UK.result.books(report.booksDone), `+${Math.round(report.bookBonus * 100)} %`) : null,
      h('div', { class: 'ledger__row ledger__row--total' }, h('span', null, UK.result.total), h('b', null, `+${formatNumber(report.gained)}`, iconEl('drop'))),
    ),
    nextStep(kit),
  )
  const handle = kit.overlays.show(content, { className: 'overlay--sheet', labelledBy: 'result-title' })
  content.append(
    h(
      'div',
      { class: 'sheet__actions' },
      button(UK.result.again, () => {
        choice = 'again'
        void handle.close()
      }),
      button(UK.result.home, () => void handle.close(), 'line'),
    ),
  )
  handle.onClose.on(() => (choice === 'again' ? handlers.again() : handlers.home()))
  restartAnimation(ring, 'grade--go')
  content.querySelector<HTMLButtonElement>('.btn')?.focus()
  return handle
}
