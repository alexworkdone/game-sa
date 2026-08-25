import { DailySeed, Game } from '@sa/core'
import { BALANCE } from './game/config/balance.js'
import { PALETTE } from './game/config/palette.js'
import { SFX } from './game/config/sfx.js'
import { PlayScene } from './game/scenes/PlayScene.js'
import type { PlayParams } from './game/scenes/PlayScene.js'
import { ResultScene } from './game/scenes/ResultScene.js'
import { RunRecords } from './game/systems/RunRecords.js'

const canvas = document.getElementById('stage')
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas #stage not found')

const dailySeed = new DailySeed({
  prefix: BALANCE.run.seedPrefix,
  epochIsoDate: BALANCE.run.dailyEpoch,
})

const openingRun: PlayParams = {
  seed: dailySeed.seedFor(),
  daily: true,
  dayNumber: dailySeed.dayNumber(),
}

const game = new Game({
  canvas,
  namespace: 'ricochet',
  designWidth: 960,
  designHeight: 540,
  backgroundColor: PALETTE.background,
  initialScene: 'play',
  initialParams: openingRun,
  debug: import.meta.env.DEV,
  createScenes: (context) => {
    context.audio.registerAll(SFX)
    const records = new RunRecords(context.storage, dailySeed)
    return [new PlayScene(records), new ResultScene(dailySeed)]
  },
})

void game.start()
