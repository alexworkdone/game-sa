import { AIM, BINDINGS, TOUCH, capturedCodes, prefersTouch } from '../config/controls.js'
import { FLIGHT, RIG } from '../config/flight.js'
import { CASTLE, GROUND, GROUND_PALETTE, TREES } from '../config/ground.js'
import { HANDS, MAGIC, SPELLS } from '../config/magic.js'
import { BALLOONS, MANA, PLAYER, REALM, RESERVE } from '../config/realm.js'
import { RENDER } from '../config/render.js'
import { CLOUDS, DAY, MOON, SKY_KEYS, STARS } from '../config/sky.js'
import { WORLD } from '../config/world.js'
import { CompositeControls } from '../controls/CompositeControls.js'
import { KeyboardMouseControls } from '../controls/KeyboardMouseControls.js'
import { TouchControls } from '../controls/TouchControls.js'
import { FixedStepLoop } from '../core/FixedStepLoop.js'
import { SeededRandom } from '../core/SeededRandom.js'
import { KeyboardMouseInput } from '../core/KeyboardMouseInput.js'
import { Camera, CameraRig } from '../flight/CameraRig.js'
import { Carpet } from '../flight/Carpet.js'
import { FlightModel } from '../flight/FlightModel.js'
import { Caster } from '../magic/Caster.js'
import { Homing } from '../magic/Homing.js'
import { ProjectilePool } from '../magic/ProjectilePool.js'
import { CanvasPresenter } from '../render/CanvasPresenter.js'
import { ColorCache } from '../render/ColorCache.js'
import { FrameBuffer } from '../render/FrameBuffer.js'
import { GroundShader } from '../render/GroundShader.js'
import { ResolutionScaler } from '../render/ResolutionScaler.js'
import { SceneRenderer } from '../render/SceneRenderer.js'
import { SkyRenderer } from '../render/SkyRenderer.js'
import { SunShadowMap } from '../render/SunShadowMap.js'
import { ForestLayer } from '../render/layers/ForestLayer.js'
import { ProjectileLayer } from '../render/layers/ProjectileLayer.js'
import { SolidLayer } from '../render/layers/SolidLayer.js'
import { TerrainLayer } from '../render/layers/TerrainLayer.js'
import { BalloonFleet } from '../realm/BalloonFleet.js'
import { Castle } from '../realm/Castle.js'
import { ManaField } from '../realm/ManaField.js'
import { ManaReserve } from '../realm/ManaReserve.js'
import { Realm } from '../realm/Realm.js'
import { BalloonLayer } from '../render/layers/BalloonLayer.js'
import { ManaLayer } from '../render/layers/ManaLayer.js'
import { Atmosphere } from '../sky/Atmosphere.js'
import { CloudLayer } from '../sky/CloudLayer.js'
import { DayCycle } from '../sky/DayCycle.js'
import { StarField } from '../sky/StarField.js'
import { CarpetView } from '../ui/CarpetView.js'
import { HandsView } from '../ui/HandsView.js'
import { Hud } from '../ui/Hud.js'
import { Screens } from '../ui/Screens.js'
import { SpellWheel, spellIcon } from '../ui/SpellWheel.js'
import { CastleModel } from '../world/CastleModel.js'
import { FacePalette } from '../world/FacePalette.js'
import { Forest } from '../world/Forest.js'
import { GroundProbe } from '../world/GroundProbe.js'
import { TerrainMesh } from '../world/TerrainMesh.js'
import { FallbackWorldSource, InlineWorldSource, WorkerWorldSource } from '../world/WorldSources.js'

export const DEFAULT_FACTORIES = {
  createWorldSource: (config) => new FallbackWorldSource(new WorkerWorldSource(config), new InlineWorldSource(config)),
  createInput: (element) => new KeyboardMouseInput(element, capturedCodes()),
  createControls: (input, parent) => {
    const keyboard = new KeyboardMouseControls(input, BINDINGS)
    return prefersTouch() ? new CompositeControls([keyboard, new TouchControls(parent, TOUCH)]) : keyboard
  },
  createSkyRenderer: (parts) => new SkyRenderer(parts),
  createSceneRenderer: (parts) => new SceneRenderer(parts),
  createPresenter: (canvas) => new CanvasPresenter(canvas),
  createScreens: (parent) => new Screens(parent, prefersTouch()),
  createHud: (parent) => new Hud(parent),
  createCarpetView: (parent) => new CarpetView(parent),
  createHandsView: (parent) => new HandsView(parent, SPELLS, HANDS),
  createSpellWheel: (parent, handlers) => new SpellWheel(parent, SPELLS, handlers),
}

const STATE = {
  loading: 'loading',
  title: 'title',
  playing: 'playing',
  choosing: 'choosing',
  paused: 'paused',
}

export class MagicCarpetApp {
  #dom
  #factories
  #state = STATE.loading
  #time = 0
  #skyView = { width: 0, height: 0, focal: 1, pixelScale: 1 }
  #sceneFrame = { focal: 1, extentX: 0, extentY: 0, lineWidth: 1 }
  #aim = { u: 0, v: 0 }
  #skyMs = 0
  #sceneMs = 0
  #primitives = 0
  #fps = 0
  #screens
  #terrain
  #mesh
  #ground
  #day
  #atmosphere
  #clouds
  #shadows
  #stars
  #sky
  #scene
  #buffer
  #presenter
  #scaler
  #input
  #controls
  #carpet
  #flight
  #rig
  #camera
  #projectiles
  #caster
  #mana
  #reserve
  #realm
  #spellHooks
  #hud
  #carpetView
  #hands
  #wheel
  #loop

  constructor(dom, factories = {}) {
    this.#dom = dom
    this.#factories = { ...DEFAULT_FACTORIES, ...factories }
  }

  get state() {
    return this.#state
  }

  get carpet() {
    return this.#carpet
  }

  get day() {
    return this.#day
  }

  get input() {
    return this.#input
  }

  get castles() {
    return this.#terrain.castles
  }

  get realm() {
    return this.#realm
  }

  get reserve() {
    return this.#reserve
  }

  async start(seed = WORLD.defaultSeed) {
    const factories = this.#factories
    this.#screens = factories.createScreens(this.#dom.ui)
    this.#screens.showLoading()

    try {
      this.#terrain = await factories
        .createWorldSource(WORLD)
        .load(seed, (progress) => this.#screens.setProgress(progress))
    } catch (error) {
      this.#screens.showError(String(error?.message ?? error))
      return
    }

    this.#buildWorld(seed)
    this.#buildPlayer()
    this.#buildView()
    this.#bindLifecycle()
    this.#resize()
    this.#renderFrame(0)
    this.#state = STATE.title
    this.#screens.showTitle(() => this.#play())
  }

  advance(seconds, steps = 1) {
    for (let i = 0; i < steps; i++) this.#loop.advance(seconds)
  }

  beginFrame(dt) {
    this.#time += dt
    this.#fps += (1 / Math.max(dt, 1e-3) - this.#fps) * 0.05
    if (this.#controls.wasPressed('pause') && !this.#input.pointerLocked) {
      this.#pause()
      return
    }
    if (this.#controls.wasPressed('stats')) this.#hud.toggleStats()
    const picked = this.#controls.pickedSpell(SPELLS.length)
    if (picked >= 0) this.#selectSpell(picked)
  }

  #selectSpell(index) {
    if (!this.#caster.select(1, index)) return
    this.#hands.select(1, index)
    this.#wheel.setSelected(index)
    this.#controls.showSpell?.(1, () => spellIcon(SPELLS[index].id))
    this.#hud.notify(`Права рука: ${SPELLS[index].title}`)
  }

  update(dt) {
    const controls = this.#controls
    this.#flight.steer(this.#carpet, controls.readCursor(), dt)
    this.#flight.step(this.#carpet, controls.readFlight(), dt)
    const warp = import.meta.env.DEV && controls.isHeld('timeWarp') ? DAY.warpSpeed : 1
    this.#day.update(dt, warp)
    this.#clouds.update(dt)
    this.#caster.update(dt, controls.readTriggers(), this.#eye(), this.#aimRay())
    this.#projectiles.update(dt, this.#ground, this.#spellHooks)
    this.#realm.update(dt, this.#carpet)
  }

  render(alpha, dt) {
    this.#renderFrame(alpha, dt)
    this.#controls.endFrame()
  }

  #buildWorld(seed) {
    const terrain = this.#terrain
    this.#mesh = new TerrainMesh(terrain, new FacePalette(terrain, GROUND_PALETTE, WORLD.snowLine), GROUND)
    const castleModel = new CastleModel(CASTLE)
    const castles = terrain.castles.map((site) => new Castle(site, castleModel, REALM))
    const units = castles.flatMap((castle) => castle.units)
    const structures = [...castles]
    this.#ground = new GroundProbe(this.#mesh, structures)
    const forest = new Forest(terrain, this.#mesh, TREES, seed)

    this.#day = new DayCycle(DAY)
    this.#atmosphere = new Atmosphere(SKY_KEYS, MOON)
    this.#atmosphere.update(this.#day)
    this.#clouds = new CloudLayer(seed, CLOUDS)
    this.#shadows = new SunShadowMap(terrain, { shift: RENDER.shadowShift, steps: RENDER.shadowSteps })
    this.#shadows.rebuild(this.#lightDirection())
    this.#stars = new StarField(seed, STARS.count)

    const notify = (text) => this.#hud?.notify(text)
    this.#mana = new ManaField(MANA.capacity, terrain.size)
    const freeMana = this.#mana.scatter(new SeededRandom(seed ^ 0x6d616e61), MANA.initialCount, this.#ground, MANA)
    this.#reserve = new ManaReserve(RESERVE)
    const balloons = new BalloonFleet(BALLOONS, this.#mana, this.#ground, terrain.size)
    this.#realm = new Realm({
      mesh: this.#mesh,
      terrain,
      forest,
      model: castleModel,
      config: REALM,
      player: PLAYER,
      mana: this.#mana,
      reserve: this.#reserve,
      balloons,
      castles,
      units,
      structures,
      notify,
    })
    this.#realm.setGoal(freeMana)
    this.#projectiles = new ProjectilePool(MAGIC.poolSize, terrain.size, MAGIC.burstTime)
    this.#caster = new Caster(this.#projectiles, SPELLS, MAGIC, this.#ground, {
      hands: HANDS,
      reserve: this.#reserve,
      rules: { castle: this.#realm.castleRules() },
      notify,
    })
    const homing = new Homing(SPELLS, {
      foreignMana: (...args) => this.#realm.findForeignMana(...args),
      hostile: (...args) => this.#realm.findHostile(...args),
    })
    this.#spellHooks = {
      guide: (pool, i, dt) => homing.guide(pool, i, dt),
      touch: (spell, x, y, z) => SPELLS[spell].effect === 'possess' && this.#realm.possessNear(x, y, z, MANA.possessRadius),
      impact: (spell, x, y, z) => {
        const effect = SPELLS[spell].effect
        if (effect === 'possess') this.#realm.possessNear(x, y, z, MANA.possessSplash)
        if (effect === 'castle') this.#realm.castCastle(x, y)
      },
    }

    this.#sky = this.#factories.createSkyRenderer({ atmosphere: this.#atmosphere, clouds: this.#clouds })
    const shader = new GroundShader({
      atmosphere: this.#atmosphere,
      shadows: this.#shadows,
      clouds: this.#clouds,
      config: GROUND,
      seaLevel: terrain.seaLevel,
      palette: GROUND_PALETTE,
    })
    this.#scene = this.#factories.createSceneRenderer({
      shader,
      colors: new ColorCache(),
      config: GROUND,
      layers: [
        new TerrainLayer(this.#mesh),
        new ForestLayer(forest, TREES),
        new SolidLayer(units, terrain.size, CASTLE.detailRadius),
        new ManaLayer(this.#mana, MANA, terrain.size),
        new BalloonLayer(balloons, BALLOONS, MANA, terrain.size),
        new ProjectileLayer(this.#projectiles, SPELLS, terrain.size),
      ],
    })
  }

  #buildPlayer() {
    const terrain = this.#terrain
    const spawn = terrain.spawn
    const z = Math.max(spawn.z, this.#ground.groundAt(spawn.x, spawn.y) + FLIGHT.minClearance + 10)
    this.#carpet = new Carpet({ ...spawn, z })
    this.#flight = new FlightModel(FLIGHT, AIM, this.#ground, terrain.size)
    this.#rig = new CameraRig(RIG, RENDER, terrain.size)
    this.#camera = new Camera()
    this.#input = this.#factories.createInput(this.#dom.canvas)
    this.#input.attach()
    this.#controls = this.#factories.createControls(this.#input, this.#dom.ui)
    this.#loop = new FixedStepLoop(this)
  }

  #buildView() {
    this.#buffer = new FrameBuffer()
    this.#presenter = this.#factories.createPresenter(this.#dom.canvas)
    this.#scaler = new ResolutionScaler(RENDER.targetSkyMs)
    this.#carpetView = this.#factories.createCarpetView(this.#dom.ui)
    this.#hands = this.#factories.createHandsView(this.#dom.ui)
    this.#hud = this.#factories.createHud(this.#dom.ui)
    this.#caster.onCast((handIndex) => this.#hands.cast(handIndex))
    this.#wheel = this.#factories.createSpellWheel(this.#dom.ui, {
      onSelect: (index) => this.#selectSpell(index),
      onOpen: () => this.#hold(),
      onClose: () => this.#release(),
    })
    this.#wheel.setSelected(this.#caster.hands[1].spell)
    this.#caster.hands.forEach((hand, handIndex) => this.#controls.showSpell?.(handIndex, () => spellIcon(SPELLS[hand.spell].id)))
  }

  #bindLifecycle() {
    window.addEventListener('resize', () => this.#resize())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.#pause()
    })
    this.#input.onPointerLockChange((locked) => {
      if (!locked) this.#pause()
    })
  }

  #play() {
    if (this.#state === STATE.playing) return
    if (this.#state === STATE.title) this.#controls.centerCursor()
    this.#state = STATE.playing
    this.#screens.hide()
    this.#hud.show()
    this.#hands.show()
    this.#wheel.show()
    this.#controls.show?.()
    this.#input.requestPointerLock()
    this.#loop.start()
  }

  #hold() {
    if (this.#state !== STATE.playing) return
    this.#state = STATE.choosing
    this.#loop.stop()
  }

  #release() {
    if (this.#state !== STATE.choosing) return
    this.#state = STATE.playing
    this.#loop.start()
  }

  #pause() {
    if (this.#state !== STATE.playing) return
    this.#state = STATE.paused
    this.#loop.stop()
    this.#controls.hide?.()
    this.#input.releasePointerLock()
    this.#screens.showPause(() => this.#play())
  }

  #resize() {
    const rect = this.#dom.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))
    this.#presenter.resize(width, height, Math.min(window.devicePixelRatio || 1, 2))
    this.#carpetView.resize(width, height)
    this.#controls.resize(width, height)
    const minScale = Math.max(1, height / RENDER.maxBufferHeight)
    const maxScale = Math.max(minScale, height / RENDER.minBufferHeight)
    this.#scaler.setBounds(minScale, maxScale, height / RENDER.initialBufferHeight)
    const cos = Math.cos(RENDER.maxRoll)
    const sin = Math.sin(RENDER.maxRoll)
    this.#buffer.ensure(
      Math.ceil((width * cos + height * sin) / minScale) + 4,
      Math.ceil((width * sin + height * cos) / minScale) + 4,
    )
    if (this.#state !== STATE.playing) this.#renderFrame(0)
  }

  #castleStatus() {
    const realm = this.#realm
    const castle = realm.playerCastle
    if (!castle) return realm.building ? 'Площа вирівнюється під замок…' : 'Замку ще немає — вибери чари «Замок» і цілься в землю'
    if (castle.rising) return `Замок росте: рівень ${castle.level}`
    const next = realm.nextLevelMana()
    const progress = next === null ? 'найбільший рівень' : `до рівня ${castle.level + 1}: ${Math.floor(castle.mana)} / ${next}`
    return `Твій замок · рівень ${castle.level} · ${progress}`
  }

  #lightDirection() {
    const atmosphere = this.#atmosphere
    return { x: atmosphere.lightX, y: atmosphere.lightY, z: atmosphere.lightZ }
  }

  #eye() {
    this.#rig.follow(this.#camera, this.#carpet, 1)
    return this.#camera
  }

  #aimRay() {
    const camera = this.#camera
    const width = this.#presenter.cssWidth
    const height = this.#presenter.cssHeight
    const focal = (height * 0.5) / Math.tan(camera.verticalFov / 2)
    const cursor = this.#controls.cursorPixels()
    const sx = cursor.x - width / 2
    const sy = cursor.y - height / 2
    const cos = Math.cos(camera.roll)
    const sin = Math.sin(camera.roll)
    this.#aim.u = (sx * cos - sy * sin) / focal
    this.#aim.v = Math.tan(camera.pitch) - (sx * sin + sy * cos) / focal
    return this.#aim
  }

  #updateViews(camera) {
    const width = this.#presenter.cssWidth
    const height = this.#presenter.cssHeight
    const roll = Math.min(Math.abs(camera.roll), RENDER.maxRoll)
    const cos = Math.cos(roll)
    const sin = Math.sin(roll)
    const halfFov = Math.tan(camera.verticalFov / 2)

    const sky = this.#skyView
    const scale = this.#scaler.scale
    sky.width = Math.min(this.#buffer.width, Math.ceil((width * cos + height * sin) / scale) + 2)
    sky.height = Math.min(this.#buffer.height, Math.ceil((width * sin + height * cos) / scale) + 2)
    sky.focal = ((height / scale) * 0.5) / halfFov
    sky.pixelScale = scale

    const frame = this.#sceneFrame
    frame.focal = (height * 0.5) / halfFov
    frame.extentX = (width * cos + height * sin) * 0.5 + 4
    frame.extentY = (width * sin + height * cos) * 0.5 + 4
    frame.lineWidth = 1 / this.#presenter.pixelRatio + 0.4
  }

  #renderFrame(alpha, dt = 0) {
    const camera = this.#camera
    const carpet = this.#carpet
    this.#rig.follow(camera, carpet, alpha)
    this.#atmosphere.update(this.#day)
    this.#shadows.update(this.#lightDirection(), RENDER.shadowRowsPerFrame)
    this.#updateViews(camera)

    const skyStarted = performance.now()
    this.#sky.render(this.#buffer, camera, this.#skyView)
    this.#stars.render(this.#buffer, camera, this.#skyView, this.#atmosphere, this.#day, this.#time)
    this.#buffer.flush(this.#skyView.width, this.#skyView.height)
    this.#presenter.present(this.#buffer, this.#skyView.width, this.#skyView.height, this.#skyView.pixelScale, camera.roll)
    const skyElapsed = performance.now() - skyStarted
    this.#scaler.record(skyElapsed)
    this.#skyMs += (skyElapsed - this.#skyMs) * 0.1

    const sceneStarted = performance.now()
    this.#presenter.overlay(camera.roll, (context) => {
      this.#primitives = this.#scene.render(context, camera, this.#sceneFrame, this.#time)
    })
    this.#sceneMs += (performance.now() - sceneStarted - this.#sceneMs) * 0.1

    const atmosphere = this.#atmosphere
    const brightness =
      (atmosphere.ambientR + atmosphere.ambientG + atmosphere.ambientB) / 3 +
      ((atmosphere.lightR + atmosphere.lightG + atmosphere.lightB) / 3) * Math.max(0, atmosphere.lightZ) * 0.8
    this.#hud.update({
      heading: ((((camera.yaw * 180) / Math.PI + 90) % 360) + 360) % 360,
      altitude: carpet.z,
      ground: this.#ground.groundAt(carpet.x, carpet.y),
      seaLevel: this.#terrain.seaLevel,
      clock: this.#day.clock(),
      daylight: this.#day.sun.z > -0.04,
      cursorX: this.#controls.cursorPixels().x,
      cursorY: this.#controls.cursorPixels().y,
      mana: this.#reserve,
      balance: this.#realm.equilibrium,
      castle: this.#castleStatus(),
    })
    this.#carpetView.update(camera, Math.min(1.1, brightness * 1.4))
    this.#hands.update(dt, this.#time, (index) => this.#caster.readiness(index), brightness * 1.3)

    if (this.#hud.statsVisible) {
      this.#hud.setStats(
        [
          `${this.#fps.toFixed(0)} fps`,
          `небо ${this.#skyMs.toFixed(1)} мс · ${this.#skyView.width}×${this.#skyView.height}`,
          `земля ${this.#sceneMs.toFixed(1)} мс · ${this.#primitives} фігур`,
          `x ${carpet.x.toFixed(0)} y ${carpet.y.toFixed(0)} z ${carpet.z.toFixed(0)}`,
        ].join('\n'),
      )
    }
  }
}
