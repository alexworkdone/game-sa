import type { Button } from '@sa/core'
import { PEARL_KINDS, PEARLS } from '../config/pearls.js'
import type { PearlKind } from '../config/pearls.js'
import { PERKS } from '../config/perks.js'
import type { PerkDef } from '../config/perks.js'
import { tierName } from '../config/tiers.js'
import { drawPerkIcon } from '../render/Icons.js'
import type { Progress } from '../systems/Progress.js'
import { createButton } from '../ui/Buttons.js'
import type { UpgradeCardState } from '../ui/UpgradeCard.js'
import { CardShopScene } from './CardShopScene.js'
import type { ShopExit } from './CardShopScene.js'
import type { ExchangeParams } from './ExchangeScene.js'
import type { Feats } from './Feats.js'

export class RelicsScene extends CardShopScene<PerkDef> {
  readonly name = 'relics'

  private readonly workshop: Button

  constructor(progress: Progress, feats: Feats) {
    super(progress, PERKS, (def) => (r, x, y, size) => drawPerkIcon(r, def.id, x, y, size), feats)
    this.workshop = createButton('Майстерня', 'secondary', 'md', 170)
    this.workshop.onActivate.on(() => this.leave('workshop'))
  }

  protected title(): string {
    return 'Реліквії маяка'
  }

  protected subtitle(): string | null {
    if (this.progress.perksUnlocked) {
      return `Вічні, на всіх складностях. 1-й рівень — за ${PEARLS.white.name}, 2-й — ще й рожеві, 3-й — ще й чорні, 4-й — ще й райдужні`
    }
    return `Відкриються на складності «${tierName(2)}»: прокачай усі апгрейди до максимуму — і в меню з'явиться перехід`
  }

  protected cardState(def: PerkDef): UpgradeCardState {
    const price = this.progress.perkPrice(def)
    return {
      level: this.progress.perkLevel(def.id),
      maxLevel: def.maxLevel,
      price: price?.map((tag) => ({ ...tag, enough: this.progress.wallet(tag.kind) >= tag.amount })) ?? null,
      affordable: this.progress.canAffordPerk(def),
      locked: !this.progress.perksUnlocked,
    }
  }

  protected wallets(): readonly PearlKind[] {
    return PEARL_KINDS.slice(0, Math.max(1, Math.min(this.progress.maxTier, PEARL_KINDS.length)))
  }

  protected purchase(def: PerkDef): boolean {
    return this.progress.buyPerk(def.id)
  }

  protected exits(): ShopExit[] {
    return [{ widget: this.workshop, activate: () => this.leave('workshop'), align: 'start' }]
  }

  protected canExchange(): boolean {
    return this.progress.perksUnlocked
  }

  protected openExchange(): void {
    const params: ExchangeParams = { back: 'relics' }
    this.context.scenes.change('exchange', params)
  }

  protected onEscape(): void {
    this.leave('menu')
  }

  protected onBack(): void {
    this.leave('menu')
  }

  private leave(target: 'menu' | 'workshop'): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    this.context.scenes.change(target)
  }
}
