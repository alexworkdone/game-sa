import { PALETTE } from '../config/palette.js'
import { isPowerUpKind } from '../entities/Pickup.js'
import type { Pickup, PickupKind } from '../entities/Pickup.js'
import { POWER_UPS } from '../config/powerups.js'
import { ringDelta } from '../level/Ring.js'
import { powerColor } from '../render/Icons.js'
import { powerTip } from './Tips.js'
import type { TipId, Tips } from './Tips.js'
import type { World } from './World.js'

export interface Callout {
  readonly id: TipId
  readonly x: number
  readonly y: number
  readonly fallbackY: number
  readonly text: string
  readonly color: string
}


const MAX_CALLOUTS = 3
const UNDER_PLANK = 24
const AIR_TIP_TIME = 4
const NEAR_SHARE = 1 / 3
const MAX_TIP_TIME = 25
const EDGE_ZONE = 96

export class Tutorial {
  private readonly tips: Tips
  private airShown = 0
  private lastX = Number.NaN
  private readonly shownFor = new Map<TipId, number>()
  private visible: Callout[] = []

  constructor(tips: Tips) {
    this.tips = tips
  }

  notifyPickup(kind: PickupKind): void {
    if (kind === 'key') this.tips.learn('key')
    else if (kind === 'pearl') this.tips.learn('pearl')
    else if (isPowerUpKind(kind)) this.tips.learn(powerTip(kind))
  }

  notifyFloorCleared(): void {
    this.tips.learn('door')
  }

  get active(): readonly Callout[] {
    return this.visible
  }

  update(dt: number, world: World): void {
    const x = world.hero.x
    if (Math.abs(x - this.lastX) > world.map.width / 2) this.tips.learn('wrap')
    this.lastX = x
    if (!this.tips.isLearned('air')) {
      if (world.hero.inWater) {
        this.airShown += dt
        if (this.airShown >= AIR_TIP_TIME) this.tips.learn('air')
      } else if (this.airShown > 0.6) {
        this.tips.learn('air')
      }
    }
    this.visible = this.collect(world)
    for (const callout of this.visible) {
      const shown = (this.shownFor.get(callout.id) ?? 0) + dt
      this.shownFor.set(callout.id, shown)
      if (shown >= MAX_TIP_TIME) this.tips.learn(callout.id)
    }
  }

  private collect(world: World): Callout[] {
    const list: Callout[] = []
    const hero = world.hero
    const near = world.map.width * NEAR_SHARE
    const add = (callout: Callout | null): void => {
      if (callout && list.length < MAX_CALLOUTS) list.push(callout)
    }
    if (!this.tips.isLearned('air') && hero.inWater) {
      add({
        id: 'air',
        x: hero.x,
        y: hero.y - hero.height - 18,
        fallbackY: hero.y + 8,
        text: `Плавай стрілками. На поверхні дихаєш, під водою — ${Math.round(hero.maxAir)} с`,
        color: PALETTE.waterFoam,
      })
    }
    if (!this.tips.isLearned('wrap') && hero.state === 'ground') {
      const width = world.map.width
      const nearRight = hero.x > width - EDGE_ZONE
      const nearLeft = hero.x < EDGE_ZONE
      if (nearLeft || nearRight) {
        add({
          id: 'wrap',
          x: hero.x,
          y: hero.y - hero.height - 18,
          fallbackY: hero.y + 8,
          text: nearRight ? 'Маяк круглий: іди далі вправо — вийдеш зліва' : 'Маяк круглий: іди далі вліво — вийдеш справа',
          color: PALETTE.accent,
        })
      }
    }
    if (!this.tips.isLearned('key') && world.keysLeft > 0) {
      const key = this.nearest(world, (pickup) => pickup.kind === 'key', near)
      if (key) {
        add({
          id: 'key',
          x: key.x,
          y: key.y - 24,
          fallbackY: key.y + UNDER_PLANK,
          text: 'Ключ: збери всі — і двері нагору відчиняться',
          color: PALETTE.key,
        })
      }
    }
    const door = world.door
    if (!this.tips.isLearned('door') && this.distanceTo(world, door.x, door.y) < near) {
      add({
        id: 'door',
        x: door.x,
        y: door.y - 46,
        fallbackY: door.y + UNDER_PLANK,
        text: door.open
          ? 'Двері відчинено — заходь!'
          : world.guardian?.alive
            ? 'Двері тримає вартовий — здолай його і збери ключі'
            : `Двері нагору: бракує ключів — ${world.keysLeft}`,
        color: door.open ? PALETTE.lampOn : PALETTE.accent,
      })
    }
    const power = this.nearest(
      world,
      (pickup) => isPowerUpKind(pickup.kind) && !this.tips.isLearned(powerTip(pickup.kind)),
      near,
    )
    if (power && isPowerUpKind(power.kind)) {
      add({
        id: powerTip(power.kind),
        x: power.x,
        y: power.y - 26,
        fallbackY: power.y + UNDER_PLANK,
        text: POWER_UPS[power.kind].tip,
        color: powerColor(power.kind),
      })
    }
    if (!this.tips.isLearned('pearl')) {
      const pearl = this.nearest(world, (pickup) => pickup.kind === 'pearl', near)
      if (pearl) {
        add({
          id: 'pearl',
          x: pearl.x,
          y: pearl.y - 16,
          fallbackY: pearl.y + UNDER_PLANK,
          text: 'Перлина: гроші на апгрейди в майстерні',
          color: PALETTE.pearl,
        })
      }
    }
    return list
  }

  private distanceTo(world: World, x: number, y: number): number {
    const hero = world.hero
    return Math.hypot(ringDelta(hero.x, x, world.map.width), y - hero.y)
  }

  private nearest(world: World, accept: (pickup: Pickup) => boolean, radius: number): Pickup | null {
    let best: Pickup | null = null
    let bestDistance = radius
    for (const pickup of world.pickups) {
      if (!pickup.alive || !accept(pickup)) continue
      const distance = this.distanceTo(world, pickup.x, pickup.y)
      if (distance >= bestDistance) continue
      best = pickup
      bestDistance = distance
    }
    return best
  }
}
