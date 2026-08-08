#!/usr/bin/env node
/**
 * Sync dsh-101 from an upgraded DSH source checkout.
 *
 * After the DSH repo itself is upgraded (new snapshot merged into the
 * staging branch), this script pulls the 101 packages' sources from that
 * checkout into this single-package repo, rewrites the internal imports,
 * regenerates the corpus, and rebuilds.
 *
 * Usage:
 *   node scripts/upgrade.mjs [--checkout /path/to/dsh] [--no-corpus]
 *
 * Flags:
 *   --checkout <dir>  DSH source checkout to sync from (default: DSH_CHECKOUT
 *                     env, or `dsh` on PATH, or ~/.dsh/source/current).
 *   --no-corpus       Skip corpus regeneration (keep the committed assets).
 *
 * What it does:
 *   1. Copies src/ from packages/101/{dsh-101-app,dsh-101-core,dsh-101-tutor}
 *      into src/{app,core,tutor} + src/client (client from dsh-101-app/client).
 *   2. Copies the invariant stubs and the corpus generator script.
 *   3. Rewrites internal package imports to relative paths:
 *        @deepseek-ai/dsh-101-core  -> ../core/index.ts
 *        @deepseek-ai/dsh-101-app   -> ../app/index.ts
 *   4. Regenerates the corpus from the upgraded checkout (unless --no-corpus).
 *   5. Runs the build.
 *
 * The Agent driving an upgrade should run this after the DSH checkout has
 * been upgraded, then review the diff (git diff --stat) and commit.
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// --- args ---
let checkout = process.env.DSH_CHECKOUT
let doCorpus = true
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i]
  if (arg === '--checkout') { checkout = resolve(process.argv[++i]) }
  else if (arg === '--no-corpus') { doCorpus = false }
  else throw new Error(`unknown argument ${JSON.stringify(arg)}`)
}

function resolveCheckout() {
  if (checkout !== undefined && checkout !== '') return resolve(checkout)
  const which = spawnSync('command', ['-v', 'dsh'], { shell: true, encoding: 'utf8' })
  const launcher = which.stdout.trim()
  if (launcher !== '') {
    let dir = dirname(launcher)
    for (let depth = 0; depth < 6; depth += 1) {
      if (existsSync(join(dir, 'packages', 'client', 'tsdown.client.ts'))) return dir
      dir = dirname(dir)
    }
  }
  const fallback = join(process.env.HOME ?? '.', '.dsh', 'source', 'current')
  if (existsSync(join(fallback, 'packages', '101', 'dsh-101-app'))) return fallback
  throw new Error('Cannot find a DSH source checkout; pass --checkout /path/to/dsh')
}

const dsh = resolveCheckout()
const p101 = join(dsh, 'packages', '101')
for (const pkg of ['dsh-101-app', 'dsh-101-core', 'dsh-101-tutor']) {
  if (!existsSync(join(p101, pkg, 'src'))) throw new Error(`missing ${pkg}/src in ${dsh}`)
}
console.log(`Syncing dsh-101 from ${dsh}`)

// --- 1. copy sources ---
// dsh-101-app/src contains both the host plugin (index.ts, invariant.ts)
// and the client half (client/). The host files go to src/app; the client
// half goes to src/client (the clientBundle preset expects src/client).
const appSrc = join(p101, 'dsh-101-app', 'src')
rmSync(join(root, 'src', 'app'), { recursive: true, force: true })
mkdirSync(join(root, 'src', 'app'), { recursive: true })
for (const entry of readdirSync(appSrc)) {
  if (entry === 'client') continue
  cpSync(join(appSrc, entry), join(root, 'src', 'app', entry), { recursive: true })
}
rmSync(join(root, 'src', 'client'), { recursive: true, force: true })
cpSync(join(appSrc, 'client'), join(root, 'src', 'client'), { recursive: true })
for (const [from, to] of [['dsh-101-core/src', 'src/core'], ['dsh-101-tutor/src', 'src/tutor']]) {
  rmSync(join(root, to), { recursive: true, force: true })
  cpSync(join(p101, from), join(root, to), { recursive: true })
}
// invariant stubs
cpSync(join(p101, 'dsh-101', 'src', 'invariant.ts'), join(root, 'src', 'invariant.ts'))
console.log('sources copied')

// --- 2. rewrite internal imports ---
function rewrite(file) {
  let text = readFileSync(file, 'utf8')
  const before = text
  text = text.replaceAll("from '@deepseek-ai/dsh-101-core'", "from '../core/index.ts'")
  text = text.replaceAll("from '@deepseek-ai/dsh-101-app'", "from '../app/index.ts'")
  text = text.replaceAll("import('@deepseek-ai/dsh-101-core')", "import('../core/index.ts')")
  text = text.replaceAll("import('@deepseek-ai/dsh-101-app')", "import('../app/index.ts')")
  if (text !== before) writeFileSync(file, text)
}
function walk(dir) {
  for (const entry of readdirRec(dir)) {
    if (/\.(ts|tsx)$/.test(entry)) rewrite(entry)
  }
}
function readdirRec(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (name === 'node_modules' || name === 'lib') continue
    const st = existsSync(full) ? statSync(full) : undefined
    if (st?.isDirectory()) out.push(...readdirRec(full))
    else out.push(full)
  }
  return out
}
walk(join(root, 'src'))
console.log('imports rewritten')

// --- 3. corpus generator ---
cpSync(join(dsh, 'scripts', 'gen-dsh-101-corpus.ts'), join(root, 'scripts', 'gen-dsh-101-corpus.ts'))
// Re-apply the standalone-repo path adaptation (upstream's default OUT points
// at its monorepo assets; here the corpus always lands in ./assets/dsh-101).
const genPath = join(root, 'scripts', 'gen-dsh-101-corpus.ts')
let genText = readFileSync(genPath, 'utf8')
genText = genText
  .replace(
    "const REPO = resolve(process.argv[2] ?? import.meta.dirname, '..')",
    "const REPO = resolve(process.argv[2] ?? join(import.meta.dirname, '..', '..'))",
  )
  .replace(
    "const OUT = resolve(process.argv[3] ?? join(REPO, 'packages/101/dsh-101-app/assets/dsh-101/corpus.json'))",
    "const OUT = resolve(process.argv[3] ?? join(import.meta.dirname, '..', 'assets', 'dsh-101', 'corpus.json'))",
  )
writeFileSync(genPath, genText)
console.log('corpus generator copied (paths adapted for standalone repo)')

// --- 4. regenerate corpus (unless skipped) ---
if (doCorpus) {
  const tsx = join(dsh, 'node_modules', '.bin', 'tsx')
  if (existsSync(tsx)) {
    const r = spawnSync(tsx, ['scripts/gen-dsh-101-corpus.ts', dsh], { cwd: root, stdio: 'inherit' })
    if (r.status !== 0) process.exit(r.status ?? 1)
    console.log('corpus regenerated')
  } else {
    console.warn('tsx not found in DSH checkout; corpus NOT regenerated (run pnpm gen-corpus later)')
  }
}

// --- 5. build ---
const build = spawnSync(process.execPath, [join(root, 'scripts', 'build.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DSH_CHECKOUT: dsh },
})
if (build.status !== 0) process.exit(build.status ?? 1)
console.log('build complete — review `git diff --stat` and commit')
