import { UK } from '../../i18n/uk.js'
import { CHAPTER_SIZE, CHEST_STARS } from '../../meta/LevelProgress.js'
import type { ChapterInfo } from '../../meta/LevelProgress.js'
import { icon } from '../../render/icons.js'
import { PARTICLE_COLORS } from '../../shared/ParticleColor.js'
import { centerOf, iconSpan, particleHex, starRow } from '../components.js'
import { append, cx, formatNumber, h } from '../dom.js'
import { showBundle } from '../overlays/BundleOverlay.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

const WAVE = [0, 0.55, 0.85, 0.55, 0, -0.55, -0.85, -0.55, 0, 0.55]
const NODE_STEP = 96
const AMPLITUDE = 30
const PATH_BOTTOM = 72
const PATH_EXTRA = 24

export class LevelsScreen extends Screen {
  private scrolled = false

  constructor(kit: UiKit) {
    super(kit, 'levels')
  }

  override enter(): void {
    this.scrolled = false
    super.enter()
  }

  protected override bind(): void {
    this.listen(this.kit.services.progress.onChange, () => this.refresh())
    requestAnimationFrame(() => this.scrollToCurrent())
  }

  protected render(): void {
    const { progress } = this.kit.services
    const lastChapter = progress.chapterOf(progress.current) + 1
    append(this.element,
      h(
        'header',
        { class: 'screen__header' },
        h('h1', { class: 'screen__title' }, UK.levels.title),
        h('span', { class: 'stat-pill' }, iconSpan('star', 'stat-pill__icon'), formatNumber(progress.totalStars)),
      ),
      h(
        'div',
        { class: 'levels__chapters' },
        Array.from({ length: lastChapter + 1 }, (_, index) => this.chapter(progress.chapter(lastChapter - index))),
      ),
    )
  }

  private chapter(info: ChapterInfo): HTMLElement {
    const { progress } = this.kit.services
    const name = UK.chapters[info.index % UK.chapters.length] ?? ''
    const height = CHAPTER_SIZE * NODE_STEP + PATH_EXTRA
    const nodes: HTMLElement[] = []
    const points: string[] = []
    for (let offset = 0; offset < CHAPTER_SIZE; offset++) {
      const level = info.first + offset
      const x = WAVE[offset % WAVE.length] ?? 0
      const y = height - PATH_BOTTOM - offset * NODE_STEP
      points.push(`${(50 + x * AMPLITUDE).toFixed(1)},${y}`)
      nodes.push(this.node(level, x, y))
    }
    return h(
      'section',
      { class: cx('chapter', !info.unlocked && 'chapter--locked') },
      this.chest(info, progress.current),
      h(
        'div',
        { class: 'chapter__path', style: `height:${height}px` },
        h('div', {
          class: 'chapter__trail',
          html: `<svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points.join(' ')}" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`,
        }),
        nodes.reverse(),
      ),
      h(
        'div',
        { class: 'chapter__head' },
        h('div', { class: 'chapter__names' }, h('span', { class: 'chapter__index' }, UK.levels.chapter(info.index)), h('h2', { class: 'chapter__name' }, name)),
        h('span', { class: 'chapter__stars' }, iconSpan('star'), `${info.stars}/${info.maxStars}`),
      ),
    )
  }

  private node(level: number, x: number, y: number): HTMLElement {
    const { progress } = this.kit.services
    const stars = progress.starsFor(level)
    const current = level === progress.current
    const unlocked = progress.isUnlocked(level)
    return h(
      'div',
      { class: 'level-node', style: `--x:${x};top:${y}px`, 'data-level': level },
      h(
        'button',
        {
          type: 'button',
          class: cx('level-node__button', current && 'level-node__button--current', !unlocked && 'level-node__button--locked', stars === 3 && 'level-node__button--perfect'),
          'aria-label': UK.home.level(level),
          on: { click: () => this.open(level) },
        },
        unlocked ? (current ? h('span', { class: 'level-node__play', html: icon('play') }) : h('span', { class: 'level-node__number' }, String(level))) : h('span', { class: 'level-node__lock', html: icon('lock') }),
      ),
      current ? h('span', { class: 'level-node__label' }, UK.home.level(level)) : unlocked && stars > 0 ? starRow(stars, 3, 'stars--node') : null,
    )
  }

  private chest(info: ChapterInfo, current: number): HTMLElement {
    const need = Math.max(0, CHEST_STARS - info.stars)
    const state = info.chestClaimed ? 'claimed' : info.chestReady ? 'ready' : 'locked'
    return h(
      'div',
      { class: cx('chest', `chest--${state}`) },
      h('span', { class: 'chest__icon', html: icon(info.chestClaimed ? 'check' : 'gift') }),
      h(
        'div',
        { class: 'chest__body' },
        h('span', { class: 'chest__title' }, UK.levels.chest),
        h(
          'span',
          { class: 'chest__text' },
          info.chestClaimed ? UK.levels.chestClaimed : info.chestReady ? `${info.stars}/${CHEST_STARS}\u00a0★` : info.first > current ? UK.levels.locked : UK.levels.chestHint(need),
        ),
      ),
      info.chestReady
        ? h(
            'button',
            { type: 'button', class: 'btn btn--accent btn--md chest__open', on: { click: (event) => void this.claim(info.index, event) } },
            h('span', { class: 'btn__label' }, UK.levels.chestOpen),
          )
        : null,
    )
  }

  private async claim(index: number, event: Event): Promise<void> {
    const origin = event.currentTarget instanceof HTMLElement ? centerOf(event.currentTarget) : null
    const bundle = this.kit.services.resolver.claimChest(index)
    if (!bundle) return
    if (origin) this.kit.fx.burst(origin, PARTICLE_COLORS.map((color) => particleHex(color)), 40)
    await showBundle(this.kit, { title: UK.rewards.chestTitle, subtitle: UK.levels.chapter(index), icon: 'gift', bundle })
  }

  private open(level: number): void {
    const { progress } = this.kit.services
    if (!progress.isUnlocked(level)) {
      this.kit.feedback('deselect', 'error')
      this.kit.toast.show(UK.levels.locked, 'warn')
      return
    }
    this.kit.feedback('tap', 'select')
    this.kit.nav.go({ name: 'game', mode: 'level', level })
  }

  private scrollToCurrent(): void {
    if (this.scrolled) return
    this.scrolled = true
    const node = this.element.querySelector<HTMLElement>(`[data-level="${this.kit.services.progress.current}"]`)
    if (!node) return
    const nodeRect = node.getBoundingClientRect()
    const viewRect = this.element.getBoundingClientRect()
    const target = this.element.scrollTop + nodeRect.top - viewRect.top - (this.element.clientHeight - nodeRect.height) / 2
    this.element.scrollTo({ top: Math.max(0, target) })
  }
}
