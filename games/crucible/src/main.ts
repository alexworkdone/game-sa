import { Game } from '@sa/core'
import { PALETTE } from './game/config/palette.js'
import { LAYOUT } from './game/config/layout.js'
import { SFX } from './game/config/sfx.js'
import { AlchemyScene } from './game/scenes/AlchemyScene.js'
import { ElementRegistry } from './game/systems/ElementRegistry.js'
import { RecipeBook } from './game/systems/RecipeBook.js'
import { Discovery } from './game/systems/Discovery.js'
import { MixLog } from './game/systems/MixLog.js'
import { Settings } from './game/systems/Settings.js'

const canvas = document.getElementById('stage')
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas #stage not found')

const game = new Game({
  canvas,
  namespace: 'crucible',
  designWidth: LAYOUT.designWidth,
  designHeight: LAYOUT.designHeight,
  backgroundColor: PALETTE.background,
  initialScene: 'alchemy',
  transition: null,
  debug: import.meta.env.DEV,
  createScenes: (context) => {
    context.audio.registerAll(SFX)
    const registry = new ElementRegistry()
    const recipes = new RecipeBook()
    const discovery = new Discovery(context.storage, registry)
    const mixLog = new MixLog(context.storage)
    const settings = new Settings(context.storage)
    return [new AlchemyScene(registry, recipes, discovery, mixLog, settings)]
  },
})

void game.start()
