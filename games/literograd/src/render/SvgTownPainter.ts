import { BUILDINGS, DECOR_SLOTS, MAX_LEVEL } from '../content/buildings.js'
import type { BuildingId } from '../content/buildings.js'
import { UK } from '../i18n/uk.js'
import type { TownSnapshot } from '../meta/City.js'
import { BUILDING_ART, CLOUDS, DECOR_ART, FIREWORKS, garland, ground, sun } from './art.js'
import type { ITownPainter, TownPaintOptions } from './ITownPainter.js'

const GROUND_Y = 250
const BACK_SCALE = 0.62
const BACK_LIFT = 5

export class SvgTownPainter implements ITownPainter {
  town(snapshot: TownSnapshot, options: TownPaintOptions = {}): string {
    const { levels, decor } = snapshot
    const festive = BUILDINGS.every((spec) => levels[spec.id] >= MAX_LEVEL)
    const built = BUILDINGS.filter((spec) => levels[spec.id] > 0).length
    const classes = ['ink-art', options.still ? 'still' : '', options.penClass ?? ''].filter(Boolean).join(' ')
    const drawing = options.drawing ?? null

    const decorLayer = (front: boolean): string =>
      decor
        .map((id, index) => {
          const slot = DECOR_SLOTS[index]
          if (!slot || slot.front !== front) return ''
          const y = front ? GROUND_Y : GROUND_Y - BACK_LIFT
          const scale = front ? 1 : BACK_SCALE
          const drawn = drawing === `decor:${index}` ? ' drawn' : ''
          return `<g class="dec${front ? '' : ' back'}${drawn}" transform="translate(${slot.x} ${y}) scale(${scale})">${DECOR_ART[id]}</g>`
        })
        .join('')

    const buildings = BUILDINGS.map((spec) => {
      const level = levels[spec.id]
      const attr = options.interactive ? ` data-building="${spec.id}"` : ''
      const state = level > 0 ? '' : ' sketch'
      const drawn = drawing === spec.id ? ' drawn' : ''
      return `<g class="bld${state}${drawn}"${attr} transform="translate(${spec.x} ${GROUND_Y})"><title>${UK.town.tip(spec.name, level)}</title>${BUILDING_ART[spec.id](Math.max(1, level))}</g>`
    }).join('')

    return (
      `<svg class="${classes}" viewBox="0 0 800 280" role="img" aria-label="${UK.town.aria(built, decor.length, festive)}">` +
      sun(58, 54) +
      CLOUDS +
      (festive ? FIREWORKS : '') +
      decorLayer(false) +
      buildings +
      ground(GROUND_Y) +
      decorLayer(true) +
      (festive ? garland() : '') +
      '</svg>'
    )
  }

  building(id: BuildingId, level: number, drawing = false): string {
    const state = level > 0 ? '' : 'sketch'
    const drawn = drawing ? ' drawn' : ''
    return `<svg class="ink-art bpic" viewBox="-75 -232 150 240" aria-hidden="true"><g class="${state}${drawn}">${BUILDING_ART[id](Math.max(1, level))}</g><line class="ln ground" x1="-70" y1="0" x2="70" y2="0"/></svg>`
  }
}
