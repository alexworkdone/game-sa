import { WorldGenerator, transferablesOf } from './WorldGenerator.js'

self.onmessage = ({ data }) => {
  const generator = new WorldGenerator(data.config)
  let reported = 0
  const world = generator.generate(data.seed, (progress) => {
    if (progress - reported < 0.02 && progress < 1) return
    reported = progress
    self.postMessage({ type: 'progress', progress })
  })
  self.postMessage({ type: 'done', world }, transferablesOf(world))
}
