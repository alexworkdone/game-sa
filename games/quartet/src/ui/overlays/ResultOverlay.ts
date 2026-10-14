import { UK } from '../../i18n/uk.js'
import { plural } from '../../i18n/plural.js'
import type { PlaySummary } from '../../meta/PlayResolver.js'
import type { PuzzleGroup } from '../../puzzle/Puzzle.js'
import { PARTICLE_COLORS } from '../../shared/ParticleColor.js'
import { button, particleChip, progressBar, starRow } from '../components.js'
import { cx, formatNumber, h, prefersReducedMotion, wait } from '../dom.js'
import type { UiKit } from '../UiKit.js'

export type ResultChoice = 'next' | 'retry' | 'menu' | 'forge'

const countUp = (element: HTMLElement, target: number, duration: number): void => {
  if (prefersReducedMotion()) {
    element.textContent = formatNumber(target)
    return
  }
  const start = performance.now()
  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    element.textContent = formatNumber(Math.round(target * eased))
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export const showResult = (kit: UiKit, summary: PlaySummary, groups: readonly PuzzleGroup[]): Promise<ResultChoice> =>
  new Promise((resolve) => {
    const { outcome, reward, xp, rankBonus } = summary
    const won = outcome.won
    const isDaily = outcome.mode === 'daily'
    let choice: ResultChoice = 'menu'
    const choose = (value: ResultChoice): void => {
      choice = value
      kit.feedback('tap', 'tap')
      void handle.close()
    }

    const title = won ? (UK.result.winTitles[reward.stars - 1] ?? UK.result.winTitles[0] ?? '') : UK.result.loseTitle
    const scoreValue = h('span', { class: 'result__score-value' }, '0')
    const stars = starRow(reward.stars, 3, 'stars--result')
    const xpFill = progressBar(kit.services.ranks.progress(xp.before, xp.xpBefore), 'progress--xp progress--lg')
    const canForge = kit.services.forge.affordablePlanets() > 0

    const earned = PARTICLE_COLORS.filter((color) => reward.particles[color] > 0)

    const actions: HTMLElement[] = []
    if (won && !isDaily) {
      actions.push(button({ label: UK.result.next, variant: 'primary', size: 'lg', icon: 'arrow', onClick: () => choose('next') }))
    }
    if (!won && !isDaily) {
      actions.push(button({ label: UK.result.retry, variant: 'primary', size: 'lg', icon: 'retry', onClick: () => choose('retry') }))
    }
    const secondary: HTMLElement[] = []
    if (canForge) {
      secondary.push(
        button({
          label: UK.result.toForge,
          variant: isDaily ? 'primary' : 'secondary',
          icon: 'forge',
          badge: kit.services.forge.affordablePlanets(),
          onClick: () => choose('forge'),
        }),
      )
    }
    if (won && !isDaily && reward.stars < 3) {
      secondary.push(button({ label: UK.result.retry, variant: 'secondary', icon: 'retry', onClick: () => choose('retry') }))
    }
    secondary.push(button({ label: UK.result.menu, variant: isDaily && !canForge ? 'primary' : 'ghost', icon: 'home', onClick: () => choose('menu') }))

    const content = h(
      'div',
      { class: cx('result', won ? 'result--win' : 'result--lose') },
      h('div', { class: 'result__glow' }),
      h('h2', { class: 'result__title' }, title),
      isDaily ? h('p', { class: 'result__subtitle' }, UK.result.dailyDone) : null,
      won ? stars : h('p', { class: 'result__subtitle' }, UK.result.loseText),
      won
        ? null
        : h(
            'ul',
            { class: 'result__groups' },
            groups.map((group) =>
              h(
                'li',
                { class: cx('result__group', `result__group--${group.color}`) },
                h('strong', null, group.title),
                h('span', null, group.words.join(', ')),
              ),
            ),
          ),
      h(
        'div',
        { class: 'result__score' },
        h('span', { class: 'result__label' }, UK.result.score),
        scoreValue,
      ),
      h(
        'ul',
        { class: 'result__lines' },
        reward.lines.map((line) =>
          h(
            'li',
            { class: cx('result__line', line.value < 0 && 'result__line--minus') },
            h('span', null, UK.result.lines[line.kind]),
            h('span', { class: 'result__line-value' }, `${line.value > 0 ? '+' : ''}${formatNumber(line.value)}`),
          ),
        ),
      ),
      earned.length
        ? h(
            'div',
            { class: 'result__earned' },
            h('span', { class: 'result__label' }, UK.result.earned),
            h('div', { class: 'result__chips' }, earned.map((color) => particleChip(color, reward.particles[color], 'particle-chip--gain'))),
            summary.bonusHints > 0 ? h('span', { class: 'result__bonus' }, UK.result.bonusHint) : null,
          )
        : null,
      h(
        'div',
        { class: 'result__xp' },
        h(
          'div',
          { class: 'result__xp-head' },
          h('span', { class: 'result__rank' }, xp.after.title),
          h('span', { class: 'result__xp-value' }, `${formatNumber(xp.xpAfter)} / ${formatNumber(xp.after.to)}`),
        ),
        xpFill,
        rankBonus
          ? h(
              'div',
              { class: 'result__rankup' },
              h('strong', null, UK.result.rankUp),
              h('span', null, UK.profile.rankReward),
            )
          : null,
      ),
      summary.dailyStreak !== null && summary.dailyStreak > 0
        ? h('p', { class: 'result__streak' }, UK.result.streak(summary.dailyStreak, plural(summary.dailyStreak, UK.forms.days)))
        : null,
      h('div', { class: 'result__actions' }, actions),
      h('div', { class: 'result__secondary' }, secondary),
    )

    const handle = kit.overlays.show(content, { variant: 'full', dismissible: false, className: 'overlay--result' })
    handle.onClose.on(() => resolve(choice))

    void (async () => {
      await wait(250)
      countUp(scoreValue, reward.score, 900)
      const starItems = [...stars.querySelectorAll<HTMLElement>('.stars__item--on')]
      for (const [index, item] of starItems.entries()) {
        await wait(260)
        item.classList.add('stars__item--pop')
        kit.feedback('star', 'select', 1 + index * 0.18)
      }
      await wait(300)
      const fill = xpFill.querySelector<HTMLElement>('.progress__fill')
      const target = xp.rankUps > 0 ? 1 : kit.services.ranks.progress(xp.after, xp.xpAfter)
      if (fill) fill.style.width = `${(target * 100).toFixed(1)}%`
      if (xp.rankUps > 0) {
        await wait(700)
        if (fill) {
          fill.style.transition = 'none'
          fill.style.width = '0%'
          void fill.offsetWidth
          fill.style.transition = ''
          fill.style.width = `${(kit.services.ranks.progress(xp.after, xp.xpAfter) * 100).toFixed(1)}%`
        }
        kit.feedback('reveal', 'success')
      }
    })()
  })
