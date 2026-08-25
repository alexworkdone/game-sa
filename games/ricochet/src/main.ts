import { Game } from '@sa/core'
import { BALANCE } from './game/config/balance.js'
import { PALETTE } from './game/config/palette.js'
import { SFX } from './game/config/sfx.js'
import { PlayScene } from './game/scenes/PlayScene.js'
import type { PlayParams } from './game/scenes/PlayScene.js'
import { ResultScene } from './game/scenes/ResultScene.js'
import { RunRecords } from './game/systems/RunRecords.js'
import { PartLedger } from './game/systems/PartLedger.js'

const canvas = document.getElementById('stage')
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas #stage not found')

const openingRun: PlayParams = {
  seed: `run-${Math.floor(Math.random() * 1e9).toString(36)}`,
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
    const records = new RunRecords(context.storage)
    const ledger = new PartLedger(context.storage)
    return [new PlayScene(records, ledger), new ResultScene()]
  },
})

void game.start()
