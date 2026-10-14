import { html } from './dom.js'
import { emblem } from './icons.js'

const TOUCH_CONTROLS = [
  ['Ліворуч', 'джойстик руху'],
  ['Праворуч', 'тягни — поворот і приціл'],
  ['▲ / ▼', 'вгору / вниз'],
  ['Вогонь', 'вогняна куля (ліва рука)'],
  ['Велика кнопка', 'чари правої руки'],
  ['Кружечок', 'вибір заклинань'],
  ['II', 'пауза'],
]

const CONTROLS = [
  ['Миша', 'приціл і поворот'],
  ['W / S', 'вперед / назад'],
  ['A / D', 'убік'],
  ['E / Q', 'вгору / вниз'],
  ['ЛКМ / Пробіл', 'вогняна куля (ліва рука)'],
  ['ПКМ / правий Shift', 'чари правої руки'],
  ['1 / 2 / 3', 'куля / захоплення / замок'],
  ['Esc', 'пауза'],
]

const controlsList = (touch) =>
  html(
    'dl',
    { class: 'controls' },
    (touch ? TOUCH_CONTROLS : CONTROLS).flatMap(([keys, action]) => [html('dt', {}, keys), html('dd', {}, action)]),
  )

export class Screens {
  #root
  #progressBar
  #progressLabel
  #touch

  constructor(parent, touch = false) {
    this.#touch = touch
    this.#root = html('div', { class: 'screens' })
    parent.append(this.#root)
  }

  showLoading() {
    this.#progressBar = html('span', { class: 'progress__bar' })
    this.#progressLabel = html('p', { class: 'screen__hint' }, 'Ткемо світ…')
    this.#show(
      html('section', { class: 'screen screen--loading' }, [
        emblem(),
        html('h1', { class: 'screen__title' }, 'Magic Carpet'),
        html('p', { class: 'screen__subtitle' }, 'Килим-літак'),
        html('div', { class: 'progress' }, [this.#progressBar]),
        this.#progressLabel,
      ]),
    )
  }

  setProgress(progress) {
    if (!this.#progressBar) return
    this.#progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress)).toFixed(3)})`
    if (progress > 0.62) this.#progressLabel.textContent = 'Зводимо замки…'
    if (progress > 0.9) this.#progressLabel.textContent = 'Розфарбовуємо долини…'
  }

  showTitle(onStart) {
    const start = html('button', { class: 'button button--primary', type: 'button' }, 'Злетіти')
    start.addEventListener('click', onStart)
    this.#show(
      html('section', { class: 'screen screen--title' }, [
        emblem(),
        html('h1', { class: 'screen__title' }, 'Magic Carpet'),
        html('p', { class: 'screen__subtitle' }, 'Килим-літак'),
        html('p', { class: 'screen__lead' }, 'Світ у тумані між горами й морем чекає на свого чарівника.'),
        start,
        controlsList(this.#touch),
      ]),
    )
    start.focus()
  }

  showPause(onResume) {
    const resume = html('button', { class: 'button button--primary', type: 'button' }, 'Продовжити')
    resume.addEventListener('click', onResume)
    this.#show(
      html('section', { class: 'screen screen--pause' }, [
        html('h2', { class: 'screen__title screen__title--small' }, 'Пауза'),
        resume,
        controlsList(this.#touch),
      ]),
    )
    resume.focus()
  }

  showError(message) {
    this.#show(
      html('section', { class: 'screen screen--error' }, [
        html('h2', { class: 'screen__title screen__title--small' }, 'Світ не виткався'),
        html('p', { class: 'screen__lead' }, message),
      ]),
    )
  }

  hide() {
    this.#root.replaceChildren()
    this.#root.classList.remove('screens--visible')
  }

  #show(screen) {
    this.#root.replaceChildren(screen)
    this.#root.classList.add('screens--visible')
  }
}
