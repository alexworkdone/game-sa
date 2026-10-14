export class Carpet {
  constructor({ x, y, z, yaw = 0, pitch = 0 }) {
    this.x = x
    this.y = y
    this.z = z
    this.previousX = x
    this.previousY = y
    this.previousZ = z
    this.vx = 0
    this.vy = 0
    this.vz = 0
    this.yaw = yaw
    this.pitch = pitch
    this.roll = 0
    this.turnRate = 0
  }

  remember() {
    this.previousX = this.x
    this.previousY = this.y
    this.previousZ = this.z
  }
}
