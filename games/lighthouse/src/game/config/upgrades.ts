import { stat } from './stats.js'
import type { StatLine } from './stats.js'

export type UpgradeId =
  | 'caliber'
  | 'trigger'
  | 'drum'
  | 'heart'
  | 'boots'
  | 'pump'
  | 'lungs'
  | 'magnet'
  | 'volley'

export interface UpgradeDef {
  readonly id: UpgradeId
  readonly title: string
  readonly costs: readonly number[]
  stats(level: number): readonly StatLine[]
}

const at = <T>(values: readonly T[], level: number): T =>
  values[Math.min(level, values.length - 1)] as T

const decimal = (value: number, digits: number): string => value.toFixed(digits).replace('.', ',')

export const UPGRADE_VALUES = {
  damage: [1, 2, 3],
  cooldown: [0.32, 0.27, 0.23, 0.19, 0.16],
  magazine: [5, 6, 7, 8, 10],
  reload: [1.15, 1.05, 0.95, 0.85, 0.7],
  maxHp: [3, 4, 5, 6],
  speed: [1, 1.1, 1.2, 1.3],
  waterTime: [1, 1.12, 1.25, 1.4],
  air: [10, 14, 18, 24],
  magnet: [16, 48, 80, 120],
  volley: [1, 2, 3, 4],
} as const

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'caliber',
    title: 'Калібр',
    costs: [50, 150],
    stats: (level) => [stat('Шкода ракети', at(UPGRADE_VALUES.damage, level))],
  },
  {
    id: 'trigger',
    title: 'Курок',
    costs: [20, 50, 90, 160],
    stats: (level) => [stat('Пострілів за секунду', decimal(1 / at(UPGRADE_VALUES.cooldown, level), 1))],
  },
  {
    id: 'drum',
    title: 'Барабан',
    costs: [20, 40, 70, 130],
    stats: (level) => [
      stat('Обойма', at(UPGRADE_VALUES.magazine, level)),
      stat('Зарядка', `${decimal(at(UPGRADE_VALUES.reload, level), 2)} с`),
    ],
  },
  {
    id: 'heart',
    title: 'Серце',
    costs: [40, 100, 200],
    stats: (level) => [stat('Сердець на старті', at(UPGRADE_VALUES.maxHp, level))],
  },
  {
    id: 'boots',
    title: 'Чоботи',
    costs: [30, 60, 120],
    stats: (level) => [stat('Швидкість', `${Math.round(at(UPGRADE_VALUES.speed, level) * 100)} %`)],
  },
  {
    id: 'pump',
    title: 'Помпа',
    costs: [40, 80, 160],
    stats: (level) => [stat('Вода повільніша', `${Math.round((1 - 1 / at(UPGRADE_VALUES.waterTime, level)) * 100)} %`)],
  },
  {
    id: 'lungs',
    title: 'Акваланг',
    costs: [20, 50, 110],
    stats: (level) => [stat('Повітря під водою', `${at(UPGRADE_VALUES.air, level)} с`)],
  },
  {
    id: 'magnet',
    title: 'Магніт',
    costs: [20, 50, 100],
    stats: (level) => [stat('Радіус збору', at(UPGRADE_VALUES.magnet, level))],
  },
  {
    id: 'volley',
    title: 'Залп',
    costs: [70, 160, 300],
    stats: (level) => [stat('Куль за постріл', at(UPGRADE_VALUES.volley, level))],
  },
]

export const upgradeValue = <K extends keyof typeof UPGRADE_VALUES>(
  key: K,
  level: number,
): (typeof UPGRADE_VALUES)[K][number] => at(UPGRADE_VALUES[key], level)
