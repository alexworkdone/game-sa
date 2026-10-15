import { html, svg } from './dom.js'
import { moonIcon, sunIcon } from './icons.js'

const COMPASS_WIDTH = 360
const PIXELS_PER_DEGREE = 3
const CARDINALS = { 0: 'Пн', 90: 'Сх', 180: 'Пд', 270: 'Зх' }
const ALTIMETER_HEIGHT = 200
const ALTIMETER_RANGE = 300
const MARKER_Y = 18
const TAPE_REACH = 48
const PIN_INSET = 14

const CASTLE_OUTLINE =
  'M-7 6 L-7 -4 L-5.5 -4 L-5.5 -2.8 L-4.5 -2.8 L-4.5 -4 L-3 -4 L-3 0 L-2 0 L-2 -6.5 L2 -6.5 L2 0 L3 0 L3 -4 ' +
  'L4.5 -4 L4.5 -2.8 L5.5 -2.8 L5.5 -4 L7 -4 L7 6 Z'

const castleGlyph = () =>
  svg('g', { class: 'marker__castle' }, [
    svg('path', { d: 'M0 -6.5 L0 -11 L4 -9.7 L0 -8.4', class: 'marker__flag' }),
    svg('path', { d: CASTLE_OUTLINE, class: 'marker__body' }),
    svg('path', { d: 'M-1.3 6 L-1.3 3.2 A1.3 1.3 0 0 1 1.3 3.2 L1.3 6 Z', class: 'marker__door' }),
  ])

const wrapDegrees = (degrees) => ((((degrees + 180) % 360) + 360) % 360) - 180

const polar = (radius, degrees) => {
  const angle = ((degrees - 90) * Math.PI) / 180
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

const arcPath = (radius, from, to) => {
  const [x1, y1] = polar(radius, from)
  const [x2, y2] = polar(radius, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${radius} ${radius} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export class Hud {
  #root
  #crosshair
  #tape
  #altitudeMarker
  #groundMarker
  #seaLine
  #altitudeValue
  #clockValue
  #sun
  #moon
  #stats
  #manaFill
  #manaValue
  #vitalFill
  #vitalValue
  #hurt
  #progressFill
  #progressValue
  #healthRow
  #healthFill
  #healthValue
  #castleText
  #markerLayer
  #pinLayer
  #markers = []
  #toast
  #toastTimer = 0

  constructor(parent) {
    this.#root = html('div', { class: 'hud', hidden: true })
    this.#crosshair = this.#buildCrosshair()
    this.#stats = html('pre', { class: 'hud__stats', hidden: true })
    this.#root.append(
      svg('svg', { class: 'hud__heading', viewBox: '-10 -10 20 20', 'aria-hidden': 'true' }, [
        svg('path', { d: 'M0 -5 L5 0 L0 5 L-5 0 Z' }),
      ]),
      this.#crosshair,
      this.#buildCompass(),
      this.#buildRealm(),
      this.#buildAltimeter(),
      this.#buildMana(),
      this.#buildClock(),
      this.#stats,
    )
    parent.append(this.#root)
  }

  show() {
    this.#root.hidden = false
  }

  hide() {
    this.#root.hidden = true
  }

  toggleStats() {
    this.#stats.hidden = !this.#stats.hidden
  }

  get statsVisible() {
    return !this.#stats.hidden
  }

  setStats(text) {
    this.#stats.textContent = text
  }

  notify(text) {
    this.#toast.textContent = text
    this.#toast.classList.add('hud__toast--visible')
    clearTimeout(this.#toastTimer)
    this.#toastTimer = setTimeout(() => this.#toast.classList.remove('hud__toast--visible'), 3200)
  }

  update({ heading, altitude, ground, seaLevel, clock, daylight, cursorX, cursorY, mana, vitals, progress, castle, markers }) {
    this.#manaFill.style.transform = `scaleX(${Math.max(0, Math.min(1, mana.value / mana.max)).toFixed(3)})`
    this.#manaValue.textContent = String(Math.floor(mana.value))
    const health = Math.max(0, Math.min(1, vitals.health / vitals.max))
    this.#vitalFill.style.transform = `scaleX(${health.toFixed(3)})`
    this.#vitalValue.textContent = String(Math.ceil(vitals.health))
    this.#hurt.style.opacity = Math.max(0, 1 - vitals.hurtAgo / 0.6).toFixed(2)
    this.#progressFill.style.transform = `scaleX(${progress.toFixed(3)})`
    this.#progressValue.textContent = `${Math.floor(progress * 100)}%`
    this.#updateCastle(castle)
    this.#crosshair.style.transform = `translate(${cursorX.toFixed(1)}px, ${cursorY.toFixed(1)}px)`
    this.#tape.setAttribute('transform', `translate(${(COMPASS_WIDTH / 2 - heading * PIXELS_PER_DEGREE).toFixed(1)} 0)`)
    this.#updateMarkers(heading, markers)

    const toY = (value) => ALTIMETER_HEIGHT - (Math.min(ALTIMETER_RANGE, Math.max(0, value)) / ALTIMETER_RANGE) * ALTIMETER_HEIGHT
    this.#altitudeMarker.setAttribute('transform', `translate(0 ${toY(altitude).toFixed(1)})`)
    this.#groundMarker.setAttribute('transform', `translate(0 ${toY(ground).toFixed(1)})`)
    this.#seaLine.setAttribute('transform', `translate(0 ${toY(seaLevel).toFixed(1)})`)
    this.#altitudeValue.textContent = String(Math.max(0, Math.round(altitude - ground)))

    this.#clockValue.textContent = clock
    this.#sun.style.display = daylight ? '' : 'none'
    this.#moon.style.display = daylight ? 'none' : ''
  }

  #updateCastle({ status, ready, health }) {
    this.#castleText.textContent = status
    this.#castleText.classList.toggle('realm__castle--ready', ready)
    this.#healthRow.hidden = !health
    if (!health) return
    const share = health.max > 0 ? Math.max(0, Math.min(1, health.value / health.max)) : 0
    this.#healthFill.style.transform = `scaleX(${share.toFixed(3)})`
    this.#healthFill.classList.toggle('meter__fill--weak', share < 0.35)
    this.#healthValue.textContent = `${Math.ceil(health.value)}\u00a0/\u00a0${health.max}`
    this.#healthRow.classList.toggle('realm__row--alarm', health.alarm)
  }

  #updateMarkers(heading, markers) {
    while (this.#markers.length < markers.length) this.#markers.push(this.#createMarker())
    this.#markers.forEach((marker, index) => {
      const data = markers[index]
      const offset = data ? wrapDegrees(data.bearing - heading) : 0
      const onTape = Boolean(data) && Math.abs(offset) <= TAPE_REACH
      const pinned = Boolean(data?.home) && !onTape
      marker.tape.style.display = onTape ? '' : 'none'
      marker.pin.style.display = pinned ? '' : 'none'
      if (!data) return
      for (const element of [marker.tape, marker.pin]) {
        element.classList.toggle('marker--home', data.home)
        element.classList.toggle('marker--ready', data.ready)
        element.classList.toggle('marker--alarm', data.alarm)
        element.style.setProperty('--marker-color', data.color)
      }
      if (onTape) {
        marker.tape.setAttribute('transform', `translate(${(COMPASS_WIDTH / 2 + offset * PIXELS_PER_DEGREE).toFixed(1)} ${MARKER_Y})`)
      }
      if (!pinned) return
      const side = offset > 0 ? 1 : -1
      marker.pin.setAttribute('transform', `translate(${COMPASS_WIDTH / 2 + side * (COMPASS_WIDTH / 2 - PIN_INSET)} ${MARKER_Y})`)
      marker.arrow.setAttribute('transform', `scale(${side} 1)`)
    })
  }

  #createMarker() {
    const tape = svg('g', { class: 'marker' }, [castleGlyph()])
    const arrow = svg('path', { d: 'M9.5 -4.5 L14.5 0 L9.5 4.5 Z', class: 'marker__arrow' })
    const pin = svg('g', { class: 'marker marker--pinned' }, [castleGlyph(), arrow])
    this.#markerLayer.append(tape)
    this.#pinLayer.append(pin)
    return { tape, pin, arrow }
  }

  #buildMana() {
    this.#manaFill = html('span', { class: 'meter__fill meter__fill--mana' })
    this.#manaValue = html('strong', { class: 'mana__value' }, '0')
    this.#vitalFill = html('span', { class: 'meter__fill meter__fill--wizard' })
    this.#vitalValue = html('strong', { class: 'mana__value mana__value--health' }, '0')
    this.#hurt = html('div', { class: 'hud__hurt' })
    return html('div', { class: 'hud__vitals' }, [
      this.#hurt,
      html('div', { class: 'hud__mana' }, [
        html('span', { class: 'vital', 'aria-label': 'Життя' }, [this.#vitalValue, html('span', { class: 'meter meter--vital meter--health' }, [this.#vitalFill])]),
        html('span', { class: 'vital', 'aria-label': 'Мана' }, [html('span', { class: 'meter meter--vital' }, [this.#manaFill]), this.#manaValue]),
      ]),
    ])
  }

  #buildRealm() {
    this.#progressFill = html('span', { class: 'meter__fill meter__fill--progress' })
    this.#progressValue = html('strong', { class: 'realm__value' }, '0%')
    this.#healthFill = html('span', { class: 'meter__fill meter__fill--health' })
    this.#healthValue = html('strong', { class: 'realm__value realm__value--health' }, '')
    this.#healthRow = html('div', { class: 'realm__row realm__row--health', hidden: true }, [
      html('span', { class: 'readout__label' }, 'Життя замку'),
      html('span', { class: 'meter meter--wide' }, [this.#healthFill]),
      this.#healthValue,
    ])
    this.#castleText = html('span', { class: 'realm__castle' }, '')
    this.#toast = html('div', { class: 'hud__toast', role: 'status' })
    return html('div', { class: 'hud__realm' }, [
      html('div', { class: 'realm__row' }, [
        html('span', { class: 'readout__label' }, 'Прогрес'),
        html('span', { class: 'meter meter--wide' }, [this.#progressFill]),
        this.#progressValue,
      ]),
      this.#healthRow,
      this.#castleText,
      this.#toast,
    ])
  }

  #buildCrosshair() {
    const arcs = (className) =>
      [0, 90, 180, 270].map((angle) => svg('path', { d: arcPath(13, angle + 18, angle + 72), class: className }))
    return svg('svg', { class: 'hud__crosshair', viewBox: '-24 -24 48 48', 'aria-hidden': 'true' }, [
      ...arcs('crosshair__shadow'),
      ...arcs('crosshair__arc'),
      svg('circle', { cx: 0, cy: 0, r: 1.8, class: 'crosshair__dot' }),
    ])
  }

  #buildCompass() {
    const ticks = []
    for (let degrees = -180; degrees <= 540; degrees += 5) {
      const x = degrees * PIXELS_PER_DEGREE
      const normalized = ((degrees % 360) + 360) % 360
      const label = CARDINALS[normalized]
      const major = normalized % 45 === 0
      const medium = normalized % 15 === 0
      ticks.push(
        svg('line', {
          x1: x,
          x2: x,
          y1: label ? 10 : major ? 14 : medium ? 18 : 21,
          y2: 26,
          class: label ? 'compass__tick compass__tick--cardinal' : 'compass__tick',
        }),
      )
      if (label) ticks.push(svg('text', { x, y: 40, class: 'compass__label compass__label--cardinal' }, label))
    }
    this.#tape = svg('g', {}, ticks)
    this.#markerLayer = svg('g', { class: 'compass__markers' })
    this.#pinLayer = svg('g', { class: 'compass__pins' })
    return html('div', { class: 'hud__compass' }, [
      svg('svg', { viewBox: `0 0 ${COMPASS_WIDTH} 48`, 'aria-hidden': 'true' }, [
        svg('defs', {}, [
          svg('linearGradient', { id: 'compass-fade', x1: 0, x2: 1, y1: 0, y2: 0 }, [
            svg('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': 0 }),
            svg('stop', { offset: '0.18', 'stop-color': '#fff', 'stop-opacity': 1 }),
            svg('stop', { offset: '0.82', 'stop-color': '#fff', 'stop-opacity': 1 }),
            svg('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': 0 }),
          ]),
          svg('mask', { id: 'compass-mask' }, [
            svg('rect', { x: 0, y: 0, width: COMPASS_WIDTH, height: 48, fill: 'url(#compass-fade)' }),
          ]),
        ]),
        svg('g', { mask: 'url(#compass-mask)' }, [this.#tape, this.#markerLayer]),
        this.#pinLayer,
        svg('path', { d: `M${COMPASS_WIDTH / 2 - 6} 0 L${COMPASS_WIDTH / 2 + 6} 0 L${COMPASS_WIDTH / 2} 8 Z`, class: 'compass__pointer' }),
      ]),
    ])
  }

  #buildAltimeter() {
    const scale = []
    for (let value = 0; value <= ALTIMETER_RANGE; value += 25) {
      const y = ALTIMETER_HEIGHT - (value / ALTIMETER_RANGE) * ALTIMETER_HEIGHT
      scale.push(svg('line', { x1: value % 100 === 0 ? 0 : 6, x2: 14, y1: y, y2: y, class: 'altimeter__tick' }))
    }
    this.#seaLine = svg('g', {}, [svg('line', { x1: -4, x2: 18, y1: 0, y2: 0, class: 'altimeter__sea' })])
    this.#groundMarker = svg('g', {}, [svg('path', { d: 'M18 0 L28 -5 L28 5 Z', class: 'altimeter__ground' })])
    this.#altitudeValue = svg('text', { x: 32, y: 0, class: 'altimeter__value' }, '0')
    this.#altitudeMarker = svg('g', {}, [svg('path', { d: 'M-2 0 L-12 -7 L-12 7 Z', class: 'altimeter__carpet' }), this.#altitudeValue])
    return html('div', { class: 'hud__altimeter' }, [
      svg('svg', { viewBox: `-16 -8 48 ${ALTIMETER_HEIGHT + 16}`, 'aria-hidden': 'true' }, [
        svg('line', { x1: 14, x2: 14, y1: 0, y2: ALTIMETER_HEIGHT, class: 'altimeter__spine' }),
        ...scale,
        this.#seaLine,
        this.#groundMarker,
        this.#altitudeMarker,
      ]),
    ])
  }

  #buildClock() {
    this.#sun = sunIcon()
    this.#moon = moonIcon()
    this.#clockValue = html('span', { class: 'clock__time' }, '00:00')
    return html('div', { class: 'hud__clock' }, [
      svg('svg', { viewBox: '-12 -12 24 24', 'aria-hidden': 'true' }, [this.#sun, this.#moon]),
      this.#clockValue,
    ])
  }
}
