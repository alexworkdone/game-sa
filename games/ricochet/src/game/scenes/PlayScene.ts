import { CoreEvent, Scene, SeededRandom, TAU } from '@sa/core'
import type { GameContext, IRandom, IRenderer } from '@sa/core'
import { BALANCE } from '../config/balance.js'
import { PALETTE } from '../config/palette.js'
import { Arena } from '../entities/Arena.js'
import { PlayerCore } from '../entities/PlayerCore.js'
import { Shield } from '../entities/Shield.js'
import type { Bullet } from '../entities/Bullet.js'
import type { Turret } from '../entities/Turret.js'
import { BulletPool } from '../systems/BulletPool.js'
import { TurretField } from '../systems/TurretField.js'
import { ScoreTracker } from '../systems/ScoreTracker.js'
import { CombatSystem } from '../systems/CombatSystem.js'
import type { CombatListener } from '../systems/CombatSystem.js'
import { RunDirector } from '../systems/RunDirector.js'
import type { RunDirectorListener } from '../systems/RunDirector.js'
import type { RunRecords } from '../systems/RunRecords.js'
import { Hud } from './Hud.js'

export interface PlayParams {
  readonly seed: string
  readonly daily: boolean
  readonly dayNumber: number
}

type PlayState = 'running' | 'paused' | 'dying'

const DEATH_DELAY = 1.05

export class PlayScene extends Scene<GameContext> implements CombatListener, RunDirectorListener {
  readonly name = 'play'

  private readonly records: RunRecords
  private readonly arena = new Arena()
  private readonly core = new PlayerCore()
  private readonly shield = new Shield()
  private readonly bullets = new BulletPool()
  private readonly turrets = new TurretField()
  private readonly score = new ScoreTracker()
  private readonly hud = new Hud()

  private combat: CombatSystem | null = null
  private director: RunDirector | null = null
  private random: IRandom = new SeededRandom('boot')

  private params: PlayParams = { seed: 'boot', daily: false, dayNumber: 1 }
  private state: PlayState = 'running'
  private elapsed = 0
  private deathTimer = 0
  private gameplayStarted = false
  private pointerMode = true
  private lastPointerX = Number.NaN
  private lastPointerY = Number.NaN
  private hintPhase = 0

  constructor(records: RunRecords) {
    super()
    this.records = records
  }

  protected override onEnter(params?: unknown): void {
    this.params = (params as PlayParams | undefined) ?? this.params
    this.random = new SeededRandom(this.params.seed)

    const { renderer, juice } = this.context
    this.arena.resize(renderer.width, renderer.height)
    this.core.reset()
    this.shield.reset()
    this.bullets.clear()
    this.turrets.clear()
    this.score.reset()
    juice.clear()

    this.combat = new CombatSystem({
      arena: this.arena,
      core: this.core,
      shield: this.shield,
      bullets: this.bullets,
      turrets: this.turrets,
      listener: this,
    })
    this.director = new RunDirector({
      arena: this.arena,
      bullets: this.bullets,
      turrets: this.turrets,
      random: this.random,
      listener: this,
    })
    this.director.start()

    this.state = 'running'
    this.elapsed = 0
    this.deathTimer = 0
    this.gameplayStarted = false
    this.hintPhase = 0
  }

  override resize(width: number, height: number): void {
    this.arena.resize(width, height)
    this.turrets.syncPositions(this.arena)
  }

  override pause(): void {
    if (this.state === 'running') this.enterPause()
  }

  update(dt: number): void {
    const { input } = this.context

    if (input.wasKeyPressed('Escape') || input.wasKeyPressed('Space')) this.togglePause()
    if (this.state === 'paused') return

    if (!this.gameplayStarted && input.hasInteracted) this.beginGameplay()

    this.elapsed += dt
    this.hintPhase += dt
    this.readSteering(dt)
    this.shield.update(dt)
    this.core.update(dt)
    this.score.update(dt)

    if (this.state === 'running') {
      this.director?.update(dt)
      this.combat?.update(dt)
      if (!this.core.alive) this.beginDeath()
      return
    }

    this.combat?.update(dt)
    this.deathTimer -= dt
    if (this.deathTimer <= 0) this.finishRun()
  }

  private readSteering(dt: number): void {
    const { input } = this.context
    const axis = input.axisX()
    if (axis !== 0) {
      this.pointerMode = false
      this.shield.rotateBy(axis * BALANCE.shield.keyboardAngularSpeed * dt)
    }
    if (input.x !== this.lastPointerX || input.y !== this.lastPointerY) {
      this.lastPointerX = input.x
      this.lastPointerY = input.y
      this.pointerMode = true
    }
    if (this.pointerMode && input.hasInteracted) {
      this.shield.setTargetAngle(this.arena.angleTo(input.x, input.y))
    }
  }

  private beginGameplay(): void {
    this.gameplayStarted = true
    this.context.portal.gameplayStart()
    this.context.analytics.track(CoreEvent.GameplayStart, {
      seed: this.params.seed,
      daily: this.params.daily,
    })
  }

  private togglePause(): void {
    if (this.state === 'paused') this.leavePause()
    else if (this.state === 'running') this.enterPause()
  }

  private enterPause(): void {
    this.state = 'paused'
    if (this.gameplayStarted) this.context.portal.gameplayStop()
  }

  private leavePause(): void {
    void this.context.portal.commercialBreak().then(() => {
      if (this.state !== 'paused') return
      this.state = 'running'
      if (this.gameplayStarted) this.context.portal.gameplayStart()
    })
  }

  private beginDeath(): void {
    const { juice, audio, portal, analytics } = this.context
    this.state = 'dying'
    this.deathTimer = DEATH_DELAY
    juice.hitStop.freeze(BALANCE.juice.deathHitStop)
    juice.shake.add(0.95)
    juice.particles.emit({
      x: this.arena.centerX,
      y: this.arena.centerY,
      count: 46,
      speedMin: 90,
      speedMax: 420,
      lifeMin: 0.4,
      lifeMax: 1,
      sizeMin: 2,
      sizeMax: 7,
      colors: [PALETTE.hostile, PALETTE.ink],
      glow: true,
    })
    audio.play('gameOver')
    if (this.gameplayStarted) portal.gameplayStop()
    analytics.track(CoreEvent.Fail, {
      wave: this.director?.waveIndex ?? 0,
      score: this.score.score,
    })
    analytics.track(CoreEvent.GameplayEnd, {
      duration_ms: Math.round(this.elapsed * 1000),
      wave: this.director?.waveIndex ?? 0,
      score: this.score.score,
      reason: 'fail',
    })
  }

  private finishRun(): void {
    const summary = this.records.submit({
      score: this.score.score,
      wave: this.director?.waveIndex ?? 0,
      bestChain: this.score.bestChain,
      durationMs: Math.round(this.elapsed * 1000),
      daily: this.params.daily,
      dayNumber: this.params.dayNumber,
    })
    this.context.scenes.change('result', summary)
  }

  onDeflect(bullet: Bullet, offset: number): void {
    const { juice, audio } = this.context
    juice.hitStop.freeze(BALANCE.juice.deflectHitStop)
    juice.shake.add(BALANCE.juice.deflectShake)
    juice.particles.emit({
      x: bullet.x,
      y: bullet.y,
      count: 10,
      angle: Math.atan2(bullet.vy, bullet.vx),
      spread: 1.5,
      speedMin: 90,
      speedMax: 300,
      lifeMin: 0.15,
      lifeMax: 0.4,
      sizeMin: 1.5,
      sizeMax: 4,
      colors: [PALETTE.friendly, PALETTE.ink],
      shape: 'spark',
    })
    audio.play('deflect', { pitch: 1 + Math.abs(offset) * 0.25 })
  }

  onWallBounce(bullet: Bullet): void {
    const { juice, audio } = this.context
    juice.shake.add(0.05)
    juice.particles.emit({
      x: bullet.x,
      y: bullet.y,
      count: 5,
      speedMin: 40,
      speedMax: 140,
      lifeMin: 0.12,
      lifeMax: 0.3,
      sizeMin: 1,
      sizeMax: 3,
      colors: [PALETTE.friendly],
    })
    audio.play('wallBounce')
  }

  onTurretDestroyed(turret: Turret, _bullet: Bullet, chainIndex: number): void {
    const { juice, audio } = this.context
    const reward = this.score.registerKill(chainIndex)

    juice.hitStop.freeze(BALANCE.juice.killHitStop)
    juice.shake.add(BALANCE.juice.killShake)
    juice.particles.emit({
      x: turret.x,
      y: turret.y,
      count: 20 + chainIndex * 6,
      speedMin: 80,
      speedMax: 340,
      lifeMin: 0.25,
      lifeMax: 0.65,
      sizeMin: 2,
      sizeMax: 6,
      colors: [PALETTE.hostile, PALETTE.reward, PALETTE.ink],
      glow: true,
    })
    juice.texts.spawn({
      x: turret.x,
      y: turret.y,
      value: reward.multiplier > 1 ? `+${reward.points} x${reward.multiplier}` : `+${reward.points}`,
      color: reward.multiplier > 1 ? PALETTE.reward : PALETTE.ink,
      size: 20 + Math.min(12, reward.multiplier * 2),
    })
    audio.play('turretKill', { pitch: 1 + Math.min(0.6, chainIndex * 0.14) })
    this.context.portal.happyMoment(Math.min(1, 0.3 + chainIndex * 0.2))
  }

  onBulletIntercepted(bullet: Bullet): void {
    this.context.juice.particles.emit({
      x: bullet.x,
      y: bullet.y,
      count: 6,
      speedMin: 50,
      speedMax: 190,
      lifeMin: 0.12,
      lifeMax: 0.32,
      sizeMin: 1,
      sizeMax: 3,
      colors: [PALETTE.hostile],
    })
  }

  onCoreHit(x: number, y: number): void {
    const { juice, audio } = this.context
    juice.hitStop.freeze(0.11)
    juice.shake.add(BALANCE.juice.coreHitShake)
    juice.particles.emit({
      x,
      y,
      count: 24,
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

  onWaveStart(_index: number, _turretCount: number): void {
    /* reserved for wave banner */
  }

  onWaveCleared(index: number): void {
    const { juice, audio } = this.context
    if (!this.core.alive) return
    const bonus = this.score.registerWaveClear(index)
    const healed =
      (index + 1) % BALANCE.waves.healEveryWaves === 0 ? this.core.heal() : false
    juice.shake.add(BALANCE.juice.waveClearShake)
    if (healed) {
      juice.particles.emit({
        x: this.arena.centerX,
        y: this.arena.centerY,
        count: 18,
        speedMin: 40,
        speedMax: 160,
        lifeMin: 0.3,
        lifeMax: 0.8,
        sizeMin: 2,
        sizeMax: 5,
        colors: [PALETTE.friendly],
        glow: true,
      })
    }
    juice.texts.spawn({
      x: this.arena.centerX,
      y: this.arena.centerY - this.arena.radius * 0.45,
      value: `+${bonus}`,
      color: PALETTE.reward,
      size: 26,
      rise: 60,
      life: 1,
    })
    audio.play('waveClear')
  }

  onTurretTelegraph(_turret: Turret): void {
    this.context.audio.play('turretCharge', { volume: 0.6 })
  }

  onTurretFire(_turret: Turret): void {
    /* muzzle handled by turret recoil */
  }

  render(renderer: IRenderer, _alpha: number): void {
    const { juice, viewport } = this.context

    renderer.push()
    renderer.translate(this.arena.centerX, this.arena.centerY)
    juice.shake.apply(renderer)
    renderer.translate(-this.arena.centerX, -this.arena.centerY)

    this.renderArena(renderer)
    if (!this.context.input.hasInteracted) this.renderHint(renderer)
    this.turrets.render(renderer, this.arena)
    this.bullets.render(renderer)
    this.shield.render(renderer, this.arena)
    this.core.render(renderer, this.arena)
    juice.renderEffects(renderer)

    renderer.pop()

    this.hud.render(renderer, {
      score: this.score.score,
      wave: this.director?.waveIndex ?? 0,
      combo: this.score.combo,
      comboRatio: this.score.comboRatio,
      label: this.params.daily ? `ДЕНЬ #${this.params.dayNumber}` : 'ТРЕНУВАННЯ',
      safe: viewport.safeArea,
    })

    if (this.state === 'paused') this.renderPauseOverlay(renderer)
  }

  private renderArena(renderer: IRenderer): void {
    const { centerX, centerY, radius } = this.arena

    renderer.circle(centerX, centerY, radius, { fill: PALETTE.surface, alpha: 0.5 })
    renderer.ring(centerX, centerY, radius, BALANCE.arena.wallThickness, {
      stroke: PALETTE.grid,
    })

    const segments = 48
    for (let i = 0; i < segments; i++) {
      if (i % 2 !== 0) continue
      const start = (i / segments) * TAU
      renderer.arc(centerX, centerY, this.arena.shieldOrbit, start, start + TAU / segments, 1.5, {
        stroke: PALETTE.grid,
        alpha: 0.75,
      })
    }
  }

  private renderHint(renderer: IRenderer): void {
    const orbit = this.arena.shieldOrbit
    const sweep = (this.hintPhase * 1.6) % TAU
    const pulse = 0.4 + Math.sin(this.hintPhase * 4) * 0.25

    renderer.arc(this.arena.centerX, this.arena.centerY, orbit, sweep, sweep + 0.9, 6, {
      stroke: PALETTE.friendly,
      alpha: pulse * 0.7,
    })

    for (let i = 0; i < 3; i++) {
      const angle = sweep + 0.95 + i * 0.12
      const point = this.arena.pointAt(angle, orbit)
      renderer.circle(point.x, point.y, 3.5 - i, {
        fill: PALETTE.friendly,
        alpha: (pulse * 0.8) / (i + 1),
      })
    }
  }

  private renderPauseOverlay(renderer: IRenderer): void {
    const safe = this.context.viewport.safeArea
    renderer.rect(-renderer.width, -renderer.height, renderer.width * 3, renderer.height * 3, {
      fill: PALETTE.background,
      alpha: 0.72,
    })
    renderer.text('ПАУЗА', safe.x + safe.width / 2, safe.y + safe.height / 2 - 14, {
      fill: PALETTE.ink,
      size: 38,
      weight: 800,
      align: 'center',
      baseline: 'middle',
    })
    const alpha = 0.5 + Math.sin(this.hintPhase * 3) * 0.3
    renderer.text(
      'ПРОБІЛ АБО ESC',
      safe.x + safe.width / 2,
      safe.y + safe.height / 2 + 26,
      {
        fill: PALETTE.inkMuted,
        size: 15,
        weight: 600,
        align: 'center',
        baseline: 'middle',
        alpha,
      },
    )
  }
}
