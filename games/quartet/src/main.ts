import '@fontsource/nunito/cyrillic-700.css'
import '@fontsource/nunito/cyrillic-800.css'
import '@fontsource/nunito/cyrillic-900.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/nunito/latin-900.css'
import '@fontsource/unbounded/cyrillic-600.css'
import '@fontsource/unbounded/cyrillic-800.css'
import '@fontsource/unbounded/latin-600.css'
import '@fontsource/unbounded/latin-800.css'
import './styles/main.scss'
import { QuartetApp } from './app/QuartetApp.js'
import { CATEGORIES } from './content/data/categories.js'

const root = document.getElementById('app')
if (!root) throw new Error('#app not found')

const app = new QuartetApp({ root, categories: CATEGORIES, debug: import.meta.env.DEV })
void app.start()
