import { Terrain } from './Terrain.js'
import { WorldGenerator } from './WorldGenerator.js'

export class WorkerWorldSource {
  #config

  constructor(config) {
    this.#config = config
  }

  load(seed, onProgress) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./worldWorker.js', import.meta.url), { type: 'module' })
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          onProgress(data.progress)
          return
        }
        worker.terminate()
        resolve(new Terrain(data.world))
      }
      worker.onerror = (error) => {
        worker.terminate()
        reject(error)
      }
      worker.postMessage({ seed, config: this.#config })
    })
  }
}

export class InlineWorldSource {
  #config

  constructor(config) {
    this.#config = config
  }

  async load(seed, onProgress) {
    return new Terrain(new WorldGenerator(this.#config).generate(seed, onProgress))
  }
}

export class FallbackWorldSource {
  #primary
  #fallback

  constructor(primary, fallback) {
    this.#primary = primary
    this.#fallback = fallback
  }

  async load(seed, onProgress) {
    try {
      return await this.#primary.load(seed, onProgress)
    } catch {
      return this.#fallback.load(seed, onProgress)
    }
  }
}
