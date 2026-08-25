import { Button, CoreEvent, Ease, Scene, SeededRandom, UiLayer, damp } from '@sa/core'
import type { GameContext, IRandom, IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import { UI_THEME } from '../config/theme.js'
import { Field } from '../entities/Field.js'
import { Container } from '../entities/Container.js'
import { Paddle } from '../entities/Paddle.js'
import type { Bullet } from '../entities/Bullet.js'
import { BulletPool } from '../systems/BulletPool.js'
import { PlasmaCollector } from '../systems/PlasmaCollector.js'
import { PulseSystem } from '../systems/PulseSystem.js'
import { VeinNetwork } from '../systems/VeinNetwork.js'
import { CombatSystem } from '../systems/CombatSystem.js'
import type { CombatListener } from '../systems/CombatSystem.js'
import { SpawnDirector } from '../systems/SpawnDirector.js'
import type { SpawnListener } from '../systems/SpawnDirector.js'
import type { PartLedger, PartProgress } from '../systems/PartLedger.js'
import type { RunOutcome, RunRecords } from '../systems/RunRecords.js'
import { IconButton } from '../ui/IconButton.js'
import { ExtractButton } from '../ui/ExtractButton.js'
import { Hud } from './Hud.js'

export interface PlayParams {
  readonly seed: string
}

type PlayState = 'running' | 'paused' | 'leaving'

const EXIT_DELAY = 0.95
const KEY_REPEAT_DELAY = 0.26
const KEY_REPEAT_INTERVAL = 0.12
const LANE_FADE_STEPS = 7

export class PlayScene extends Scene<GameContext> implements CombatListener, SpawnListener {
  readonly name = 'play'

  private readonly records: RunRecords
  private readonly ledger: PartLedger
  private readonly field = new Field()
  private readonly container = new Container()
  private readonly paddle = new Paddle()
  private readonly bullets = new BulletPool()
  private readonly collector = new PlasmaCollector()
  private readonly veins = new VeinNetwork()
  private readonly pulses = new PulseSystem(this.veins)
  private readonly hud = new Hud()
  private readonly ui = new UiLayer()
  private readonly menuButtons: (Button | ExtractButton)[] = []
  private readonly controls: IconButton[] = []
  private extractButton: ExtractButton | null = null

  private combat: CombatSystem | null = null
  private director: SpawnDirector | null = null
  private random: IRandom = new SeededRandom('boot')

  private params: PlayParams = { seed: 'boot' }
  private state: PlayState = 'running'
  private outcome: RunOutcome = 'destroyed'
  private elapsed = 0
  private exitTimer = 0
  private gameplayStarted = false
  private finished = false
  private partsThisRun = 0
  private displayEnergy = 0
  private hintPhase = 0
  private pointerMode = true
  private lastPointerX = Number.NaN
  private lastPointerY = Number.NaN
  private repeatTimer = 0
  private heldDirection = 0

  constructor(records: RunRecords, ledger: PartLedger) {
    super()
    this.records = records
    this.ledger = ledger
  }

  private get progress(): PartProgress {
    return this.ledger.progress
  }

  protected override onEnter(params?: unknown): void {
    this.params = (params as PlayParams | undefined) ?? this.params
    this.random = new SeededRandom(this.params.seed)

    const { renderer, juice } = this.context
    this.field.resize(renderer.width, renderer.height)
    this.veins.rebuild(this.field)
    this.container.reset()
    this.paddle.reset(this.field)
    this.bullets.clear()
    this.collector.reset()
    this.pulses.clear()
    juice.clear()

    this.combat = new CombatSystem({
      field: this.field,
      container: this.container,
      paddle: this.paddle,
      bullets: this.bullets,
      listener: this,
    })
    this.director = new SpawnDirector({
      field: this.field,
      bullets: this.bullets,
      random: this.random,
      listener: this,
    })
    this.director.start()

    this.state = 'running'
    this.outcome = 'destroyed'
    this.elapsed = 0
    this.exitTimer = 0
    this.gameplayStarted = false
    this.finished = false
    this.partsThisRun = 0
    this.displayEnergy = 0
    this.hintPhase = 0
    this.repeatTimer = 0
    this.heldDirection = 0
    this.buildUi()
  }

  protected override onExit(): void {
    this.ui.clear()
    this.menuButtons.length = 0
    this.controls.length = 0
  }

  private buildUi(): void {
    const safe = this.context.viewport.safeArea
    const centerX = safe.x + safe.width / 2
    const centerY = safe.y + safe.height / 2
    const width = Math.min(240, safe.width - 60)

    this.ui.clear()
    this.menuButtons.length = 0
    this.controls.length = 0

    const size = 46
    const margin = 16
    const pauseButton = this.ui.add(
      new IconButton({
        x: safe.x + safe.width - margin - size,
        y: safe.y + margin,
        width: size,
        height: size,
        icon: 'pause',
      }),
    )
    pauseButton.onActivate.on(() => {
      this.context.audio.play('uiTap')
      this.togglePause()
    })

    const restartButton = this.ui.add(
      new IconButton({
        x: safe.x + safe.width - margin * 2 - size * 2,
        y: safe.y + margin,
        width: size,
        height: size,
        icon: 'restart',
      }),
    )
    restartButton.onActivate.on(() => {
      this.context.audio.play('uiTap')
      this.restart()
    })
    this.controls.push(pauseButton, restartButton)

    const resume = this.ui.add(
      new Button({
        x: centerX - width / 2,
        y: centerY + 4,
        width,
        height: 52,
        label: 'ПРОДОВЖИТИ',
        theme: UI_THEME,
        fontSize: 18,
      }),
    )
    resume.onActivate.on(() => {
      this.context.audio.play('uiTap')
      this.leavePause()
    })

    const extract = this.ui.add(
      new ExtractButton({
        x: centerX - width / 2,
        y: centerY + 66,
        width: Math.max(width, 250),
        height: 48,
      }),
    )
    extract.onActivate.on(() => {
      this.context.audio.play('uiTap')
      this.extractToBase()
    })
    this.extractButton = extract

    this.menuButtons.push(resume, extract)
    this.setMenuVisible(false)
  }

  private setMenuVisible(visible: boolean): void {
    for (const button of this.menuButtons) {
      button.visible = visible
      button.enabled = visible
    }
  }

  private extractToBase(): void {
    this.setMenuVisible(false)
    this.beginExit('extracted')
  }

  private restart(): void {
    this.finished = true
    this.context.scenes.change('play', this.params)
  }

  override resize(width: number, height: number): void {
    this.field.resize(width, height)
    this.veins.rebuild(this.field)
    this.buildUi()
    if (this.state === 'paused') this.setMenuVisible(true)
  }

  override pause(): void {
    if (this.state === 'running') this.enterPause()
  }

  update(dt: number): void {
    const { input } = this.context

    if (input.wasKeyPressed('Escape') || input.wasKeyPressed('Space')) this.togglePause()
    if (input.wasKeyPressed('KeyR')) {
      this.restart()
      return
    }
    if (this.extractButton) this.extractButton.energy = this.collector.energy

    if (this.state === 'paused') {
      this.ui.handleInput(input)
      this.ui.update(dt)
      return
    }
    this.ui.handleInput(input)
    this.ui.update(dt)

    if (!this.gameplayStarted && input.hasInteracted) this.beginGameplay()

    this.elapsed += dt
    this.hintPhase += dt
    if (this.state === 'running') this.readSteering(dt)
    this.paddle.update(dt, this.field)
    this.displayEnergy = damp(this.displayEnergy, this.collector.energy, 0.02, dt)
    this.container.update(dt)
    this.pulses.update(dt, (lane, energy) => this.onPulseArrived(lane, energy))

    if (this.state === 'running') {
      this.director?.update(dt)
      this.combat?.update(dt)
      if (!this.container.alive) this.beginExit('destroyed')
      return
    }

    if (this.state !== 'leaving') return

    this.combat?.update(dt)
    this.exitTimer -= dt
    if (this.exitTimer <= 0) this.finishRun()
  }

  private readSteering(dt: number): void {
    const { input } = this.context

    const pressedLeft = input.wasKeyPressed('ArrowLeft') || input.wasKeyPressed('KeyA')
    const pressedRight = input.wasKeyPressed('ArrowRight') || input.wasKeyPressed('KeyD')
    if (pressedLeft || pressedRight) {
      this.pointerMode = false
      this.heldDirection = pressedLeft ? -1 : 1
      this.repeatTimer = KEY_REPEAT_DELAY
      this.paddle.step(this.heldDirection, this.field)
      return
    }

    const holdingLeft = input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')
    const holdingRight = input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')
    const holding = holdingLeft ? -1 : holdingRight ? 1 : 0
    if (holding !== 0) {
      this.pointerMode = false
      if (holding !== this.heldDirection) {
        this.heldDirection = holding
        this.repeatTimer = KEY_REPEAT_DELAY
      }
      this.repeatTimer -= dt
      if (this.repeatTimer <= 0) {
        this.repeatTimer = KEY_REPEAT_INTERVAL
        this.paddle.step(holding, this.field)
      }
      return
    }
    this.heldDirection = 0

    if (input.x !== this.lastPointerX || input.y !== this.lastPointerY) {
      this.lastPointerX = input.x
      this.lastPointerY = input.y
      this.pointerMode = true
    }
    if (this.pointerMode && input.hasInteracted && !this.pointerOverControls(input.x, input.y)) {
      this.paddle.setLane(this.field.nearestLane(input.x, input.y), this.field)
    }
  }

  private pointerOverControls(x: number, y: number): boolean {
    return this.controls.some((button) => button.hitTest(x, y))
  }

  private beginGameplay(): void {
    this.gameplayStarted = true
    this.context.portal.gameplayStart()
    this.context.analytics.track(CoreEvent.GameplayStart, { seed: this.params.seed })
  }

  private togglePause(): void {
    if (this.state === 'paused') this.leavePause()
    else if (this.state === 'running') this.enterPause()
  }

  private enterPause(): void {
    this.state = 'paused'
    this.setMenuVisible(true)
    if (this.gameplayStarted) this.context.portal.gameplayStop()
  }

  private leavePause(): void {
    this.setMenuVisible(false)
    void this.context.portal.commercialBreak().then(() => {
      if (this.state !== 'paused') return
      this.state = 'running'
      if (this.gameplayStarted) this.context.portal.gameplayStart()
    })
  }

  private beginExit(outcome: RunOutcome): void {
    if (this.state === 'leaving') return
    const { juice, audio, portal, analytics } = this.context
    const wasPaused = this.state === 'paused'
    this.state = 'leaving'
    this.outcome = outcome
    this.exitTimer = EXIT_DELAY
    this.container.beginTeleport()

    const destroyed = outcome === 'destroyed'
    juice.hitStop.freeze(BALANCE.juice.deathHitStop)
    juice.shake.add(destroyed ? 0.95 : 0.5)
    juice.particles.emit({
      x: this.field.pivotX,
      y: this.field.pivotY,
      count: 34,
      speedMin: 90,
      speedMax: 380,
      lifeMin: 0.25,
      lifeMax: 0.6,
      sizeMin: 2,
      sizeMax: 6,
      colors: destroyed ? [PALETTE.hostile, PALETTE.ink] : [PALETTE.reward, PALETTE.ink],
      glow: true,
    })
    juice.particles.emit({
      x: this.field.pivotX,
      y: this.field.pivotY,
      count: 30,
      angle: -Math.PI / 2,
      spread: 1.1,
      speedMin: 160,
      speedMax: 520,
      lifeMin: 0.25,
      lifeMax: 0.65,
      sizeMin: 1.5,
      sizeMax: 4,
      colors: [PALETTE.friendly, PALETTE.ink],
      shape: 'spark',
      glow: true,
    })
    audio.play(destroyed ? 'gameOver' : 'chargeUp')

    if (this.gameplayStarted && !wasPaused) portal.gameplayStop()
    analytics.track(destroyed ? CoreEvent.Fail : CoreEvent.RunComplete, {
      catches: this.collector.charges,
      energy: Math.round(this.collector.energy * 10) / 10,
    })
    analytics.track(CoreEvent.GameplayEnd, {
      duration_ms: Math.round(this.elapsed * 1000),
      catches: this.collector.charges,
      energy: Math.round(this.collector.energy * 10) / 10,
      reason: outcome,
    })
  }

  private finishRun(): void {
    if (this.finished) return
    this.finished = true
    const collected = Math.round(this.collector.energy * 10) / 10
    const destroyed = this.outcome === 'destroyed'
    const runEnergy = destroyed
      ? 0
      : Math.round(Math.max(0, collected - BALANCE.plasma.teleportCost) * 10) / 10
    const run = this.records.submit({
      energy: runEnergy,
      catches: this.collector.charges,
      partsThisRun: this.partsThisRun,
      outcome: this.outcome,
      durationMs: Math.round(this.elapsed * 1000),
    })
    const progress = this.ledger.commit(runEnergy)
    this.context.scenes.change('result', {
      run,
      progress,
      runEnergy,
      lostEnergy: destroyed ? collected : 0,
    })
  }

  onTelegraph(lane: number): void {
    this.context.audio.play('warn', { pitch: 1 + lane * 0.05 })
  }

  onSpawn(lane: number): void {
    const origin = this.field.lanePoint(lane, this.field.outerRadius)
    this.context.audio.play('launch')
    this.context.juice.particles.emit({
      x: origin.x,
      y: origin.y,
      count: 6,
      speedMin: 30,
      speedMax: 110,
      lifeMin: 0.1,
      lifeMax: 0.28,
      sizeMin: 1,
      sizeMax: 3,
      colors: [PALETTE.hostile],
    })
  }

  onAbsorb(bullet: Bullet, _distance: number): void {
    const { juice, audio } = this.context

    juice.hitStop.freeze(BALANCE.juice.absorbHitStop)
    juice.shake.add(BALANCE.juice.absorbShake)
    juice.particles.emit({
      x: bullet.x,
      y: bullet.y,
      count: 10,
      speedMin: 60,
      speedMax: 240,
      lifeMin: 0.12,
      lifeMax: 0.32,
      sizeMin: 1.5,
      sizeMax: 3.5,
      colors: [PALETTE.friendly, PALETTE.ink],
      shape: 'spark',
    })
    juice.texts.spawn({
      x: bullet.x,
      y: bullet.y,
      value: `+${bullet.energy.toFixed(1)}`,
      color: PALETTE.reward,
      size: 18,
      life: 0.5,
      rise: 30,
      weight: 300,
      alpha: 0.95,
    })
    audio.play('absorb', { pitch: 0.9 + bullet.energy * 0.5 })
    this.pulses.spawn(bullet.lane, bullet.energy)
  }

  private onPulseArrived(_lane: number, energy: number): void {
    const { juice, audio } = this.context
    this.collector.add(energy)
    if (this.state !== 'running') return
    if (this.collector.energy < BALANCE.plasma.containerCapacity) return

    this.partsThisRun = 1
    this.container.flashGeneration()
    audio.play('chargeUp')
    juice.shake.add(BALANCE.juice.chargeGainShake)
    juice.particles.emit({
      x: this.field.pivotX,
      y: this.field.pivotY,
      count: 26,
      speedMin: 80,
      speedMax: 300,
      lifeMin: 0.3,
      lifeMax: 0.8,
      sizeMin: 2,
      sizeMax: 5,
      colors: [PALETTE.reward, PALETTE.friendly],
      glow: true,
    })
    this.beginExit('extracted')
  }

  onContainerHit(bullet: Bullet): void {
    const { juice, audio } = this.context
    juice.hitStop.freeze(0.11)
    juice.shake.add(BALANCE.juice.coreHitShake)
    juice.particles.emit({
      x: bullet.x,
      y: bullet.y,
      count: 22,
      speedMin: 70,
      speedMax: 300,
      lifeMin: 0.25,
      lifeMax: 0.7,
      sizeMin: 2,
      sizeMax: 6,
      colors: [PALETTE.hostile, PALETTE.ink],
      glow: true,
    })
    audio.play('coreHit')
  }

  render(renderer: IRenderer, _alpha: number): void {
    const { juice, viewport } = this.context
    const progress = this.progress

    renderer.push()
    renderer.translate(this.field.pivotX, this.field.pivotY)
    juice.shake.apply(renderer)
    renderer.translate(-this.field.pivotX, -this.field.pivotY)

    const rigIntact = !this.container.vanished
    if (rigIntact) {
      this.renderLanes(renderer)
      if (!this.context.input.hasInteracted) this.renderHint(renderer)
      this.renderTelegraphs(renderer)
    }
    this.bullets.render(renderer)
    if (rigIntact) this.paddle.render(renderer, this.field)
    this.container.render(renderer, this.field, {
      energy: this.displayEnergy,
      capacity: BALANCE.plasma.containerCapacity,
    })
    if (rigIntact) this.veins.render(renderer, this.field)
    this.pulses.render(renderer)
    juice.renderEffects(renderer)

    renderer.pop()

    for (const button of this.controls) button.render(renderer)

    this.hud.render(renderer, {
      label: `Деталь #${progress.partIndex + 1} (${progress.currentTarget} ГДж)`,
      safe: viewport.safeArea,
    })

    if (this.state === 'paused') this.renderPauseOverlay(renderer)
  }

  private renderLanes(renderer: IRenderer): void {
    const orbit = this.field.paddleOrbit
    const inner = orbit * 1.25
    const outer = this.field.outerRadius
    const half = (this.field.laneSpan * 0.46) / 2

    for (let lane = 0; lane < this.field.laneCount; lane++) {
      const active = lane === this.paddle.lane
      const angle = this.field.laneAngle(lane)

      renderer.arc(this.field.pivotX, this.field.pivotY, orbit, angle - half, angle + half, 3, {
        stroke: active ? PALETTE.friendly : PALETTE.grid,
        alpha: active ? 0.4 : 0.9,
      })

      for (let step = 0; step < LANE_FADE_STEPS; step++) {
        const from = inner + ((outer - inner) * step) / LANE_FADE_STEPS
        const to = inner + ((outer - inner) * (step + 1)) / LANE_FADE_STEPS
        const fade = 1 - step / LANE_FADE_STEPS
        const start = this.field.pointAt(angle, from)
        const end = this.field.pointAt(angle, to)
        renderer.line(start.x, start.y, end.x, end.y, active ? 2 : 1, {
          stroke: active ? PALETTE.friendly : PALETTE.grid,
          alpha: (active ? 0.4 : 0.34) * fade * 1.15,
        })
      }
    }
  }

  private renderTelegraphs(renderer: IRenderer): void {
    const director = this.director
    if (!director) return

    for (const telegraph of director.telegraphs) {
      const point = this.field.lanePoint(telegraph.lane, this.field.outerRadius)
      const grow = Ease.outCubic(telegraph.ratio)
      const pulse = 0.5 + Math.sin(telegraph.ratio * Math.PI * 6) * 0.2

      renderer.circle(point.x, point.y, 40 * (0.45 + grow), {
        fill: PALETTE.hostile,
        alpha: 0.05 + grow * 0.13,
        glow: PALETTE.hostile,
        glowSize: 34 * grow,
      })
      renderer.circle(point.x, point.y, 14 * (0.3 + grow * 0.85), {
        fill: PALETTE.hostile,
        alpha: 0.16 + grow * 0.5 * pulse,
      })

      const angle = this.field.laneAngle(telegraph.lane)
      const tail = this.field.pointAt(angle, this.field.outerRadius - 46 * grow)
      renderer.line(point.x, point.y, tail.x, tail.y, 3, {
        stroke: PALETTE.hostile,
        alpha: grow * 0.35,
      })
    }
  }

  private renderHint(renderer: IRenderer): void {
    const orbit = this.field.paddleOrbit
    const pulse = 0.35 + Math.sin(this.hintPhase * 4) * 0.25

    for (let i = 0; i < this.field.laneCount; i++) {
      if (i === this.paddle.lane) continue
      const point = this.field.lanePoint(i, orbit)
      renderer.circle(point.x, point.y, 5, { fill: PALETTE.friendly, alpha: pulse * 0.55 })
    }
  }

  private renderPauseOverlay(renderer: IRenderer): void {
    const safe = this.context.viewport.safeArea
    renderer.rect(-renderer.width, -renderer.height, renderer.width * 3, renderer.height * 3, {
      fill: PALETTE.background,
      alpha: 0.72,
    })
    for (const button of this.controls) button.render(renderer)
    renderer.text('ПАУЗА', safe.x + safe.width / 2, safe.y + safe.height / 2 - 42, {
      fill: PALETTE.ink,
      size: 38,
      weight: 800,
      align: 'center',
      baseline: 'middle',
    })
    for (const button of this.menuButtons) button.render(renderer)
    renderer.text(
      'ПРОБІЛ / ESC — пауза · R — новий виліт · ← → — рух',
      safe.x + safe.width / 2,
      safe.y + safe.height / 2 + 138,
      {
        fill: PALETTE.inkMuted,
        size: 12,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        alpha: 0.6,
      },
    )
  }
}
