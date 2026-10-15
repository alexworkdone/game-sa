import { AIM, BINDINGS, KEYS, TOUCH, capturedCodes, prefersTouch } from '../config/controls.js'
import { FLIGHT, RIG } from '../config/flight.js'
import { CASTLE, GROUND, GROUND_PALETTE, SCATTER, TREES, WATER } from '../config/ground.js'
import { FOE_SHOTS, HANDS, MAGIC, SPELLS } from '../config/magic.js'
import { BALLOONS, CROWD, MAGNETISM, MANA, PLAYER, REALM, RESERVE, WIZARD } from '../config/realm.js'
import { RENDER } from '../config/render.js'
import { CLOUDS, DAY, MOON, SKY_KEYS, STARS } from '../config/sky.js'
import { WORLD } from '../config/world.js'
import { CompositeControls } from '../controls/CompositeControls.js'
import { KeyboardMouseControls } from '../controls/KeyboardMouseControls.js'
import { TouchControls } from '../controls/TouchControls.js'
import { FixedStepLoop } from '../core/FixedStepLoop.js'
import { wrapDelta } from '../core/math.js'
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
import { WaterRenderer } from '../render/WaterRenderer.js'
import { WaveField } from '../render/WaveField.js'
import { ForestLayer } from '../render/layers/ForestLayer.js'
import { ProjectileLayer } from '../render/layers/ProjectileLayer.js'
import { ScatterLayer } from '../render/layers/ScatterLayer.js'
import { SolidLayer } from '../render/layers/SolidLayer.js'
import { TerrainLayer } from '../render/layers/TerrainLayer.js'
import { BalloonFleet } from '../realm/BalloonFleet.js'
import { Castle } from '../realm/Castle.js'
import { Crowd } from '../realm/Crowd.js'
import { Magnetism } from '../realm/Magnetism.js'
import { ManaField } from '../realm/ManaField.js'
import { ManaReserve } from '../realm/ManaReserve.js'
import { Realm } from '../realm/Realm.js'
import { Vitals } from '../realm/Vitals.js'
import { BalloonLayer } from '../render/layers/BalloonLayer.js'
import { CastleGaugeLayer } from '../render/layers/CastleGaugeLayer.js'
import { MagnetLayer } from '../render/layers/MagnetLayer.js'
import { ManaLayer } from '../render/layers/ManaLayer.js'
import { PeopleLayer } from '../render/layers/PeopleLayer.js'
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
import { CoverSet } from '../world/CoverSet.js'
import { FacePalette } from '../world/FacePalette.js'
import { GroundPattern } from '../world/GroundPattern.js'
import { Scatter } from '../world/Scatter.js'
import { Forest } from '../world/Forest.js'
import { GroundProbe } from '../world/GroundProbe.js'
import { TerrainMesh } from '../world/TerrainMesh.js'
import { FallbackWorldSource, InlineWorldSource, WorkerWorldSource } from '../world/WorldSources.js'

export const DEFAULT_FACTORIES = {
  createWorldSource: (config) => new FallbackWorldSource(new WorkerWorldSource(config), new InlineWorldSource(config)),
  createInput: (element) => new KeyboardMouseInput(element, capturedCodes()),
  createControls: (input, parent) => {
    const keyboard = new KeyboardMouseControls(input, BINDINGS, KEYS)
    return prefersTouch() ? new CompositeControls([keyboard, new TouchControls(parent, TOUCH)]) : keyboard
  },
  createSkyRenderer: (parts) => new SkyRenderer(parts),
  createWaterRenderer: (parts) => new WaterRenderer(parts),
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
  #markers = []
  #skyMs = 0
  #waterMs = 0
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
  #water
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
  #foeShots
  #foeHooks
  #crowd
  #magnetism
  #vitals
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

  get crowd() {
    return this.#crowd
  }

  get vitals() {
    return this.#vitals
  }

  get magnetism() {
    return this.#magnetism
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
    const shift = this.#controls.readGearShift(this.#time)
    if (shift !== 0) this.#shiftGear(shift)
  }

  #shiftGear(delta) {
    const changed = this.#flight.shiftGear(this.#carpet, delta)
    const speed = this.#flight.speedOf(this.#carpet)
    if (changed) this.#hud.notify(`Швидкість килима: ${speed}`)
    else this.#hud.notify(delta > 0 ? `Швидкість уже найбільша: ${speed}` : `Швидкість уже найменша: ${speed}`)
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
    this.#crowd.update(dt, this.#carpet, { pool: this.#foeShots, spell: FOE_SHOTS[0] })
    this.#foeShots.update(dt, this.#ground, this.#foeHooks)
    this.#magnetism.update(dt)
    this.#realm.update(dt, this.#carpet)
    this.#vitals.update(dt, this.#realm.isHome(this.#carpet.x, this.#carpet.y))
  }

  render(alpha, dt) {
    this.#renderFrame(alpha, dt)
    this.#controls.endFrame()
  }

  #buildWorld(seed) {
    const terrain = this.#terrain
    const pattern = new GroundPattern(terrain, seed, GROUND)
    this.#mesh = new TerrainMesh(terrain, new FacePalette(terrain, GROUND_PALETTE, WORLD.snowLine, pattern), GROUND)
    const castleModel = new CastleModel(CASTLE)
    const castles = terrain.castles.map(
      (site) => new Castle({ ...site, mana: REALM.levelMana[site.level] * REALM.castleMana }, castleModel, REALM),
    )
    const units = castles.flatMap((castle) => castle.units)
    const structures = [...castles]
    this.#ground = new GroundProbe(this.#mesh, structures)
    const forest = new Forest(terrain, this.#mesh, TREES, seed)
    const scatter = new Scatter(terrain, this.#mesh, pattern, SCATTER, WORLD.snowLine, seed)

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
      cover: new CoverSet([forest, scatter]),
      model: castleModel,
      config: REALM,
      player: PLAYER,
      mana: this.#mana,
      manaScale: MANA.sizeScale,
      manaHover: MANA.hover,
      probe: this.#ground,
      reserve: this.#reserve,
      balloons,
      castles,
      units,
      structures,
      notify,
    })
    this.#realm.setGoal(castles.reduce((total, castle) => total + castle.mana, freeMana))
    this.#projectiles = new ProjectilePool(MAGIC.poolSize, terrain.size, MAGIC.burstTime)
    this.#caster = new Caster(this.#projectiles, SPELLS, MAGIC, this.#ground, {
      hands: HANDS,
      reserve: this.#reserve,
      rules: { castle: this.#realm.castleRules() },
      notify,
    })
    this.#vitals = new Vitals(WIZARD)
    this.#crowd = new Crowd({
      mesh: this.#mesh,
      terrain,
      config: CROWD,
      seed,
      onFall: (x, y, value) => this.#realm.dropMana(x, y, value),
    })
    this.#magnetism = new Magnetism({
      mana: this.#mana,
      ground: this.#ground,
      config: MAGNETISM,
      hover: MANA.hover,
      sizeScale: MANA.sizeScale,
      worldSize: terrain.size,
    })
    this.#foeShots = new ProjectilePool(MAGIC.foePoolSize, terrain.size, MAGIC.burstTime)
    this.#foeHooks = {
      touch: (spell, x, y, z) => this.#shotReaches(FOE_SHOTS[spell], x, y, z),
      impact: () => {},
    }
    const homing = new Homing(SPELLS, {
      foreignMana: (...args) => this.#realm.findForeignMana(...args),
      mana: (...args) => this.#realm.findMana(...args),
      hostile: (...args) => this.#crowd.findTarget(...args),
    })
    this.#spellHooks = {
      guide: (pool, i, dt) => homing.guide(pool, i, dt),
      touch: (spell, x, y, z) => this.#spellTouches(SPELLS[spell], x, y, z),
      impact: (spell, x, y, z) => {
        const spec = SPELLS[spell]
        if (spec.effect === 'possess') this.#realm.possessNear(x, y, z, MANA.possessSplash)
        if (spec.effect === 'castle') this.#realm.castCastle(x, y)
        if (spec.effect === 'blast') this.#blast(spec, x, y, z)
        if (spec.effect === 'magnet') this.#magnetize(this.#magnetism.pearlNear(x, y, z, MAGNETISM.splash))
      },
    }

    this.#sky = this.#factories.createSkyRenderer({ atmosphere: this.#atmosphere, clouds: this.#clouds })
    const shader = new GroundShader({
      atmosphere: this.#atmosphere,
      shadows: this.#shadows,
      clouds: this.#clouds,
      config: GROUND,
      seaLevel: terrain.seaLevel,
    })
    this.#water = this.#factories.createWaterRenderer({
      atmosphere: this.#atmosphere,
      clouds: this.#clouds,
      shader,
      mesh: this.#mesh,
      waves: new WaveField(seed, WATER.waves),
      config: WATER,
      radius: GROUND.radius,
    })
    this.#scene = this.#factories.createSceneRenderer({
      shader,
      colors: new ColorCache(),
      config: GROUND,
      layers: [
        new TerrainLayer(this.#mesh),
        new ScatterLayer(scatter, SCATTER),
        new ForestLayer(forest, TREES),
        new SolidLayer(units, terrain.size, CASTLE.detailRadius),
        new CastleGaugeLayer(castles, REALM.gauge, terrain.size),
        new ManaLayer(this.#mana, this.#mesh, MANA, terrain.size),
        new MagnetLayer(this.#magnetism, this.#mana, this.#ground, SPELLS.find((spell) => spell.id === 'magnet'), MAGNETISM, terrain.size),
        new PeopleLayer(this.#crowd, this.#mesh, CROWD, FOE_SHOTS[0], terrain.size, CROWD.aggro * 2),
        new BalloonLayer(balloons, BALLOONS, MANA, terrain.size),
        new ProjectileLayer(this.#projectiles, SPELLS, terrain.size),
        new ProjectileLayer(this.#foeShots, FOE_SHOTS, terrain.size),
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

  #spellTouches(spec, x, y, z) {
    if (spec.effect === 'possess') return this.#realm.possessNear(x, y, z, MANA.possessRadius)
    if (spec.effect === 'blast') {
      if (!this.#crowd.hit(x, y, z, 0)) return false
      this.#blast(spec, x, y, z)
      return true
    }
    if (spec.effect === 'magnet') {
      const target = this.#magnetism.pearlNear(x, y, z, MAGNETISM.touch)
      if (target < 0) return false
      this.#magnetize(target)
      return true
    }
    return false
  }

  #blast(spec, x, y, z) {
    this.#realm.blast(x, y, z, spec.damage, spec.blast)
    this.#crowd.hit(x, y, z, spec.blast)
  }

  #magnetize(target) {
    if (target < 0) return
    const pulled = this.#magnetism.attract(target)
    this.#hud.notify(pulled > 0 ? `Магніт тягне кульок: ${pulled}` : 'Поруч немає менших кульок')
  }

  #shotReaches(spec, x, y, z) {
    const carpet = this.#carpet
    const size = this.#terrain.size
    const gap = Math.hypot(wrapDelta(carpet.x - x, size), wrapDelta(carpet.y - y, size), carpet.z - z)
    if (gap > WIZARD.hitRadius) return false
    if (this.#vitals.damage(spec.damage)) this.#fall()
    return true
  }

  #fall() {
    const carpet = this.#carpet
    const home = this.#realm.playerCastle ?? this.#terrain.spawn
    carpet.x = home.x
    carpet.y = home.y
    carpet.z = this.#ground.groundAt(home.x, home.y) + FLIGHT.minClearance + 30
    carpet.vx = 0
    carpet.vy = 0
    carpet.vz = 0
    carpet.remember()
    this.#vitals.revive()
    this.#reserve.value *= WIZARD.respawnMana
    this.#hud.notify('Тебе збили! Килим повертає тебе додому')
  }

  #castleReport() {
    const realm = this.#realm
    const castle = realm.playerCastle
    const ready = realm.upgradeReady
    const health = castle && { value: castle.health, max: castle.maxHealth, alarm: castle.underAttack }
    return { status: this.#castleStatus(ready), ready, health }
  }

  #castleStatus(ready) {
    const realm = this.#realm
    const castle = realm.playerCastle
    if (!castle) return realm.building ? 'Площа вирівнюється під замок…' : 'Замку ще немає — вибери чари «Замок» і цілься в землю'
    if (castle.rising) return `Замок росте: рівень\u00a0${castle.level}`
    if (ready) return `Мани досить на рівень\u00a0${castle.level + 1} — цілься чарами «Замок» у свій замок`
    const next = realm.nextLevelMana()
    const progress = next === null ? 'найбільший рівень' : `до рівня\u00a0${castle.level + 1}: ${Math.floor(castle.mana)}\u00a0/\u00a0${next}`
    return `Твій замок · рівень\u00a0${castle.level} · ${progress}`
  }

  #castleMarkers() {
    const realm = this.#realm
    const carpet = this.#carpet
    const size = this.#terrain.size
    const ready = realm.upgradeReady
    const markers = this.#markers
    const standing = realm.castles.filter((castle) => castle.standing)
    markers.length = standing.length
    standing.forEach((castle, index) => {
      const marker = (markers[index] ??= {})
      const home = castle === realm.playerCastle
      const [r, g, b] = castle.color ?? CASTLE.roofs[castle.banner % CASTLE.roofs.length]
      marker.bearing = (Math.atan2(wrapDelta(castle.y - carpet.y, size), wrapDelta(castle.x - carpet.x, size)) * 180) / Math.PI + 90
      marker.home = home
      marker.ready = home && ready
      marker.alarm = castle.underAttack
      marker.color = `rgb(${r} ${g} ${b})`
    })
    return markers
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
    const waterStarted = performance.now()
    this.#water.render(this.#buffer, camera, this.#skyView, this.#time)
    this.#waterMs += (performance.now() - waterStarted - this.#waterMs) * 0.1
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
      vitals: this.#vitals,
      progress: this.#realm.progress,
      castle: this.#castleReport(),
      markers: this.#castleMarkers(),
    })
    this.#carpetView.update(camera, Math.min(1.1, brightness * 1.4))
    this.#hands.update(dt, this.#time, (index) => this.#caster.readiness(index), brightness * 1.3)

    if (this.#hud.statsVisible) {
      this.#hud.setStats(
        [
          `${this.#fps.toFixed(0)} fps`,
          `небо ${this.#skyMs.toFixed(1)} мс (вода ${this.#waterMs.toFixed(1)}) · ${this.#skyView.width}×${this.#skyView.height}`,
          `земля ${this.#sceneMs.toFixed(1)} мс · ${this.#primitives} фігур`,
          `x ${carpet.x.toFixed(0)} y ${carpet.y.toFixed(0)} z ${carpet.z.toFixed(0)}`,
        ].join('\n'),
      )
    }
  }
}
