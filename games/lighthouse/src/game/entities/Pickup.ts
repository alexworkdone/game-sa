import type { PowerUpKind } from '../level/LevelBlueprint.js'

export type PickupKind = 'pearl' | 'key' | 'shell' | PowerUpKind

export const isPowerUpKind = (kind: PickupKind): kind is PowerUpKind =>
  kind !== 'pearl' && kind !== 'key' && kind !== 'shell'

export class Pickup {
  readonly kind: PickupKind
  readonly value: number

  x: number
  y: number
  vx = 0
  vy = 0
  resting: boolean
  alive = true
  age: number
  pulled = false

  constructor(kind: PickupKind, x: number, y: number, value = 1, resting = true) {
    this.kind = kind
    this.x = x
    this.y = y
    this.value = value
    this.resting = resting
    this.age = Math.random() * 10
  }

  get isPowerUp(): boolean {
    return isPowerUpKind(this.kind)
  }
}
