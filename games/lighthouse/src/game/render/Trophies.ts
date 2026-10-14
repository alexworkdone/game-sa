import type { IRenderer } from '@sa/core'
import type { TrophyGrade, TrophyKind } from '../config/achievements.js'
import { PALETTE } from '../config/palette.js'

interface Metal {
  readonly main: string
  readonly shade: string
  readonly light: string
}

const METALS: Readonly<Record<TrophyGrade, Metal>> = {
  bronze: { main: '#cd8a4f', shade: '#8a5a2c', light: '#f0b884' },
  silver: { main: '#cfd8e6', shade: '#8b96aa', light: '#ffffff' },
  gold: { main: '#ffcf4a', shade: '#c8901c', light: '#fff3b8' },
  crystal: { main: '#9fe6ff', shade: '#4fa3c8', light: '#eafcff' },
}

const SHADOW: Metal = { main: '#222b45', shade: '#171e33', light: '#2c3756' }
const WOOD = '#7a5534'
const WOOD_DARK = '#4a321e'

export const gradeColor = (grade: TrophyGrade): string => METALS[grade].main

const star = (r: IRenderer, x: number, y: number, outer: number, inner: number, fill: string): void => {
  const points: number[] = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? outer : inner
    points.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
  }
  r.polygon(points, { fill })
}

export const drawTrophy = (
  r: IRenderer,
  kind: TrophyKind,
  grade: TrophyGrade,
  x: number,
  y: number,
  size: number,
  locked: boolean,
): void => {
  const m = locked ? SHADOW : METALS[grade]
  const s = size
  const wood = locked ? SHADOW.shade : WOOD
  const woodDark = locked ? SHADOW.shade : WOOD_DARK
  if (!locked && grade === 'crystal') r.circle(x, y, s * 0.5, { fill: m.main, alpha: 0.12, glow: m.main, glowSize: 16 })
  switch (kind) {
    case 'cup':
      r.arc(x - s * 0.3, y - s * 0.22, s * 0.12, Math.PI * 0.5, Math.PI * 1.5, s * 0.06, { stroke: m.shade })
      r.arc(x + s * 0.3, y - s * 0.22, s * 0.12, -Math.PI * 0.5, Math.PI * 0.5, s * 0.06, { stroke: m.shade })
      r.polygon([x - s * 0.32, y - s * 0.4, x + s * 0.32, y - s * 0.4, x + s * 0.2, y - s * 0.02, x - s * 0.2, y - s * 0.02], { fill: m.main })
      r.rect(x - s * 0.32, y - s * 0.42, s * 0.64, s * 0.06, { fill: m.light })
      r.rect(x - s * 0.05, y - s * 0.03, s * 0.1, s * 0.18, { fill: m.shade })
      r.roundRect(x - s * 0.2, y + s * 0.14, s * 0.4, s * 0.08, s * 0.03, { fill: m.main })
      r.roundRect(x - s * 0.27, y + s * 0.22, s * 0.54, s * 0.12, s * 0.03, { fill: woodDark })
      if (!locked) r.line(x - s * 0.2, y - s * 0.32, x - s * 0.12, y - s * 0.1, s * 0.04, { stroke: m.light, alpha: 0.8 })
      return
    case 'medal':
      r.polygon([x - s * 0.28, y - s * 0.48, x - s * 0.1, y - s * 0.48, x + s * 0.06, y - s * 0.08, x - s * 0.1, y - s * 0.06], {
        fill: locked ? SHADOW.light : PALETTE.danger,
      })
      r.polygon([x + s * 0.28, y - s * 0.48, x + s * 0.1, y - s * 0.48, x - s * 0.06, y - s * 0.08, x + s * 0.1, y - s * 0.06], {
        fill: locked ? SHADOW.light : '#3b6fd8',
      })
      r.circle(x, y + s * 0.12, s * 0.27, { fill: m.main })
      r.ring(x, y + s * 0.12, s * 0.27, s * 0.05, { stroke: m.shade })
      star(r, x, y + s * 0.12, s * 0.15, s * 0.07, m.light)
      return
    case 'plaque':
      r.roundRect(x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.64, s * 0.08, { fill: wood })
      r.roundRect(x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.64, s * 0.08, { stroke: woodDark, lineWidth: s * 0.04 })
      r.roundRect(x - s * 0.28, y - s * 0.15, s * 0.56, s * 0.3, s * 0.04, { fill: m.main })
      r.line(x - s * 0.18, y - s * 0.04, x + s * 0.18, y - s * 0.04, s * 0.035, { stroke: m.shade })
      r.line(x - s * 0.12, y + s * 0.05, x + s * 0.12, y + s * 0.05, s * 0.035, { stroke: m.shade })
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        r.circle(x + dx * s * 0.34, y + dy * s * 0.24, s * 0.03, { fill: m.light })
      }
      return
    case 'star':
      star(r, x, y, s * 0.46, s * 0.2, m.shade)
      star(r, x, y - s * 0.02, s * 0.4, s * 0.17, m.main)
      star(r, x, y - s * 0.02, s * 0.16, s * 0.07, m.light)
      return
    case 'shell': {
      const points: number[] = [x, y + s * 0.34]
      for (let i = 0; i <= 12; i++) {
        const angle = Math.PI + (i / 12) * Math.PI
        const bump = i % 2 === 0 ? 0.42 : 0.38
        points.push(x + Math.cos(angle) * s * bump, y + s * 0.06 + Math.sin(angle) * s * bump)
      }
      r.polygon(points, { fill: m.main })
      for (let i = 1; i < 6; i++) {
        const angle = Math.PI + (i / 6) * Math.PI
        r.line(x, y + s * 0.3, x + Math.cos(angle) * s * 0.36, y + s * 0.06 + Math.sin(angle) * s * 0.36, s * 0.03, { stroke: m.shade })
      }
      r.roundRect(x - s * 0.12, y + s * 0.28, s * 0.24, s * 0.1, s * 0.03, { fill: m.shade })
      return
    }
    case 'chest':
      r.roundRect(x - s * 0.38, y - s * 0.32, s * 0.76, s * 0.3, s * 0.14, { fill: wood })
      r.rect(x - s * 0.38, y - s * 0.06, s * 0.76, s * 0.38, { fill: wood })
      r.rect(x - s * 0.38, y - s * 0.06, s * 0.76, s * 0.05, { fill: woodDark })
      r.rect(x - s * 0.26, y - s * 0.32, s * 0.07, s * 0.64, { fill: m.main })
      r.rect(x + s * 0.19, y - s * 0.32, s * 0.07, s * 0.64, { fill: m.main })
      r.roundRect(x - s * 0.08, y - s * 0.1, s * 0.16, s * 0.18, s * 0.03, { fill: m.main })
      r.circle(x, y - s * 0.02, s * 0.03, { fill: woodDark })
      if (!locked) {
        r.circle(x - s * 0.12, y - s * 0.36, s * 0.07, { fill: PALETTE.pearl })
        r.circle(x + s * 0.06, y - s * 0.38, s * 0.06, { fill: PALETTE.pearl })
      }
      return
    case 'anchor':
      r.ring(x, y - s * 0.36, s * 0.08, s * 0.05, { stroke: m.main })
      r.rect(x - s * 0.04, y - s * 0.28, s * 0.08, s * 0.6, { fill: m.main })
      r.rect(x - s * 0.2, y - s * 0.22, s * 0.4, s * 0.07, { fill: m.shade })
      r.arc(x, y + s * 0.04, s * 0.3, Math.PI * 0.12, Math.PI * 0.88, s * 0.08, { stroke: m.main })
      r.polygon([x + s * 0.34, y + s * 0.02, x + s * 0.22, y + s * 0.08, x + s * 0.34, y + s * 0.18], { fill: m.main })
      r.polygon([x - s * 0.34, y + s * 0.02, x - s * 0.22, y + s * 0.08, x - s * 0.34, y + s * 0.18], { fill: m.main })
      return
    case 'key':
      r.push()
      r.translate(x, y)
      r.rotate(-0.6)
      r.ring(-s * 0.24, 0, s * 0.15, s * 0.07, { stroke: m.main })
      r.circle(-s * 0.24, 0, s * 0.05, { fill: m.light })
      r.rect(-s * 0.1, -s * 0.05, s * 0.52, s * 0.1, { fill: m.main })
      r.rect(s * 0.26, s * 0.05, s * 0.07, s * 0.14, { fill: m.main })
      r.rect(s * 0.36, s * 0.05, s * 0.07, s * 0.1, { fill: m.shade })
      r.pop()
      return
    case 'crown':
      r.polygon(
        [x - s * 0.38, y + s * 0.22, x + s * 0.38, y + s * 0.22, x + s * 0.38, y - s * 0.2, x + s * 0.19, y, x, y - s * 0.32, x - s * 0.19, y, x - s * 0.38, y - s * 0.2],
        { fill: m.main },
      )
      r.rect(x - s * 0.38, y + s * 0.12, s * 0.76, s * 0.1, { fill: m.shade })
      if (!locked) {
        r.circle(x, y + s * 0.02, s * 0.06, { fill: PALETTE.danger })
        r.circle(x - s * 0.22, y + s * 0.06, s * 0.045, { fill: '#3b6fd8' })
        r.circle(x + s * 0.22, y + s * 0.06, s * 0.045, { fill: PALETTE.good })
      }
      for (const dx of [-0.38, 0, 0.38]) r.circle(x + dx * s, y + (dx === 0 ? -0.32 : -0.2) * s, s * 0.05, { fill: m.light })
      return
    case 'gear':
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        r.line(x, y, x + Math.cos(angle) * s * 0.42, y + Math.sin(angle) * s * 0.42, s * 0.14, { stroke: m.shade })
      }
      r.circle(x, y, s * 0.3, { fill: m.main })
      r.circle(x, y, s * 0.12, { fill: locked ? SHADOW.shade : PALETTE.night })
      return
    case 'lantern':
      r.arc(x, y - s * 0.36, s * 0.1, Math.PI, Math.PI * 2, s * 0.04, { stroke: m.shade })
      r.polygon([x - s * 0.2, y - s * 0.26, x + s * 0.2, y - s * 0.26, x + s * 0.12, y - s * 0.36, x - s * 0.12, y - s * 0.36], { fill: m.main })
      r.roundRect(x - s * 0.18, y - s * 0.26, s * 0.36, s * 0.46, s * 0.06, {
        fill: locked ? SHADOW.light : PALETTE.light,
        alpha: locked ? 1 : 0.9,
        ...(locked ? {} : { glow: PALETTE.light, glowSize: 14 }),
      })
      r.line(x, y - s * 0.26, x, y + s * 0.2, s * 0.03, { stroke: m.shade })
      r.roundRect(x - s * 0.22, y + s * 0.2, s * 0.44, s * 0.1, s * 0.03, { fill: m.main })
      return
    case 'compass':
      r.circle(x, y, s * 0.4, { fill: m.main })
      r.circle(x, y, s * 0.31, { fill: locked ? SHADOW.shade : '#f2ead8' })
      r.polygon([x, y - s * 0.26, x + s * 0.07, y, x - s * 0.07, y], { fill: locked ? SHADOW.light : PALETTE.danger })
      r.polygon([x, y + s * 0.26, x + s * 0.07, y, x - s * 0.07, y], { fill: locked ? SHADOW.main : PALETTE.pistol })
      r.circle(x, y, s * 0.04, { fill: m.shade })
      return
    case 'heart': {
      const color = locked ? SHADOW.main : PALETTE.heart
      r.circle(x - s * 0.15, y - s * 0.1, s * 0.2, { fill: color })
      r.circle(x + s * 0.15, y - s * 0.1, s * 0.2, { fill: color })
      r.polygon([x - s * 0.34, y - s * 0.02, x + s * 0.34, y - s * 0.02, x, y + s * 0.36], { fill: color })
      r.ring(x, y, s * 0.46, s * 0.05, { stroke: m.main })
      return
    }
    case 'bell':
      r.ring(x, y - s * 0.38, s * 0.07, s * 0.04, { stroke: m.shade })
      r.polygon(
        [x - s * 0.12, y - s * 0.32, x + s * 0.12, y - s * 0.32, x + s * 0.2, y - s * 0.12, x + s * 0.34, y + s * 0.2, x - s * 0.34, y + s * 0.2, x - s * 0.2, y - s * 0.12],
        { fill: m.main },
      )
      r.rect(x - s * 0.36, y + s * 0.18, s * 0.72, s * 0.07, { fill: m.shade })
      r.circle(x, y + s * 0.3, s * 0.07, { fill: m.shade })
      if (!locked) r.line(x - s * 0.12, y - s * 0.2, x - s * 0.2, y + s * 0.12, s * 0.04, { stroke: m.light, alpha: 0.7 })
      return
    case 'helmet':
      r.roundRect(x - s * 0.3, y + s * 0.2, s * 0.6, s * 0.14, s * 0.04, { fill: m.shade })
      r.circle(x, y - s * 0.02, s * 0.36, { fill: m.main })
      r.circle(x, y - s * 0.02, s * 0.17, { fill: locked ? SHADOW.shade : '#1a3a52' })
      r.ring(x, y - s * 0.02, s * 0.17, s * 0.04, { stroke: m.shade })
      for (const angle of [0.3, 1.3, 2.4, 3.6, 4.7, 5.6]) {
        r.circle(x + Math.cos(angle) * s * 0.28, y - s * 0.02 + Math.sin(angle) * s * 0.28, s * 0.03, { fill: m.light })
      }
      return
    case 'ribbon':
      r.polygon([x - s * 0.16, y + s * 0.1, x - s * 0.02, y + s * 0.1, x - s * 0.12, y + s * 0.46, x - s * 0.22, y + s * 0.38], {
        fill: locked ? SHADOW.light : PALETTE.danger,
      })
      r.polygon([x + s * 0.16, y + s * 0.1, x + s * 0.02, y + s * 0.1, x + s * 0.12, y + s * 0.46, x + s * 0.22, y + s * 0.38], {
        fill: locked ? SHADOW.light : PALETTE.danger,
      })
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2
        r.circle(x + Math.cos(angle) * s * 0.24, y - s * 0.08 + Math.sin(angle) * s * 0.24, s * 0.1, { fill: m.shade })
      }
      r.circle(x, y - s * 0.08, s * 0.22, { fill: m.main })
      r.circle(x, y - s * 0.08, s * 0.1, { fill: m.light })
      return
    case 'wheel':
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const ex = x + Math.cos(angle) * s * 0.44
        const ey = y + Math.sin(angle) * s * 0.44
        r.line(x, y, ex, ey, s * 0.05, { stroke: wood })
        r.circle(ex, ey, s * 0.05, { fill: wood })
      }
      r.ring(x, y, s * 0.3, s * 0.08, { stroke: m.main })
      r.circle(x, y, s * 0.1, { fill: m.shade })
      return
    case 'bubbles':
      for (const [dx, dy, radius] of [[-0.14, 0.14, 0.2], [0.18, -0.04, 0.15], [-0.04, -0.3, 0.1]] as const) {
        r.circle(x + dx * s, y + dy * s, radius * s, { fill: m.main, alpha: locked ? 1 : 0.35 })
        r.ring(x + dx * s, y + dy * s, radius * s, s * 0.04, { stroke: m.main })
        if (!locked) r.circle(x + (dx - radius * 0.35) * s, y + (dy - radius * 0.35) * s, radius * s * 0.25, { fill: m.light })
      }
      return
  }
}
