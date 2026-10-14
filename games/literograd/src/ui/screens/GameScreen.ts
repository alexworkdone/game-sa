import { CoreEvent } from '@sa/core'
import type { ModeId } from '../../content/modes.js'
import { UK } from '../../i18n/uk.js'
import { RoundSession } from '../../round/RoundSession.js'
import type { RoundStats } from '../../round/RoundSession.js'
import { describeVariant } from '../../round/Variant.js'
import type { Variant } from '../../round/Variant.js'
import { button, iconEl } from '../components.js'
import { append, clear, cx, formatClock, formatDecimal, h, restartAnimation } from '../dom.js'
import { showResult } from '../overlays/ResultSheet.js'
import type { OverlayHandle } from '../OverlayHost.js'
import { Screen } from '../Screen.js'
import type { UiKit } from '../UiKit.js'

export interface GameParams {
  readonly mode: ModeId
}

const LOW_TIME_SECONDS = 10
const BAD_MS = 380
const FLOAT_MS = 900
const BANNER_MS = 1500
const DENSE_COLUMNS = 6

export class GameScreen extends Screen<GameParams> {
  private session: RoundSession | null = null
  private variant: Variant | null = null
  private result: OverlayHandle | null = null
  private leaving = false
  private waveTimer = 0
  private shownSecond = -1

  private readonly board = h('div', { class: 'board', role: 'group', 'aria-label': UK.game.board })
  private readonly wrap = h('div', { class: 'board-wrap' }, this.board)
  private readonly task = h('div', { class: 'task', 'aria-live': 'polite' })
  private readonly strip = h('div', { class: 'strip', 'aria-hidden': 'true' })
  private readonly time = h('div', { class: 'timer', 'aria-label': UK.game.timeLeft })
  private readonly barFill = h('i')
  private readonly bar = h('div', { class: 'timebar' }, this.barFill)
  private readonly earn = h('span')
  private readonly combo = h('span', { class: 'combo', title: UK.game.combo })
  private readonly hintCount = h('b')
  private readonly hint = button([UK.game.hint, this.hintCount], () => this.useHint(), 'line')

  constructor(kit: UiKit) {
    super(kit, 'screen--game')
    this.board.addEventListener('click', this.onBoardClick)
  }

  override enter(params: GameParams): void {
    this.leaving = false
    super.enter(params)
    this.startRound()
  }

  override leave(): void {
    this.leaving = true
    this.stopSession()
    void this.result?.close()
    this.result = null
    super.leave()
  }

  requestBack(): void {
    this.session?.finish()
  }

  protected render(): void {
    append(
      this.element,
      h(
        'div',
        { class: 'game-top' },
        button([iconEl('close'), UK.game.exit], () => this.session?.finish(), 'ghost', { small: true }),
        this.time,
      ),
      this.bar,
      h(
        'div',
        { class: 'game-info' },
        this.task,
        h(
          'div',
          { class: 'game-info__stats' },
          h('span', { class: 'earn', title: UK.game.roundInk }, iconEl('drop'), this.earn),
          this.combo,
        ),
      ),
      this.strip,
      this.wrap,
      h('div', { class: 'game-bottom' }, this.hint),
    )
  }

  protected override bind(): void {
    const onVisibility = (): void => {
      if (document.hidden) this.session?.pause()
      else this.session?.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    this.cleanup(() => document.removeEventListener('visibilitychange', onVisibility))
  }

  private startRound(): void {
    this.stopSession()
    void this.result?.close()
    this.result = null
    const { modes, prefs, perks, scheduler, portal, analytics } = this.kit.services
    const mode = modes.create(this.params.mode, prefs.values)
    const variant = describeVariant(this.params.mode, prefs.values)
    const session = new RoundSession(
      mode,
      { durationMs: perks.roundSeconds * 1000, comboCap: perks.comboCap, hints: perks.hints, multiplier: variant.multiplier },
      scheduler,
    )
    this.variant = variant
    this.session = session
    this.shownSecond = -1
    session.onTick.on((remaining) => this.drawTime(remaining))
    session.onFinish.on((stats) => this.onFinish(session, stats))
    this.board.classList.remove('board--leaving')
    this.wrap.querySelectorAll('.fx').forEach((node) => node.remove())
    session.start()
    this.drawBoard()
    this.drawTask()
    this.drawStats()
    this.drawHint()
    this.drawTime(session.remainingMs)
    portal.gameplayStart()
    analytics.track(CoreEvent.GameplayStart, { mode: this.params.mode, variant: variant.key })
  }

  private stopSession(): void {
    window.clearTimeout(this.waveTimer)
    const session = this.session
    if (!session) return
    session.finish()
    session.dispose()
    this.session = null
  }

  private onFinish(session: RoundSession, stats: RoundStats): void {
    const variant = this.variant
    if (!variant) return
    const { resolver, portal, analytics } = this.kit.services
    window.clearTimeout(this.waveTimer)
    portal.gameplayStop()
    const report = resolver.settle(stats, variant)
    analytics.track(CoreEvent.GameplayEnd, {
      mode: session.mode.id,
      variant: variant.key,
      gained: report.gained,
      correct: stats.correct,
      wrong: stats.wrong,
    })
    if (this.leaving) return
    this.result = showResult(this.kit, report, session.mode.id, {
      again: () => this.startRound(),
      home: () => this.kit.nav.go({ name: 'town' }),
    })
  }

  private readonly onBoardClick = (event: Event): void => {
    const tile = (event.target as Element).closest<HTMLButtonElement>('.tile')
    const session = this.session
    if (!tile || !session) return
    const index = Number(tile.dataset.index)
    const outcome = session.tap(index)
    if (!outcome || outcome.result.kind === 'ignore') return
    const { result } = outcome
    if (result.kind === 'miss') {
      restartAnimation(tile, 'tile--bad')
      window.setTimeout(() => tile.classList.remove('tile--bad'), BAD_MS)
      this.drawStats()
      return
    }
    this.float(tile, `+${formatDecimal(outcome.gain)}`)
    tile.classList.remove('tile--hint')
    if (result.bonus) this.banner(`${result.bonus.text} +${formatDecimal(outcome.bonusGain)}`)
    if (result.change === 'tile') {
      const label = session.mode.tiles[index]?.label ?? ''
      tile.textContent = label
      tile.setAttribute('aria-label', label)
      restartAnimation(tile, 'tile--fresh')
    } else {
      tile.classList.add('tile--found')
    }
    if (result.change === 'board') this.nextWave(session)
    this.drawTask()
    this.drawStats()
  }

  private nextWave(session: RoundSession): void {
    this.board.classList.add('board--leaving')
    this.waveTimer = window.setTimeout(() => {
      if (session !== this.session || session.finished) return
      session.advance()
      this.board.classList.remove('board--leaving')
      this.drawBoard()
      this.drawTask()
    }, session.mode.waveDelayMs)
  }

  private useHint(): void {
    const session = this.session
    if (!session) return
    const index = session.useHint()
    if (index >= 0) this.board.querySelector(`[data-index="${index}"]`)?.classList.add('tile--hint')
    this.drawHint()
  }

  private drawBoard(): void {
    const mode = this.session?.mode
    if (!mode) return
    this.board.style.setProperty('--cols', String(mode.columns))
    this.board.classList.toggle('board--dense', mode.columns >= DENSE_COLUMNS)
    clear(this.board)
    append(
      this.board,
      mode.tiles.map((tile, index) =>
        h(
          'button',
          { type: 'button', class: cx('tile', tile.found && 'tile--found'), 'data-index': String(index), 'aria-label': tile.label },
          tile.label,
        ),
      ),
    )
  }

  private drawTask(): void {
    const mode = this.session?.mode
    if (!mode) return
    const view = mode.task()
    clear(this.task)
    append(
      this.task,
      h('span', null, view.lead),
      h('b', { class: 'task__glyph' }, view.glyph),
      view.tail ? h('span', { class: 'task__tail' }, view.tail) : null,
    )
    clear(this.strip)
    this.strip.hidden = view.strip === null
    if (view.strip) {
      const at = view.strip.at
      append(
        this.strip,
        view.strip.items.map((item, index) => h('span', { class: cx(index < at && 'done', index === at && 'next') }, item)),
      )
    }
  }

  private drawStats(): void {
    const session = this.session
    if (!session) return
    this.earn.textContent = String(Math.floor(session.earnedSoFar))
    const multiplier = session.multiplier
    this.combo.textContent = `×${formatDecimal(multiplier)}`
    this.combo.classList.toggle('combo--hot', multiplier > 1)
  }

  private drawHint(): void {
    const session = this.session
    if (!session) return
    this.hint.hidden = session.config.hints === 0
    this.hint.disabled = session.hints <= 0
    this.hintCount.textContent = String(session.hints)
  }

  private drawTime(remaining: number): void {
    const session = this.session
    if (!session) return
    const seconds = Math.ceil(remaining / 1000)
    if (seconds !== this.shownSecond) {
      this.shownSecond = seconds
      this.time.textContent = formatClock(remaining)
      const low = seconds <= LOW_TIME_SECONDS
      this.time.classList.toggle('timer--low', low)
      this.bar.classList.toggle('timebar--low', low)
    }
    this.barFill.style.transform = `scaleX(${Math.max(0, remaining / session.config.durationMs)})`
  }

  private float(tile: HTMLElement, text: string): void {
    const box = this.wrap.getBoundingClientRect()
    const rect = tile.getBoundingClientRect()
    this.fx(text, 'fx', rect.left - box.left + rect.width / 2, rect.top - box.top + rect.height / 2, FLOAT_MS)
  }

  private banner(text: string): void {
    const box = this.wrap.getBoundingClientRect()
    this.fx(text, 'fx fx--banner', box.width / 2, box.height / 2, BANNER_MS)
  }

  private fx(text: string, className: string, x: number, y: number, ttl: number): void {
    const node = h('span', { class: className, style: `left:${x}px;top:${y}px` }, text)
    this.wrap.appendChild(node)
    window.setTimeout(() => node.remove(), ttl)
  }
}
