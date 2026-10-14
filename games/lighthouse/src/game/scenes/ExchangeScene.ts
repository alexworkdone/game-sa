import { Scene, UiLayer } from '@sa/core'
import type { Button, GameContext, IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { EXCHANGE_PAIRS, PEARL_KINDS, pearlCount, pearlTier } from '../config/pearls.js'
import type { ExchangeRate } from '../config/pearls.js'
import { drawPearl } from '../render/Icons.js'
import type { Progress } from '../systems/Progress.js'
import { createButton } from '../ui/Buttons.js'
import { FocusRing } from '../ui/FocusRing.js'
import { HEADER, ScreenHeader } from '../ui/ScreenHeader.js'
import { drawWallets } from '../ui/WalletStrip.js'
import type { Feats } from './Feats.js'

export interface ExchangeParams {
  readonly back: 'relics' | 'workshop'
  readonly backParams?: unknown
}

interface Offer {
  readonly button: Button
  readonly batch: number | null
}

interface ExchangeSide {
  readonly rate: ExchangeRate
  readonly offers: readonly Offer[]
}

const BATCHES: readonly (number | null)[] = [10, 100, 1000, null]
const ROW_H = 94
const ROW_GAP = 12
const LIST_TOP = HEADER.bottom + 16
const BUTTON_W = 60
const BUTTON_GAP = 6
const BUTTON_TOP = 16
const PREVIEW_Y = 70
const SIDE_PAD = 18

export class ExchangeScene extends Scene<GameContext> {
  readonly name = 'exchange'

  private readonly progress: Progress
  private readonly feats: Feats
  private readonly ui = new UiLayer()
  private readonly focus = new FocusRing()
  private readonly header = new ScreenHeader('Назад')
  private rows: (readonly [ExchangeSide, ExchangeSide])[] = []
  private returnTo: ExchangeParams = { back: 'relics' }
  private bump = 0
  private time = 0
  private leaving = false

  constructor(progress: Progress, feats: Feats) {
    super()
    this.progress = progress
    this.feats = feats
    this.header.onBack.on(() => this.leave())
  }

  protected override onEnter(params?: unknown): void {
    this.returnTo = (params as ExchangeParams | undefined) ?? { back: 'relics' }
    this.leaving = false
    this.rows = EXCHANGE_PAIRS.filter((pair) => pearlTier(pair.up.to) <= this.progress.maxTier).map(
      (pair) => [this.side(pair.up), this.side(pair.down)] as const,
    )
    this.ui.clear()
    for (const row of this.rows) for (const side of row) for (const offer of side.offers) this.ui.add(offer.button)
    this.ui.add(this.header.back)
    this.focus.set(
      this.rows.flatMap((row) =>
        row.flatMap((side) => side.offers.map((offer) => ({ widget: offer.button, activate: () => this.trade(side, offer) }))),
      ),
      BATCHES.length * 2,
    )
    this.sync()
    this.layout()
  }

  private side(rate: ExchangeRate): ExchangeSide {
    const offers = BATCHES.map((batch) => ({
      batch,
      button: createButton(batch === null ? 'Усе' : '', batch === null ? 'ghost' : 'secondary', 'sm', BUTTON_W, 15),
    }))
    const side = { rate, offers }
    for (const offer of offers) offer.button.onActivate.on(() => this.trade(side, offer))
    return side
  }

  protected override onExit(): void {
    this.ui.clear()
    this.context.juice.clear()
  }

  override resize(): void {
    this.layout()
  }

  private get rowWidth(): number {
    return this.context.viewport.safeArea.width - HEADER.side * 2
  }

  private layout(): void {
    const safe = this.context.viewport.safeArea
    this.header.layout(safe)
    const x = safe.x + HEADER.side
    const half = this.rowWidth / 2
    this.rows.forEach((row, index) => {
      const y = safe.y + LIST_TOP + index * (ROW_H + ROW_GAP) + BUTTON_TOP
      row.forEach((side, slot) => {
        let left = x + half * (slot + 1) - SIDE_PAD - BATCHES.length * BUTTON_W - (BATCHES.length - 1) * BUTTON_GAP
        for (const offer of side.offers) {
          offer.button.setBounds({ x: left, y })
          left += BUTTON_W + BUTTON_GAP
        }
      })
    })
  }

  private lots(side: ExchangeSide, offer: Offer): number {
    const available = this.progress.exchangeLots(side.rate)
    if (offer.batch === null) return available
    const lots = Math.floor(offer.batch / side.rate.give)
    return lots <= available ? lots : 0
  }

  private sync(): void {
    for (const row of this.rows) {
      for (const side of row) {
        for (const offer of side.offers) {
          if (offer.batch !== null) offer.button.label = String(Math.floor(offer.batch / side.rate.give) * side.rate.give)
          offer.button.enabled = this.lots(side, offer) > 0
        }
      }
    }
  }

  private trade(side: ExchangeSide, offer: Offer): void {
    if (this.leaving) return
    const { rate } = side
    const done = this.progress.exchange(rate, this.lots(side, offer))
    if (done <= 0) {
      this.context.audio.play('deny')
      return
    }
    this.context.audio.play('buy')
    this.bump = 1
    this.context.juice.texts.spawn({
      x: offer.button.x + BUTTON_W / 2,
      y: offer.button.y - 6,
      value: `+${pearlCount(rate.get * done, rate.to)}`,
      color: PALETTE.good,
      size: 15,
    })
    this.feats.achievements.check()
    this.sync()
  }

  private leave(): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.context.scenes.change(this.returnTo.back, this.returnTo.backParams)
  }

  update(dt: number): void {
    this.time += dt
    this.bump = Math.max(0, this.bump - dt * 3)
    this.ui.update(dt)
    if (this.leaving) return
    const input = this.context.input
    if (input.wasKeyPressed('Escape')) {
      this.leave()
      return
    }
    if (!this.ui.handleInput(input)) this.focus.handle(input)
  }

  render(r: IRenderer): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    r.rect(0, 0, viewport.width, viewport.height, { fill: PALETTE.night })
    this.header.render(r, safe, 'Каса маяка', {
      text: 'Курс в обидва боки: 100 білих = 10 рожевих = 1 чорна = ⅓ райдужної',
      fill: PALETTE.inkMuted,
    })
    const kinds = PEARL_KINDS.slice(0, Math.max(1, Math.min(this.progress.maxTier, PEARL_KINDS.length)))
    drawWallets(r, this.progress, kinds, safe.x + safe.width - HEADER.side - 4, safe.y + HEADER.titleY, 26 * (1 + this.bump * 0.15))

    const x = safe.x + HEADER.side
    const width = this.rowWidth
    this.rows.forEach((row, index) => {
      const y = safe.y + LIST_TOP + index * (ROW_H + ROW_GAP)
      r.roundRect(x, y, width, ROW_H, 16, { fill: PALETTE.surface, alpha: 0.95 })
      r.line(x + width / 2, y + 14, x + width / 2, y + ROW_H - 14, 1.5, { stroke: PALETTE.surfaceActive })
      row.forEach((side, slot) => this.drawSide(r, side, x + (width / 2) * slot, y))
    })
    if (this.rows.length === 0) {
      r.text('Каса відкриється разом зі складністю II', safe.x + safe.width / 2, safe.y + LIST_TOP + 20, {
        fill: PALETTE.inkMuted,
        size: 16,
        weight: 700,
        align: 'center',
        baseline: 'middle',
      })
    }
    this.ui.render(r)
    this.drawPreviews(r)
    this.focus.render(r, this.time)
    this.context.juice.renderEffects(r)
    this.feats.toast.render(r, viewport.width)
  }

  private drawSide(r: IRenderer, side: ExchangeSide, x: number, y: number): void {
    const { rate } = side
    const cy = y + 32
    const amount = { fill: PALETTE.ink, size: 19, weight: 900, baseline: 'middle' } as const
    drawPearl(r, x + SIDE_PAD + 10, cy, 20, 1, rate.from)
    r.text(String(rate.give), x + SIDE_PAD + 24, cy + 1, amount)
    const arrowX = x + SIDE_PAD + 24 + r.measureText(String(rate.give), amount) + 12
    r.polygon([arrowX, cy - 6, arrowX + 12, cy, arrowX, cy + 6], { fill: PALETTE.accent })
    drawPearl(r, arrowX + 30, cy, 20, 1, rate.to)
    r.text(String(rate.get), arrowX + 44, cy + 1, amount)
    const have = this.progress.wallet(rate.from)
    const enough = have >= rate.give
    r.text(`у тебе ${have}`, x + SIDE_PAD, y + ROW_H - 24, {
      fill: enough ? PALETTE.inkMuted : PALETTE.danger,
      size: 12.5,
      weight: 700,
      baseline: 'middle',
    })
  }

  private drawPreviews(r: IRenderer): void {
    for (const row of this.rows) {
      for (const side of row) {
        for (const offer of side.offers) {
          const lots = offer.batch === null ? this.progress.exchangeLots(side.rate) : Math.floor(offer.batch / side.rate.give)
          if (lots <= 0) continue
          const label = `+${lots * side.rate.get}`
          const style = { size: 12, weight: 800 } as const
          const cx = offer.button.x + BUTTON_W / 2
          const cy = offer.button.y - BUTTON_TOP + PREVIEW_Y
          const width = 11 + 3 + r.measureText(label, style)
          const alpha = offer.button.enabled ? 1 : 0.35
          r.push()
          r.alpha(alpha)
          drawPearl(r, cx - width / 2 + 5.5, cy, 11, 1, side.rate.to)
          r.text(label, cx - width / 2 + 14, cy + 0.5, { ...style, fill: PALETTE.good, baseline: 'middle' })
          r.pop()
        }
      }
    }
  }
}
