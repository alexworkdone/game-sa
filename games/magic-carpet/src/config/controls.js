export const BINDINGS = {
  forward: ['KeyW'],
  back: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  up: ['KeyE'],
  down: ['KeyQ'],
  castLeft: ['Space', 'Mouse0'],
  castRight: ['ShiftRight', 'Mouse2'],
  spell1: ['Digit1', 'Numpad1'],
  spell2: ['Digit2', 'Numpad2'],
  spell3: ['Digit3', 'Numpad3'],
  spell4: ['Digit4', 'Numpad4'],
  pause: ['Escape', 'KeyP'],
  timeWarp: ['KeyT'],
  stats: ['F3'],
}

export const KEYS = {
  doubleTap: 0.32,
}

export const AIM = {
  deadZone: 0.08,
  turnRate: 1.9,
  curve: 1.5,
  pitchFollow: 5,
}

export const capturedCodes = () =>
  Object.entries(BINDINGS)
    .filter(([action]) => action !== 'pause')
    .flatMap(([, codes]) => codes)
    .filter((code) => !code.startsWith('Mouse'))

export const TOUCH = {
  stickRadius: 60,
  aimGain: 1.8,
  aimReturn: 9,
}

export const prefersTouch = () =>
  new URLSearchParams(location.search).has('touch') ||
  window.matchMedia('(pointer: coarse)').matches ||
  navigator.maxTouchPoints > 0
