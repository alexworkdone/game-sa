import { html } from './dom.js'
import { CastingHand } from './hands/CastingHand.js'
import { CastleOrb, FireOrb, MagnetOrb, PossessionOrb } from './hands/orbs.js'

const ORBS = {
  fire: (id) => new FireOrb(id),
  possession: (id) => new PossessionOrb(id),
  castle: (id) => new CastleOrb(id),
  magnet: (id) => new MagnetOrb(id),
}

export class HandsView {
  #root
  #hands
  #spells

  constructor(parent, spells, hands) {
    this.#spells = spells
    this.#hands = hands.map((hand, handIndex) => {
      const choices = hand.fixed ? spells.filter((spell) => spell.id === hand.spell) : spells
      const orbs = Object.fromEntries(choices.map((spell) => [spell.id, ORBS[spell.orb](`orb-${handIndex}-${spell.id}`)]))
      const spell = spells.find((candidate) => candidate.id === hand.spell)
      return new CastingHand({
        id: `hand-${handIndex}`,
        side: hand.side < 0 ? 'left' : 'right',
        gem: spell.gem,
        orbs,
        selected: hand.spell,
      })
    })
    this.#root = html('div', { class: 'hands', hidden: true }, this.#hands.map((hand) => hand.element))
    parent.append(this.#root)
  }

  show() {
    this.#root.hidden = false
  }

  hide() {
    this.#root.hidden = true
  }

  select(handIndex, spellIndex) {
    this.#hands[handIndex]?.select(this.#spells[spellIndex].id)
  }

  cast(handIndex) {
    this.#hands[handIndex]?.cast()
  }

  update(dt, time, readiness, brightness) {
    const light = Math.max(0.3, Math.min(1.05, brightness))
    this.#hands.forEach((hand, handIndex) => hand.update(dt, time, readiness(handIndex), light))
  }
}
