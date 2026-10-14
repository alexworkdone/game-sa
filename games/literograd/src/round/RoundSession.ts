import { Signal } from '@sa/core'
import type { IDisposable } from '@sa/core'
import type { IFrameScheduler } from './FrameScheduler.js'
import type { IRoundMode, TapResult } from './IRoundMode.js'

export interface RoundConfig {
  readonly durationMs: number
  readonly comboCap: number
  readonly hints: number
  readonly multiplier: number
}

export interface RoundStats {
  readonly correct: number
  readonly wrong: number
  readonly maxCombo: number
  readonly earned: number
  readonly elapsedMs: number
}

export interface TapOutcome {
  readonly result: TapResult
  readonly gain: number
  readonly bonusGain: number
}

type RoundState = 'idle' | 'running' | 'paused' | 'finished'

const MAX_FRAME_MS = 250
const COMBO_STEP = 5
const COMBO_INCREMENT = 0.5

export class RoundSession implements IDisposable {
  readonly onTick = new Signal<number>()
  readonly onFinish = new Signal<RoundStats>()
  readonly mode: IRoundMode
  readonly config: RoundConfig

  private readonly scheduler: IFrameScheduler
  private state: RoundState = 'idle'
  private handle = 0
  private last = 0
  private elapsed = 0
  private correct = 0
  private wrong = 0
  private streak = 0
  private maxCombo = 0
  private earned = 0
  private hintsLeft: number
  private hinted = -1
  private waiting = false

  constructor(mode: IRoundMode, config: RoundConfig, scheduler: IFrameScheduler) {
    this.mode = mode
    this.config = config
    this.scheduler = scheduler
    this.hintsLeft = config.hints
  }

  get running(): boolean {
    return this.state === 'running'
  }

  get finished(): boolean {
    return this.state === 'finished'
  }

  get remainingMs(): number {
    return Math.max(0, this.config.durationMs - this.elapsed)
  }

  get multiplier(): number {
    return Math.min(this.config.comboCap, 1 + Math.floor(this.streak / COMBO_STEP) * COMBO_INCREMENT)
  }

  get earnedSoFar(): number {
    return this.earned
  }

  get hints(): number {
    return this.hintsLeft
  }

  get stats(): RoundStats {
    return {
      correct: this.correct,
      wrong: this.wrong,
      maxCombo: this.maxCombo,
      earned: this.earned,
      elapsedMs: this.elapsed,
    }
  }

  start(): void {
    if (this.state !== 'idle') return
    this.mode.start()
    this.state = 'running'
    this.last = this.scheduler.now()
    this.handle = this.scheduler.request(this.frame)
  }

  pause(): void {
    if (this.state !== 'running') return
    this.state = 'paused'
    this.scheduler.cancel(this.handle)
  }

  resume(): void {
    if (this.state !== 'paused') return
    this.state = 'running'
    this.last = this.scheduler.now()
    this.handle = this.scheduler.request(this.frame)
  }

  finish(): void {
    if (this.state === 'finished' || this.state === 'idle') return
    this.state = 'finished'
    this.scheduler.cancel(this.handle)
    this.onFinish.emit(this.stats)
  }

  tap(index: number): TapOutcome | null {
    if (this.state !== 'running' || this.waiting) return null
    const result = this.mode.tap(index)
    if (result.kind === 'ignore') return { result, gain: 0, bonusGain: 0 }
    if (result.kind === 'miss') {
      this.wrong++
      this.streak = 0
      return { result, gain: 0, bonusGain: 0 }
    }
    this.correct++
    this.streak++
    this.maxCombo = Math.max(this.maxCombo, this.streak)
    this.hinted = -1
    const gain = (this.multiplier + result.extraBase) * this.config.multiplier
    const bonusGain = result.bonus ? result.bonus.amount * this.config.multiplier : 0
    this.earned += gain + bonusGain
    if (result.change === 'board') this.waiting = true
    return { result, gain, bonusGain }
  }

  advance(): void {
    if (this.state === 'finished') return
    this.mode.advance()
    this.waiting = false
    this.hinted = -1
  }

  useHint(): number {
    if (this.state !== 'running' || this.waiting) return -1
    const index = this.mode.hintIndex()
    if (index < 0 || index === this.hinted) return index
    if (this.hintsLeft <= 0) return -1
    this.hintsLeft--
    this.hinted = index
    return index
  }

  dispose(): void {
    this.scheduler.cancel(this.handle)
    this.state = 'finished'
    this.onTick.dispose()
    this.onFinish.dispose()
  }

  private readonly frame = (now: number): void => {
    if (this.state !== 'running') return
    this.elapsed += Math.min(now - this.last, MAX_FRAME_MS)
    this.last = now
    this.onTick.emit(this.remainingMs)
    if (this.remainingMs <= 0) {
      this.finish()
      return
    }
    this.handle = this.scheduler.request(this.frame)
  }
}
