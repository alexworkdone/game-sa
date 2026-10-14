import { mod, wrapDelta } from '../core/math.js'

export class Camera {
  x = 0
  y = 0
  z = 0
  yaw = 0
  pitch = 0
  roll = 0
  verticalFov = 1
}

export class CameraRig {
  #rig
  #render
  #worldSize

  constructor(rig, render, worldSize) {
    this.#rig = rig
    this.#render = render
    this.#worldSize = worldSize
  }

  follow(camera, carpet, alpha) {
    const size = this.#worldSize
    camera.x = mod(carpet.previousX + wrapDelta(carpet.x - carpet.previousX, size) * alpha, size)
    camera.y = mod(carpet.previousY + wrapDelta(carpet.y - carpet.previousY, size) * alpha, size)
    camera.z = carpet.previousZ + (carpet.z - carpet.previousZ) * alpha + this.#rig.eyeHeight
    camera.yaw = carpet.yaw
    camera.pitch = carpet.pitch
    camera.roll = carpet.roll
    camera.verticalFov = this.#render.verticalFov
  }
}
