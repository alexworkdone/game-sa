import { PERKS } from './perks.js'

export type StatId =
  | 'floorsCleared'
  | 'guardians'
  | 'keys'
  | 'powerUps'
  | 'noHitFloors'
  | 'fastestFloor'
  | 'maxHearts'
  | 'secondWinds'
  | 'underwaterKeys'
  | 'upgradesBought'
  | 'noHitGuardians'
  | 'shells'

export type TrophyKind =
  | 'cup'
  | 'medal'
  | 'plaque'
  | 'star'
  | 'shell'
  | 'chest'
  | 'anchor'
  | 'key'
  | 'crown'
  | 'gear'
  | 'lantern'
  | 'compass'
  | 'heart'
  | 'bell'
  | 'helmet'
  | 'ribbon'
  | 'wheel'
  | 'bubbles'

export type TrophyGrade = 'bronze' | 'silver' | 'gold' | 'crystal'

export interface FeatView {
  readonly totalPearls: number
  readonly kills: number
  readonly runs: number
  readonly bestFloor: number
  readonly maxTier: number
  readonly anyUpgradeMaxed: boolean
  readonly relicKinds: number
  readonly deaths: Readonly<Record<string, number>>
  stat(id: StatId): number
}

export interface AchievementDef {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly trophy: TrophyKind
  readonly grade: TrophyGrade
  readonly target: number
  readonly lowerIsBetter?: boolean
  readonly chain?: string
  measure(view: FeatView): number
}

const reach = (
  id: string,
  title: string,
  description: string,
  trophy: TrophyKind,
  grade: TrophyGrade,
  target: number,
  measure: (view: FeatView) => number,
  chain?: string,
): AchievementDef => ({ id, title, description, trophy, grade, target, measure, ...(chain ? { chain } : {}) })

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  reach('shell1', 'Скарб із дна', 'Підніми з дна мушлю з перлами', 'chest', 'silver', 1, (v) => v.stat('shells')),
  reach('floor10', 'Десятий поверх', 'Досягни 10-го поверху', 'medal', 'bronze', 10, (v) => v.bestFloor, 'floor'),
  reach('floor25', 'Чверть сотні', 'Досягни 25-го поверху', 'medal', 'silver', 25, (v) => v.bestFloor, 'floor'),
  reach('floor50', 'Під самим дахом', 'Досягни 50-го поверху', 'cup', 'gold', 50, (v) => v.bestFloor, 'floor'),
  reach('floor100', 'Маяк до неба', 'Досягни 100-го поверху', 'crown', 'crystal', 100, (v) => v.bestFloor, 'floor'),
  reach('floors100', 'Сотня сходинок', 'Пройди 100 поверхів загалом', 'plaque', 'bronze', 100, (v) => v.stat('floorsCleared'), 'floors'),
  reach('floors500', 'Старий доглядач', 'Пройди 500 поверхів загалом', 'plaque', 'silver', 500, (v) => v.stat('floorsCleared'), 'floors'),
  reach('floors2000', 'Легенда узбережжя', 'Пройди 2000 поверхів загалом', 'plaque', 'gold', 2000, (v) => v.stat('floorsCleared'), 'floors'),

  reach('pearls1k', 'Тисяча перлин', 'Збери 1000 перлин загалом', 'shell', 'bronze', 1000, (v) => v.totalPearls, 'pearls'),
  reach('pearls10k', 'Перлинна скриня', 'Збери 10 000 перлин загалом', 'shell', 'silver', 10000, (v) => v.totalPearls, 'pearls'),
  reach('pearls100k', 'Скарб фрегата', 'Збери 100 000 перлин загалом', 'chest', 'gold', 100000, (v) => v.totalPearls, 'pearls'),

  reach('kills100', 'Гроза крабів', 'Здолай 100 потвор', 'anchor', 'bronze', 100, (v) => v.kills, 'kills'),
  reach('kills1000', 'Морський мисливець', 'Здолай 1000 потвор', 'anchor', 'silver', 1000, (v) => v.kills, 'kills'),
  reach('kills5000', 'Жах глибин', 'Здолай 5000 потвор', 'anchor', 'gold', 5000, (v) => v.kills, 'kills'),

  reach('guardian1', 'Двері відчинено', 'Здолай першого вартового', 'key', 'bronze', 1, (v) => v.stat('guardians'), 'guardians'),
  reach('guardian10', 'Ключар маяка', 'Здолай 10 вартових', 'key', 'silver', 10, (v) => v.stat('guardians'), 'guardians'),
  reach('guardian50', 'Повелитель восьминогів', 'Здолай 50 вартових', 'key', 'gold', 50, (v) => v.stat('guardians'), 'guardians'),

  reach('tier1', 'Нічний шторм пройдено', 'Прокачай усе й відкрий складність II', 'cup', 'silver', 2, (v) => v.maxTier, 'tier'),
  reach('tier2', 'Крижана буря пройдена', 'Відкрий складність III', 'cup', 'gold', 3, (v) => v.maxTier, 'tier'),
  reach('tier3', 'Багряний шторм пройдено', 'Відкрий складність IV', 'cup', 'crystal', 4, (v) => v.maxTier, 'tier'),
  reach('tier4', 'Смарагдова безодня пройдена', 'Відкрий складність V', 'crown', 'gold', 5, (v) => v.maxTier, 'tier'),

  reach('firstUpgrade', 'Перша обнова', 'Купи перший апгрейд', 'gear', 'bronze', 1, (v) => v.stat('upgradesBought'), 'upgrades'),
  reach('maxUpgrade', 'Майстер своєї справи', 'Прокачай один апгрейд до максимуму', 'gear', 'silver', 1, (v) => (v.anyUpgradeMaxed ? 1 : 0)),
  reach('upgrades50', 'Золоті руки', 'Купи 50 апгрейдів загалом', 'gear', 'gold', 50, (v) => v.stat('upgradesBought'), 'upgrades'),
  reach('firstRelic', 'Перша реліквія', 'Купи будь-яку реліквію', 'lantern', 'silver', 1, (v) => v.relicKinds, 'relics'),
  reach('allRelics', 'Хранитель реліквій', 'Купи кожну реліквію хоча б раз', 'lantern', 'crystal', PERKS.length, (v) => v.relicKinds, 'relics'),

  reach('noHit', 'Без подряпини', 'Здолай вартового, не втративши на його поверсі жодного серця', 'star', 'silver', 1, (v) => v.stat('noHitGuardians')),
  reach('noHit25', 'Невразливий', 'Пройди 25 поверхів без подряпини', 'star', 'gold', 25, (v) => v.stat('noHitFloors')),
  {
    id: 'speed30',
    title: 'Швидкі чоботи',
    description: 'Пройди поверх швидше ніж за 30 с',
    trophy: 'compass',
    grade: 'silver',
    target: 30,
    lowerIsBetter: true,
    chain: 'speed',
    measure: (v) => v.stat('fastestFloor'),
  },
  {
    id: 'speed20',
    title: 'Блискавка',
    description: 'Пройди поверх швидше ніж за 20 с',
    trophy: 'compass',
    grade: 'gold',
    target: 20,
    lowerIsBetter: true,
    chain: 'speed',
    measure: (v) => v.stat('fastestFloor'),
  },
  reach('hearts8', 'Серцеїд', 'Май 8 сердець одночасно', 'heart', 'gold', 8, (v) => v.stat('maxHearts')),
  reach('phoenix', 'Фенікс', 'Встань завдяки «Другому диханню»', 'bell', 'silver', 1, (v) => v.stat('secondWinds')),
  reach('diver', 'Ловець перлин', 'Підбери ключ, коли ти з головою під водою', 'helmet', 'silver', 1, (v) => v.stat('underwaterKeys')),
  reach('keys500', "В'язка ключів", 'Збери 500 ключів', 'wheel', 'silver', 500, (v) => v.stat('keys')),
  reach('powerUps50', 'Колекціонер бонусів', 'Підбери 50 бонусів', 'ribbon', 'silver', 50, (v) => v.stat('powerUps')),
  reach('drowned', 'Без зябер', 'Захлинися вперше. Буває.', 'bubbles', 'bronze', 1, (v) => v.deaths['water'] ?? 0),
]
