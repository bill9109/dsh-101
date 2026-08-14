# dsh-101 — A document-first reader profile bundle for DSH

[![Release v0.1.7](https://img.shields.io/badge/release-v0.1.7-5B4CF0?style=flat-square)](https://github.com/bill9109/dsh-101/releases/tag/v0.1.7)
[![License: BSD-3-Clause](https://img.shields.io/badge/license-BSD--3--Clause-0B7285?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%5E20%20%7C%20%3E%3D22-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![DSH profiles](https://img.shields.io/badge/DSH-Web-5B4CF0?style=flat-square)](cordis.patch.yml)

**Install:** `bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v0.1.7`

**DSH 101 is a document-first reading interface built on top of `dsh-base` + `dsh-web-app`: it organizes DSH's own documentation into an ordered, searchable, translatable reader.**

[English](README.md) | [中文](README.zh.md)

## Why this exists

DSH ships a large body of built-in documentation, but in its raw form it is a file dump: scattered across the source tree, with no order, no search, and no comfortable way to read it. dsh-101 makes that documentation a first-class part of the DSH experience — a curated, ordered, searchable, translatable reader instead of raw files, with the conversation panel alongside so you can ask questions while you read.

## Features

- DSH's built-in documentation, curated and ordered by topic
- Built-in document translation
- A sliding hidden table of contents
- Conversation panel on the right

## Usage

Boot the profile (default port 3081, coexists with the web GUI on 3080):

```sh
dsh --profile dsh-101
```

Open http://127.0.0.1:3081 (or the port you chose): the reader shows the curated corpus with the sliding table of contents, search filters the documents, translation switches the reading language, and the right-hand panel is the DSH conversation you already know.

## Install

This repository ships both a **bundle** (`@bill9109/dsh-101`, installable via `dsh plugin add`) and a
**`profile/` directory** (a ready-to-use `dsh-101` profile composing `dsh-base` + `dsh-web-app` +
this bundle). DSH's official distribution model is "distribute bundles, compose profiles" — there is
no official command to distribute a profile, but a profile is just a directory under
`$DSH_HOME/profiles/<name>/`, so the repository's `profile/` is directly usable.

**Recommended: one-liner script** (places `profile/` into `~/.dsh/profiles/dsh-101/` and installs the bundle):

```sh
# Install from GitHub (pin to a tag/commit when possible):
bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v0.1.7

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
dsh plugin --profile dsh-101 add github:bill9109/dsh-101#v0.1.7
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

### Upgrade

Re-run the one-liner with the new pinned tag:

```sh
bash <(curl -fsSL https://raw.githubusercontent.com/bill9109/dsh-101/main/scripts/install.sh) github:bill9109/dsh-101#v<new-version>
```

For a local-checkout installation, re-run `./scripts/install.sh .` against the updated checkout (it
only fills in missing layers, so your profile state is preserved). When DSH itself publishes a new
snapshot, sync the bundle sources from the upgraded checkout with `node scripts/upgrade.mjs`
(see "Upgrading from a newer DSH snapshot").

### Uninstall

```sh
dsh plugin --profile dsh-101 remove @bill9109/dsh-101
# and, if you no longer want the standalone profile:
rm -rf ~/.dsh/profiles/dsh-101
```

The first command runs `pnpm remove` in the profile directory and removes the bundle from
`dsh.profile.bundles`; the second deletes the standalone profile itself.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Web GUI (3080) is down / sidebar stays pending after installing dsh-101 | dsh-101 was installed into the `web` profile and disabled `ui-layout` — remove `@bill9109/dsh-101` from the web profile and reinstall dsh-101 as its own profile with the one-liner |
| `dsh --profile dsh-101` fails to start | Confirm `$DSH_HOME/profiles/dsh-101/` exists and its bundles list contains the three layers (`dsh-base`, `dsh-web-app`, `@bill9109/dsh-101`); re-run `install.sh` if a layer is missing |
| Port 3081 already in use | Pass `--port <port>` at launch, or persist a different default in the profile's `cordis.patch.yml` |
| GitHub install fails or installs stale code | Pin the install to a tag (`github:bill9109/dsh-101#v0.1.7`) or install from a local checkout (`./scripts/install.sh .`) |
| Documents missing or outdated | Regenerate the corpus from a DSH source checkout: `DSH_CHECKOUT=/path/to/dsh node scripts/build.mjs --corpus` |
| Broken after DSH published a new snapshot | Sync sources and rebuild with `node scripts/upgrade.mjs --checkout /path/to/upgraded-dsh` |

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
profile/          ready-to-use dsh-101 profile (package.json + pnpm-workspace.yaml + cordis.patch.yml)
scripts/
  install.sh            one-liner profile installer (install.sh --port <port> <src>)
  build.mjs             builds host + client bundles against a DSH checkout
  gen-dsh-101-corpus.ts regenerates the corpus from a DSH source tree
  upgrade.mjs           syncs sources from an upgraded DSH checkout and rebuilds
  verify-i18n.mjs       bilingual README consistency check (node scripts/verify-i18n.mjs)
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

## Upgrading from a newer DSH snapshot

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

## Development and verification

```sh
pnpm install
pnpm run build       # tsc + tsdown -> lib/ (committed)
pnpm run gen-corpus  # regenerate corpus from a DSH source tree (needs DSH_CHECKOUT)
node scripts/verify-i18n.mjs   # bilingual README consistency
```

`pnpm run build` emits the host + client bundles into `lib/`, which is committed so consumers
install without building. Keep the bilingual README in sync: edit both `README.md` and
`README.zh.md`, then `node scripts/verify-i18n.mjs --write` to re-record the blob hashes.

## Community and About

- Use [GitHub Issues](https://github.com/bill9109/dsh-101/issues) for reproducible bugs, focused feature requests, and usage questions.
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes; report vulnerabilities privately via [SECURITY.md](SECURITY.md).
- Follow releases and compatibility notes in [CHANGELOG.md](CHANGELOG.md).

## License

BSD-3-Clause
