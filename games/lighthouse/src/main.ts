import { Game } from '@sa/core'
import { LAYOUT } from './game/config/layout.js'
import { PALETTE } from './game/config/palette.js'
import { SFX } from './game/config/sfx.js'
import { CompositeControls } from './game/controls/CompositeControls.js'
import { KeyboardControls } from './game/controls/KeyboardControls.js'
import { TouchControls } from './game/controls/TouchControls.js'
import { EnemyFactory } from './game/entities/EnemyFactory.js'
import { TowerGenerator } from './game/level/TowerGenerator.js'
import { MenuScene } from './game/scenes/MenuScene.js'
import { PlayScene } from './game/scenes/PlayScene.js'
import type { ControlRigFactory } from './game/scenes/PlayScene.js'
import { ExchangeScene } from './game/scenes/ExchangeScene.js'
import { ProfilesScene } from './game/scenes/ProfilesScene.js'
import { RelicsScene } from './game/scenes/RelicsScene.js'
import { ResultScene } from './game/scenes/ResultScene.js'
import { WorkshopScene } from './game/scenes/WorkshopScene.js'
import { Profiles } from './game/systems/Profiles.js'
import { Progress } from './game/systems/Progress.js'
import { Achievements } from './game/systems/Achievements.js'
import { AchievementToast } from './game/ui/AchievementToast.js'
import { AchievementsScene } from './game/scenes/AchievementsScene.js'
import type { Feats } from './game/scenes/Feats.js'
import { Tips } from './game/systems/Tips.js'
import { Unlocks } from './game/systems/Unlocks.js'
import { MUSIC_TRACKS } from './game/config/music.js'
import { SynthMusic } from './game/systems/music/SynthMusic.js'
import { VolumeControls } from './game/systems/VolumeControls.js'

const canvas = document.getElementById('stage')
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas #stage not found')

const createControls: ControlRigFactory = (context) => {
  const touch = new TouchControls(context.viewport)
  return {
    touch,
    controls: new CompositeControls([new KeyboardControls(context.input), touch]),
  }
}

const game = new Game({
  canvas,
  namespace: 'lighthouse',
  designWidth: LAYOUT.designWidth,
  designHeight: LAYOUT.designHeight,
  backgroundColor: PALETTE.background,
  initialScene: 'menu',
  debug: import.meta.env.DEV,
  createScenes: (context) => {
    context.audio.registerAll(SFX)
    const profiles = new Profiles(context.storage)
    const storage = profiles.storage()
    const progress = new Progress(storage)
    const tips = new Tips(storage)
    const unlocks = new Unlocks(storage, progress)
    const feats: Feats = {
      achievements: new Achievements(storage, progress),
      toast: new AchievementToast(() => context.audio.play('achievement')),
    }
    feats.achievements.onUnlock.on((unlocked) => feats.toast.push(unlocked))
    const music = new SynthMusic(MUSIC_TRACKS, { track: () => progress.tier - 1 })
    const volume = new VolumeControls(context.storage, context.audio, music)
    const unlockMusic = (): void => music.unlock()
    window.addEventListener('pointerdown', unlockMusic, { once: true })
    window.addEventListener('keydown', unlockMusic, { once: true })
    context.onPause.on(() => music.suspend())
    context.onResume.on(() => music.resume())
    if (import.meta.env.DEV) {
      const tiers = Number(new URLSearchParams(location.search).get('tiers'))
      if (tiers > 0) progress.unlockTiers(tiers)
      Object.assign(window, { lighthouse: { progress, tips, feats, unlocks, profiles, context, music, volume } })
    }
    return [
      new MenuScene(progress, feats, unlocks, volume),
      new PlayScene(progress, new TowerGenerator(), new EnemyFactory(), createControls, tips, feats, unlocks, volume),
      new WorkshopScene(progress, feats),
      new ResultScene(progress, feats),
      new RelicsScene(progress, feats),
      new AchievementsScene(feats),
      new ProfilesScene(profiles),
      new ExchangeScene(progress, feats),
    ]
  },
})

void game.start()
