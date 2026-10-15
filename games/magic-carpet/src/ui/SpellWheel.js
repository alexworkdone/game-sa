import { html, svg } from './dom.js'

const GLYPHS = {
  fireball: [
    'M0 -9 C5 -4 8 1 4.5 6 A6 6 0 1 1 -5 1.5 C-5 -1.5 -3 -5 0 -9 Z',
    'M0.5 -1 C2.5 1 3 3.5 1 5 A2.8 2.8 0 1 1 -2.5 3 C-2.5 1.5 -1.5 0 0.5 -1 Z',
  ],
  possession: ['M0 0 C2 -1.5 3.5 1.5 1.5 3.5 C-1.5 6 -6 3 -5.5 -1.2 C-4.5 -6 2 -8 6 -4.5 C9 -1.5 8 4.5 5 7.2'],
  castle: [
    'M-8 8 V-3 H-9.5 V-8 H-7.5 V-6 H-5.5 V-8 H-3.5 V-3 H-2 V0 H2 V-3 H3.5 V-8 H5.5 V-6 H7.5 V-8 H9.5 V-3 H8 V8 Z',
    'M-1.8 8 V4.5 A1.8 1.8 0 0 1 1.8 4.5 V8',
  ],
  magnet: ['M-6 -8 V0 A6 6 0 0 0 6 0 V-8', 'M-6 -8 V-4.5 M6 -8 V-4.5'],
}

export const spellIcon = (id) =>
  svg('svg', { class: `spell-icon spell-icon--${id}`, viewBox: '-12 -12 24 24', 'aria-hidden': 'true' }, (GLYPHS[id] ?? []).map((d) => svg('path', { d })))

export class SpellWheel {
  #root
  #button
  #face
  #badge
  #menu
  #items
  #spells
  #onSelect
  #onOpen
  #onClose
  #backdrop

  constructor(parent, spells, { onSelect, onOpen = () => {}, onClose = () => {} }) {
    this.#spells = spells
    this.#onSelect = onSelect
    this.#onOpen = onOpen
    this.#onClose = onClose
    this.#face = html('span', { class: 'spell-wheel__face' })
    this.#badge = html('span', { class: 'spell-wheel__badge' })
    this.#button = html('button', { class: 'spell-wheel__button', type: 'button', 'aria-label': 'Вибрати заклинання', 'aria-expanded': 'false' }, [
      this.#face,
      this.#badge,
    ])
    const spread = Math.min(150, 46 * (spells.length - 1))
    this.#items = spells.map((spell, index) => {
      const angle = spells.length > 1 ? -spread / 2 + (spread * index) / (spells.length - 1) : 0
      const item = html(
        'button',
        { class: 'spell-wheel__item', type: 'button', style: `--angle: ${angle}deg`, 'aria-label': `${index + 1}: ${spell.title}` },
        [spellIcon(spell.id), html('span', { class: 'spell-wheel__key' }, String(index + 1)), html('span', { class: 'spell-wheel__title' }, spell.title)],
      )
      item.addEventListener('click', (event) => {
        event.stopPropagation()
        this.#onSelect(index)
        this.close()
      })
      return item
    })
    this.#menu = html('div', { class: 'spell-wheel__menu' }, this.#items)
    this.#backdrop = html('div', { class: 'spell-wheel__backdrop' })
    this.#root = html('div', { class: 'spell-wheel', hidden: true }, [this.#backdrop, this.#menu, this.#button])
    this.#button.addEventListener('click', (event) => {
      event.stopPropagation()
      this.toggle()
    })
    this.#backdrop.addEventListener('pointerdown', (event) => {
      event.stopPropagation()
      this.close()
    })
    window.addEventListener('keydown', this.#onKey)
    parent.append(this.#root)
  }

  show() {
    this.#root.hidden = false
  }

  hide() {
    this.close()
    this.#root.hidden = true
  }

  toggle() {
    if (this.isOpen) this.close()
    else this.open()
  }

  get isOpen() {
    return this.#root.classList.contains('spell-wheel--open')
  }

  open() {
    if (this.isOpen) return
    this.#root.classList.add('spell-wheel--open')
    this.#button.setAttribute('aria-expanded', 'true')
    this.#onOpen()
  }

  close() {
    if (!this.isOpen) return
    this.#root.classList.remove('spell-wheel--open')
    this.#button.setAttribute('aria-expanded', 'false')
    this.#onClose()
  }

  #onKey = (event) => {
    if (!this.isOpen) return
    if (event.code === 'Escape') {
      event.preventDefault()
      this.close()
      return
    }
    const slot = Number(event.code.replace(/^(Digit|Numpad)/, ''))
    if (Number.isInteger(slot) && slot >= 1 && slot <= this.#spells.length) {
      event.preventDefault()
      this.#onSelect(slot - 1)
      this.close()
    }
  }

  setSelected(index) {
    this.#face.replaceChildren(spellIcon(this.#spells[index].id))
    this.#badge.textContent = String(index + 1)
    this.#items.forEach((item, itemIndex) => item.classList.toggle('spell-wheel__item--active', itemIndex === index))
  }
}
