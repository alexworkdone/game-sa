import type { IRenderer } from '@sa/core'
import { PALETTE } from '../config/palette.js'
import { PEARLS } from '../config/pearls.js'
import type { PearlKind } from '../config/pearls.js'
import type { UpgradeId } from '../config/upgrades.js'
import type { PickupKind } from '../entities/Pickup.js'
import { POWER_UPS } from '../config/powerups.js'
import type { PerkId } from '../config/perks.js'

export const drawHeart = (
  r: IRenderer,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
): void => {
  const s = size
  r.circle(x - s * 0.24, y - s * 0.12, s * 0.28, { fill: color, alpha })
  r.circle(x + s * 0.24, y - s * 0.12, s * 0.28, { fill: color, alpha })
  r.polygon([x - s * 0.5, y - s * 0.02, x + s * 0.5, y - s * 0.02, x, y + s * 0.5], {
    fill: color,
    alpha,
  })
}

export const drawHeartSlot = (r: IRenderer, x: number, y: number, size: number, full: boolean): void => {
  if (full) {
    drawHeart(r, x, y, size, PALETTE.heart)
    r.circle(x - size * 0.28, y - size * 0.2, size * 0.09, { fill: '#ffffff', alpha: 0.7 })
  } else {
    drawHeart(r, x, y, size, PALETTE.surfaceActive)
  }
}

const RAINBOW = ['#ff2d55', '#ff8a00', '#ffd400', '#2ee86b', '#1ea7ff', '#8f4dff'] as const

const drawRainbowPearl = (r: IRenderer, x: number, y: number, size: number, alpha: number): void => {
  const time = performance.now() / 1000
  const cx = x - size * 0.06
  const cy = y - size * 0.06
  const radius = size * 0.42
  const turn = time * 1.1
  const wedge = (Math.PI * 2) / RAINBOW.length
  r.circle(x, y, size * 0.5, { fill: PEARLS.rainbow.shade, alpha })
  RAINBOW.forEach((color, index) => {
    const start = turn + index * wedge
    r.arc(cx, cy, radius / 2, start, start + wedge + 0.02, radius, { stroke: color, alpha })
  })
  r.circle(cx, cy, radius * 0.55, { fill: PEARLS.rainbow.fill, alpha: alpha * 0.16 })
  const sweep = time * 2.6
  const shimmer = 0.45 + Math.sin(time * 3.4) * 0.2
  r.arc(cx, cy, radius * 0.72, sweep, sweep + 1.1, size * 0.12, { stroke: '#ffffff', alpha: alpha * shimmer })
  r.arc(cx, cy, radius * 0.4, -sweep * 0.7, -sweep * 0.7 + 0.8, size * 0.08, { stroke: '#fff4fb', alpha: alpha * 0.35 })
  r.ring(cx, cy, radius, size * 0.05, { stroke: '#f3f8ff', alpha: alpha * 0.7 })
  r.circle(x - size * 0.16, y - size * 0.18, size * 0.12, { fill: PEARLS.rainbow.shine, alpha })
}

export const drawPearl = (r: IRenderer, x: number, y: number, size: number, alpha = 1, kind: PearlKind = 'white'): void => {
  if (kind === 'rainbow') {
    drawRainbowPearl(r, x, y, size, alpha)
    return
  }
  const look = PEARLS[kind]
  r.circle(x, y, size * 0.5, { fill: look.shade, alpha })
  r.circle(x - size * 0.06, y - size * 0.06, size * 0.42, { fill: look.fill, alpha })
  if (kind === 'black') r.ring(x - size * 0.06, y - size * 0.06, size * 0.36, size * 0.05, { stroke: '#7a6aa8', alpha: alpha * 0.6 })
  r.circle(x - size * 0.16, y - size * 0.18, size * 0.12, { fill: look.shine, alpha })
}

export const drawKey = (r: IRenderer, x: number, y: number, size: number, glow = true, alpha = 1): void => {
  const s = size
  const shine = glow ? { glow: PALETTE.key, glowSize: s * 0.9 } : {}
  r.ring(x - s * 0.3, y, s * 0.2, s * 0.11, { stroke: PALETTE.key, alpha, ...shine })
  r.rect(x - s * 0.12, y - s * 0.06, s * 0.62, s * 0.12, { fill: PALETTE.key, alpha })
  r.rect(x + s * 0.3, y + s * 0.06, s * 0.08, s * 0.17, { fill: PALETTE.key, alpha })
  r.rect(x + s * 0.42, y + s * 0.06, s * 0.08, s * 0.11, { fill: PALETTE.key, alpha })
  r.rect(x - s * 0.12, y + s * 0.02, s * 0.62, s * 0.04, { fill: PALETTE.keyShade, alpha })
  r.circle(x - s * 0.36, y - s * 0.07, s * 0.05, { fill: PALETTE.keyGlint, alpha })
}

export const drawBullet = (r: IRenderer, x: number, y: number, size: number, filled: boolean): void => {
  const w = size * 0.36
  const h = size
  r.roundRect(x - w / 2, y - h / 2, w, h, w / 2, {
    fill: filled ? PALETTE.flare : PALETTE.surfaceActive,
  })
  if (filled) r.rect(x - w / 2, y + h * 0.12, w, h * 0.38, { fill: PALETTE.coatShade })
}

export const drawPowerGlyph = (
  r: IRenderer,
  kind: PickupKind,
  x: number,
  y: number,
  size: number,
  alpha = 1,
): void => {
  const s = size
  switch (kind) {
    case 'heart':
      drawHeart(r, x, y + s * 0.04, s * 0.9, PALETTE.heart, alpha)
      return
    case 'shield':
      r.ring(x, y, s * 0.38, s * 0.12, { stroke: PALETTE.shield, alpha })
      r.circle(x, y, s * 0.16, { fill: PALETTE.shield, alpha })
      return
    case 'fan':
      for (const angle of [-0.45, 0, 0.45]) {
        const dx = Math.cos(angle) * s * 0.5
        const dy = Math.sin(angle) * s * 0.5
        r.line(x - s * 0.35, y, x - s * 0.35 + dx * 1.4, y + dy * 1.4, s * 0.13, {
          stroke: PALETTE.fan,
          alpha,
        })
      }
      return
    case 'hourglass':
      r.polygon([x - s * 0.32, y - s * 0.42, x + s * 0.32, y - s * 0.42, x, y], {
        fill: PALETTE.hourglass,
        alpha,
      })
      r.polygon([x - s * 0.32, y + s * 0.42, x + s * 0.32, y + s * 0.42, x, y], {
        fill: PALETTE.hourglass,
        alpha: alpha * 0.6,
      })
      r.rect(x - s * 0.38, y - s * 0.5, s * 0.76, s * 0.09, { fill: PALETTE.plankLight, alpha })
      r.rect(x - s * 0.38, y + s * 0.41, s * 0.76, s * 0.09, { fill: PALETTE.plankLight, alpha })
      return
    case 'hotgun':
      r.polygon(
        [x, y - s * 0.5, x + s * 0.3, y - s * 0.05, x + s * 0.22, y + s * 0.4, x - s * 0.22, y + s * 0.4, x - s * 0.3, y - s * 0.05],
        { fill: PALETTE.hotgun, alpha },
      )
      r.circle(x, y + s * 0.14, s * 0.14, { fill: PALETTE.flareCore, alpha })
      return
    case 'strider': {
      const legs = { stroke: PALETTE.strider, alpha }
      for (const side of [-1, 1]) {
        r.line(x - s * 0.12, y, x - s * 0.46, y + side * s * 0.34, s * 0.06, legs)
        r.line(x + s * 0.12, y, x + s * 0.46, y + side * s * 0.34, s * 0.06, legs)
        r.line(x, y, x + side * s * 0.12, y + s * 0.42, s * 0.06, legs)
      }
      r.roundRect(x - s * 0.28, y - s * 0.09, s * 0.56, s * 0.18, s * 0.09, { fill: PALETTE.strider, alpha })
      r.circle(x + s * 0.3, y, s * 0.1, { fill: PALETTE.strider, alpha })
      return
    }
    case 'pearl':
      drawPearl(r, x, y, s * 0.7, alpha)
      return
    case 'key':
      drawKey(r, x, y, s * 0.8, false, alpha)
      return
    case 'homing': {
      const style = { stroke: PALETTE.homing, alpha }
      r.ring(x, y, s * 0.34, s * 0.09, style)
      r.line(x - s * 0.5, y, x - s * 0.18, y, s * 0.09, style)
      r.line(x + s * 0.18, y, x + s * 0.5, y, s * 0.09, style)
      r.line(x, y - s * 0.5, x, y - s * 0.18, s * 0.09, style)
      r.line(x, y + s * 0.18, x, y + s * 0.5, s * 0.09, style)
      r.circle(x, y, s * 0.08, { fill: PALETTE.homing, alpha })
      return
    }
    case 'blast': {
      const points: number[] = []
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        const radius = i % 2 === 0 ? s * 0.5 : s * 0.24
        points.push(x + Math.cos(a) * radius, y + Math.sin(a) * radius)
      }
      r.polygon(points, { fill: PALETTE.blast, alpha })
      r.circle(x, y, s * 0.14, { fill: PALETTE.flareCore, alpha })
      return
    }
    case 'harpoon': {
      const style = { stroke: PALETTE.harpoon, alpha }
      r.line(x - s * 0.5, y + s * 0.2, x + s * 0.34, y - s * 0.14, s * 0.08, style)
      r.polygon([x + s * 0.5, y - s * 0.2, x + s * 0.2, y - s * 0.22, x + s * 0.3, y], { fill: PALETTE.harpoon, alpha })
      r.line(x + s * 0.08, y - s * 0.05, x + s * 0.12, y + s * 0.12, s * 0.07, style)
      return
    }
    case 'twin': {
      const fill = { fill: PALETTE.twin, alpha }
      r.rect(x - s * 0.3, y - s * 0.05, s * 0.6, s * 0.1, fill)
      r.polygon([x + s * 0.5, y, x + s * 0.24, y - s * 0.2, x + s * 0.24, y + s * 0.2], fill)
      r.polygon([x - s * 0.5, y, x - s * 0.24, y - s * 0.2, x - s * 0.24, y + s * 0.2], fill)
      return
    }
    case 'frost': {
      const style = { stroke: PALETTE.frost, alpha }
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI
        const dx = Math.cos(a) * s * 0.46
        const dy = Math.sin(a) * s * 0.46
        r.line(x - dx, y - dy, x + dx, y + dy, s * 0.08, style)
      }
      r.circle(x, y, s * 0.1, { fill: PALETTE.frost, alpha })
      return
    }
    case 'crampons': {
      const fill = { fill: PALETTE.crampons, alpha }
      r.roundRect(x - s * 0.42, y - s * 0.16, s * 0.84, s * 0.22, s * 0.1, fill)
      r.roundRect(x - s * 0.42, y - s * 0.42, s * 0.3, s * 0.3, s * 0.08, fill)
      for (let i = 0; i < 4; i++) {
        const sx = x - s * 0.32 + i * s * 0.21
        r.polygon([sx - s * 0.07, y + s * 0.06, sx + s * 0.07, y + s * 0.06, sx, y + s * 0.38], fill)
      }
      return
    }
    case 'rod': {
      r.line(x - s * 0.08, y - s * 0.48, x - s * 0.08, y + s * 0.46, s * 0.09, { stroke: PALETTE.stoneLight, alpha })
      r.circle(x - s * 0.08, y - s * 0.48, s * 0.08, { fill: PALETTE.stoneLight, alpha })
      r.polygon(
        [x + s * 0.12, y - s * 0.4, x + s * 0.42, y - s * 0.4, x + s * 0.24, y - s * 0.06, x + s * 0.44, y - s * 0.06, x + s * 0.08, y + s * 0.42, x + s * 0.2, y + s * 0.04, x + s * 0.02, y + s * 0.04],
        { fill: PALETTE.rod, alpha },
      )
      return
    }
    case 'fins': {
      const fill = { fill: PALETTE.fins, alpha }
      r.polygon([x - s * 0.06, y - s * 0.42, x + s * 0.12, y - s * 0.42, x + s * 0.46, y + s * 0.38, x - s * 0.46, y + s * 0.38], fill)
      r.roundRect(x - s * 0.12, y - s * 0.5, s * 0.3, s * 0.2, s * 0.08, { fill: PALETTE.kelpDark, alpha })
      r.line(x - s * 0.18, y + s * 0.1, x - s * 0.28, y + s * 0.34, s * 0.05, { stroke: PALETTE.night, alpha: alpha * 0.5 })
      r.line(x + s * 0.12, y + s * 0.1, x + s * 0.22, y + s * 0.34, s * 0.05, { stroke: PALETTE.night, alpha: alpha * 0.5 })
      return
    }
    case 'lantern': {
      r.arc(x, y - s * 0.38, s * 0.16, Math.PI, Math.PI * 2, s * 0.07, { stroke: PALETTE.stoneLight, alpha })
      r.roundRect(x - s * 0.26, y - s * 0.3, s * 0.52, s * 0.08, s * 0.03, { fill: PALETTE.stoneLight, alpha })
      r.roundRect(x - s * 0.22, y - s * 0.22, s * 0.44, s * 0.52, s * 0.1, {
        fill: PALETTE.lantern,
        alpha,
        glow: PALETTE.lantern,
        glowSize: s * 0.5,
      })
      r.circle(x, y + s * 0.04, s * 0.1, { fill: PALETTE.lightCore, alpha })
      r.roundRect(x - s * 0.26, y + s * 0.3, s * 0.52, s * 0.08, s * 0.03, { fill: PALETTE.stoneLight, alpha })
      return
    }
  }
}

export const drawShell = (r: IRenderer, x: number, y: number, size: number, alpha = 1): void => {
  const s = size
  const fan: number[] = []
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI
    const bump = i % 2 === 0 ? 1 : 0.92
    fan.push(x + Math.cos(a) * s * 0.5 * bump, y + s * 0.18 + Math.sin(a) * s * 0.5 * bump)
  }
  fan.push(x + s * 0.12, y + s * 0.3, x - s * 0.12, y + s * 0.3)
  r.polygon(fan, { fill: PALETTE.shell, alpha })
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI
    r.line(x, y + s * 0.26, x + Math.cos(a) * s * 0.44, y + s * 0.18 + Math.sin(a) * s * 0.44, s * 0.05, {
      stroke: PALETTE.shellShade,
      alpha,
    })
  }
  r.roundRect(x - s * 0.16, y + s * 0.22, s * 0.32, s * 0.12, s * 0.05, { fill: PALETTE.shellShade, alpha })
  r.arc(x, y + s * 0.18, s * 0.5, Math.PI * 1.08, Math.PI * 1.92, s * 0.05, { stroke: PALETTE.shellLip, alpha })
  drawPearl(r, x + s * 0.2, y - s * 0.12, s * 0.28, alpha)
}

export const powerColor = (kind: PickupKind): string => {
  if (kind === 'pearl') return PALETTE.pearl
  if (kind === 'key') return PALETTE.key
  if (kind === 'shell') return PALETTE.shell
  return POWER_UPS[kind].color
}

export const drawUpgradeIcon = (r: IRenderer, id: UpgradeId, x: number, y: number, size: number): void => {
  const s = size
  switch (id) {
    case 'caliber':
      r.roundRect(x - s * 0.16, y - s * 0.42, s * 0.32, s * 0.84, s * 0.16, { fill: PALETTE.flare })
      r.rect(x - s * 0.16, y + s * 0.08, s * 0.32, s * 0.34, { fill: PALETTE.coatShade })
      r.rect(x - s * 0.2, y + s * 0.06, s * 0.4, s * 0.06, { fill: PALETTE.flareCore })
      return
    case 'trigger':
      r.roundRect(x - s * 0.45, y - s * 0.28, s * 0.85, s * 0.24, s * 0.06, { fill: PALETTE.pistol })
      r.roundRect(x - s * 0.42, y - s * 0.1, s * 0.26, s * 0.52, s * 0.08, { fill: PALETTE.plank })
      r.arc(x - s * 0.02, y + s * 0.02, s * 0.14, 0, Math.PI, s * 0.06, { stroke: PALETTE.ink })
      r.line(x - s * 0.02, y - s * 0.04, x + s * 0.02, y + s * 0.1, s * 0.07, { stroke: PALETTE.accent })
      return
    case 'drum':
      r.circle(x, y, s * 0.44, { fill: PALETTE.pistol })
      r.circle(x, y, s * 0.1, { fill: PALETTE.stoneDark })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        r.circle(x + Math.cos(a) * s * 0.26, y + Math.sin(a) * s * 0.26, s * 0.09, { fill: PALETTE.flare })
      }
      return
    case 'heart':
      drawHeart(r, x, y, s * 0.9, PALETTE.heart)
      return
    case 'boots':
      r.polygon(
        [x - s * 0.3, y - s * 0.45, x + s * 0.05, y - s * 0.45, x + s * 0.05, y + s * 0.1, x + s * 0.45, y + s * 0.18, x + s * 0.45, y + s * 0.4, x - s * 0.3, y + s * 0.4],
        { fill: PALETTE.coat },
      )
      r.rect(x - s * 0.3, y + s * 0.3, s * 0.75, s * 0.1, { fill: PALETTE.boots })
      return
    case 'pump':
      r.polygon([x, y - s * 0.48, x + s * 0.3, y, x - s * 0.3, y], { fill: PALETTE.water })
      r.circle(x, y + s * 0.08, s * 0.3, { fill: PALETTE.water })
      r.line(x, y - s * 0.1, x, y + s * 0.24, s * 0.08, { stroke: PALETTE.waterFoam })
      r.polygon([x - s * 0.14, y + s * 0.12, x + s * 0.14, y + s * 0.12, x, y + s * 0.3], {
        fill: PALETTE.waterFoam,
      })
      return
    case 'lungs':
      r.roundRect(x - s * 0.34, y - s * 0.36, s * 0.34, s * 0.82, s * 0.16, { fill: PALETTE.shield })
      r.rect(x - s * 0.34, y - s * 0.1, s * 0.34, s * 0.08, { fill: PALETTE.night, alpha: 0.5 })
      r.rect(x - s * 0.24, y - s * 0.48, s * 0.14, s * 0.14, { fill: PALETTE.pistol })
      r.circle(x + s * 0.22, y + s * 0.1, s * 0.1, { stroke: PALETTE.waterFoam, lineWidth: 1.5 })
      r.circle(x + s * 0.3, y - s * 0.16, s * 0.08, { stroke: PALETTE.waterFoam, lineWidth: 1.5 })
      r.circle(x + s * 0.2, y - s * 0.38, s * 0.06, { stroke: PALETTE.waterFoam, lineWidth: 1.5 })
      return
    case 'magnet':
      r.arc(x, y - s * 0.02, s * 0.3, Math.PI, Math.PI * 2, s * 0.2, { stroke: PALETTE.danger })
      r.rect(x - s * 0.4, y - s * 0.04, s * 0.2, s * 0.32, { fill: PALETTE.danger })
      r.rect(x + s * 0.2, y - s * 0.04, s * 0.2, s * 0.32, { fill: PALETTE.danger })
      r.rect(x - s * 0.4, y + s * 0.2, s * 0.2, s * 0.12, { fill: PALETTE.ink })
      r.rect(x + s * 0.2, y + s * 0.2, s * 0.2, s * 0.12, { fill: PALETTE.ink })
      return
    case 'volley':
      for (const offset of [-0.3, 0, 0.3]) {
        const cy = y + offset * s
        r.line(x - s * 0.46, cy, x + s * 0.1, cy, s * 0.08, { stroke: PALETTE.flare, alpha: 0.6 })
        r.circle(x + s * 0.22, cy, s * 0.12, { fill: PALETTE.flare })
        r.circle(x + s * 0.22, cy, s * 0.05, { fill: PALETTE.flareCore })
      }
      return
  }
}

export const drawPerkIcon = (r: IRenderer, id: PerkId, x: number, y: number, size: number): void => {
  const s = size
  switch (id) {
    case 'treasure':
      drawPearl(r, x - s * 0.05, y + s * 0.06, s * 0.72)
      r.line(x + s * 0.22, y - s * 0.42, x + s * 0.22, y - s * 0.14, s * 0.06, { stroke: '#ffffff' })
      r.line(x + s * 0.08, y - s * 0.28, x + s * 0.36, y - s * 0.28, s * 0.06, { stroke: '#ffffff' })
      return
    case 'kit':
      r.arc(x, y - s * 0.2, s * 0.14, Math.PI, Math.PI * 2, s * 0.07, { stroke: PALETTE.plankDark })
      r.roundRect(x - s * 0.42, y - s * 0.2, s * 0.84, s * 0.58, s * 0.08, { fill: PALETTE.plank })
      r.rect(x - s * 0.42, y - s * 0.02, s * 0.84, s * 0.06, { fill: PALETTE.plankDark })
      r.circle(x, y + s * 0.14, s * 0.1, { fill: PALETTE.accent })
      return
    case 'spareHeart':
      drawHeart(r, x - s * 0.06, y + s * 0.04, s * 0.78, PALETTE.heart)
      r.line(x + s * 0.3, y - s * 0.44, x + s * 0.3, y - s * 0.18, s * 0.09, { stroke: PALETTE.good })
      r.line(x + s * 0.17, y - s * 0.31, x + s * 0.43, y - s * 0.31, s * 0.09, { stroke: PALETTE.good })
      return
    case 'discount':
      r.circle(x - s * 0.2, y - s * 0.2, s * 0.12, { stroke: PALETTE.accent, lineWidth: s * 0.07 })
      r.circle(x + s * 0.2, y + s * 0.2, s * 0.12, { stroke: PALETTE.accent, lineWidth: s * 0.07 })
      r.line(x + s * 0.3, y - s * 0.34, x - s * 0.3, y + s * 0.34, s * 0.08, { stroke: PALETTE.accent })
      return
    case 'elevator':
      r.roundRect(x - s * 0.3, y - s * 0.44, s * 0.6, s * 0.88, s * 0.08, { stroke: PALETTE.ink, lineWidth: s * 0.06 })
      r.polygon([x, y - s * 0.28, x + s * 0.18, y - s * 0.02, x - s * 0.18, y - s * 0.02], { fill: PALETTE.good })
      r.rect(x - s * 0.06, y - s * 0.04, s * 0.12, s * 0.3, { fill: PALETTE.good })
      return
    case 'secondWind':
      r.arc(x - s * 0.34, y - s * 0.04, s * 0.2, Math.PI * 0.6, Math.PI * 1.5, s * 0.07, { stroke: '#ffffff' })
      r.arc(x + s * 0.34, y - s * 0.04, s * 0.2, -Math.PI * 0.5, Math.PI * 0.4, s * 0.07, { stroke: '#ffffff' })
      drawHeart(r, x, y + s * 0.04, s * 0.62, PALETTE.heart)
      return
    case 'keyMagnet':
      r.arc(x, y - s * 0.12, s * 0.26, Math.PI, Math.PI * 2, s * 0.14, { stroke: PALETTE.danger })
      drawKey(r, x, y + s * 0.24, s * 0.7, false)
      return
    case 'tide':
      r.polygon([x - s * 0.08, y - s * 0.46, x + s * 0.18, y - s * 0.02, x - s * 0.34, y - s * 0.02], { fill: PALETTE.water })
      r.circle(x - s * 0.08, y + s * 0.08, s * 0.27, { fill: PALETTE.water })
      r.circle(x + s * 0.24, y + s * 0.22, s * 0.18, { fill: PALETTE.night })
      r.ring(x + s * 0.24, y + s * 0.22, s * 0.18, s * 0.05, { stroke: PALETTE.hourglass })
      r.line(x + s * 0.24, y + s * 0.22, x + s * 0.24, y + s * 0.12, s * 0.04, { stroke: PALETTE.hourglass })
      return
    case 'longPowers':
      r.ring(x, y, s * 0.42, s * 0.06, { stroke: PALETTE.accent })
      drawPowerGlyph(r, 'hourglass', x, y, s * 0.72)
      return
    case 'lucky':
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        r.circle(x + dx * s * 0.14, y + dy * s * 0.14 - s * 0.06, s * 0.17, { fill: PALETTE.good })
      }
      r.line(x, y + s * 0.1, x + s * 0.12, y + s * 0.44, s * 0.06, { stroke: PALETTE.good })
      return
  }
}
