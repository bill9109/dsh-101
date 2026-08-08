#!/usr/bin/env node
/**
 * Build the @dsh-external/dsh-101 bundle.
 *
 * Peer dependencies (cordis, @deepseek-ai/dsh-*) resolve from the running
 * DSH's module fallback (`$DSH_HOME/profiles/node_modules`), the flat
 * dependency closure `healProfilesModuleFallback` maintains — or from a DSH
 * source checkout's `apps/cli/node_modules` when `DSH_CHECKOUT` is set.
 * Toolchain binaries (tsc, tsdown) come from the DSH source checkout when
 * available.
 *
 * The peer root is linked into this repo's node_modules, tsc then tsdown
 * run, and the link is removed afterwards.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function resolveCheckout() {
  if (process.env.DSH_CHECKOUT !== undefined && process.env.DSH_CHECKOUT !== '') {
    return resolve(process.env.DSH_CHECKOUT)
  }
  const which = spawnSync('command', ['-v', 'dsh'], { shell: true, encoding: 'utf8' })
  const launcher = which.stdout.trim()
  if (launcher === '') return undefined
  let directory = dirname(launcher)
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(join(directory, 'packages', 'client', 'tsdown.client.ts'))) return directory
    directory = dirname(directory)
  }
  return undefined
}

function resolveFallback() {
  const home = process.env.DSH_HOME !== undefined && process.env.DSH_HOME.trim() !== ''
    ? resolve(process.env.DSH_HOME)
    : join(process.env.HOME ?? '.', '.dsh')
  const fallback = join(home, 'profiles', 'node_modules')
  return existsSync(join(fallback, 'cordis')) ? fallback : undefined
}

function resolveCliModules(checkout) {
  if (checkout === undefined) return undefined
  const cli = join(checkout, 'apps', 'cli', 'node_modules')
  return existsSync(join(cli, 'cordis')) ? cli : undefined
}

const checkout = resolveCheckout()
const fallback = resolveFallback()
const cli = resolveCliModules(checkout)
const peerRoot = fallback ?? cli
if (peerRoot === undefined) {
  throw new Error(
    'Cannot find DSH peers: set DSH_CHECKOUT=/path/to/dsh (source checkout) or run dsh once so '
    + '$DSH_HOME/profiles/node_modules exists',
  )
}

// Assemble a flat node_modules by linking every package in the peer root(s).
// First source wins (fallback over cli root when both exist).
const nodeModules = join(root, 'node_modules')
rmSync(nodeModules, { recursive: true, force: true })
mkdirSync(nodeModules, { recursive: true })

const linkOne = (src, dest) => {
  if (!existsSync(dest)) {
    const isDir = existsSync(src) && statSync(src).isDirectory()
    symlinkSync(src, dest, isDir ? 'dir' : 'file')
  }
}

const linkFlat = (dir) => {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.bin') continue
    linkOne(join(dir, entry.name), join(nodeModules, entry.name))
  }
}

// fallback is the authoritative flat closure; the cli root adds anything
// missing (e.g. dev-only entries). @types/node comes from the checkout's
// pnpm store since the flat fallback omits it.
linkFlat(fallback ?? cli)
if (fallback !== undefined && cli !== undefined) linkFlat(cli)
if (checkout !== undefined && !existsSync(join(nodeModules, '@types', 'node'))) {
  const pnpmTypes = join(checkout, 'node_modules', '.pnpm', '@types+node@22.20.0', 'node_modules', '@types', 'node')
  if (existsSync(pnpmTypes)) {
    mkdirSync(join(nodeModules, '@types'), { recursive: true })
    linkOne(pnpmTypes, join(nodeModules, '@types', 'node'))
  }
}

try {
  const checkoutBin = checkout !== undefined ? join(checkout, 'node_modules', '.bin') : undefined
  const bin = checkoutBin !== undefined && existsSync(join(checkoutBin, 'tsdown'))
    ? checkoutBin
    : join(peerRoot, '.bin')
  const run = (name, args) => {
    const result = spawnSync(join(bin, name), args, {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...(checkout !== undefined ? { DSH_CHECKOUT: checkout } : {}),
      },
    })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
  run('tsc', ['-p', 'tsconfig.json'])
  run('tsdown', ['-c', 'tsdown.config.mjs'])
} finally {
  rmSync(nodeModules, { recursive: true, force: true })
}
