import type { Button } from '@sa/core'
import { UI_PRIMARY_THEME, UI_SECONDARY_THEME } from '../config/theme.js'
import { tierCostLabel, tierName, tierNumeral } from '../config/tiers.js'
import { UPGRADES } from '../config/upgrades.js'
import { PEARLS, pearlKindOf } from '../config/pearls.js'
import type { PearlKind } from '../config/pearls.js'
import type { UpgradeDef } from '../config/upgrades.js'
import { drawUpgradeIcon } from '../render/Icons.js'
import type { Progress } from '../systems/Progress.js'
import { createButton } from '../ui/Buttons.js'
import type { UpgradeCardState } from '../ui/UpgradeCard.js'
import { CardShopScene } from './CardShopScene.js'
import type { ShopExit } from './CardShopScene.js'
import type { PlayParams } from './PlayScene.js'
import type { ExchangeParams } from './ExchangeScene.js'
import type { Feats } from './Feats.js'

export interface WorkshopParams {
  readonly nextFloor?: number
}

type Exit = 'menu' | 'play' | 'resume'

export class WorkshopScene extends CardShopScene<UpgradeDef> {
  readonly name = 'workshop'

  private readonly play: Button
  private readonly continueButton: Button
  private readonly advance: Button
  private nextFloor: number | null = null

  constructor(progress: Progress, feats: Feats) {
    super(progress, UPGRADES, (def) => (r, x, y, size) => drawUpgradeIcon(r, def.id, x, y, size), feats)
    this.play = createButton('Грати', 'primary', 'md', 200)
    this.continueButton = createButton('', 'primary', 'md', 260)
    this.advance = createButton('Новий рівень складності →', 'primary', 'md', 290)
    this.play.onActivate.on(() => this.leave('play'))
    this.continueButton.onActivate.on(() => this.leave('resume'))
    this.advance.onActivate.on(() => this.advanceTier())
  }

  protected canExchange(): boolean {
    return this.progress.maxTier > 1
  }

  protected openExchange(): void {
    const params: ExchangeParams =
      this.nextFloor !== null ? { back: 'workshop', backParams: { nextFloor: this.nextFloor } } : { back: 'workshop' }
    this.context.scenes.change('exchange', params)
  }

  protected override prepare(params?: unknown): void {
    this.nextFloor = (params as WorkshopParams | undefined)?.nextFloor ?? null
    this.header.backLabel = this.nextFloor !== null ? 'У меню' : 'Меню'
  }

  protected title(): string {
    return 'Майстерня доглядача'
  }

  protected subtitle(): string | null {
    const tier = this.progress.tier
    const parts: string[] = []
    if (this.nextFloor !== null) parts.push(`Перерва між поверхами · далі поверх ${this.nextFloor}`)
    if (tier > 1) parts.push(`Складність ${tierNumeral(tier)} «${tierName(tier)}» · ${PEARLS[pearlKindOf(tier)].name} · ціни ${tierCostLabel(tier)}`)
    return parts.length > 0 ? parts.join(' · ') : null
  }

  protected cardState(def: UpgradeDef): UpgradeCardState {
    const cost = this.progress.nextCost(def)
    return {
      level: this.progress.level(def.id),
      maxLevel: def.costs.length,
      price: cost === null ? null : [{ kind: this.progress.pearlKind, amount: cost, enough: cost <= this.progress.pearls }],
      affordable: this.progress.canAfford(def),
      locked: false,
    }
  }

  protected wallets(): readonly PearlKind[] {
    return [this.progress.pearlKind]
  }

  protected purchase(def: UpgradeDef): boolean {
    return this.progress.buy(def.id)
  }

  protected override afterPurchase(): void {
    if (this.nextFloor === null && this.progress.canAdvance) this.rebuild()
    else this.refresh()
  }

  protected exits(): ShopExit[] {
    const list: ShopExit[] = []
    if (this.nextFloor !== null) {
      this.continueButton.label = `Далі — поверх ${this.nextFloor}`
      return [...list, { widget: this.continueButton, activate: () => this.leave('resume'), align: 'end' }]
    }
    const advancing = this.progress.canAdvance
    this.play.setTheme(advancing ? UI_SECONDARY_THEME : UI_PRIMARY_THEME)
    list.push({ widget: this.play, activate: () => this.leave('play'), align: 'end' })
    if (advancing) list.push({ widget: this.advance, activate: () => this.advanceTier(), align: 'end' })
    return list
  }

  protected onEscape(): void {
    this.leave(this.nextFloor !== null ? 'resume' : 'menu')
  }

  protected onBack(): void {
    this.leave('menu')
  }

  private advanceTier(): void {
    if (this.leaving || !this.progress.canAdvance) return
    const tier = this.progress.advanceTier()
    this.context.audio.play('floorClear')
    this.feats.achievements.check()
    this.showNotice(`Відкрито «${tierName(tier)}»: апгрейди з нуля за ${PEARLS[pearlKindOf(tier)].name}, ціни ${tierCostLabel(tier)}. Реліквії відкрито!`)
    this.rebuild()
  }

  private leave(target: Exit): void {
    if (this.leaving) return
    this.leaving = true
    this.context.audio.play('uiTap')
    if (target === 'menu') {
      this.context.scenes.change('menu')
      return
    }
    const params: PlayParams = target === 'resume' ? { resume: true } : { startFloor: this.progress.startFloor }
    this.context.scenes.change('play', params)
  }
}
