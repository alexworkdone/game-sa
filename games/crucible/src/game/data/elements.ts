import {
  CORE,
  DEEP,
  LIGHT,
  bar,
  crestDown,
  crestUp,
  curlLeft,
  curlRight,
  disc,
  poly,
  ring,
} from './glyphs.js'
import {
  archShape,
  barsShape,
  birdShape,
  bladeShape,
  blobShape,
  boatShape,
  boltShape,
  bookShape,
  bricksShape,
  bugShape,
  bulbShape,
  carShape,
  clawShape,
  clothShape,
  coilShape,
  crescentShape,
  dotsShape,
  dropShape,
  figureShape,
  fishShape,
  flakeShape,
  flowerShape,
  gearShape,
  gemShape,
  grassShape,
  houseShape,
  jetShape,
  loafShape,
  mountainShape,
  orbitShape,
  pawShape,
  planeShape,
  robotShape,
  rockShape,
  rocketShape,
  screenShape,
  sheetShape,
  spiralShape,
  stalkShape,
  starShape,
  sunShape,
  towerShape,
  treeShape,
  wavesShape,
  wheelShape,
  wingShape,
} from './glyphs.js'
import type { GlyphOp } from './glyphs.js'
import type { CategoryId } from './categories.js'

export type ElementId =
  | 'earth'
  | 'water'
  | 'fire'
  | 'air'
  | 'steam'
  | 'swamp'
  | 'dust'
  | 'lava'
  | 'energy'
  | 'sea'
  | 'stone'
  | 'cloud'
  | 'smoke'
  | 'sand'
  | 'rain'
  | 'obsidian'
  | 'glass'
  | 'beach'
  | 'life'
  | 'plant'
  | 'tree'
  | 'storm'
  | 'volcano'
  | 'rainbow'
  | 'wind'
  | 'sky'
  | 'sun'
  | 'ice'
  | 'snow'
  | 'fog'
  | 'hail'
  | 'lightning'
  | 'ocean'
  | 'wave'
  | 'river'
  | 'lake'
  | 'waterfall'
  | 'island'
  | 'geyser'
  | 'iceberg'
  | 'glacier'
  | 'salt'
  | 'mountain'
  | 'pressure'
  | 'magma'
  | 'cave'
  | 'metal'
  | 'iron'
  | 'gold'
  | 'coal'
  | 'diamond'
  | 'crystal'
  | 'oil'
  | 'clay'
  | 'brick'
  | 'granite'
  | 'concrete'
  | 'rust'
  | 'steel'
  | 'ash'
  | 'grass'
  | 'flower'
  | 'seed'
  | 'moss'
  | 'algae'
  | 'fish'
  | 'bird'
  | 'insect'
  | 'bee'
  | 'honey'
  | 'animal'
  | 'lizard'
  | 'wolf'
  | 'forest'
  | 'mushroom'
  | 'fruit'
  | 'wood'
  | 'horse'
  | 'human'
  | 'tool'
  | 'family'
  | 'house'
  | 'village'
  | 'city'
  | 'field'
  | 'wheat'
  | 'bread'
  | 'warrior'
  | 'paper'
  | 'ink'
  | 'book'
  | 'rope'
  | 'cloth'
  | 'wheel'
  | 'cart'
  | 'boat'
  | 'ship'
  | 'sword'
  | 'lens'
  | 'wax'
  | 'electricity'
  | 'engine'
  | 'lamp'
  | 'computer'
  | 'robot'
  | 'car'
  | 'plane'
  | 'rocket'
  | 'moon'
  | 'star'
  | 'space'
  | 'planet'
  | 'meteor'
  | 'galaxy'
  | 'eclipse'
  | 'dragon'
  | 'phoenix'
  | 'golem'
  | 'mermaid'
  | 'giant'

export interface ElementDef {
  readonly id: ElementId
  readonly name: string
  readonly category: CategoryId
  readonly tones: readonly string[]
  readonly ops: readonly GlyphOp[]
}

export const BASE_ELEMENTS: readonly ElementId[] = ['earth', 'water', 'fire', 'air']

export const ELEMENTS: readonly ElementDef[] = [
  {
    id: 'earth',
    category: 'base',
    name: 'Земля',
    tones: ['#3a2a17', '#7c5631', '#a8d16a'],
    ops: [
      poly(CORE, -0.98, 0.62, -0.38, -0.22, 0.1, 0.22, 0.58, -0.52, 0.98, 0.62),
      poly(LIGHT, 0.58, -0.52, 0.9, -0.02, 0.28, -0.02),
      disc(-0.44, 0.3, 0.13, DEEP),
      disc(0.24, 0.42, 0.1, DEEP),
    ],
  },
  {
    id: 'water',
    category: 'base',
    name: 'Вода',
    tones: ['#092c52', '#1f6fb8', '#91daff'],
    ops: [
      disc(0, 0.26, 0.66, CORE),
      poly(CORE, 0, -0.96, 0.6, 0.3, -0.6, 0.3),
      disc(-0.24, 0.4, 0.17, LIGHT),
    ],
  },
  {
    id: 'fire',
    category: 'base',
    name: 'Вогонь',
    tones: ['#571100', '#ff6a1f', '#ffd257'],
    ops: [
      poly(CORE, 0, -0.98, 0.46, -0.32, 0.68, 0.28, 0.3, 0.84, -0.3, 0.84, -0.68, 0.28, -0.46, -0.32),
      poly(LIGHT, 0.02, -0.34, 0.38, 0.2, 0.2, 0.7, -0.2, 0.7, -0.38, 0.2),
    ],
  },
  {
    id: 'air',
    category: 'base',
    name: 'Повітря',
    tones: ['#152738', '#5d7fa8', '#d8edff'],
    ops: [
      bar(-0.85, -0.45, 0.3, -0.45, 0.16, LIGHT),
      curlRight(0.3, -0.27, 0.19, 0.16, LIGHT),
      bar(-0.5, -0.08, 0.3, -0.08, 0.16, LIGHT),
      bar(-0.8, 0.3, 0.45, 0.3, 0.14, CORE),
      curlRight(0.45, 0.48, 0.18, 0.14, CORE),
      bar(-0.3, 0.66, 0.45, 0.66, 0.14, CORE),
    ],
  },
  {
    id: 'steam',
    category: 'sky',
    name: 'Пара',
    tones: ['#28383f', '#8fb3c4', '#e9f7ff'],
    ops: [
      curlRight(-0.38, -0.42, 0.26, 0.14, LIGHT),
      curlLeft(-0.38, 0.1, 0.26, 0.14, LIGHT),
      curlRight(-0.38, 0.62, 0.26, 0.14, LIGHT),
      curlRight(0.42, -0.6, 0.24, 0.13, CORE),
      curlLeft(0.42, -0.12, 0.24, 0.13, CORE),
      curlRight(0.42, 0.36, 0.24, 0.13, CORE),
    ],
  },
  {
    id: 'swamp',
    category: 'water',
    name: 'Болото',
    tones: ['#18230f', '#46603a', '#93b24f'],
    ops: [
      disc(0, 0.5, 0.78, CORE),
      disc(-0.55, 0.3, 0.34, CORE),
      disc(0.55, 0.34, 0.3, CORE),
      disc(-0.28, 0.22, 0.14, LIGHT),
      disc(0.2, 0.38, 0.1, LIGHT),
      disc(-0.02, -0.12, 0.11, LIGHT),
      disc(0.34, -0.42, 0.07, LIGHT),
      disc(-0.4, -0.5, 0.05, LIGHT),
    ],
  },
  {
    id: 'dust',
    category: 'depths',
    name: 'Пил',
    tones: ['#2a2317', '#6b5b3c', '#cbb489'],
    ops: [
      disc(-0.42, -0.3, 0.2, CORE),
      disc(0.24, -0.5, 0.13, LIGHT),
      disc(0.48, 0.12, 0.17, CORE),
      disc(-0.12, 0.28, 0.11, LIGHT),
      disc(-0.56, 0.5, 0.12, CORE),
      disc(0.2, 0.6, 0.09, LIGHT),
      disc(-0.05, -0.62, 0.07, LIGHT),
    ],
  },
  {
    id: 'lava',
    category: 'depths',
    name: 'Лава',
    tones: ['#2a0903', '#ff4d12', '#ffc23d'],
    ops: [
      poly(CORE, -1, -0.1, -0.4, -0.5, 0.12, -0.12, 0.62, -0.56, 1, -0.06, 1, 0.42, -1, 0.42),
      bar(-0.66, 0.08, 0.66, 0.08, 0.11, LIGHT),
      disc(-0.42, 0.68, 0.16, LIGHT),
      disc(0.36, 0.74, 0.12, LIGHT),
    ],
  },
  {
    id: 'energy',
    category: 'sky',
    name: 'Енергія',
    tones: ['#2a1849', '#8b5cf6', '#f7ec74'],
    ops: [
      poly(LIGHT, 0.18, -0.96, -0.58, 0.1, -0.06, 0.1, -0.28, 0.96, 0.58, -0.18, 0.06, -0.18),
      disc(-0.66, -0.5, 0.12, CORE),
      disc(0.62, 0.52, 0.1, CORE),
    ],
  },
  {
    id: 'sea',
    category: 'water',
    name: 'Море',
    tones: ['#042040', '#0f6ea8', '#82dfff'],
    ops: [
      crestUp(-0.2, -0.52, 0.3, 0.13, CORE),
      crestDown(0.4, -0.52, 0.3, 0.13, CORE),
      crestUp(-0.5, 0.02, 0.3, 0.13, LIGHT),
      crestDown(0.1, 0.02, 0.3, 0.13, LIGHT),
      crestUp(0.7, 0.02, 0.3, 0.13, LIGHT),
      crestUp(-0.5, 0.56, 0.3, 0.13, CORE),
      crestDown(0.1, 0.56, 0.3, 0.13, CORE),
      crestUp(0.7, 0.56, 0.3, 0.13, CORE),
    ],
  },
  {
    id: 'stone',
    category: 'stone',
    name: 'Камінь',
    tones: ['#191c24', '#5b6472', '#9aa5b7'],
    ops: [
      poly(CORE, -0.82, 0.1, -0.44, -0.66, 0.36, -0.72, 0.86, -0.06, 0.6, 0.68, -0.5, 0.72),
      bar(-0.44, -0.66, -0.1, -0.06, 0.07, LIGHT),
      bar(-0.1, -0.06, 0.86, -0.06, 0.07, LIGHT),
      bar(-0.1, -0.06, 0.05, 0.7, 0.07, DEEP),
    ],
  },
  {
    id: 'cloud',
    category: 'sky',
    name: 'Хмара',
    tones: ['#283040', '#9fb2cc', '#eff5ff'],
    ops: [
      disc(-0.42, 0.08, 0.42, CORE),
      disc(0.12, -0.16, 0.54, CORE),
      disc(0.6, 0.12, 0.36, CORE),
      bar(-0.6, 0.4, 0.7, 0.4, 0.44, CORE),
      disc(0.06, -0.3, 0.26, LIGHT),
    ],
  },
  {
    id: 'smoke',
    category: 'sky',
    name: 'Дим',
    tones: ['#111318', '#474d59', '#8d95a6'],
    ops: [
      curlRight(-0.2, -0.5, 0.3, 0.16, CORE),
      curlLeft(-0.2, 0.1, 0.3, 0.16, CORE),
      curlRight(-0.2, 0.7, 0.3, 0.16, CORE),
      disc(0.5, -0.5, 0.14, LIGHT),
      disc(0.62, 0.1, 0.1, LIGHT),
      disc(0.42, 0.56, 0.08, LIGHT),
    ],
  },
  {
    id: 'sand',
    category: 'stone',
    name: 'Пісок',
    tones: ['#38290f', '#c8a25a', '#f2dfab'],
    ops: [
      poly(CORE, -1, 0.7, -0.5, 0.05, 0.05, 0.42, 0.62, -0.2, 1, 0.24, 1, 0.7),
      disc(-0.3, -0.42, 0.09, LIGHT),
      disc(0.2, -0.62, 0.07, LIGHT),
      disc(0.62, -0.5, 0.08, LIGHT),
      disc(-0.2, 0.5, 0.07, DEEP),
      disc(0.44, 0.48, 0.06, DEEP),
    ],
  },
  {
    id: 'rain',
    category: 'sky',
    name: 'Дощ',
    tones: ['#0f1b2c', '#5b7fb0', '#a9dcff'],
    ops: [
      disc(-0.34, -0.42, 0.34, CORE),
      disc(0.2, -0.56, 0.4, CORE),
      bar(-0.56, -0.24, 0.6, -0.24, 0.36, CORE),
      bar(-0.48, 0.16, -0.62, 0.72, 0.11, LIGHT),
      bar(0.02, 0.16, -0.12, 0.72, 0.11, LIGHT),
      bar(0.52, 0.16, 0.38, 0.72, 0.11, LIGHT),
    ],
  },
  {
    id: 'obsidian',
    category: 'stone',
    name: 'Обсидіан',
    tones: ['#06060a', '#241f34', '#7d6cdd'],
    ops: [
      poly(CORE, 0, -0.96, 0.72, -0.1, 0.42, 0.86, -0.42, 0.86, -0.72, -0.1),
      poly(LIGHT, 0, -0.96, 0.2, -0.06, -0.06, 0.84, -0.2, -0.04),
      bar(0.2, -0.06, 0.72, -0.1, 0.05, DEEP),
    ],
  },
  {
    id: 'glass',
    category: 'stone',
    name: 'Скло',
    tones: ['#102d38', '#4fa7bd', '#e1fbff'],
    ops: [
      poly(CORE, -0.62, -0.8, 0.62, -0.8, 0.62, 0.8, -0.62, 0.8),
      poly(DEEP, -0.62, -0.8, 0.62, -0.8, 0.62, -0.62, -0.62, -0.62),
      bar(-0.4, 0.6, 0.34, -0.62, 0.13, LIGHT),
      bar(0.06, 0.62, 0.5, -0.1, 0.1, LIGHT),
    ],
  },
  {
    id: 'beach',
    category: 'water',
    name: 'Пляж',
    tones: ['#2c2312', '#d9b878', '#63d1e8'],
    ops: [
      crestUp(-0.5, -0.3, 0.3, 0.13, LIGHT),
      crestDown(0.1, -0.3, 0.3, 0.13, LIGHT),
      crestUp(0.7, -0.3, 0.3, 0.13, LIGHT),
      bar(-1, 0.5, 1, 0.5, 0.62, CORE),
      disc(-0.4, 0.38, 0.09, DEEP),
      ring(0.42, 0.42, 0.15, 0.07, DEEP),
    ],
  },
  {
    id: 'life',
    category: 'life',
    name: 'Життя',
    tones: ['#06301e', '#1f9d63', '#bbff9e'],
    ops: [
      ring(0, 0, 0.78, 0.12, CORE),
      bar(0, 0.6, 0, -0.24, 0.12, LIGHT),
      poly(LIGHT, 0, -0.02, -0.56, -0.26, -0.18, -0.54),
      poly(LIGHT, 0, -0.22, 0.54, -0.42, 0.16, -0.7),
    ],
  },
  {
    id: 'plant',
    category: 'life',
    name: 'Рослина',
    tones: ['#0b2a11', '#2f8f3c', '#a2e46c'],
    ops: [
      bar(0, 0.88, 0, -0.5, 0.13, CORE),
      poly(LIGHT, 0, 0.3, -0.78, 0.06, -0.32, -0.34),
      poly(LIGHT, 0, -0.05, 0.78, -0.28, 0.32, -0.66),
      disc(0, -0.62, 0.16, LIGHT),
    ],
  },
  {
    id: 'tree',
    category: 'life',
    name: 'Дерево',
    tones: ['#201303', '#6b4522', '#46a94f'],
    ops: [
      bar(0, 0.92, 0, 0.05, 0.19, CORE),
      bar(0, 0.42, -0.4, 0.1, 0.11, CORE),
      bar(0, 0.3, 0.42, 0, 0.11, CORE),
      disc(-0.42, -0.24, 0.42, LIGHT),
      disc(0.4, -0.2, 0.38, LIGHT),
      disc(0, -0.52, 0.46, LIGHT),
    ],
  },
  {
    id: 'storm',
    category: 'sky',
    name: 'Буря',
    tones: ['#0e1224', '#3d4a72', '#ffe066'],
    ops: [
      disc(-0.4, -0.44, 0.36, CORE),
      disc(0.18, -0.58, 0.42, CORE),
      bar(-0.6, -0.26, 0.62, -0.26, 0.38, CORE),
      poly(LIGHT, 0.14, 0, -0.36, 0.5, -0.02, 0.5, -0.2, 0.98, 0.42, 0.34, 0.06, 0.34),
      bar(-0.72, 0.2, -0.5, 0.7, 0.08, DEEP),
    ],
  },
  {
    id: 'volcano',
    category: 'depths',
    name: 'Вулкан',
    tones: ['#181006', '#5a4030', '#ff6a1f'],
    ops: [
      poly(CORE, -1, 0.84, -0.3, -0.4, 0.3, -0.4, 1, 0.84),
      poly(LIGHT, -0.3, -0.4, 0.3, -0.4, 0.16, 0.1, -0.16, 0.1),
      bar(0.1, -0.3, 0.46, 0.7, 0.09, LIGHT),
      disc(-0.05, -0.62, 0.14, LIGHT),
      disc(0.3, -0.78, 0.1, LIGHT),
      disc(-0.44, -0.8, 0.08, LIGHT),
    ],
  },
  {
    id: 'rainbow',
    category: 'sky',
    name: 'Веселка',
    tones: ['#131a2c', '#ff5a5a', '#5adcff', '#ffa94d', '#ffe066', '#6ee7a0', '#b07cff'],
    ops: [
      crestUp(0, 0.55, 0.92, 0.14, 1),
      crestUp(0, 0.55, 0.78, 0.14, 3),
      crestUp(0, 0.55, 0.64, 0.14, 4),
      crestUp(0, 0.55, 0.5, 0.14, 5),
      crestUp(0, 0.55, 0.36, 0.14, 2),
      crestUp(0, 0.55, 0.22, 0.14, 6),
    ],
  },
  {
    id: 'wind',
    category: 'sky',
    name: 'Вітер',
    tones: ['#131f2e', '#4d7ba8', '#cfe6ff'],
    ops: coilShape(),
  },
  {
    id: 'sky',
    category: 'sky',
    name: 'Небо',
    tones: ['#0a1830', '#2c5a9c', '#a9d2ff'],
    ops: wavesShape(),
  },
  {
    id: 'sun',
    category: 'sky',
    name: 'Сонце',
    tones: ['#4a2200', '#ff9d1f', '#ffe680'],
    ops: sunShape(),
  },
  {
    id: 'ice',
    category: 'sky',
    name: 'Лід',
    tones: ['#0e2c3d', '#4aa8c9', '#e6fbff'],
    ops: gemShape(),
  },
  {
    id: 'snow',
    category: 'sky',
    name: 'Сніг',
    tones: ['#1c2a38', '#89aecb', '#ffffff'],
    ops: flakeShape(),
  },
  {
    id: 'fog',
    category: 'sky',
    name: 'Туман',
    tones: ['#1b2228', '#6e7f8c', '#d6e2ea'],
    ops: wavesShape(),
  },
  {
    id: 'hail',
    category: 'sky',
    name: 'Град',
    tones: ['#141f2c', '#6d93b5', '#e8f6ff'],
    ops: dotsShape(),
  },
  {
    id: 'lightning',
    category: 'sky',
    name: 'Блискавка',
    tones: ['#181430', '#6f5cff', '#fff59a'],
    ops: boltShape(),
  },
  {
    id: 'ocean',
    category: 'water',
    name: 'Океан',
    tones: ['#021428', '#0b5088', '#5ec6ff'],
    ops: wavesShape(),
  },
  {
    id: 'wave',
    category: 'water',
    name: 'Хвиля',
    tones: ['#062339', '#0f6ea8', '#96e2ff'],
    ops: wavesShape(),
  },
  {
    id: 'river',
    category: 'water',
    name: 'Річка',
    tones: ['#07263a', '#1e7bb0', '#9ee0ff'],
    ops: wavesShape(),
  },
  {
    id: 'lake',
    category: 'water',
    name: 'Озеро',
    tones: ['#06202f', '#1a6a94', '#8fd8f2'],
    ops: dropShape(),
  },
  {
    id: 'waterfall',
    category: 'water',
    name: 'Водоспад',
    tones: ['#08283c', '#2b8ec2', '#d8f6ff'],
    ops: jetShape(),
  },
  {
    id: 'island',
    category: 'water',
    name: 'Острів',
    tones: ['#123020', '#3f7d4a', '#2f9fd6'],
    ops: mountainShape(),
  },
  {
    id: 'geyser',
    category: 'water',
    name: 'Гейзер',
    tones: ['#1a2a2e', '#5fb0b8', '#eaffff'],
    ops: jetShape(),
  },
  {
    id: 'iceberg',
    category: 'water',
    name: 'Айсберг',
    tones: ['#0b2233', '#4f93b8', '#e8fbff'],
    ops: gemShape(),
  },
  {
    id: 'glacier',
    category: 'water',
    name: 'Льодовик',
    tones: ['#122a38', '#5f9ec2', '#f0fdff'],
    ops: mountainShape(),
  },
  {
    id: 'salt',
    category: 'water',
    name: 'Сіль',
    tones: ['#252a30', '#8f9aa6', '#ffffff'],
    ops: dotsShape(),
  },
  {
    id: 'mountain',
    category: 'depths',
    name: 'Гора',
    tones: ['#1a1d24', '#5b6472', '#b8c3d4'],
    ops: mountainShape(),
  },
  {
    id: 'pressure',
    category: 'depths',
    name: 'Тиск',
    tones: ['#14161c', '#4a5160', '#9aa5b7'],
    ops: archShape(),
  },
  {
    id: 'magma',
    category: 'depths',
    name: 'Магма',
    tones: ['#2a0a02', '#e03c10', '#ffb03a'],
    ops: blobShape(),
  },
  {
    id: 'cave',
    category: 'depths',
    name: 'Печера',
    tones: ['#0a0c10', '#2c3240', '#6e7a8c'],
    ops: archShape(),
  },
  {
    id: 'metal',
    category: 'depths',
    name: 'Метал',
    tones: ['#1c1f26', '#6f7a8a', '#cfd8e6'],
    ops: barsShape(),
  },
  {
    id: 'iron',
    category: 'depths',
    name: 'Залізо',
    tones: ['#1d1a18', '#6b6459', '#b9b0a2'],
    ops: barsShape(),
  },
  {
    id: 'gold',
    category: 'depths',
    name: 'Золото',
    tones: ['#3a2a05', '#d9a520', '#ffef9e'],
    ops: barsShape(),
  },
  {
    id: 'coal',
    category: 'depths',
    name: 'Вугілля',
    tones: ['#0a0a0c', '#2e2e33', '#7a7a84'],
    ops: rockShape(),
  },
  {
    id: 'diamond',
    category: 'depths',
    name: 'Діамант',
    tones: ['#101820', '#7fb6d6', '#ffffff'],
    ops: gemShape(),
  },
  {
    id: 'crystal',
    category: 'depths',
    name: 'Кристал',
    tones: ['#151d2c', '#6a7fd0', '#dfe6ff'],
    ops: gemShape(),
  },
  {
    id: 'oil',
    category: 'depths',
    name: 'Нафта',
    tones: ['#0a0a0a', '#2a2620', '#7a6b4a'],
    ops: dropShape(),
  },
  {
    id: 'clay',
    category: 'stone',
    name: 'Глина',
    tones: ['#2c1f14', '#8a6142', '#d0a878'],
    ops: blobShape(),
  },
  {
    id: 'brick',
    category: 'stone',
    name: 'Цегла',
    tones: ['#2e140c', '#a6402a', '#e08a5c'],
    ops: bricksShape(),
  },
  {
    id: 'granite',
    category: 'stone',
    name: 'Граніт',
    tones: ['#1a1a1e', '#5e5c66', '#a8a6b2'],
    ops: rockShape(),
  },
  {
    id: 'concrete',
    category: 'stone',
    name: 'Бетон',
    tones: ['#1d1f22', '#666a70', '#aeb3ba'],
    ops: bricksShape(),
  },
  {
    id: 'rust',
    category: 'stone',
    name: 'Іржа',
    tones: ['#2a1508', '#8c451c', '#d98a4a'],
    ops: rockShape(),
  },
  {
    id: 'steel',
    category: 'stone',
    name: 'Сталь',
    tones: ['#15181d', '#7d8694', '#dce3ee'],
    ops: barsShape(),
  },
  {
    id: 'ash',
    category: 'stone',
    name: 'Попіл',
    tones: ['#141414', '#4e4e52', '#9a9aa0'],
    ops: dotsShape(),
  },
  {
    id: 'grass',
    category: 'life',
    name: 'Трава',
    tones: ['#0d2410', '#3d8a2e', '#9fd968'],
    ops: grassShape(),
  },
  {
    id: 'flower',
    category: 'life',
    name: 'Квітка',
    tones: ['#2a0f22', '#d4487e', '#ffd1e4'],
    ops: flowerShape(),
  },
  {
    id: 'seed',
    category: 'life',
    name: 'Насіння',
    tones: ['#241a0c', '#8a6a32', '#d8bc7a'],
    ops: dotsShape(),
  },
  {
    id: 'moss',
    category: 'life',
    name: 'Мох',
    tones: ['#0d1c10', '#3f7a42', '#8fc47a'],
    ops: dotsShape(),
  },
  {
    id: 'algae',
    category: 'life',
    name: 'Водорість',
    tones: ['#062018', '#1f7a5e', '#7fe0bc'],
    ops: coilShape(),
  },
  {
    id: 'fish',
    category: 'life',
    name: 'Риба',
    tones: ['#07202e', '#2a7fb8', '#9fdcff'],
    ops: fishShape(),
  },
  {
    id: 'bird',
    category: 'life',
    name: 'Птах',
    tones: ['#1a1420', '#6b5a9c', '#dcd0ff'],
    ops: birdShape(),
  },
  {
    id: 'insect',
    category: 'life',
    name: 'Комаха',
    tones: ['#161c0e', '#5d7024', '#b9cc5e'],
    ops: bugShape(),
  },
  {
    id: 'bee',
    category: 'life',
    name: 'Бджола',
    tones: ['#241a04', '#d9a919', '#ffe57a'],
    ops: bugShape(),
  },
  {
    id: 'honey',
    category: 'life',
    name: 'Мед',
    tones: ['#2e1c02', '#d99a10', '#ffd873'],
    ops: dropShape(),
  },
  {
    id: 'animal',
    category: 'life',
    name: 'Тварина',
    tones: ['#1e150e', '#8a6440', '#d6b48c'],
    ops: pawShape(),
  },
  {
    id: 'lizard',
    category: 'life',
    name: 'Ящірка',
    tones: ['#12220e', '#4f8a34', '#9fd06a'],
    ops: clawShape(),
  },
  {
    id: 'wolf',
    category: 'life',
    name: 'Вовк',
    tones: ['#16181c', '#5c626e', '#b6bcc8'],
    ops: pawShape(),
  },
  {
    id: 'forest',
    category: 'life',
    name: 'Ліс',
    tones: ['#08180c', '#2f6b30', '#78bd5c'],
    ops: treeShape(),
  },
  {
    id: 'mushroom',
    category: 'life',
    name: 'Гриб',
    tones: ['#241610', '#9c4a3c', '#e0b49c'],
    ops: archShape(),
  },
  {
    id: 'fruit',
    category: 'life',
    name: 'Фрукт',
    tones: ['#2a0c0c', '#c9342c', '#ffb0a0'],
    ops: dropShape(),
  },
  {
    id: 'wood',
    category: 'life',
    name: 'Деревина',
    tones: ['#241505', '#8a5c2a', '#cfa062'],
    ops: barsShape(),
  },
  {
    id: 'horse',
    category: 'life',
    name: 'Кінь',
    tones: ['#20150e', '#7a5030', '#c9a077'],
    ops: pawShape(),
  },
  {
    id: 'human',
    category: 'people',
    name: 'Людина',
    tones: ['#1c1410', '#b07a52', '#f0d4b4'],
    ops: figureShape(),
  },
  {
    id: 'tool',
    category: 'people',
    name: 'Знаряддя',
    tones: ['#1a1a1e', '#7a7e88', '#ccd2dc'],
    ops: bladeShape(),
  },
  {
    id: 'family',
    category: 'people',
    name: 'Сімʼя',
    tones: ['#241a12', '#b5825a', '#f2dcc4'],
    ops: figureShape(),
  },
  {
    id: 'house',
    category: 'people',
    name: 'Дім',
    tones: ['#20160e', '#8a5a34', '#d6a86e'],
    ops: houseShape(),
  },
  {
    id: 'village',
    category: 'people',
    name: 'Село',
    tones: ['#1a1810', '#6e6a3c', '#c4bc7e'],
    ops: houseShape(),
  },
  {
    id: 'city',
    category: 'people',
    name: 'Місто',
    tones: ['#12141c', '#5a6280', '#b6c0dc'],
    ops: towerShape(),
  },
  {
    id: 'field',
    category: 'people',
    name: 'Поле',
    tones: ['#1e1a0c', '#8a7a30', '#d6c46a'],
    ops: grassShape(),
  },
  {
    id: 'wheat',
    category: 'people',
    name: 'Пшениця',
    tones: ['#2a2008', '#c9a428', '#ffe894'],
    ops: stalkShape(),
  },
  {
    id: 'bread',
    category: 'people',
    name: 'Хліб',
    tones: ['#2a1a08', '#b5793a', '#f0c98a'],
    ops: loafShape(),
  },
  {
    id: 'warrior',
    category: 'people',
    name: 'Воїн',
    tones: ['#1c1218', '#8a3a42', '#e0a0a8'],
    ops: bladeShape(),
  },
  {
    id: 'paper',
    category: 'craft',
    name: 'Папір',
    tones: ['#2a2620', '#c9c0aa', '#f6f2e6'],
    ops: sheetShape(),
  },
  {
    id: 'ink',
    category: 'craft',
    name: 'Чорнило',
    tones: ['#08080c', '#232838', '#6a7490'],
    ops: dropShape(),
  },
  {
    id: 'book',
    category: 'craft',
    name: 'Книга',
    tones: ['#1c1410', '#8a5a3a', '#e0c49c'],
    ops: bookShape(),
  },
  {
    id: 'rope',
    category: 'craft',
    name: 'Мотузка',
    tones: ['#241c0e', '#96773a', '#dcc28a'],
    ops: coilShape(),
  },
  {
    id: 'cloth',
    category: 'craft',
    name: 'Тканина',
    tones: ['#1a1424', '#6a5490', '#c8b8e8'],
    ops: clothShape(),
  },
  {
    id: 'wheel',
    category: 'craft',
    name: 'Колесо',
    tones: ['#1e1811', '#7a6440', '#c8ac7e'],
    ops: wheelShape(),
  },
  {
    id: 'cart',
    category: 'craft',
    name: 'Віз',
    tones: ['#221a10', '#8a6a40', '#d0ac76'],
    ops: carShape(),
  },
  {
    id: 'boat',
    category: 'craft',
    name: 'Човен',
    tones: ['#1a1810', '#7a6432', '#c8b47a'],
    ops: boatShape(),
  },
  {
    id: 'ship',
    category: 'craft',
    name: 'Корабель',
    tones: ['#141a24', '#4a648a', '#b0c8e8'],
    ops: boatShape(),
  },
  {
    id: 'sword',
    category: 'craft',
    name: 'Меч',
    tones: ['#14181e', '#8a94a4', '#e0e8f4'],
    ops: bladeShape(),
  },
  {
    id: 'lens',
    category: 'craft',
    name: 'Лінза',
    tones: ['#0e2028', '#4a94ae', '#d8f4ff'],
    ops: orbitShape(),
  },
  {
    id: 'wax',
    category: 'craft',
    name: 'Віск',
    tones: ['#2a2208', '#c9ab48', '#f4e2a0'],
    ops: barsShape(),
  },
  {
    id: 'electricity',
    category: 'machine',
    name: 'Електрика',
    tones: ['#161230', '#5c4aff', '#fff07a'],
    ops: boltShape(),
  },
  {
    id: 'engine',
    category: 'machine',
    name: 'Двигун',
    tones: ['#181a1e', '#6a7080', '#c0c8d8'],
    ops: gearShape(),
  },
  {
    id: 'lamp',
    category: 'machine',
    name: 'Лампа',
    tones: ['#2a2408', '#d9b429', '#fff6b0'],
    ops: bulbShape(),
  },
  {
    id: 'computer',
    category: 'machine',
    name: 'Компʼютер',
    tones: ['#0c1418', '#2a7a8a', '#9ee6f4'],
    ops: screenShape(),
  },
  {
    id: 'robot',
    category: 'machine',
    name: 'Робот',
    tones: ['#141820', '#6a7a94', '#c8d8f0'],
    ops: robotShape(),
  },
  {
    id: 'car',
    category: 'machine',
    name: 'Автомобіль',
    tones: ['#1a1014', '#a8323c', '#f0a0a8'],
    ops: carShape(),
  },
  {
    id: 'plane',
    category: 'machine',
    name: 'Літак',
    tones: ['#141c24', '#5a7a9c', '#c0dcf4'],
    ops: planeShape(),
  },
  {
    id: 'rocket',
    category: 'machine',
    name: 'Ракета',
    tones: ['#1c1418', '#9c4a3a', '#ffc09a'],
    ops: rocketShape(),
  },
  {
    id: 'moon',
    category: 'space',
    name: 'Місяць',
    tones: ['#14161e', '#8a8e9c', '#eef0f8'],
    ops: crescentShape(),
  },
  {
    id: 'star',
    category: 'space',
    name: 'Зірка',
    tones: ['#141020', '#ffd24a', '#fff6c8'],
    ops: starShape(),
  },
  {
    id: 'space',
    category: 'space',
    name: 'Космос',
    tones: ['#05050e', '#241f4a', '#8a80d8'],
    ops: dotsShape(),
  },
  {
    id: 'planet',
    category: 'space',
    name: 'Планета',
    tones: ['#0a1420', '#2a6a8a', '#8ad0e8'],
    ops: orbitShape(),
  },
  {
    id: 'meteor',
    category: 'space',
    name: 'Метеор',
    tones: ['#1a1208', '#a05a20', '#ffc070'],
    ops: rockShape(),
  },
  {
    id: 'galaxy',
    category: 'space',
    name: 'Галактика',
    tones: ['#0a081c', '#5a44b8', '#dcd0ff'],
    ops: spiralShape(),
  },
  {
    id: 'eclipse',
    category: 'space',
    name: 'Затемнення',
    tones: ['#0c0c12', '#3a3a4a', '#ffcf5a'],
    ops: crescentShape(),
  },
  {
    id: 'dragon',
    category: 'myth',
    name: 'Дракон',
    tones: ['#1c0c10', '#a03028', '#ffb04a'],
    ops: clawShape(),
  },
  {
    id: 'phoenix',
    category: 'myth',
    name: 'Фенікс',
    tones: ['#2a1002', '#e06a10', '#ffd47a'],
    ops: wingShape(),
  },
  {
    id: 'golem',
    category: 'myth',
    name: 'Голем',
    tones: ['#1c1810', '#7a6a4a', '#c4b494'],
    ops: figureShape(),
  },
  {
    id: 'mermaid',
    category: 'myth',
    name: 'Русалка',
    tones: ['#0c2028', '#2a8a9c', '#a0e8f4'],
    ops: fishShape(),
  },
  {
    id: 'giant',
    category: 'myth',
    name: 'Велетень',
    tones: ['#1a1a20', '#6a6474', '#c0b8cc'],
    ops: figureShape(),
  },
]
