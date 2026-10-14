import type { BuildingId, DecorId } from '../content/buildings.js'

const r1 = (value: number): number => Math.round(value * 10) / 10

const flag = (x: number, y: number): string =>
  `<line class="ln" x1="${x}" y1="${y}" x2="${x}" y2="${y - 22}"/><path class="f-flag" d="M${x} ${y - 22}L${x + 16} ${y - 17}L${x} ${y - 12}Z"/>`

type BuildingArt = (level: number) => string

const countHouse: BuildingArt = (level) => {
  const h = 66 + 12 * (level - 1)
  let s = ''
  if (level >= 2) s += `<rect class="f-stone" x="20" y="${-h - 30}" width="9" height="20"/>`
  s += `<rect class="f-wall" x="-40" y="${-h}" width="80" height="${h}"/>`
  s += `<path class="f-roof" d="M-48 ${-h}L0 ${-h - 34}L48 ${-h}Z"/>`
  s += `<rect class="f-paper" x="-19" y="${-h + 8}" width="38" height="17" rx="3"/>`
  s += `<text class="svg-t" x="0" y="${-h + 20.5}">123</text>`
  s += '<path class="f-win" d="M-10 0V-24Q0 -34 10 -24V0"/>'
  s += '<rect class="f-win" x="-33" y="-36" width="15" height="14"/>'
  s += '<rect class="f-win" x="18" y="-36" width="15" height="14"/>'
  if (level >= 3) s += flag(0, -h - 34)
  return s
}

const clockTower: BuildingArt = (level) => {
  const h = 118 + 18 * (level - 1)
  const cy = -h + 26
  let s = `<rect class="f-stone" x="-24" y="${-h}" width="48" height="${h}"/>`
  s += `<path class="f-roof" d="M-30 ${-h}L0 ${-h - 42}L30 ${-h}Z"/>`
  s += `<circle class="f-paper" cx="0" cy="${cy}" r="15"/>`
  s += `<path class="ln thin" d="M0 ${cy - 15}v3M15 ${cy}h-3M0 ${cy + 15}v-3M-15 ${cy}h3"/>`
  s += `<line class="ln" x1="0" y1="${cy}" x2="0" y2="${cy - 9}"/>`
  s += `<g transform="translate(0 ${cy})"><line class="ln hand" x1="0" y1="0" x2="11" y2="0"/></g>`
  s += `<rect class="f-win" x="-5" y="${-h + 52}" width="10" height="18" rx="5"/>`
  if (level >= 2) s += `<rect class="f-win" x="-5" y="${-h + 82}" width="10" height="18" rx="5"/>`
  s += '<path class="f-win" d="M-9 0V-18Q0 -28 9 -18V0"/>'
  if (level >= 3) s += flag(0, -h - 42)
  return s
}

const library: BuildingArt = (level) => {
  const h = 62 + 8 * (level - 1)
  const columns = 3 + level
  let s = '<rect class="f-stone" x="-62" y="-8" width="124" height="8"/>'
  s += `<rect class="f-wall" x="-54" y="${-h}" width="108" height="${h - 8}"/>`
  for (let i = 0; i < columns; i++) {
    const x = -44 + (i * 88) / (columns - 1)
    s += `<rect class="f-paper" x="${r1(x - 4)}" y="${-h + 6}" width="8" height="${h - 14}"/>`
  }
  s += `<rect class="f-stone" x="-60" y="${-h - 8}" width="120" height="8"/>`
  s += `<path class="f-roof" d="M-62 ${-h - 8}L0 ${-h - 38}L62 ${-h - 8}Z"/>`
  s += `<text class="svg-t" x="0" y="${-h - 15}">АБВ</text>`
  if (level >= 3) s += flag(0, -h - 38)
  return s
}

const SAIL_SPEED: readonly number[] = [9, 9, 6, 3.5]

const windmill: BuildingArt = (level) => {
  const h = 92 + 10 * (level - 1)
  const radius = 52 + 6 * (level - 1)
  const cy = -h - 6
  let s = `<path class="f-wall" d="M-24 0L-15 ${-h}L15 ${-h}L24 0Z"/>`
  s += `<path class="f-roof" d="M-19 ${-h}Q0 ${-h - 30} 19 ${-h}Z"/>`
  s += `<rect class="f-win" x="-5" y="${-h + 24}" width="10" height="12" rx="2"/>`
  s += '<path class="f-win" d="M-8 0V-16Q0 -24 8 -16V0"/>'
  let blades = ''
  const segment = (radius - 12) / 3
  for (const angle of [0, 90, 180, 270]) {
    blades += `<g transform="rotate(${angle})"><rect class="f-paper" x="2" y="${-radius}" width="12" height="${radius - 12}"/>`
    if (level >= 2) blades += `<path class="ln thin" d="M2 ${r1(-radius + segment)}h12M2 ${r1(-radius + 2 * segment)}h12"/>`
    blades += `<line class="ln" x1="0" y1="0" x2="0" y2="${-radius}"/></g>`
  }
  s += `<g transform="translate(0 ${cy})"><g class="sails" style="animation-duration:${SAIL_SPEED[level] ?? 9}s">${blades}</g><circle class="f-roof" cx="0" cy="0" r="5"/></g>`
  if (level >= 3) s += '<rect class="f-stone" x="27" y="-15" width="16" height="15" rx="4"/><path class="ln thin" d="M30 -10h10"/>'
  return s
}

const fountain: BuildingArt = (level) => {
  let s = '<path class="f-stone" d="M-44 0L-40 -16L40 -16L44 0Z"/>'
  s += '<ellipse class="f-water" cx="0" cy="-16" rx="40" ry="5"/>'
  s += '<rect class="f-stone" x="-5" y="-40" width="10" height="24"/>'
  s += '<path class="f-stone" d="M-21 -40Q0 -26 21 -40Z"/>'
  s += '<ellipse class="f-water" cx="0" cy="-40" rx="21" ry="3.5"/>'
  let top = -40
  if (level >= 2) {
    s += '<rect class="f-stone" x="-3.5" y="-60" width="7" height="20"/><path class="f-stone" d="M-13 -60Q0 -51 13 -60Z"/><ellipse class="f-water" cx="0" cy="-60" rx="13" ry="2.5"/>'
    top = -60
  }
  s += `<path class="jet" d="M0 ${top - 2}Q-16 ${top - 28} -30 -18"/><path class="jet" d="M0 ${top - 2}Q16 ${top - 28} 30 -18"/><path class="jet" d="M0 ${top - 2}V${top - 20}"/>`
  if (level >= 3) {
    s += `<path class="jet" d="M0 ${top - 2}Q-26 ${top - 40} -40 -18"/><path class="jet" d="M0 ${top - 2}Q26 ${top - 40} 40 -18"/><circle class="f-hl" cx="0" cy="${top - 26}" r="5"/>`
  }
  return s
}

const lighthouse: BuildingArt = (level) => {
  const h = 128 + 18 * (level - 1)
  const halfWidth = (y: number): number => r1(22 - (10 * y) / h)
  const beam = 70 + 28 * (level - 1)
  let s = `<path class="beam" d="M0 ${-h - 13}L${-beam} ${-h - 40}L${-beam} ${-h + 14}Z"/>`
  s += `<path class="beam" d="M0 ${-h - 13}L56 ${-h - 30}L56 ${-h + 4}Z"/>`
  s += `<path class="f-wall" d="M-22 0L-12 ${-h}L12 ${-h}L22 0Z"/>`
  for (const [from, to] of [
    [0.2, 0.36],
    [0.56, 0.72],
  ] as const) {
    const y1 = r1(from * h)
    const y2 = r1(to * h)
    s += `<path class="f-flag" d="M${-halfWidth(y1)} ${-y1}L${halfWidth(y1)} ${-y1}L${halfWidth(y2)} ${-y2}L${-halfWidth(y2)} ${-y2}Z"/>`
  }
  s += `<rect class="f-win" x="-4" y="${r1(-0.46 * h - 6)}" width="8" height="12" rx="4"/>`
  s += '<path class="f-win" d="M-7 0V-14Q0 -21 7 -14V0"/>'
  s += `<rect class="f-stone" x="-17" y="${-h - 4}" width="34" height="5"/>`
  s += `<rect class="f-hl" x="-10" y="${-h - 22}" width="20" height="18"/>`
  s += `<path class="f-roof" d="M-14 ${-h - 22}L0 ${-h - 38}L14 ${-h - 22}Z"/>`
  if (level >= 3) s += flag(0, -h - 38)
  return s
}

export const BUILDING_ART: Readonly<Record<BuildingId, BuildingArt>> = {
  count: countHouse,
  clock: clockTower,
  library,
  mill: windmill,
  fountain,
  lighthouse,
}

export const DECOR_ART: Readonly<Record<DecorId, string>> = {
  tree: '<line class="ln" x1="0" y1="0" x2="0" y2="-18"/><circle class="f-green" cx="0" cy="-30" r="14"/><path class="ln thin" d="M-6 -30q6 -7 12 0"/>',
  house: '<rect class="f-wall" x="-14" y="-22" width="28" height="22"/><path class="f-roof" d="M-18 -22L0 -38L18 -22Z"/><rect class="f-win" x="-5" y="-15" width="10" height="9"/>',
  lamp: '<line class="ln" x1="0" y1="0" x2="0" y2="-36"/><path class="ln" d="M0 -36q9 0 9 7"/><circle class="f-hl" cx="9" cy="-25" r="4.5"/>',
}

export const sun = (x: number, y: number): string => {
  let s = '<g>'
  for (let k = 0; k < 8; k++) {
    const angle = (k * Math.PI) / 4
    s += `<line class="ln thin" x1="${r1(x + Math.cos(angle) * 26)}" y1="${r1(y + Math.sin(angle) * 26)}" x2="${r1(x + Math.cos(angle) * 33)}" y2="${r1(y + Math.sin(angle) * 33)}"/>`
  }
  return `${s}<circle class="f-hl" cx="${x}" cy="${y}" r="19"/></g>`
}

export const CLOUDS =
  '<g class="cloud"><path class="f-paper" d="M230 78a12 12 0 0 1 14 -16a16 16 0 0 1 30 -4a12 12 0 0 1 20 10a9 9 0 0 1 2 10Z"/></g>' +
  '<g class="cloud" style="animation-duration:30s"><path class="f-paper" d="M520 52a10 10 0 0 1 12 -13a14 14 0 0 1 26 -3a10 10 0 0 1 16 9a8 8 0 0 1 2 7Z"/></g>'

export const burst = (x: number, y: number, tone: 'a' | 'b' | 'c', delay: number): string => {
  let s = `<g class="fw fw-${tone}" style="animation-delay:${delay}s">`
  for (let k = 0; k < 10; k++) {
    const angle = (k * Math.PI) / 5
    s += `<line x1="${r1(x + Math.cos(angle) * 5)}" y1="${r1(y + Math.sin(angle) * 5)}" x2="${r1(x + Math.cos(angle) * 17)}" y2="${r1(y + Math.sin(angle) * 17)}"/>`
  }
  return `${s}<circle cx="${x}" cy="${y}" r="2"/></g>`
}

export const FIREWORKS =
  burst(135, 60, 'a', 0) + burst(400, 58, 'b', 0.7) + burst(596, 70, 'c', 1.4) + burst(272, 44, 'b', 2.1) + burst(520, 36, 'a', 1.05)

const GARLAND_TONES: readonly string[] = ['f-flag', 'f-hl', 'f-water']

export const garland = (): string => {
  const curve = (x: number): number => {
    const t = x / 800
    return (1 - t) * (1 - t) * 18 + 2 * t * (1 - t) * 70 + t * t * 18
  }
  let s = '<path class="ln thin" d="M0 18Q400 70 800 18"/>'
  for (let x = 30, k = 0; x < 790; x += 34, k++) {
    const tone = GARLAND_TONES[k % GARLAND_TONES.length] ?? 'f-flag'
    s += `<path class="${tone} thin" d="M${x - 7} ${r1(curve(x - 7))}L${x + 7} ${r1(curve(x + 7))}L${x} ${r1(curve(x) + 14)}Z"/>`
  }
  return s
}

export const ground = (y: number): string => {
  let s = `<path class="ln ground" d="M0 ${y}C120 ${y - 4} 240 ${y + 4} 400 ${y}S680 ${y - 4} 800 ${y + 1}"/>`
  for (let x = 14; x < 800; x += 22) s += `<line class="hatch" x1="${x}" y1="${y + 7}" x2="${x - 9}" y2="${y + 16}"/>`
  return s
}
