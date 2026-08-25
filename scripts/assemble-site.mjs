#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const GAMES_ROOT = 'games'
const OUT = 'site'

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const games = existsSync(GAMES_ROOT)
  ? readdirSync(GAMES_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => existsSync(join(GAMES_ROOT, name, 'dist')))
  : []

for (const name of games) {
  cpSync(join(GAMES_ROOT, name, 'dist'), join(OUT, name), { recursive: true })
}

const cards = games
  .map(
    (name) =>
      `<a class="card" href="./${name}/"><span class="name">${name}</span><span class="go">грати →</span></a>`,
  )
  .join('\n      ')

writeFileSync(
  join(OUT, 'index.html'),
  `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Прототипи</title>
    <style>
      :root { color-scheme: dark; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #0b0d14;
        color: #f2f5ff;
        font: 400 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      main { width: min(420px, 100%); display: grid; gap: 12px; }
      h1 { font-size: 14px; font-weight: 600; color: #79839d; letter-spacing: .08em; text-transform: uppercase; }
      .card {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 20px; border-radius: 14px; background: #151a27;
        color: inherit; text-decoration: none; transition: background .15s;
      }
      .card:hover, .card:focus-visible { background: #1e2536; }
      .name { font-size: 20px; font-weight: 700; text-transform: capitalize; }
      .go { color: #5ef2ff; font-size: 14px; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>
      <h1>Прототипи</h1>
      ${cards || '<p>Поки порожньо.</p>'}
    </main>
  </body>
</html>
`,
)

console.log(`site assembled: ${games.length ? games.join(', ') : 'no games built'}`)
