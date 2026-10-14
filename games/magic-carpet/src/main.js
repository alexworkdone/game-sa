import '@fontsource/philosopher/cyrillic-400.css'
import '@fontsource/philosopher/latin-400.css'
import '@fontsource/philosopher/cyrillic-700.css'
import '@fontsource/philosopher/latin-700.css'
import './styles.css'
import { MagicCarpetApp } from './app/MagicCarpetApp.js'
import { WORLD } from './config/world.js'

const seedParameter = Number(new URLSearchParams(location.search).get('seed'))
const seed = Number.isFinite(seedParameter) && seedParameter > 0 ? seedParameter : WORLD.defaultSeed

const app = new MagicCarpetApp({
  canvas: document.getElementById('world'),
  ui: document.getElementById('ui'),
})

app.start(seed)

if (import.meta.env.DEV) window.carpet = app
