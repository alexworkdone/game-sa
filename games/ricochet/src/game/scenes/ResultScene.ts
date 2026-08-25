import { Button, Ease, Scene, UiLayer, clamp } from '@sa/core'
import type { GameContext, IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'
import type { CommitResult, PartProgress } from '../systems/PartLedger.js'
import type { RunSummary } from '../systems/RunRecords.js'
import type { PlayParams } from './PlayScene.js'

export interface BaseSummary {
  readonly run: RunSummary
  readonly progress: CommitResult
  readonly runEnergy: number
  readonly lostEnergy: number
}

export class ResultScene extends Scene<GameContext> {
  readonly name = 'result'

  private readonly ui = new UiLayer()

  private summary: BaseSummary | null = null
  private appear = 0

  private get overflow(): number {
    return this.summary?.progress.overflow ?? 0
  }

  protected override onEnter(params?: unknown): void {
    this.summary = (params as BaseSummary | undefined) ?? null
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
    const baseY = safe.y + safe.height * 0.68
    const width = Math.min(250, safe.width - 60)

    this.ui.clear()

    const replay = this.ui.add(
      new Button({
        x: centerX - width / 2,
        y: baseY,
        width,
        height: 54,
        label: 'НОВИЙ ВИЛІТ',
        theme: UI_THEME,
        fontSize: 19,
      }),
    )
    replay.onActivate.on(() => this.startRun())

    const sound = this.ui.add(
      new Button({
        x: safe.x + safe.width - 64,
        y: safe.y + 16,
        width: 46,
        height: 46,
        label: this.context.audio.muted ? '🔇' : '🔊',
        theme: UI_THEME,
        fontSize: 18,
        variant: 'ghost',
      }),
    )
    sound.onActivate.on((button) => {
      const muted = this.context.audio.toggleMuted()
      button.label = muted ? '🔇' : '🔊'
      this.context.analytics.track('setting_changed', { setting: 'muted', value: muted })
      if (!muted) this.context.audio.play('uiTap')
    })
  }

  private startRun(): void {
    this.context.audio.play('uiTap')
    const params: PlayParams = {
      seed: `run-${Math.floor(Math.random() * 1e9).toString(36)}`,
    }
    this.context.scenes.change('play', params)
  }

  update(dt: number): void {
    this.appear = Math.min(1, this.appear + dt * 2)
    this.ui.handleInput(this.context.input)
    this.ui.update(dt)
  }

  render(renderer: IRenderer, _alpha: number): void {
    const safe = this.context.viewport.safeArea
    const centerX = safe.x + safe.width / 2
    const rise = (1 - Ease.outCubic(this.appear)) * 24
    const summary = this.summary
    const progress = summary?.progress

    renderer.rect(-renderer.width, -renderer.height, renderer.width * 3, renderer.height * 3, {
      fill: PALETTE.background,
      alpha: 0.9,
    })

    const top = safe.y + safe.height * 0.14 + rise

    const lost = (summary?.lostEnergy ?? 0) > 0
    const extracted = summary?.progress.partBuilt === true
    const title = lost
      ? 'БАЗА · КОНТЕЙНЕР ВТРАЧЕНО'
      : extracted
        ? 'БАЗА · ДЕТАЛЬ ЗІБРАНА'
        : 'БАЗА · ВІДВАНТАЖЕННЯ'
    renderer.text(
      title,
      centerX,
      top,
      {
        fill: lost ? PALETTE.hostile : extracted ? PALETTE.reward : PALETTE.inkMuted,
        size: 13,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      },
    )

    renderer.text(
      lost
        ? `−${(summary?.lostEnergy ?? 0).toFixed(1)} ГДж`
        : `+${(summary?.runEnergy ?? 0).toFixed(1)} ГДж`,
      centerX,
      top + 46,
      {
      fill: lost ? PALETTE.hostile : PALETTE.friendly,
      size: 46,
      weight: 800,
      align: 'center',
      baseline: 'middle',
      alpha: this.appear,
      glow: lost ? PALETTE.hostile : PALETTE.friendly,
      glowSize: 18,
      },
    )

    if (lost) {
      renderer.text('ВАНТАЖ ЗГОРІВ РАЗОМ ІЗ КОНТЕЙНЕРОМ', centerX, top + 78, {
        fill: PALETTE.hostile,
        size: 12,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear * 0.9,
      })
    }

    if (!lost && summary && summary.run.partsThisRun > 0) {
      renderer.text(
        `ЗІБРАНО ДЕТАЛЕЙ: ${summary.run.partsThisRun}`,
        centerX,
        top + 78,
        {
          fill: PALETTE.reward,
          size: 13,
          weight: 700,
          align: 'center',
          baseline: 'middle',
          alpha: this.appear,
        },
      )
    }

    this.renderReservoir(
      renderer,
      centerX,
      top + 110,
      safe.width,
      progress,
      summary?.runEnergy ?? 0,
    )

    const stats: Array<[string, string]> = [
      ['ДЕТАЛЕЙ', String(progress?.partsBuilt ?? 0)],
      ['РЕКОРД', `${(summary?.run.best ?? 0).toFixed(1)}`],
      ['СЕРІЯ', `${summary?.run.streak ?? 0} дн`],
    ]
    const statY = top + 176
    const spacing = Math.min(100, safe.width / 3.6)
    stats.forEach(([label, value], index) => {
      const x = centerX + (index - 1) * spacing
      renderer.text(value, x, statY, {
        fill: PALETTE.ink,
        size: 21,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      })
      renderer.text(label, x, statY + 21, {
        fill: PALETTE.inkMuted,
        size: 10,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      })
    })

    this.ui.render(renderer)
  }

  private renderReservoir(
    renderer: IRenderer,
    centerX: number,
    y: number,
    safeWidth: number,
    progress: PartProgress | undefined,
    runEnergy: number,
  ): void {
    const width = Math.min(280, safeWidth - 56)
    const x = centerX - width / 2
    const height = 16
    const capacity = progress?.capacity ?? 1
    const stored = progress?.reservoir ?? 0
    const ratio = clamp(stored / capacity, 0, 1)

    renderer.text('РЕЗЕРВУАР', x, y - 14, {
      fill: PALETTE.inkMuted,
      size: 11,
      weight: 700,
      align: 'left',
      baseline: 'middle',
      alpha: this.appear,
    })
    renderer.text(`${stored.toFixed(1)} / ${capacity} ГДж`, x + width, y - 14, {
      fill: ratio >= 1 ? PALETTE.hostile : PALETTE.reward,
      size: 11,
      weight: 800,
      align: 'right',
      baseline: 'middle',
      alpha: this.appear,
    })

    renderer.roundRect(x, y, width, height, 8, { fill: PALETTE.surface, alpha: this.appear })
    if (ratio > 0.01) {
      renderer.roundRect(x + 2, y + 2, (width - 4) * ratio, height - 4, 6, {
        fill: PALETTE.reward,
        alpha: this.appear,
        glow: PALETTE.reward,
        glowSize: 10,
      })
    }

    const nextTarget = progress?.currentTarget ?? 0
    renderer.text(
      `Деталь #${(progress?.partIndex ?? 0) + 1} потребує ${nextTarget} ГДж`,
      centerX,
      y + height + 14,
      {
        fill: PALETTE.inkMuted,
        size: 11,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        alpha: this.appear,
      },
    )
    if (this.overflow > 0) {
      renderer.text(
        `переповнення: −${this.overflow.toFixed(1)} ГДж`,
        centerX,
        y + height + 32,
        {
          fill: PALETTE.hostile,
          size: 11,
          weight: 700,
          align: 'center',
          baseline: 'middle',
          alpha: this.appear,
        },
      )
    }
  }
}
