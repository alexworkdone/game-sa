const CAPACITY = 64

export class Projector {
  inX = new Float32Array(CAPACITY)
  inY = new Float32Array(CAPACITY)
  inZ = new Float32Array(CAPACITY)
  outX = new Float32Array(CAPACITY)
  outY = new Float32Array(CAPACITY)
  #depth = new Float32Array(CAPACITY)
  #clipX = new Float32Array(CAPACITY)
  #clipY = new Float32Array(CAPACITY)
  #clipZ = new Float32Array(CAPACITY)
  #clipD = new Float32Array(CAPACITY)
  fX = 1
  fY = 0
  rX = 0
  rY = 1
  camZ = 0
  focal = 1
  horizon = 0
  extentX = 0
  extentY = 0
  near = 0.5
  px = 0
  py = 0
  pd = 0

  setup(camera, focal, extentX, extentY, near) {
    this.fX = Math.cos(camera.yaw)
    this.fY = Math.sin(camera.yaw)
    this.rX = -this.fY
    this.rY = this.fX
    this.camZ = camera.z
    this.focal = focal
    this.horizon = Math.tan(camera.pitch) * focal
    this.extentX = extentX
    this.extentY = extentY
    this.near = near
  }

  point(dx, dy, z) {
    const depth = dx * this.fX + dy * this.fY
    if (depth < this.near) return false
    const scale = this.focal / depth
    this.px = (dx * this.rX + dy * this.rY) * scale
    this.py = this.horizon - (z - this.camZ) * scale
    this.pd = depth
    return true
  }

  polygon(count) {
    const { inX, inY, inZ, outX, outY, fX, fY, near } = this
    const depth = this.#depth
    let behind = false
    for (let k = 0; k < count; k++) {
      depth[k] = inX[k] * fX + inY[k] * fY
      if (depth[k] < near) behind = true
    }

    let xs = inX
    let ys = inY
    let zs = inZ
    let ds = depth
    let n = count
    if (behind) {
      const cx = this.#clipX
      const cy = this.#clipY
      const cz = this.#clipZ
      const cd = this.#clipD
      n = 0
      for (let k = 0; k < count; k++) {
        const next = k + 1 === count ? 0 : k + 1
        const inside = depth[k] >= near
        if (inside) {
          cx[n] = inX[k]
          cy[n] = inY[k]
          cz[n] = inZ[k]
          cd[n] = depth[k]
          n++
        }
        if (inside !== depth[next] >= near) {
          const t = (near - depth[k]) / (depth[next] - depth[k])
          cx[n] = inX[k] + (inX[next] - inX[k]) * t
          cy[n] = inY[k] + (inY[next] - inY[k]) * t
          cz[n] = inZ[k] + (inZ[next] - inZ[k]) * t
          cd[n] = near
          n++
        }
      }
      if (n < 3) return 0
      xs = cx
      ys = cy
      zs = cz
      ds = cd
    }

    const { rX, rY, focal, horizon, camZ, extentX, extentY } = this
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let k = 0; k < n; k++) {
      const scale = focal / ds[k]
      const sx = (xs[k] * rX + ys[k] * rY) * scale
      const sy = horizon - (zs[k] - camZ) * scale
      outX[k] = sx
      outY[k] = sy
      if (sx < minX) minX = sx
      if (sx > maxX) maxX = sx
      if (sy < minY) minY = sy
      if (sy > maxY) maxY = sy
    }
    if (maxX < -extentX || minX > extentX || maxY < -extentY || minY > extentY) return 0
    return n
  }
}
