import { Scene, UiLayer } from '@sa/core'
import type { Button, GameContext, IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import type { PearlKind } from '../config/pearls.js'
import { drawWallets } from '../ui/WalletStrip.js'
import type { Progress } from '../systems/Progress.js'
import type { Feats } from './Feats.js'
import { BUTTON_SIZES } from '../ui/Buttons.js'
import { FocusRing } from '../ui/FocusRing.js'
import { IconButton } from '../ui/IconButton.js'
import { HEADER, ScreenHeader } from '../ui/ScreenHeader.js'
import { UpgradeCard } from '../ui/UpgradeCard.js'
import type { CardDef, IconPainter, UpgradeCardState } from '../ui/UpgradeCard.js'

export interface ShopExit {
  readonly widget: Button
  readonly activate: () => void
  readonly align: 'start' | 'end'
}

const COLUMNS = 5
const CARD_H = 172
const GAP = 14
const GRID_TOP = HEADER.bottom + 4
const FOOTER_BOTTOM = 20
const EXIT_GAP = 12
const NOTICE_TIME = 6
const EXCHANGE_SIZE = 44
const EXCHANGE_GAP = 14

export abstract class CardShopScene<T extends CardDef> extends Scene<GameContext> {
  protected readonly progress: Progress
  protected readonly feats: Feats
  protected readonly cards: UpgradeCard<T>[]
  protected time = 0
  protected leaving = false

  protected readonly header = new ScreenHeader()
  private readonly exchangeButton = new IconButton({ x: 0, y: 0, width: EXCHANGE_SIZE, height: EXCHANGE_SIZE, icon: 'exchange' })
  private readonly ui = new UiLayer()
  private readonly focus = new FocusRing()
  private exitList: ShopExit[] = []
  private balanceBump = 0
  private denied = 0
  private notice = ''
  private noticeTimer = 0

  constructor(progress: Progress, defs: readonly T[], icon: (def: T) => IconPainter, feats: Feats) {
    super()
    this.progress = progress
    this.feats = feats
    this.cards = defs.map((def) => {
      const card = new UpgradeCard(def, icon(def), { x: 0, y: 0, width: 0, height: CARD_H })
      card.onActivate.on(() => this.buy(card))
      return card
    })
    this.header.onBack.on(() => this.onBack())
    this.exchangeButton.onActivate.on(() => this.goExchange())
  }

  protected abstract title(): string
  protected abstract subtitle(): string | null
  protected abstract cardState(def: T): UpgradeCardState
  protected abstract purchase(def: T): boolean
  protected abstract exits(): ShopExit[]
  protected abstract onEscape(): void
  protected abstract onBack(): void
  protected abstract wallets(): readonly PearlKind[]
  protected abstract canExchange(): boolean
  protected abstract openExchange(): void

  protected override onEnter(params?: unknown): void {
    this.leaving = false
    this.noticeTimer = 0
    this.prepare(params)
    this.feats.achievements.check()
    this.rebuild()
  }

  protected prepare(_params?: unknown): void {}

  protected override onExit(): void {
    this.ui.clear()
  }

  override resize(): void {
    this.layout()
  }

  protected rebuild(): void {
    this.ui.clear()
    for (const card of this.cards) this.ui.add(card)
    this.ui.add(this.header.back)
    this.exchangeButton.visible = this.canExchange()
    if (this.exchangeButton.visible) this.ui.add(this.exchangeButton)
    const exits = this.exits()
    this.exitList = [...exits.filter((exit) => exit.align === 'start'), ...exits.filter((exit) => exit.align === 'end')]
    for (const exit of this.exitList) this.ui.add(exit.widget)
    this.focus.set(
      [...this.cards.map((card) => ({ widget: card, activate: () => this.buy(card) })), ...this.exitList],
      COLUMNS,
    )
    this.refresh()
    this.layout()
  }

  private goExchange(): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.openExchange()
  }

  protected showNotice(text: string): void {
    this.notice = text
    this.noticeTimer = NOTICE_TIME
  }

  private layout(): void {
    const safe = this.context.viewport.safeArea
    this.header.layout(safe)
    this.exchangeButton.setBounds({
      x: safe.x + safe.width - HEADER.side - EXCHANGE_SIZE,
      y: safe.y + HEADER.titleY - EXCHANGE_SIZE / 2,
    })
    const cardW = (safe.width - HEADER.side * 2 - GAP * (COLUMNS - 1)) / COLUMNS
    const x0 = safe.x + HEADER.side
    const y0 = safe.y + GRID_TOP
    this.cards.forEach((card, index) => {
      const col = index % COLUMNS
      const row = Math.floor(index / COLUMNS)
      const inRow = Math.min(COLUMNS, this.cards.length - row * COLUMNS)
      const shift = ((COLUMNS - inRow) * (cardW + GAP)) / 2
      card.setBounds({ x: x0 + shift + col * (cardW + GAP), y: y0 + row * (CARD_H + GAP), width: cardW })
    })
    const by = safe.y + safe.height - FOOTER_BOTTOM - BUTTON_SIZES.md.height
    let left = safe.x + HEADER.side
    let right = safe.x + safe.width - HEADER.side
    for (const exit of this.exitList.filter((item) => item.align === 'start')) {
      exit.widget.setBounds({ x: left, y: by })
      left += exit.widget.width + EXIT_GAP
    }
    for (const exit of this.exitList.filter((item) => item.align === 'end').reverse()) {
      right -= exit.widget.width
      exit.widget.setBounds({ x: right, y: by })
      right -= EXIT_GAP
    }
  }

  protected refresh(): void {
    for (const card of this.cards) card.state = this.cardState(card.def)
  }

  private buy(card: UpgradeCard<T>): void {
    if (this.leaving) return
    const { audio, juice } = this.context
    if (!this.purchase(card.def)) {
      audio.play('deny')
      this.denied = 0.4
      return
    }
    audio.play('buy')
    card.celebrate()
    this.balanceBump = 1
    juice.particles.emit({
      x: card.x + card.width / 2,
      y: card.y + card.height / 2,
      count: 24,
      speedMin: 80,
      speedMax: 260,
      lifeMin: 0.3,
      lifeMax: 0.7,
      colors: [PALETTE.accent, PALETTE.light, PALETTE.pearl],
      gravity: 300,
    })
    this.feats.achievements.check()
    this.afterPurchase()
  }

  protected afterPurchase(): void {
    this.refresh()
  }

  update(dt: number): void {
    this.time += dt
    this.balanceBump = Math.max(0, this.balanceBump - dt * 3)
    this.denied = Math.max(0, this.denied - dt)
    this.noticeTimer = Math.max(0, this.noticeTimer - dt)
    this.ui.update(dt)
    if (this.leaving) return
    const input = this.context.input
    if (input.wasKeyPressed('Escape')) {
      this.onEscape()
      return
    }
    if (!this.ui.handleInput(input)) this.focus.handle(input)
  }

  render(r: IRenderer): void {
    const viewport = this.context.viewport
    const safe = viewport.safeArea
    r.rect(0, 0, viewport.width, viewport.height, { fill: PALETTE.night })
    const notice = this.noticeTimer > 0 ? this.notice : null
    const line = notice ?? this.subtitle()
    this.header.render(r, safe, this.title(), line ? { text: line, fill: notice ? PALETTE.good : PALETTE.inkMuted } : null)
    const shake = this.denied > 0 ? Math.sin(this.time * 70) * 4 * this.denied : 0
    const scale = 1 + this.balanceBump * 0.2
    drawWallets(
      r,
      this.progress,
      this.wallets(),
      (this.exchangeButton.visible ? this.exchangeButton.x - EXCHANGE_GAP : safe.x + safe.width - HEADER.side - 4) + shake,
      safe.y + HEADER.titleY,
      26 * scale,
      this.denied > 0 ? PALETTE.danger : PALETTE.ink,
    )
    this.ui.render(r)
    this.focus.render(r, this.time)
    this.context.juice.renderEffects(r)
    this.feats.toast.render(r, viewport.width)
  }
}
