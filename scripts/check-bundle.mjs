#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

const KB = 1024
const MB = 1024 * 1024

const DEFAULT_BUDGET = { initialBytes: 8 * MB, maxFiles: 1500 }

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function human(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`
  if (bytes >= KB) return `${(bytes / KB).toFixed(1)} KB`
  return `${bytes} B`
}

function readBudget(gameDir) {
  const file = join(gameDir, 'budget.json')
  if (!existsSync(file)) return DEFAULT_BUDGET
  return { ...DEFAULT_BUDGET, ...JSON.parse(readFileSync(file, 'utf8')) }
}

function checkGame(gameDir) {
  const dist = join(gameDir, 'dist')
  if (!existsSync(dist)) return null

  const budget = readBudget(gameDir)
  const files = walk(dist)
  const total = files.reduce((sum, f) => sum + statSync(f).size, 0)

  const html = files.filter((f) => extname(f) === '.html')
  const referenced = new Set()
  for (const page of html) {
    const src = readFileSync(page, 'utf8')
    for (const m of src.matchAll(/(?:src|href)="\.?\/?([^"]+)"/g)) referenced.add(m[1])
  }
  const initialFiles = files.filter(
    (f) => extname(f) === '.html' || [...referenced].some((r) => f.endsWith(r)),
  )
  const initial = initialFiles.reduce((sum, f) => sum + statSync(f).size, 0)
  const initialGz = initialFiles.reduce(
    (sum, f) => sum + gzipSync(readFileSync(f)).length,
    0,
  )

  const errors = []
  if (initial > budget.initialBytes)
    errors.push(
      `initial ${human(initial)} > budget ${human(budget.initialBytes)}`,
    )
  if (files.length > budget.maxFiles)
    errors.push(`${files.length} files > budget ${budget.maxFiles}`)

  return { gameDir, initial, initialGz, total, count: files.length, errors }
}

const gamesRoot = 'games'
const dirs = existsSync(gamesRoot)
  ? readdirSync(gamesRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(gamesRoot, e.name))
  : []

const results = dirs.map(checkGame).filter(Boolean)

if (results.length === 0) {
  console.log('bundle budget: no built games found (run the game build first)')
  process.exit(0)
}

let failed = false
for (const r of results) {
  const name = relative(gamesRoot, r.gameDir)
  const status = r.errors.length ? 'FAIL' : 'ok'
  console.log(
    `[${status}] ${name}  initial ${human(r.initial)} (gz ${human(r.initialGz)})  total ${human(r.total)}  files ${r.count}`,
  )
  for (const e of r.errors) {
    failed = true
    console.error(`       ${e}`)
  }
}

process.exit(failed ? 1 : 0)
