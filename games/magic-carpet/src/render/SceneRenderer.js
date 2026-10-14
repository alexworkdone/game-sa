import { PolygonBatch } from './PolygonBatch.js'
import { Projector } from './Projector.js'

export class SceneRenderer {
  #layers
  #shader
  #config
  #projector = new Projector()
  #batch
  #scene

  constructor({ layers, shader, colors, config }) {
    this.#layers = layers
    this.#shader = shader
    this.#config = config
    this.#batch = new PolygonBatch(colors)
    this.#scene = {
      projector: this.#projector,
      batch: this.#batch,
      shader,
      camera: null,
      time: 0,
      radius: config.radius,
      lateralLimit: 1,
    }
  }

  render(context, camera, frame, time) {
    const projector = this.#projector
    projector.setup(camera, frame.focal, frame.extentX, frame.extentY, this.#config.nearPlane)
    this.#shader.prepare(camera)
    this.#batch.reset()
    const scene = this.#scene
    scene.camera = camera
    scene.time = time
    scene.lateralLimit = (frame.extentX / frame.focal) * 1.05
    for (const layer of this.#layers) layer.collect(scene)
    this.#batch.draw(context, frame.lineWidth)
    return this.#batch.count
  }
}
