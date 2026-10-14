import { Scene, UiLayer } from '@sa/core'
import type { Button, GameContext, IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { UPGRADES } from '../config/upgrades.js'
import { tierTheme } from '../config/tiers.js'
import { DEATH_TITLES } from '../config/epitaphs.js'
import { LighthouseArt } from '../render/LighthouseArt.js'
import { drawPearl } from '../render/Icons.js'
import type { Progress } from '../systems/Progress.js'
import { createButton } from '../ui/Buttons.js'
import { FocusRing } from '../ui/FocusRing.js'
import type { PlayParams, RunSummary } from './PlayScene.js'
import type { Feats } from './Feats.js'

const BUTTON_W = 220
const BUTTON_GAP = 16

export class ResultScene extends Scene<GameContext> {
  readonly name = 'result'

  private readonly feats: Feats
  private readonly progress: Progress
  private readonly art = new LighthouseArt()
  private readonly ui = new UiLayer()
  private readonly focus = new FocusRing()
  private readonly again: Button
  private readonly workshop: Button
  private readonly menu: Button
  private summary: RunSummary | null = null
  private time = 0
  private leaving = false

  constructor(progress: Progress, feats: Feats) {
    super()
    this.progress = progress
    this.feats = feats
    this.menu = createButton('Меню', 'ghost', 'lg', BUTTON_W)
    this.workshop = createButton('Майстерня', 'secondary', 'lg', BUTTON_W)
    this.again = createButton('Ще раз', 'primary', 'lg', BUTTON_W)
    this.again.onActivate.on(() => this.go('play'))
    this.workshop.onActivate.on(() => this.go('workshop'))
    this.menu.onActivate.on(() => this.go('menu'))
  }

  protected override onEnter(params?: unknown): void {
    this.summary = (params as RunSummary | undefined) ?? null
    this.feats.achievements.check()
    this.time = 0
    this.leaving = false
    this.ui.clear()
    this.ui.add(this.menu)
    this.ui.add(this.workshop)
    this.ui.add(this.again)
    const canBuy = UPGRADES.some((def) => this.progress.canAfford(def))
    const entries = [
      { widget: this.menu, activate: () => this.go('menu') },
      { widget: this.workshop, activate: () => this.go('workshop') },
      { widget: this.again, activate: () => this.go('play') },
    ]
    this.focus.set(entries)
    this.focus.focus(canBuy ? 1 : 2)
    this.layout()
  }

  protected override onExit(): void {
    this.ui.clear()
  }

  override resize(): void {
    this.layout()
  }

  private layout(): void {
    const safe = this.context.viewport.safeArea
    const cx = safe.x + safe.width / 2
    const y = safe.y + 392
    this.menu.setBounds({ x: cx - BUTTON_W * 1.5 - BUTTON_GAP, y })
    this.workshop.setBounds({ x: cx - BUTTON_W / 2, y })
    this.again.setBounds({ x: cx + BUTTON_W / 2 + BUTTON_GAP, y })
  }

  private suggestLungs(summary: RunSummary): boolean {
    const lungs = UPGRADES.find((def) => def.id === 'lungs')
    if (!lungs || this.progress.isMaxed(lungs)) return false
    return summary.cause === 'water' || summary.keysUnderwater > 0
  }

  private go(target: 'play' | 'workshop' | 'menu'): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    if (target === 'play') {
      const params: PlayParams = { startFloor: this.progress.startFloor }
      this.context.scenes.change('play', params)
    } else {
      this.context.scenes.change(target)
    }
  }

  update(dt: number): void {
    this.time += dt
    this.ui.update(dt)
    if (this.leaving || this.time < 0.4) return
    const input = this.context.input
    if (!this.ui.handleInput(input)) this.focus.handle(input)
  }

  render(r: IRenderer): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    const cx = safe.x + safe.width / 2
    this.art.drawSky(r, viewport.width, viewport.height, this.time, tierTheme(this.progress.tier))
    this.art.drawSea(r, viewport.width, safe.y + 480, viewport.height, this.time, tierTheme(this.progress.tier))
    const summary = this.summary
    if (!summary) return

    const appear = Math.min(1, this.time * 2.5)
    r.text(DEATH_TITLES[summary.cause], cx, safe.y + 62, {
      fill: summary.cause === 'quit' ? PALETTE.accent : PALETTE.danger,
      size: 44,
      weight: 900,
      align: 'center',
      baseline: 'middle',
      alpha: appear,
    })
    r.text(summary.epitaph, cx, safe.y + 104, {
      fill: PALETTE.ink,
      size: 18,
      weight: 600,
      align: 'center',
      baseline: 'middle',
      alpha: appear,
    })

    r.roundRect(cx - 260, safe.y + 134, 520, 200, 18, { fill: PALETTE.surface, alpha: 0.92 })
    r.text('Поверх', cx - 130, safe.y + 170, {
      fill: PALETTE.inkMuted,
      size: 16,
      weight: 700,
      align: 'center',
      baseline: 'middle',
    })
    r.text(String(summary.floorReached), cx - 130, safe.y + 222, {
      fill: PALETTE.accent,
      size: 64,
      weight: 900,
      align: 'center',
      baseline: 'middle',
    })
    if (summary.record.newBest) {
      const pulse = 1 + Math.sin(this.time * 6) * 0.05
      r.text('Новий рекорд!', cx - 130, safe.y + 274, {
        fill: PALETTE.good,
        size: 17 * pulse,
        weight: 800,
        align: 'center',
        baseline: 'middle',
      })
    } else {
      r.text(`Рекорд: ${this.progress.bestFloor}`, cx - 130, safe.y + 274, {
        fill: PALETTE.inkMuted,
        size: 15,
        weight: 700,
        align: 'center',
        baseline: 'middle',
      })
    }

    const lx = cx + 10
    drawPearl(r, lx + 12, safe.y + 178, 18, 1, this.progress.pearlKind)
    r.text(`+${summary.pearls} за забіг`, lx + 30, safe.y + 179, {
      fill: PALETTE.ink,
      size: 20,
      weight: 800,
      baseline: 'middle',
    })
    r.text(`У кишені: ${this.progress.pearls}`, lx + 30, safe.y + 206, {
      fill: PALETTE.inkMuted,
      size: 15,
      weight: 600,
      baseline: 'middle',
    })
    r.text(`Потвор переможено: ${summary.kills}`, lx, safe.y + 242, {
      fill: PALETTE.ink,
      size: 16,
      weight: 700,
      baseline: 'middle',
    })
    if (summary.record.unlockedCheckpoint !== null) {
      r.text(`Ліфт: тепер можна стартувати з поверху ${summary.record.unlockedCheckpoint}`, cx, safe.y + 312, {
        fill: PALETTE.lampOn,
        size: 15,
        weight: 700,
        align: 'center',
        baseline: 'middle',
      })
    } else if (this.suggestLungs(summary)) {
      r.text('Порада: прокачай «Акваланг» у майстерні — більше повітря під водою', cx, safe.y + 312, {
        fill: PALETTE.waterFoam,
        size: 15,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: 0.75 + Math.sin(this.time * 4) * 0.25,
      })
    } else if (UPGRADES.some((def) => this.progress.canAfford(def))) {
      r.text('У майстерні вже є що купити', cx, safe.y + 312, {
        fill: PALETTE.accent,
        size: 15,
        weight: 700,
        align: 'center',
        baseline: 'middle',
        alpha: 0.7 + Math.sin(this.time * 4) * 0.3,
      })
    }
    this.ui.render(r)
    this.focus.render(r, this.time)
    this.feats.toast.render(r, viewport.width)
  }
}
