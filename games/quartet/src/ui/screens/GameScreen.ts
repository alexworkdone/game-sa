import { CoreEvent } from '@sa/core'
import { measure, play } from '../../fx/flip.js'
import { UK } from '../../i18n/uk.js'
import type { Puzzle, PuzzleGroup } from '../../puzzle/Puzzle.js'
import { GROUP_SIZE, PuzzleSession } from '../../puzzle/PuzzleSession.js'
import type { GuessResult } from '../../puzzle/PuzzleSession.js'
import { hyphenPoints, splitAt } from '../../render/hyphenate.js'
import { icon } from '../../render/icons.js'
import type { ParticleColor } from '../../shared/ParticleColor.js'
import { PARTICLE_COLORS, emptyAmounts } from '../../shared/ParticleColor.js'
import { button, centerOf, particleChip, particleHex } from '../components.js'
import { append, cx, h, wait } from '../dom.js'
import { confirmDialog } from '../overlays/ConfirmDialog.js'
import { offerHint } from '../overlays/HintOffer.js'
import { showResult } from '../overlays/ResultOverlay.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

export type GameParams = { readonly mode: 'level'; readonly level: number } | { readonly mode: 'daily' }

const TILE_FONT = 17
const TILE_FONT_TWO_LINES = 15
const TILE_FONT_MIN = 10
const TWO_LINES_BELOW = 11.5
const FIT_SAFETY = 0.94
const TILE_PADDING = 4
const GRID_GAP = 8
const PREVIEW_PARTICLES = 10

export class GameScreen extends Screen<GameParams> {
  private session: PuzzleSession | null = null
  private revealed: PuzzleGroup[] = []
  private readonly tiles = new Map<string, HTMLButtonElement>()
  private earned = emptyAmounts()
  private busy = false
  private touched = false
  private lifeOffered = false
  private gameplayActive = false
  private measureContext: CanvasRenderingContext2D | null = null

  private grid!: HTMLElement
  private solvedList!: HTMLElement
  private banners!: HTMLElement
  private lives!: HTMLElement
  private earnedRow!: HTMLElement
  private submitButton!: HTMLButtonElement
  private clearButton!: HTMLButtonElement
  private hintButton!: HTMLButtonElement

  constructor(kit: UiKit) {
    super(kit, 'game')
  }

  override enter(params: GameParams): void {
    const { levels, daily, dailyTracker, portal, analytics } = this.kit.services
    let puzzle: Puzzle
    try {
      puzzle = params.mode === 'level' ? levels.get(params.level) : daily.get(dailyTracker.seed)
    } catch (error) {
      analytics.track('puzzle_error', { message: (error as Error).message })
      this.kit.toast.show(UK.game.unavailable, 'warn', 2600)
      window.setTimeout(() => this.kit.nav.go({ name: 'home' }), 0)
      return
    }
    this.session = new PuzzleSession(puzzle)
    this.revealed = []
    this.earned = emptyAmounts()
    this.busy = false
    this.touched = false
    this.lifeOffered = false
    super.enter(params)
    portal.gameplayStart()
    this.gameplayActive = true
    analytics.track(CoreEvent.GameplayStart, {
      mode: params.mode,
      level: params.mode === 'level' ? params.level : dailyTracker.dayNumber,
    })
  }

  override leave(): void {
    super.leave()
    this.stopGameplay()
    this.session?.dispose()
    this.session = null
    this.tiles.clear()
  }

  protected override bind(): void {
    this.listen(this.kit.services.wallet.onChange, () => this.syncHintButton())
    const onResize = (): void => this.fitWords()
    window.addEventListener('resize', onResize)
    this.cleanup(() => window.removeEventListener('resize', onResize))
    void document.fonts
      ?.load(`900 ${TILE_FONT}px Nunito`, 'ЖОВТИЙ')
      .then(() => this.fitWords())
      .catch(() => undefined)
  }

  protected render(): void {
    const session = this.session
    if (!session) return
    this.grid = h('div', { class: 'board__grid', role: 'group' })
    this.solvedList = h('div', { class: 'board__solved' })
    this.banners = h('div', { class: 'board__banners' })
    this.lives = h('div', { class: 'lives', 'aria-label': UK.game.mistakes })
    this.earnedRow = h('div', { class: 'game__earned' })
    this.submitButton = button({ label: UK.game.submit, variant: 'primary', size: 'lg', onClick: () => void this.submit() })
    this.clearButton = button({ label: UK.game.clear, variant: 'secondary', size: 'lg', onClick: () => this.clearSelection() })
    this.hintButton = button({ icon: 'bulb', variant: 'secondary', ariaLabel: UK.game.hint, className: 'game__hint', onClick: () => void this.useHint() })

    append(this.element,
      h(
        'header',
        { class: 'game__header' },
        button({ icon: 'back', variant: 'ghost', ariaLabel: UK.result.menu, className: 'game__back', onClick: () => void this.back() }),
        h('div', { class: 'game__heading' }, h('h1', { class: 'game__title' }, this.title()), h('p', { class: 'game__subtitle' }, UK.game.subtitle)),
        this.hintButton,
      ),
      h('div', { class: 'game__status' }, h('div', { class: 'game__lives' }, h('span', { class: 'game__label' }, UK.game.mistakes), this.lives), this.earnedRow),
      h('div', { class: 'board' }, this.solvedList, this.banners, this.grid),
      h(
        'div',
        { class: 'game__actions' },
        button({ icon: 'shuffle', variant: 'secondary', size: 'lg', ariaLabel: UK.game.shuffle, onClick: () => this.shuffle() }),
        this.clearButton,
        this.submitButton,
      ),
    )
    this.renderBoard()
    this.renderLives()
    this.renderEarned()
    this.syncHintButton()
  }

  private title(): string {
    if (this.params.mode === 'level') return UK.game.level(this.params.level)
    const date = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    return `${UK.game.daily} · ${date}`
  }

  private renderBoard(): void {
    const session = this.session
    if (!session) return
    const bars = [...session.solved, ...this.revealed].map((group) =>
      h(
        'div',
        { class: cx('solved', `solved--${group.color}`, this.revealed.includes(group) && 'solved--revealed'), 'data-id': group.categoryId },
        h('h3', { class: 'solved__title' }, group.title),
        h('p', { class: 'solved__words' }, group.words.join(', ')),
      ),
    )
    this.solvedList.replaceChildren(...bars)
    const hidden = new Set(this.revealed.flatMap((group) => group.words))
    const words = session.remaining.filter((word) => !hidden.has(word))
    this.tiles.clear()
    this.grid.replaceChildren(
      ...words.map((word) => {
        const tile = h(
          'button',
          {
            type: 'button',
            class: 'tile',
            'data-word': word,
            on: { click: () => this.toggle(word) },
          },
          h('span', { class: 'tile__text' }, word),
        )
        this.tiles.set(word, tile)
        return tile
      }),
    )
    this.renderBanners()
    this.syncSelection()
    this.fitWords()
  }

  private renderBanners(): void {
    const session = this.session
    if (!session) return
    this.banners.replaceChildren(
      ...session.hintedTitles.map((group) =>
        h('div', { class: cx('hint-banner', `hint-banner--${group.color}`) }, h('span', { class: 'hint-banner__icon', html: icon('bulb') }), group.title),
      ),
    )
  }

  private renderLives(): void {
    const session = this.session
    if (!session) return
    const dots = Array.from({ length: session.maxLives }, (_, index) =>
      h('span', { class: cx('lives__dot', index >= session.lives && 'lives__dot--lost') }),
    )
    this.lives.replaceChildren(...dots)
  }

  private renderEarned(): void {
    this.earnedRow.replaceChildren(
      ...PARTICLE_COLORS.map((color) =>
        h('span', { class: cx('game__earned-item', this.earned[color] > 0 && 'game__earned-item--on'), 'data-color': color }, particleChip(color, this.earned[color])),
      ),
    )
  }

  private syncSelection(): void {
    const session = this.session
    if (!session) return
    const hintColor = new Map<string, ParticleColor>()
    for (const group of session.puzzle.groups) {
      for (const word of group.words) if (session.hintedWords.has(word)) hintColor.set(word, group.color)
    }
    for (const [word, tile] of this.tiles) {
      const selected = session.selected.has(word)
      tile.classList.toggle('tile--selected', selected)
      tile.setAttribute('aria-pressed', String(selected))
      const hinted = hintColor.get(word)
      tile.classList.toggle('tile--hinted', hinted !== undefined)
      if (hinted) tile.style.setProperty('--hint', `var(--${hinted})`)
    }
    this.submitButton.disabled = !session.canSubmit || this.busy
    this.clearButton.disabled = session.selected.size === 0 || this.busy
  }

  private syncHintButton(): void {
    if (!this.hintButton) return
    const hints = this.kit.services.wallet.hints
    this.hintButton.querySelector('.badge')?.remove()
    this.hintButton.append(h('span', { class: cx('badge', hints === 0 && 'badge--muted') }, hints > 0 ? String(hints) : '+'))
  }

  private fitWords(): void {
    const width = this.grid?.clientWidth ?? 0
    if (!width) return
    const inner = ((width - GRID_GAP * 3) / 4 - TILE_PADDING * 2) * FIT_SAFETY
    const context = this.measureContext ?? document.createElement('canvas').getContext('2d')
    this.measureContext = context
    if (!context) return
    const family = getComputedStyle(this.grid).getPropertyValue('--font-body').trim() || 'sans-serif'
    context.font = `900 ${TILE_FONT}px ${family}`
    const fontFor = (lines: readonly string[], cap: number): number => {
      const widest = Math.max(...lines.map((line) => context.measureText(line).width + line.length * TILE_FONT * 0.02))
      return Math.min(cap, (TILE_FONT * inner) / widest)
    }
    for (const [word, tile] of this.tiles) {
      let lines: readonly string[] = [word]
      let size = fontFor(lines, TILE_FONT)
      if (size < TWO_LINES_BELOW) {
        for (const point of hyphenPoints(word)) {
          const parts = splitAt(word, point)
          const candidate = fontFor(parts, TILE_FONT_TWO_LINES)
          if (candidate > size) {
            size = candidate
            lines = parts
          }
        }
      }
      tile.style.setProperty('--fs', `${Math.max(TILE_FONT_MIN, size).toFixed(2)}px`)
      tile.querySelector('.tile__text')?.replaceChildren(...lines.map((line) => h('span', { class: 'tile__line' }, line)))
    }
  }

  private toggle(word: string): void {
    const session = this.session
    if (!session || this.busy) return
    const wasSelected = session.selected.has(word)
    if (!session.toggle(word)) {
      if (session.selected.size >= GROUP_SIZE) this.tiles.get(word)?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }],
        { duration: 160 },
      )
      return
    }
    this.touched = true
    this.kit.feedback(wasSelected ? 'deselect' : 'select', 'tap')
    this.syncSelection()
  }

  private clearSelection(): void {
    if (this.busy) return
    this.session?.clearSelection()
    this.kit.feedback('deselect', 'tap')
    this.syncSelection()
  }

  private shuffle(): void {
    const session = this.session
    if (!session || this.busy) return
    const before = measure(this.tiles.values(), (tile) => tile.dataset.word ?? '')
    session.shuffle()
    this.kit.feedback('shuffle', 'tap')
    const selected = new Set(session.selected)
    this.renderBoard()
    for (const word of selected) this.tiles.get(word)?.classList.add('tile--selected')
    play(this.tiles.values(), (tile) => tile.dataset.word ?? '', before, 420)
  }

  private async submit(): Promise<void> {
    const session = this.session
    if (!session || this.busy || !session.canSubmit) return
    this.busy = true
    this.touched = true
    this.syncSelection()
    const before = session.solved.length
    const picked = [...session.selected]
    const result = session.submit()
    if (!result) {
      this.busy = false
      return
    }
    if (result.verdict === 'correct') {
      const fresh = session.solved.slice(before)
      for (const [index, group] of fresh.entries()) await this.animateSolve(group, index === 0 ? picked : group.words)
    } else {
      await this.animateMiss(result, picked)
    }
    this.busy = false
    this.syncSelection()
    if (session.status === 'won') await this.finish(true)
    else if (session.status === 'lost') await this.outOfLives()
  }

  private async animateSolve(group: PuzzleGroup, words: readonly string[]): Promise<void> {
    const colorIndex = PARTICLE_COLORS.indexOf(group.color)
    words.forEach((word, index) => {
      const tile = this.tiles.get(word)
      if (!tile) return
      tile.style.setProperty('--i', String(index))
      tile.style.setProperty('--group', `var(--${group.color})`)
      tile.classList.add('tile--hop')
    })
    this.kit.feedback('correct', 'success', 1 + colorIndex * 0.12)
    const praise = UK.game.praise[Math.floor(Math.random() * UK.game.praise.length)] ?? ''
    this.kit.toast.show(praise, 'success', 900)
    await wait(560)

    const rest = [...this.tiles.values()].filter((tile) => !group.words.includes(tile.dataset.word ?? ''))
    const before = measure(rest, (tile) => tile.dataset.word ?? '')
    this.renderBoard()
    play(this.tiles.values(), (tile) => tile.dataset.word ?? '', before)

    const bar = this.solvedList.querySelector<HTMLElement>(`[data-id="${group.categoryId}"]`)
    if (bar) {
      bar.classList.add('solved--enter')
      const origin = centerOf(bar)
      const hex = particleHex(group.color)
      this.kit.fx.burst(origin, [hex, '#ffffff'], 28)
      const target = this.earnedRow.querySelector(`[data-color="${group.color}"]`)
      if (target) {
        this.kit.fx.fly(origin, centerOf(target), hex, 10, () => {
          this.earned[group.color] += PREVIEW_PARTICLES
          this.renderEarned()
          this.earnedRow.querySelector(`[data-color="${group.color}"]`)?.classList.add('game__earned-item--pulse')
          this.kit.feedback('coin', null)
        })
      }
    }
    await wait(420)
  }

  private async animateMiss(result: GuessResult, words: readonly string[]): Promise<void> {
    if (result.verdict === 'repeat') {
      this.kit.toast.show(UK.game.repeat, 'warn')
      this.kit.feedback('deselect', 'tap')
      return
    }
    for (const word of words) this.tiles.get(word)?.classList.add('tile--shake')
    this.kit.feedback(result.verdict === 'one-away' ? 'almost' : 'wrong', 'error')
    this.kit.toast.show(result.verdict === 'one-away' ? UK.game.oneAway : UK.game.wrong, 'warn')
    const dot = this.lives.querySelectorAll('.lives__dot:not(.lives__dot--lost)')
    dot[dot.length - 1]?.classList.add('lives__dot--losing')
    await wait(480)
    for (const word of words) this.tiles.get(word)?.classList.remove('tile--shake')
    this.renderLives()
  }

  private async useHint(): Promise<void> {
    const session = this.session
    if (!session || this.busy || session.status !== 'playing') return
    const { wallet } = this.kit.services
    if (wallet.hints <= 0 && !(await offerHint(this.kit))) return
    const hint = session.hint()
    if (!hint) return
    wallet.useHint()
    this.touched = true
    this.kit.feedback('reveal', 'select')
    this.kit.toast.show(hint.revealedTitle ? UK.game.hintTitle(hint.group.title) : UK.game.hintWord, 'info', 2200)
    this.renderBanners()
    this.syncSelection()
  }

  private async outOfLives(): Promise<void> {
    const session = this.session
    if (!session) return
    if (!this.lifeOffered) {
      this.lifeOffered = true
      const { ads, analytics } = this.kit.services
      analytics.track(CoreEvent.RewardedOffered, { placement: 'life' })
      const agreed = await confirmDialog(this.kit, {
        title: UK.game.outTitle,
        text: UK.game.outText,
        confirm: UK.game.outWatch,
        cancel: UK.game.outGiveUp,
        icon: 'heart',
        confirmIcon: 'video',
        dismissible: false,
      })
      this.stopGameplay()
      if (agreed && (await ads.rewarded())) {
        analytics.track(CoreEvent.RewardedWatched, { placement: 'life' })
        session.grantLife()
        this.kit.services.portal.gameplayStart()
        this.gameplayActive = true
        this.renderLives()
        this.syncSelection()
        return
      }
    }
    for (const group of session.revealAll()) {
      const before = measure(this.tiles.values(), (tile) => tile.dataset.word ?? '')
      this.revealed.push(group)
      this.renderBoard()
      play(this.tiles.values(), (tile) => tile.dataset.word ?? '', before)
      this.solvedList.querySelector(`[data-id="${group.categoryId}"]`)?.classList.add('solved--enter')
      this.kit.feedback('deselect', null)
      await wait(520)
    }
    await this.finish(false)
  }

  private async finish(won: boolean): Promise<void> {
    const session = this.session
    if (!session) return
    this.stopGameplay()
    const params = this.params
    const { resolver, analytics, forge, dailyTracker } = this.kit.services
    if (won) {
      this.kit.fx.confetti(PARTICLE_COLORS.map((color) => particleHex(color)))
      this.kit.feedback('reveal', 'success')
      await wait(900)
    } else {
      await wait(500)
    }
    const summary = resolver.resolve({
      mode: params.mode,
      level: params.mode === 'level' ? params.level : dailyTracker.dayNumber,
      won,
      mistakes: session.mistakes,
      hintsUsed: session.hintsUsed,
      elapsedMs: session.elapsedMs,
      solvedColors: session.solved.map((group) => group.color),
    })
    analytics.track(won ? CoreEvent.RunComplete : CoreEvent.Fail, {
      mode: params.mode,
      level: summary.outcome.level,
      stars: summary.reward.stars,
      score: summary.reward.score,
      mistakes: session.mistakes,
      seconds: Math.round(session.elapsedMs / 1000),
    })
    const choice = await showResult(this.kit, summary, session.puzzle.groups)
    if (choice === 'forge' && forge.affordablePlanets() > 0) {
      this.kit.nav.go({ name: 'forge' })
      return
    }
    if (choice === 'next' && params.mode === 'level') {
      await this.kit.services.ads.maybeBreak()
      this.kit.nav.go({ name: 'game', mode: 'level', level: params.level + 1 })
      return
    }
    if (choice === 'retry' && params.mode === 'level') {
      this.kit.nav.go({ name: 'game', mode: 'level', level: params.level })
      return
    }
    this.kit.nav.go({ name: params.mode === 'daily' ? 'home' : 'levels' })
  }

  requestBack(): void {
    if (!this.busy) void this.back()
  }

  private async back(): Promise<void> {
    const session = this.session
    const exit = (): void => this.kit.nav.go({ name: this.params.mode === 'daily' ? 'home' : 'levels' })
    if (!session || session.status !== 'playing' || !this.touched) {
      exit()
      return
    }
    const leave = await confirmDialog(this.kit, {
      title: UK.game.leaveTitle,
      text: UK.game.leaveText,
      confirm: UK.game.leave,
      cancel: UK.game.stay,
      icon: 'info',
      confirmVariant: 'danger',
    })
    if (leave) exit()
  }

  private stopGameplay(): void {
    if (!this.gameplayActive) return
    this.gameplayActive = false
    this.kit.services.portal.gameplayStop()
  }
}
