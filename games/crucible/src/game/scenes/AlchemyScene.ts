import { CoreEvent, Ease, Scene, clamp, lerp } from '@sa/core'
import type { GameContext, IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { TEXT, TIMING } from '../config/layout.js'
import type { ElementDef, ElementId } from '../data/elements.js'

import { Stage } from '../entities/Stage.js'
import { Crucible } from '../entities/Crucible.js'
import { BoltPool } from '../entities/BoltPool.js'
import { GlyphPainter } from '../render/GlyphPainter.js'
import { ElementBadge } from '../render/ElementBadge.js'
import { CrucibleRenderer } from '../render/CrucibleRenderer.js'
import { DiscoveryFeed } from '../render/DiscoveryFeed.js'
import { ElementGrid } from '../ui/ElementGrid.js'
import type { TileState } from '../ui/ElementGrid.js'
import { CategoryBar } from '../ui/CategoryBar.js'
import type { FilterId } from '../ui/CategoryBar.js'
import { SettingsPanel } from '../ui/SettingsPanel.js'
import type { PanelAction } from '../ui/SettingsPanel.js'
import type { GridEntry } from '../ui/ElementGrid.js'
import { CATEGORIES } from '../data/categories.js'
import type { Settings } from '../systems/Settings.js'
import type { ElementRegistry } from '../systems/ElementRegistry.js'
import type { RecipeBook } from '../systems/RecipeBook.js'
import type { Discovery } from '../systems/Discovery.js'
import type { MixLog } from '../systems/MixLog.js'
import { HintBook } from '../systems/HintBook.js'
import { Hud } from './Hud.js'

const FRESH_LIFE = 1.4
const HALO_LAYERS = 7

export class AlchemyScene extends Scene<GameContext> {
  readonly name = 'alchemy'

  private readonly registry: ElementRegistry
  private readonly recipes: RecipeBook
  private readonly discovery: Discovery
  private readonly mixLog: MixLog
  private readonly settings: Settings
  private readonly hintBook = new HintBook()

  private readonly stage = new Stage()
  private readonly crucible = new Crucible()
  private readonly bolts = new BoltPool()
  private readonly glyphs = new GlyphPainter()
  private readonly badge = new ElementBadge(this.glyphs)
  private readonly grid = new ElementGrid()
  private readonly categoryBar = new CategoryBar()
  private readonly panel = new SettingsPanel()
  private readonly crucibleView: CrucibleRenderer
  private readonly feed: DiscoveryFeed
  private readonly hud: Hud
  private readonly fresh = new Map<ElementId, number>()

  private visible: ElementDef[] = []
  private entries: GridEntry[] = []
  private time = 0
  private idleTimer = 0
  private peekTimer = 0
  private peekKey = ''
  private peekTarget: ElementId | null = null
  private dragTarget: 'grid' | 'categories' | 'feed' | 'none' = 'none'
  private pointerActive = false
  private pressX = 0
  private pressY = 0
  private lastX = 0
  private lastY = 0
  private pressTime = 0
  private travelled = 0
  private gameplayLive = false

  constructor(
    registry: ElementRegistry,
    recipes: RecipeBook,
    discovery: Discovery,
    mixLog: MixLog,
    settings: Settings,
  ) {
    super()
    this.registry = registry
    this.recipes = recipes
    this.discovery = discovery
    this.mixLog = mixLog
    this.settings = settings
    this.crucibleView = new CrucibleRenderer(this.glyphs, registry)
    this.feed = new DiscoveryFeed(registry, recipes)
    this.hud = new Hud()
  }

  private readonly countOf = (id: FilterId): number =>
    id === 'all' ? this.discovery.count : this.discovery.countIn(id)

  private readonly totalOf = (id: FilterId): number =>
    id === 'all' ? this.discovery.total : this.registry.totalIn(id)

  protected override onEnter(): void {
    const { renderer, portal, analytics, juice } = this.context
    juice.clear()
    this.crucible.clear()
    this.bolts.clear()
    this.hud.clear()
    this.fresh.clear()
    this.hintBook.reset()
    this.time = 0
    this.idleTimer = 0
    this.peekTarget = null
    this.resize(renderer.width, renderer.height)
    portal.gameplayStart()
    this.gameplayLive = true
    analytics.track(CoreEvent.GameplayStart, { known: this.discovery.count })
  }

  protected override onExit(): void {
    if (this.gameplayLive) this.context.portal.gameplayStop()
    this.gameplayLive = false
  }

  override pause(): void {
    if (this.gameplayLive) this.context.portal.gameplayStop()
    this.gameplayLive = false
  }

  override resume(): void {
    if (!this.gameplayLive) {
      this.context.portal.gameplayStart()
      this.gameplayLive = true
    }
  }

  override resize(width: number, height: number): void {
    this.stage.resize(width, height)
    this.relayout()
  }

  private relayout(): void {
    this.categoryBar.layout(
      this.context.renderer,
      this.stage.categories,
      this.settings,
      this.countOf,
      this.totalOf,
    )
    this.panel.layout(this.stage)
    this.refreshVisible()
    this.refreshFeed()
  }

  private refreshFeed(): void {
    this.feed.refresh(
      this.context.renderer,
      this.stage.feed,
      this.discovery,
      this.hintBook.text(this.settings),
      this.settings,
    )
  }

  private sorted(defs: readonly ElementDef[]): ElementDef[] {
    const byName = (a: ElementDef, b: ElementDef): number =>
      this.settings.element(a.id).localeCompare(this.settings.element(b.id))
    const list = [...defs]
    switch (this.settings.sort) {
      case 'alpha':
        return list.sort(byName)
      case 'category':
        return list.sort(
          (a, b) =>
            CATEGORIES.findIndex((c) => c.id === a.category) -
              CATEGORIES.findIndex((c) => c.id === b.category) ||
            this.registry.rank(a.id) - this.registry.rank(b.id),
        )
      case 'depth':
        return list.sort(
          (a, b) => this.recipes.depthOf(a.id) - this.recipes.depthOf(b.id) || byName(a, b),
        )
      case 'useful':
        return list.sort(
          (a, b) => this.recipes.usageOf(b.id) - this.recipes.usageOf(a.id) || byName(a, b),
        )
      default: {
        const order = this.discovery.order
        return list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
      }
    }
  }

  private refreshVisible(): void {
    const known = this.discovery.list.filter((def) => this.categoryBar.isOn(def.category))
    this.visible = this.sorted(known)
    const locked = this.recipes
      .craftableNow((id) => this.discovery.has(id))
      .map((id) => this.registry.get(id))
      .filter((def) => this.categoryBar.isOn(def.category))
    this.entries = [
      ...this.visible.map((def) => ({ def, locked: false })),
      ...this.sorted(locked).map((def) => ({ def, locked: true })),
    ]
    this.grid.layout(this.stage.grid, this.entries)
  }

  update(dt: number): void {
    this.time += dt
    this.readPointer(dt)
    this.readKeys()
    this.grid.update(dt, this.pointerActive && this.dragTarget === 'grid')
    this.categoryBar.settle(dt)
    this.bolts.update(dt, (element) => this.onBoltArrived(element))
    this.crucible.update(dt)
    this.advancePhase()
    this.hud.update(dt)
    this.updateHints(dt)
    this.updatePeek(dt)
    for (const [id, left] of this.fresh) {
      const next = left - dt
      if (next <= 0) this.fresh.delete(id)
      else this.fresh.set(id, next)
    }
  }

  private updateHints(dt: number): void {
    if (this.hintBook.pending) return
    this.idleTimer += dt
    if (this.idleTimer < TIMING.hintIdleDelay) return
    this.idleTimer = 0
    if (this.hintBook.pick(this.discovery, this.settings)) this.refreshFeed()
  }

  private updatePeek(dt: number): void {
    const armed =
      this.crucible.filled > 0 &&
      this.crucible.free > 0 &&
      this.crucible.phase === 'idle' &&
      this.bolts.flying === 0
    if (!armed) {
      this.peekTimer = 0
      this.peekKey = ''
      this.peekTarget = null
      return
    }
    const key = this.crucible.slots.join('+')
    if (key !== this.peekKey) {
      this.peekKey = key
      this.peekTimer = 0
      this.peekTarget = null
      return
    }
    if (this.peekTarget) return
    this.peekTimer += dt
    if (this.peekTimer < TIMING.peekDelay) return
    this.peekTarget = this.findCompletion()
    if (this.peekTarget) this.context.audio.play('tick', { pitch: 1.7, volume: 0.5 })
  }

  private findCompletion(): ElementId | null {
    for (const def of this.visible) {
      const result = this.recipes.resolve([...this.crucible.slots, def.id])
      if (result && !this.discovery.has(result)) return def.id
    }
    return null
  }

  private readPointer(dt: number): void {
    const { input } = this.context
    if (input.justPressed) {
      this.pointerActive = true
      this.pressX = input.x
      this.pressY = input.y
      this.lastX = input.x
      this.lastY = input.y
      this.pressTime = 0
      this.travelled = 0
      this.dragTarget = this.panel.open
        ? 'none'
        : this.stage.hitsGrid(input.x, input.y)
          ? 'grid'
          : this.stage.hitsCategories(input.x, input.y)
            ? 'categories'
            : this.stage.hitsFeed(input.x, input.y)
              ? 'feed'
              : 'none'
    }

    if (this.pointerActive && input.isDown) {
      this.pressTime += dt
      const dx = input.x - this.lastX
      const dy = input.y - this.lastY
      this.lastX = input.x
      this.lastY = input.y
      this.travelled += Math.abs(dx) + Math.abs(dy)
      if (this.dragTarget === 'grid' && dy !== 0) this.grid.dragBy(dy, dt)
      if (this.dragTarget === 'categories' && dx !== 0) this.categoryBar.dragBy(dx)
      if (this.dragTarget === 'feed' && dy !== 0) this.feed.dragBy(dy)
    }

    if (this.pointerActive && input.justReleased) {
      this.pointerActive = false
      if (this.travelled < TIMING.tapMoveLimit && this.pressTime < TIMING.tapTimeLimit) {
        this.handleTap(this.pressX, this.pressY)
      }
    }
  }

  private readKeys(): void {
    const { input } = this.context
    if (input.wasKeyPressed('Escape') && this.panel.open) {
      this.panel.open = false
      return
    }
    if (this.panel.open) return
    if (input.wasKeyPressed('Enter') || input.wasKeyPressed('Space')) this.tapCrucible()
    if (input.wasKeyPressed('Backspace') || input.wasKeyPressed('Escape')) this.emptyCrucible()
  }

  private handleTap(x: number, y: number): void {
    if (this.panel.open) {
      const action = this.panel.hitTest(x, y)
      if (!action) return
      this.applyPanelAction(action)
      return
    }

    if (this.stage.hitsMenu(x, y)) {
      this.panel.open = true
      this.context.audio.play('select', { pitch: 0.9, volume: 0.5 })
      return
    }

    if (this.stage.hitsCategories(x, y)) {
      const filter = this.categoryBar.hitTest(x, y)
      if (!filter) return
      this.categoryBar.toggle(filter)
      this.grid.resetScroll()
      this.refreshVisible()
      this.context.audio.play('select', {
        pitch: this.categoryBar.anyOn ? 0.85 : 0.6,
        volume: 0.5,
      })
      return
    }

    if (this.stage.hitsCrucible(x, y)) {
      this.tapCrucible()
      return
    }

    if (!this.stage.hitsGrid(x, y)) return
    const tile = this.grid.hitTest(x, y)
    if (tile && !tile.locked) this.toggleElement(tile.def)
  }

  private applyPanelAction(action: PanelAction): void {
    const { audio } = this.context
    if (action.kind === 'close') {
      this.panel.open = false
      audio.play('clear', { pitch: 1.2, volume: 0.4 })
      return
    }
    if (action.kind === 'lang') {
      if (this.settings.lang === action.value) return
      this.settings.setLang(action.value)
      this.relayout()
    } else if (action.kind === 'sort') {
      if (this.settings.sort === action.value) return
      this.settings.setSort(action.value)
      this.grid.resetScroll()
      this.refreshVisible()
    } else {
      if (this.settings.theme === action.value) return
      this.settings.setTheme(action.value)
    }
    audio.play('select', { pitch: 1.1, volume: 0.45 })
  }

  private toggleElement(def: ElementDef): void {
    if (this.crucible.phase !== 'idle') return
    const { audio, juice } = this.context

    if (this.crucible.holds(def.id) > 0) {
      this.crucible.take(def.id)
      audio.play('clear', { pitch: 1.3 })
      const spot = this.grid.positionOf(def.id)
      if (spot) {
        juice.particles.emit({
          x: spot.x,
          y: spot.y,
          count: 10,
          speedMin: 30,
          speedMax: 130,
          lifeMin: 0.16,
          lifeMax: 0.36,
          sizeMin: 1.5,
          sizeMax: 3,
          colors: def.tones,
          drag: 3,
          glow: true,
        })
      }
      return
    }

    if (!this.crucible.reserve()) {
      this.crucible.shake = 0.5
      this.hud.showMessage(this.settings.t('crucibleFull'))
      audio.play('fizzle', { volume: 0.4 })
      return
    }

    const spot = this.grid.positionOf(def.id) ?? {
      x: this.stage.crucibleCenterX,
      y: this.stage.crucibleCenterY,
    }
    this.bolts.launch(def.id, spot.x, spot.y, TIMING.boltFlight)
    audio.play('select')
    juice.particles.emit({
      x: spot.x,
      y: spot.y,
      count: 10,
      speedMin: 30,
      speedMax: 120,
      lifeMin: 0.16,
      lifeMax: 0.36,
      sizeMin: 1.5,
      sizeMax: 3,
      colors: def.tones,
      drag: 3,
      glow: true,
    })
  }

  private tapCrucible(): void {
    if (this.crucible.phase !== 'idle' || this.bolts.flying > 0) return
    if (this.crucible.filled === 0) return
    if (this.crucible.filled === 1) {
      this.emptyCrucible()
      return
    }
    const result = this.recipes.resolve(this.crucible.slots)
    if (result) {
      this.crucible.result = result
      this.crucible.enter('resolving', TIMING.brewDelay)
      this.context.audio.play('craft')
      this.context.juice.shake.add(0.2)
      return
    }
    this.mixLog.addFailure(this.crucible.slots)
    this.crucible.enter('fizzled', TIMING.fizzleDelay)
    this.crucible.shake = 1
    this.context.audio.play('fizzle')
    this.context.juice.shake.add(0.3)
    this.hud.showMessage(this.settings.t('mixFailed'))
  }

  private emptyCrucible(): void {
    if (this.crucible.isEmpty || this.crucible.phase !== 'idle') return
    this.crucible.clear()
    this.bolts.clear()
    this.context.audio.play('clear')
  }

  private onBoltArrived(element: ElementId): void {
    const { audio, juice } = this.context
    const def = this.registry.get(element)
    this.crucible.receive(element)
    this.crucible.flash = 0.7
    audio.play('boltLand', { pitch: 1 + this.crucible.filled * 0.12 })
    juice.shake.add(0.12)
    juice.particles.emit({
      x: this.stage.crucibleCenterX,
      y: this.stage.crucibleCenterY,
      count: 14,
      speedMin: 60,
      speedMax: 220,
      lifeMin: 0.2,
      lifeMax: 0.5,
      sizeMin: 2,
      sizeMax: 4.5,
      colors: def.tones,
      drag: 2.4,
      glow: true,
    })
  }

  private advancePhase(): void {
    if (this.crucible.phase === 'idle' || this.crucible.timer > 0) return
    if (this.crucible.phase === 'resolving') {
      this.completeCraft()
      return
    }
    if (this.crucible.phase === 'fizzled') this.context.audio.play('clear')
    this.crucible.clear()
  }

  private completeCraft(): void {
    const id = this.crucible.result
    if (!id) {
      this.crucible.clear()
      return
    }
    const def = this.registry.get(id)
    const { audio, juice, portal, analytics } = this.context
    const isNew = this.discovery.add(id)

    this.crucible.slots.length = 0
    this.crucible.slots.push(id)
    this.crucible.freshResult = isNew
    this.crucible.enter('crafted', TIMING.craftedHold)
    this.crucible.flash = 1

    audio.play(isNew ? 'discover' : 'craft')
    juice.shake.add(0.45)
    juice.particles.emit({
      x: this.stage.crucibleCenterX,
      y: this.stage.crucibleCenterY,
      count: 36,
      speedMin: 90,
      speedMax: 360,
      lifeMin: 0.3,
      lifeMax: 0.9,
      sizeMin: 2,
      sizeMax: 6,
      colors: def.tones,
      drag: 1.8,
      glow: true,
    })

    if (isNew) {
      portal.happyMoment(0.6)
      this.fresh.set(id, FRESH_LIFE)
      if (this.hintBook.resolve(id)) this.idleTimer = 0
      this.categoryBar.layout(
        this.context.renderer,
        this.stage.categories,
        this.settings,
        this.countOf,
        this.totalOf,
      )
      this.refreshVisible()
      this.refreshFeed()
      analytics.track('element_discovered', { id, known: this.discovery.count })
      if (this.discovery.count === this.discovery.total) {
        analytics.track(CoreEvent.RunComplete, { known: this.discovery.count })
      }
    } else {
      this.hud.showMessage(`${this.settings.element(id)} — ${this.settings.t('alreadyKnown')}`)
    }
  }

  private readonly tileState = (def: ElementDef): TileState => {
    const held = this.crucible.holds(def.id) + this.bolts.holds(def.id)
    const hint =
      this.peekTarget === def.id ? 0.55 + Math.sin(this.time * 4) * 0.35 : 0
    const warn =
      this.crucible.filled > 0 &&
      this.crucible.phase === 'idle' &&
      this.mixLog.has([...this.crucible.slots, def.id])
    return {
      held,
      hint,
      warn,
      fresh: clamp((this.fresh.get(def.id) ?? 0) / FRESH_LIFE, 0, 1),
    }
  }

  render(renderer: IRenderer, _alpha: number): void {
    const { juice } = this.context
    renderer.push()
    juice.shake.apply(renderer)

    this.renderBackdrop(renderer)

    renderer.push()
    if (this.crucible.shake > 0) {
      renderer.translate(Math.sin(this.time * 52) * 5 * this.crucible.shake, 0)
    }
    this.crucibleView.render(
      renderer,
      this.stage.crucible,
      this.crucible,
      this.settings,
      this.time,
    )
    renderer.pop()

    this.renderBolts(renderer)
    this.feed.renderInfo(renderer, this.stage.info, this.discovery, this.settings)
    this.feed.render(renderer, this.settings)
    this.renderMenuButton(renderer)
    this.categoryBar.render(renderer, this.settings, this.countOf, this.totalOf)
    if (this.entries.length === 0) this.renderEmptyGrid(renderer)
    else this.grid.render(renderer, this.badge, this.settings, this.time, this.tileState)
    juice.renderEffects(renderer)
    this.hud.render(renderer, this.stage)
    this.panel.render(renderer, this.stage, this.settings)
    renderer.pop()
  }

  private renderMenuButton(renderer: IRenderer): void {
    const { menuX, menuY, menuRadius } = this.stage
    renderer.circle(menuX, menuY, menuRadius, {
      fill: PALETTE.backdrop,
      stroke: this.panel.open ? PALETTE.beam : PALETTE.frame,
      lineWidth: this.panel.open ? 2 : 1,
    })
    for (let i = -1; i <= 1; i++) {
      renderer.line(
        menuX - menuRadius * 0.4,
        menuY + i * menuRadius * 0.3,
        menuX + menuRadius * 0.4,
        menuY + i * menuRadius * 0.3,
        2.5,
        { stroke: this.panel.open ? PALETTE.ink : PALETTE.inkMuted },
      )
    }
  }

  private renderEmptyGrid(renderer: IRenderer): void {
    const { grid } = this.stage
    renderer.text(
      this.settings.t('allOff'),
      grid.x + grid.width / 2,
      grid.y + 54,
      {
        size: TEXT.tileLabel,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        fill: PALETTE.inkMuted,
        alpha: 0.7,
      },
    )
  }

  private renderBackdrop(renderer: IRenderer): void {
    const { crucible, width, height } = this.stage
    const cx = this.stage.crucibleCenterX
    const cy = this.stage.crucibleCenterY
    renderer.rect(0, 0, width, height, { fill: PALETTE.background })
    for (let i = HALO_LAYERS; i > 0; i--) {
      renderer.circle(cx, cy, crucible.size * (0.6 + i * 0.28), {
        fill: PALETTE.backdrop,
        alpha: 0.13,
      })
    }
  }

  private renderBolts(renderer: IRenderer): void {
    const toX = this.stage.crucibleCenterX
    const toY = this.stage.crucibleCenterY
    for (const bolt of this.bolts.items) {
      if (!bolt.active) continue
      const def = this.registry.get(bolt.element)
      const color = def.tones[2] ?? PALETTE.spark
      const t = Ease.inOutQuad(clamp(bolt.progress, 0, 1))
      const lift = Math.hypot(toX - bolt.fromX, toY - bolt.fromY) * 0.22
      const cx = (bolt.fromX + toX) / 2
      const cy = (bolt.fromY + toY) / 2 - lift
      const inv = 1 - t
      const x = inv * inv * bolt.fromX + 2 * inv * t * cx + t * t * toX
      const y = inv * inv * bolt.fromY + 2 * inv * t * cy + t * t * toY

      for (let i = 3; i >= 1; i--) {
        const tt = clamp(t - i * 0.07, 0, 1)
        const ii = 1 - tt
        renderer.circle(
          ii * ii * bolt.fromX + 2 * ii * tt * cx + tt * tt * toX,
          ii * ii * bolt.fromY + 2 * ii * tt * cy + tt * tt * toY,
          7 - i * 1.4,
          { fill: color, alpha: 0.2 * (1 - i / 4) },
        )
      }
      renderer.circle(x, y, lerp(11, 6, t), {
        fill: color,
        alpha: 0.92,
        glow: color,
        glowSize: 24,
      })
      renderer.circle(x, y, 4, { fill: PALETTE.spark, alpha: 0.95 })
    }
  }
}
