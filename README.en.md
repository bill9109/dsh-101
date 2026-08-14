# dsh-101 — A document-first reader profile bundle for DSH

[English](README.en.md) | [中文](README.md)

**DSH 101** is a document-first reading interface built on top of `dsh-base` + `dsh-web-app`: it organizes DSH's own documentation into an ordered, searchable, translatable reader.

License BSD-3-Clause · [GitHub](https://github.com/bill9109/dsh-101)

## Features

- DSH's built-in documentation, curated and ordered by topic
- Built-in document translation
- A sliding hidden table of contents
- Conversation panel on the right

## Install (profile distribution)

This repository ships both a **bundle** (`@bill9109/dsh-101`, installable via `dsh plugin add`) and a
**`profile/` directory** (a ready-to-use `dsh-101` profile composing `dsh-base` + `dsh-web-app` +
this bundle). DSH's official distribution model is "distribute bundles, compose profiles" — there is
no official command to distribute a profile, but a profile is just a directory under
`$DSH_HOME/profiles/<name>/`, so the repository's `profile/` is directly usable.

**Recommended: one-liner script** (places `profile/` into `~/.dsh/profiles/dsh-101/` and installs the bundle):

```sh
# Install from GitHub (pin to a tag/commit when possible):
bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v0.1.4

# Or install from a local checkout, specifying the port (default 3081):
./scripts/install.sh --port 3081 .

# Boot:
dsh --profile dsh-101
```

What the script does: places the three `profile/` files into `$DSH_HOME/profiles/dsh-101/`
(only fills in missing `dsh-base`/`dsh-web-app` layers if the profile already exists), primes the
DSH module fallback (so in-box peers resolve at runtime), then runs `dsh plugin --profile dsh-101 add`
to install this bundle.

**Manual install**:

```sh
mkdir -p ~/.dsh/profiles/dsh-101
cp profile/package.json profile/pnpm-workspace.yaml ~/.dsh/profiles/dsh-101/
# Optional: port patch
cp profile/cordis.patch.yml ~/.dsh/profiles/dsh-101/
# Install the bundle (appends to the bundles list)
dsh plugin --profile dsh-101 add github:bill9109/dsh-101#v0.1.4
dsh --profile dsh-101
```

Verify the bundles list has the three layers:

```sh
python3 -c "import json; print(json.load(open('$HOME/.dsh/profiles/dsh-101/package.json'))['dsh']['profile']['bundles'])"
# expected: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@bill9109/dsh-101']
```

> **Do NOT install into the `web` profile.** dsh-101's bundle disables `ui-layout`
> (the default browser shell); installed into any web-app profile it takes down the
> whole web (sidebar / conversation / app-shell all wait for the `layout` service and
> stay pending). Always use dsh-101 as its own profile (`dsh --profile dsh-101`,
> default port 3081, coexists with the web GUI on 3080). `install.sh` now rejects
> `--profile web` outright.

### Port

Defaults to 3081 (coexists with the web GUI on 3080). Two ways to change it:

**At launch (recommended, no config change, dsh 0.1.0-rc.6+):**

```sh
dsh --profile dsh-101 --port 8080
```

**Persist a different default in the profile config:**

```yaml
# ~/.dsh/profiles/dsh-101/cordis.patch.yml
- id: webserver
  inject: [webStartup]
  config:
    host: !!js ctx.webStartup.host ?? '127.0.0.1'
    port: !!js ctx.webStartup.port ?? 8080
```

(Launch flags win; the patch value is only the fallback.)

> **Git installs ship build artifacts.** `lib/` is committed to this repository, so a git install
> gets the built host + client bundles directly — **no build, no credentials needed**. If you install
> from a pristine clone before building, run `node scripts/build.mjs` first (needs a DSH source checkout, see below).

## Directory layout

```
src/
  app/        host plugin: corpus service + /api/dsh101 routes (from dsh-101-app)
  app/invariant.ts
  core/       corpus model: loading, merging, search (from dsh-101-core)
  tutor/      host plugin: model tools, curator skill (from dsh-101-tutor)
  client/     browser side: reader shell (from dsh-101-app/src/client)
  invariant.ts
assets/dsh-101/   generated corpus (corpus.json + documents/ + images/)
cordis.patch.yml  bundle patch: mounts app (package root) + tutor (./tutor subpath)
scripts/
  build.mjs        builds host + client bundles against a DSH checkout
  gen-dsh-101-corpus.ts  regenerates the corpus from a DSH source tree
  upgrade.mjs      syncs sources from an upgraded DSH checkout and rebuilds
```

## Build

The bundle's peer dependencies resolve from a DSH install — either a source checkout
(`DSH_CHECKOUT`) or the module fallback of a running DSH (`$DSH_HOME/profiles/node_modules`).
Toolchain binaries (tsc, tsdown) prefer the DSH source checkout.

```sh
DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs
# Rebuild after regenerating the corpus:
DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs --corpus
```

`build.mjs` symlinks DSH's peers into `node_modules`, runs `tsc` (types into `types/`) then
`tsdown` (host bundle + client bundle into `lib/`), and removes the symlinks afterwards.

> **Usually no build needed.** `lib/` is committed; `dsh plugin add` (GitHub / tarball / local
> checkout) installs the built bundle. Build only when developing this repo or after an `upgrade` sync.

## Regenerating the corpus

The corpus is a snapshot of the DSH repository's docs. Regenerate it from any DSH source checkout
(uses that checkout's tsx):

```sh
DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs --corpus
# or explicitly:
/path/to/dsh/node_modules/.bin/tsx scripts/gen-dsh-101-corpus.ts /path/to/dsh
```

## Upgrade

After DSH publishes a new snapshot, sync this bundle from the upgraded checkout:

```sh
node scripts/upgrade.mjs --checkout /path/to/upgraded-dsh
```

The script copies the 101 packages' sources into `src/`, rewrites internal imports to relative
paths, regenerates the corpus, and rebuilds. Then review the diff, commit, bump the version and tag:

```sh
git add -A && git commit -m "sync with DSH <snapshot>"
git tag v0.2.0 && git push origin main --tags
```

## License

BSD-3-Clause
