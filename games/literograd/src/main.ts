import '@fontsource/bad-script/cyrillic-400.css'
import '@fontsource/bad-script/latin-400.css'
import '@fontsource/golos-text/cyrillic-400.css'
import '@fontsource/golos-text/cyrillic-500.css'
import '@fontsource/golos-text/cyrillic-600.css'
import '@fontsource/golos-text/latin-400.css'
import '@fontsource/golos-text/latin-500.css'
import '@fontsource/golos-text/latin-600.css'
import '@fontsource/unbounded/cyrillic-500.css'
import '@fontsource/unbounded/cyrillic-700.css'
import '@fontsource/unbounded/latin-500.css'
import '@fontsource/unbounded/latin-700.css'
import './styles/main.scss'
import { LiterogradApp } from './app/LiterogradApp.js'

const root = document.getElementById('app')
if (!root) throw new Error('#app not found')

const app = new LiterogradApp({ root, debug: import.meta.env.DEV })
void app.start()
