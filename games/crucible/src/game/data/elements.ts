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
]
