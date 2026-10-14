import type { PowerUpKind } from '../level/LevelBlueprint.js'
import { PALETTE } from './palette.js'

export type TimedPowerUp = Exclude<PowerUpKind, 'heart'>

export type FloorFeature = 'ice' | 'lightning' | 'currents' | 'dark'

export interface PowerUpInfo {
  readonly name: string
  readonly tip: string
  readonly expired: string
  readonly duration: number
  readonly weight: number
  readonly color: string
  readonly warn: boolean
}

export const POWER_UPS: Readonly<Record<PowerUpKind, PowerUpInfo>> = {
  heart: {
    name: '+1 серце',
    tip: 'Серце: +1 життя',
    expired: '',
    duration: 0,
    weight: 22,
    color: PALETTE.heart,
    warn: false,
  },
  shield: {
    name: 'Щит!',
    tip: 'Щит: 8 с без шкоди',
    expired: 'Щит зник',
    duration: 8,
    weight: 16,
    color: PALETTE.shield,
    warn: true,
  },
  hourglass: {
    name: 'Вода стоїть!',
    tip: 'Годинник: вода стоїть 8 с',
    expired: 'Вода рушила!',
    duration: 8,
    weight: 16,
    color: PALETTE.hourglass,
    warn: true,
  },
  strider: {
    name: 'Водомірка!',
    tip: 'Водомірка: бігай по воді й швидше, 10 с',
    expired: 'Водомірка скінчилась',
    duration: 10,
    weight: 14,
    color: PALETTE.strider,
    warn: true,
  },
  fan: {
    name: 'Віяло!',
    tip: 'Віяло: три ракети за постріл, 10 с',
    expired: 'Віяло скінчилось',
    duration: 10,
    weight: 12,
    color: PALETTE.fan,
    warn: false,
  },
  hotgun: {
    name: 'Гарячий ствол!',
    tip: 'Гарячий ствол: стріляй без перезарядки, 8 с',
    expired: 'Ствол охолов',
    duration: 8,
    weight: 12,
    color: PALETTE.hotgun,
    warn: false,
  },
  homing: {
    name: 'Самонавід!',
    tip: 'Самонавід: ракети самі шукають ціль, 10 с',
    expired: 'Самонавід скінчився',
    duration: 10,
    weight: 12,
    color: PALETTE.homing,
    warn: false,
  },
  blast: {
    name: 'Вибухівка!',
    tip: 'Вибухівка: ракета вибухає й зачіпає сусідів, 10 с',
    expired: 'Вибухівка скінчилась',
    duration: 10,
    weight: 10,
    color: PALETTE.blast,
    warn: false,
  },
  harpoon: {
    name: 'Гарпун!',
    tip: 'Гарпун: прошиває всіх у ряд і б’є сильніше, 10 с',
    expired: 'Гарпун скінчився',
    duration: 10,
    weight: 10,
    color: PALETTE.harpoon,
    warn: false,
  },
  twin: {
    name: 'Два стволи!',
    tip: 'Два стволи: стріляєш уперед і назад, 12 с',
    expired: 'Другий ствол скінчився',
    duration: 12,
    weight: 12,
    color: PALETTE.twin,
    warn: false,
  },
  frost: {
    name: 'Крига!',
    tip: 'Крига: влучена потвора замерзає й не кусається, 10 с',
    expired: 'Крига скінчилась',
    duration: 10,
    weight: 10,
    color: PALETTE.frost,
    warn: false,
  },
  crampons: {
    name: 'Кішки!',
    tip: 'Кішки: не ковзаєш, а крижини не заважають виринати, 12 с',
    expired: 'Кішки зносились',
    duration: 12,
    weight: 0,
    color: PALETTE.crampons,
    warn: true,
  },
  rod: {
    name: 'Громовідвід!',
    tip: "Громовідвід: блискавка тебе не б'є, 15 с",
    expired: 'Громовідвід розрядився',
    duration: 15,
    weight: 0,
    color: PALETTE.rod,
    warn: true,
  },
  fins: {
    name: 'Ласти!',
    tip: 'Ласти: течії й водорості тебе не тримають, 12 с',
    expired: 'Ласти зісковзнули',
    duration: 12,
    weight: 0,
    color: PALETTE.fins,
    warn: true,
  },
  lantern: {
    name: 'Ліхтар!',
    tip: 'Ліхтар: у темряві видно вдвічі далі, 15 с',
    expired: 'Ліхтар згас',
    duration: 15,
    weight: 0,
    color: PALETTE.lantern,
    warn: true,
  },
}

export const FEATURE_COUNTERS: Readonly<Record<FloorFeature, TimedPowerUp>> = {
  ice: 'crampons',
  lightning: 'rod',
  currents: 'fins',
  dark: 'lantern',
}

export const COUNTER_DROP_WEIGHT = 14

export const POWER_UP_KINDS = Object.keys(POWER_UPS) as PowerUpKind[]

export const TIMED_POWER_UPS = POWER_UP_KINDS.filter((kind): kind is TimedPowerUp => kind !== 'heart')

export const KIT_POWER_UPS = TIMED_POWER_UPS.filter((kind) => POWER_UPS[kind].weight > 0)

export const POWER_UP_WEIGHTS: readonly { value: PowerUpKind; weight: number }[] = POWER_UP_KINDS.filter(
  (kind) => POWER_UPS[kind].weight > 0,
).map((kind) => ({ value: kind, weight: POWER_UPS[kind].weight }))
