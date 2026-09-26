import { LAYOUT } from '../config/layout.js'
import type { CrucibleView } from '../render/CrucibleRenderer.js'

export interface Area {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

const inside = (area: Area, x: number, y: number): boolean =>
  x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height

export class Stage {
  width: number = LAYOUT.designWidth
  height: number = LAYOUT.designHeight
  centerX: number = LAYOUT.designWidth / 2

  crucible: CrucibleView = { x: 0, y: 0, size: 100, corner: 16 }
  info: Area = { x: 0, y: 0, width: 100, height: 60 }
  feed: Area = { x: 0, y: 0, width: 100, height: 100 }
  categories: Area = { x: 0, y: 0, width: 100, height: LAYOUT.categoryHeight }
  grid: Area = { x: 0, y: 0, width: 100, height: 100 }
  menuX = 0
  menuY = 0
  menuRadius: number = LAYOUT.menuButton

  get crucibleCenterX(): number {
    return this.crucible.x + this.crucible.size / 2
  }

  get crucibleCenterY(): number {
    return this.crucible.y + this.crucible.size / 2
  }

  hitsCrucible(x: number, y: number): boolean {
    const { x: left, y: top, size } = this.crucible
    return x >= left && x <= left + size && y >= top && y <= top + size
  }

  hitsMenu(x: number, y: number): boolean {
    const reach = this.menuRadius * 1.35
    return (x - this.menuX) ** 2 + (y - this.menuY) ** 2 <= reach * reach
  }

  hitsFeed(x: number, y: number): boolean {
    return inside(this.feed, x, y)
  }

  hitsGrid(x: number, y: number): boolean {
    return inside(this.grid, x, y)
  }

  hitsCategories(x: number, y: number): boolean {
    return inside(this.categories, x, y)
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.centerX = width / 2

    const margin = LAYOUT.sideMargin
    const infoHeight = Math.min(
      LAYOUT.infoHeightMax,
      Math.max(LAYOUT.infoHeightMin, height * LAYOUT.infoHeightRatio),
    )
    this.menuRadius = LAYOUT.menuButton
    this.menuX = width - margin - this.menuRadius
    this.menuY = margin + infoHeight / 2
    this.info = {
      x: margin,
      y: margin,
      width: width - margin * 2 - this.menuRadius * 2 - 10,
      height: infoHeight,
    }

    const rowTop = margin + infoHeight + LAYOUT.crucibleTopGap
    const size = Math.min(
      width * LAYOUT.crucibleWidthRatio,
      (height - rowTop) * LAYOUT.crucibleHeightRatio,
    )
    this.crucible = {
      x: width - margin - size,
      y: rowTop,
      size,
      corner: Math.min(size * 0.16, 30),
    }

    this.feed = {
      x: margin,
      y: rowTop,
      width: Math.max(160, this.crucible.x - LAYOUT.columnGap - margin),
      height: size,
    }

    const categoriesY = rowTop + size + LAYOUT.categoryTopGap
    this.categories = {
      x: margin,
      y: categoriesY,
      width: width - margin * 2,
      height: LAYOUT.categoryHeight,
    }

    const gridY = categoriesY + LAYOUT.categoryHeight + LAYOUT.gridTopGap
    this.grid = {
      x: margin,
      y: gridY,
      width: width - margin * 2,
      height: Math.max(120, height - margin - gridY),
    }
  }
}
