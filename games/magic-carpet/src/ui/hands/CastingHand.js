import { html, svg } from '../dom.js'
import { createHandArt } from './HandArt.js'
import { HAND_LEAN, HAND_TILT, LAUNCH, ORB, VIEW, silhouette } from './handGeometry.js'

const RAISE = 0.09
const LOWER = 0.42
const FLASH = 0.3
const LAUNCH_TIME = 0.16
const REST = { x: 0, y: 10, angle: 0, scale: 1 }
const PUSH = { x: 7, y: -3, angle: -6, scale: 0.93 }

const easeOut = (t) => 1 - (1 - t) * (1 - t)
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const mixPose = (t) => ({
  x: REST.x + (PUSH.x - REST.x) * t,
  y: REST.y + (PUSH.y - REST.y) * t,
  angle: REST.angle + (PUSH.angle - REST.angle) * t,
  scale: REST.scale + (PUSH.scale - REST.scale) * t,
})

const layer = (className, children) =>
  svg('svg', { class: className, viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, 'aria-hidden': 'true' }, children)

export class CastingHand {
  #root
  #rig
  #art
  #orbs
  #current
  #orbGroup
  #auraStops
  #aura
  #rim
  #rimOuter
  #rimInner
  #ring
  #launch
  #castAge = Infinity

  constructor({ id, side, gem, orbs, selected }) {
    this.#orbs = orbs
    const stop = (offset, opacity) => svg('stop', { offset, 'stop-opacity': opacity })
    this.#auraStops = [stop(0, 0.8), stop(0.35, 0.38), stop(1, 0)]
    const defs = svg('defs', {}, [
      ...Object.values(orbs).flatMap((orb) => orb.defs),
      svg('radialGradient', { id: `${id}-aura` }, this.#auraStops),
    ])

    this.#aura = svg('circle', { cx: ORB[0], cy: ORB[1], r: 74, fill: `url(#${id}-aura)` })
    this.#rimOuter = svg('g', { 'stroke-width': 9, 'stroke-opacity': 0.12 }, silhouette().map((d) => svg('path', { d })))
    this.#rimInner = svg('g', { 'stroke-width': 3, 'stroke-opacity': 0.3 }, silhouette().map((d) => svg('path', { d })))
    this.#rim = svg('g', { fill: 'none', 'stroke-linejoin': 'round' }, [this.#rimOuter, this.#rimInner])
    this.#orbGroup = svg('g', {}, Object.values(orbs).map((orb) => orb.element))
    this.#ring = svg('circle', { cx: ORB[0], cy: ORB[1], r: 0, fill: 'none', 'stroke-width': 4, opacity: 0 })
    this.#launch = svg('circle', { cx: ORB[0], cy: ORB[1], r: 18, opacity: 0 })
    this.#art = createHandArt(id, gem)

    this.#rig = html('div', { class: 'hand__rig' }, [
      layer('hand__magic', [this.#rim]),
      this.#art,
      layer('hand__magic', [defs, this.#aura, this.#orbGroup, this.#ring, this.#launch]),
    ])
    this.#root = html('div', { class: `hand hand--${side}`, style: `--tilt: ${HAND_TILT}deg; --lean: ${HAND_LEAN}deg` }, [this.#rig])
    this.select(selected)
  }

  select(id) {
    const orb = this.#orbs[id]
    if (!orb) return
    this.#current = orb
    for (const [key, candidate] of Object.entries(this.#orbs)) candidate.element.style.display = key === id ? '' : 'none'
    const [deep, bright] = orb.glow
    this.#auraStops[0].setAttribute('stop-color', bright)
    this.#auraStops[1].setAttribute('stop-color', deep)
    this.#auraStops[2].setAttribute('stop-color', deep)
    this.#rimOuter.setAttribute('stroke', deep)
    this.#rimInner.setAttribute('stroke', bright)
    this.#ring.setAttribute('stroke', bright)
    this.#launch.setAttribute('fill', bright)
  }

  get element() {
    return this.#root
  }

  cast() {
    this.#castAge = 0
  }

  update(dt, time, readiness, brightness) {
    this.#castAge += dt
    const age = this.#castAge
    let push = 0
    if (age < RAISE) push = easeOut(age / RAISE)
    else if (age < RAISE + LOWER) push = 1 - easeInOut((age - RAISE) / LOWER)
    const pose = mixPose(push)
    this.#rig.style.transform = `translate(${pose.x.toFixed(2)}%, ${pose.y.toFixed(2)}%) rotate(${pose.angle.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`

    const flash = age < FLASH ? 1 - age / FLASH : 0
    this.#art.style.filter = `brightness(${(brightness + flash * 0.3).toFixed(3)})`

    const charge = Math.max(0, Math.min(1, readiness))
    const size = Math.pow(charge, 0.7)
    const pulse = 1 + Math.sin(time * 3.1) * 0.035
    this.#orbGroup.setAttribute(
      'transform',
      `translate(${ORB[0]} ${ORB[1]}) scale(${(size * pulse * 1.2).toFixed(3)})`,
    )
    this.#current.update(time, charge)
    this.#aura.setAttribute('opacity', (0.3 + size * 0.55 + flash * 0.4).toFixed(3))
    this.#rim.setAttribute('opacity', (0.25 + size * 0.6 + flash * 0.4).toFixed(3))

    if (age < FLASH) {
      const t = age / FLASH
      this.#ring.setAttribute('r', (20 + easeOut(t) * 120).toFixed(1))
      this.#ring.setAttribute('opacity', ((1 - t) * (1 - t)).toFixed(3))
      this.#ring.setAttribute('stroke-width', (6 * (1 - t) + 1).toFixed(2))
    } else {
      this.#ring.setAttribute('opacity', 0)
    }

    if (age < LAUNCH_TIME) {
      const t = easeOut(age / LAUNCH_TIME)
      this.#launch.setAttribute('cx', (ORB[0] + LAUNCH[0] * t).toFixed(1))
      this.#launch.setAttribute('cy', (ORB[1] + LAUNCH[1] * t).toFixed(1))
      this.#launch.setAttribute('r', (18 * (1 - t * 0.8)).toFixed(1))
      this.#launch.setAttribute('opacity', (1 - t * 0.6).toFixed(2))
    } else {
      this.#launch.setAttribute('opacity', 0)
    }
  }
}
