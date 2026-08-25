import { Button, Ease, Scene, UiLayer, defaultTheme } from '@sa/core'
import type { DailySeed, GameContext, IRenderer, UiTheme } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { RunSummary } from '../systems/RunRecords.js'
import type { PlayParams } from './PlayScene.js'

const THEME: UiTheme = {
  ...defaultTheme,
  text: PALETTE.ink,
  textMuted: PALETTE.inkMuted,
  surface: PALETTE.surface,
  surfaceActive: PALETTE.grid,
  accent: PALETTE.friendly,
}

export class ResultScene extends Scene<GameContext> {
  readonly name = 'result'

  private readonly dailySeed: DailySeed
  private readonly ui = new UiLayer()

  private summary: RunSummary | null = null
  private appear = 0
  private replay: Button | null = null
  private dailyRun: Button | null = null
  private sound: Button | null = null

  constructor(dailySeed: DailySeed) {
    super()
    this.dailySeed = dailySeed
  }

  protected override onEnter(params?: unknown): void {
    this.summary = (params as RunSummary | undefined) ?? null
    this.appear = 0
    this.buildUi()
  }

  protected override onExit(): void {
    this.ui.clear()
  }

  override resize(): void {
    this.buildUi()
  }

  private buildUi(): void {
    const safe = this.context.viewport.safeArea
    const centerX = safe.x + safe.width / 2
    const baseY = safe.y + safe.height * 0.62
    const width = Math.min(260, safe.width - 60)

    this.ui.clear()

    this.replay = this.ui.add(
      new Button({
        x: centerX - width / 2,
        y: baseY,
        width,
        height: 56,
        label: 'ЩЕ РАЗ',
        theme: THEME,
        fontSize: 20,
      }),
    )
    this.replay.onActivate.on(() => this.startRun(false))

    this.dailyRun = this.ui.add(
      new Button({
        x: centerX - width / 2,
        y: baseY + 68,
        width,
        height: 46,
        label: `ВЕЖА ДНЯ #${this.dailySeed.dayNumber()}`,
        theme: THEME,
        fontSize: 15,
        variant: 'ghost',
      }),
    )
    this.dailyRun.onActivate.on(() => this.startRun(true))

    this.sound = this.ui.add(
      new Button({
        x: safe.x + safe.width - 66,
        y: safe.y + 18,
        width: 48,
        height: 48,
        label: this.context.audio.muted ? '🔇' : '🔊',
        theme: THEME,
        fontSize: 20,
        variant: 'ghost',
      }),
    )
    this.sound.onActivate.on((button) => {
      const muted = this.context.audio.toggleMuted()
      button.label = muted ? '🔇' : '🔊'
      this.context.analytics.track('setting_changed', { setting: 'muted', value: muted })
      if (!muted) this.context.audio.play('uiTap')
    })
  }

  private startRun(daily: boolean): void {
    this.context.audio.play('uiTap')
    const params: PlayParams = daily
      ? { seed: this.dailySeed.seedFor(), daily: true, dayNumber: this.dailySeed.dayNumber() }
      : {
          seed: `practice-${Math.floor(Math.random() * 1e9).toString(36)}`,
          daily: false,
          dayNumber: this.dailySeed.dayNumber(),
        }
    this.context.scenes.change('play', params)
  }

  update(dt: number): void {
    this.appear = Math.min(1, this.appear + dt * 2.2)
    this.ui.handleInput(this.context.input)
    this.ui.update(dt)
  }

  render(renderer: IRenderer, _alpha: number): void {
    const safe = this.context.viewport.safeArea
    const centerX = safe.x + safe.width / 2
    const rise = (1 - Ease.outCubic(this.appear)) * 26
    const summary = this.summary

    renderer.rect(-renderer.width, -renderer.height, renderer.width * 3, renderer.height * 3, {
      fill: PALETTE.background,
      alpha: 0.86,
    })

    const titleY = safe.y + safe.height * 0.2 + rise
    renderer.text(summary?.daily ? 'ВЕЖА ДНЯ' : 'ТРЕНУВАННЯ', centerX, titleY, {
      fill: PALETTE.inkMuted,
      size: 15,
      weight: 700,
      align: 'center',
      baseline: 'middle',
      alpha: this.appear,
    })

    renderer.text(String(summary?.score ?? 0), centerX, titleY + 54, {
      fill: summary?.isPersonalBest ? PALETTE.reward : PALETTE.ink,
      size: 72,
      weight: 800,
      align: 'center',
      baseline: 'middle',
      alpha: this.appear,
      ...(summary?.isPersonalBest
        ? { glow: PALETTE.reward, glowSize: 24 }
        : {}),
    })

    if (summary?.isPersonalBest) {
      renderer.text('НОВИЙ РЕКОРД', centerX, titleY + 100, {
        fill: PALETTE.reward,
        size: 14,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      })
    }

    const stats: Array<[string, string]> = [
      ['РЕКОРД', String(summary?.best ?? 0)],
      ['ХВИЛЯ', String((summary?.wave ?? 0) + 1)],
      ['СЕРІЯ', `${summary?.streak ?? 0} дн`],
    ]
    const statY = titleY + 140
    const spacing = Math.min(96, safe.width / 4)
    stats.forEach(([label, value], index) => {
      const x = centerX + (index - 1) * spacing
      renderer.text(value, x, statY, {
        fill: PALETTE.ink,
        size: 22,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      })
      renderer.text(label, x, statY + 22, {
        fill: PALETTE.inkMuted,
        size: 11,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      })
    })

    this.ui.render(renderer)
  }
}
