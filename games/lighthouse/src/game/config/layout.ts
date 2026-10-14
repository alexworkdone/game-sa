export const LAYOUT = {
  designWidth: 960,
  designHeight: 540,
  tile: 32,
  cols: 30,
  rows: 15,
  hudHeight: 46,
  levelTopGap: 4,
} as const

export const LEVEL_WIDTH = LAYOUT.cols * LAYOUT.tile
export const LEVEL_HEIGHT = LAYOUT.rows * LAYOUT.tile
