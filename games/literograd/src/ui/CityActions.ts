import { Signal } from '@sa/core'
import type { AppServices } from '../app/AppServices.js'
import { decorSpec, upgradeAt } from '../content/buildings.js'
import type { BuildingId, DecorId } from '../content/buildings.js'
import { penFor } from '../content/pens.js'
import { UK } from '../i18n/uk.js'
import type { Toaster } from './Toaster.js'

const DRAWING_MS = 1750
const TEST_INK = 10_000

export class CityActions {
  readonly onDrawing = new Signal<string>()
  readonly onCityCompleted = new Signal<void>()

  private readonly services: AppServices
  private readonly toast: Toaster
  private target: string | null = null
  private timer = 0

  constructor(services: AppServices, toast: Toaster) {
    this.services = services
    this.toast = toast
  }

  get drawing(): string | null {
    return this.target
  }

  upgrade(id: BuildingId): void {
    const before = this.services.city.level(id)
    this.markDrawing(id)
    const result = this.services.builder.upgrade(id)
    if (!result.ok) {
      this.target = null
      return
    }
    this.onDrawing.emit(id)
    const effect = upgradeAt(result.spec, before)
    if (result.cityCompleted) {
      this.onCityCompleted.emit()
      return
    }
    this.toast.show(before === 0 ? UK.toast.drawn(result.spec.name, effect) : UK.toast.upgraded(result.spec.name, result.level, effect))
  }

  place(id: DecorId): void {
    const target = `decor:${this.services.city.decor.length}`
    this.markDrawing(target)
    if (!this.services.builder.place(id)) {
      this.target = null
      return
    }
    this.onDrawing.emit(target)
    this.toast.show(UK.toast.decor(decorSpec(id).name))
  }

  startNewBook(): void {
    const { builder, prefs, city, perks } = this.services
    builder.startNewBook(Date.now())
    prefs.enforce()
    this.toast.show(UK.toast.newBook(city.book, penFor(city.book).name, Math.round(perks.bookBonus * 100)))
  }

  grantTestInk(message: string = UK.toast.testAdded): void {
    this.services.wallet.add(TEST_INK)
    this.toast.show(message)
  }

  resetAll(): void {
    const { wallet, city, records, prefs } = this.services
    city.reset()
    wallet.reset()
    records.reset()
    prefs.reset()
    this.toast.show(UK.toast.reset)
  }

  private markDrawing(target: string): void {
    window.clearTimeout(this.timer)
    this.target = target
    this.timer = window.setTimeout(() => {
      this.target = null
      document.querySelectorAll('.drawn').forEach((node) => node.classList.remove('drawn'))
    }, DRAWING_MS)
  }
}
