const f = (value) => value.toFixed(1)
const point = ([x, y]) => `${f(x)} ${f(y)}`

export const VIEW = { width: 300, height: 540 }
export const ORB = [154, 252]
export const HAND_TILT = 30
export const HAND_LEAN = 52
export const LAUNCH = [10, -260]

export const SLEEVE = {
  body: 'M92 352 C84 410 64 470 30 540 L276 540 C246 470 224 410 214 352 A61 15 0 0 0 92 352 Z',
  folds: [
    'M104 378 C96 420 84 466 66 512',
    'M134 380 C130 424 126 470 120 520',
    'M174 380 C178 424 184 470 192 520',
    'M202 378 C210 420 222 466 240 512',
  ],
  shine: 'M146 382 C146 428 148 474 150 530',
  opening: { cx: 153, cy: 352, rx: 61, ry: 15 },
}

export const WRIST = 'M119 358 C118 340 118 322 119 304 L186 306 C186 322 187 340 189 358 Z'

export const BRACELET = {
  band: 'M117 334 C137 346 170 346 191 332 L189 316 C168 330 136 330 118 318 Z',
  shine: 'M123 326 C142 336 166 336 184 326',
  gem: [153, 339],
}

export const BACK = 'M120 332 C116 318 112 300 107 284 C101 262 100 238 101 216 C122 197 171 192 203 204 C208 230 205 260 196 286 C191 300 189 316 188 332 Z'

export const TENDONS = [
  'M150 306 C143 276 135 244 129 214',
  'M153 306 C154 274 155 242 155 208',
  'M157 306 C165 276 173 244 180 212',
]

export const FINGERS = [
  { base: [111, 215], tip: [98, 150], baseWidth: 17, tipWidth: 13.5 },
  { base: [132, 206], tip: [125, 124], baseWidth: 19, tipWidth: 15.5 },
  { base: [155, 202], tip: [158, 112], baseWidth: 20, tipWidth: 16.5 },
  { base: [179, 206], tip: [193, 128], baseWidth: 19, tipWidth: 15.5 },
]

export const THUMB = { base: [190, 274], tip: [238, 214], baseWidth: 24, tipWidth: 17 }

export const RING = { finger: 1, at: 0.22 }

const axes = ({ base, tip }) => {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const length = Math.hypot(dx, dy)
  const ux = dx / length
  const uy = dy / length
  return { ux, uy, nx: -uy, ny: ux, length }
}

const offset = ([x, y], dx, dy, k) => [x + dx * k, y + dy * k]

export const along = (digit, t) => {
  const { ux, uy, length } = axes(digit)
  return {
    center: offset(digit.base, ux, uy, length * t),
    width: digit.baseWidth + (digit.tipWidth - digit.baseWidth) * t,
    angle: (Math.atan2(uy, ux) * 180) / Math.PI + 90,
  }
}

export const digitPath = (digit, bulge = 1.6) => {
  const { ux, uy, nx, ny } = axes(digit)
  const { base, tip, baseWidth, tipWidth } = digit
  const left = offset(base, nx, ny, baseWidth / 2)
  const right = offset(base, nx, ny, -baseWidth / 2)
  const tipLeft = offset(tip, nx, ny, tipWidth / 2)
  const tipRight = offset(tip, nx, ny, -tipWidth / 2)
  const middle = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2]
  const sideLeft = offset(middle, nx, ny, (baseWidth + tipWidth) / 4 + bulge)
  const sideRight = offset(middle, nx, ny, -(baseWidth + tipWidth) / 4 - bulge)
  const cap = tipWidth * 0.72
  return [
    `M${point(left)}`,
    `Q${point(sideLeft)} ${point(tipLeft)}`,
    `C${point(offset(tipLeft, ux, uy, cap))} ${point(offset(tipRight, ux, uy, cap))} ${point(tipRight)}`,
    `Q${point(sideRight)} ${point(right)}`,
    'Z',
  ].join(' ')
}

export const knuckleWrinkles = (digit) => {
  const { ux, uy, nx, ny, length } = axes(digit)
  return [0.46, 0.5].map((t) => {
    const width = digit.baseWidth + (digit.tipWidth - digit.baseWidth) * t
    const center = offset(digit.base, ux, uy, length * t)
    const a = offset(center, nx, ny, width * 0.26)
    const b = offset(center, nx, ny, -width * 0.26)
    return `M${point(a)} Q${point(offset(center, ux, uy, -2.4))} ${point(b)}`
  })
}

export const nail = (digit) => {
  const { ux, uy, length } = axes(digit)
  const nailLength = Math.min(length * 0.3, digit.tipWidth * 1.05)
  const center = offset(digit.tip, ux, uy, digit.tipWidth * 0.32 - nailLength / 2)
  return {
    cx: center[0],
    cy: center[1],
    rx: digit.tipWidth * 0.31,
    ry: nailLength / 2,
    angle: (Math.atan2(uy, ux) * 180) / Math.PI + 90,
  }
}

export const knuckle = (digit) => ({
  cx: digit.base[0],
  cy: digit.base[1],
  rx: digit.baseWidth * 0.36,
  ry: digit.baseWidth * 0.26,
  angle: along(digit, 0).angle,
})

export const silhouette = () => [BACK, WRIST, ...FINGERS.map((digit) => digitPath(digit)), digitPath(THUMB, 2.4)]
