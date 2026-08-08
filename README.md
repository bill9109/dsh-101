# @dsh-external/dsh-101

The **DSH 101** profile bundle: a document-first reader surface over
`dsh-base` + `dsh-web-app` (module tree, article reader, search, tutor
panel). Single-package aggregation of the upstream `dsh-101-app`,
`dsh-101-core`, and `dsh-101-tutor` packages (the `dsh-webbridge` package is
not included).

## Install

Requires a DSH installation built from the same source family (the bundle's
peer dependencies — `cordis`, `@deepseek-ai/dsh-*` — resolve from the DSH
installation's module closure).

```sh
# From the checkout (author/developer), or from GitHub with a pinned commit:
dsh plugin --profile dsh-101 add github:dsh-external/dsh-101#<commit-sha>

# Or from a local checkout:
dsh plugin --profile dsh-101 add .

# Boot the reader profile (binds :3081 by default via the profile's
# cordis.patch.yml; without that patch it uses the web profile's :3080):
dsh --profile dsh-101
```

The first `add` initializes the profile with `@deepseek-ai/dsh-base` and
appends this bundle to `dsh.profile.bundles` because the package declares
`dsh.bundle`.

> **Git installs and built artifacts.** `lib/` is committed to this repo, so
> a git install gets the built host + client bundles directly — no build
> permission needed. If you install from a fresh clone before building, run
> `pnpm build` (requires a DSH source checkout, see below).

## Layout

```
src/
  app/        host plugin: corpus service + /api/dsh101 routes (from dsh-101-app)
  app/invariant.ts
  core/       corpus model: loading, merging, search (from dsh-101-core)
  tutor/      host plugin: model tools, curator skill (from dsh-101-tutor)
  client/     browser half: reader shell (from dsh-101-app/src/client)
  invariant.ts
assets/dsh-101/   generated corpus (corpus.json + documents/ + images/)
cordis.patch.yml  bundle patch: mounts app (package root) + tutor (./tutor)
scripts/
  build.mjs        build host + client bundles against a DSH checkout
  gen-dsh-101-corpus.ts  regenerate the corpus from a DSH source tree
  upgrade.mjs      sync sources from an upgraded DSH checkout + rebuild
```

## Build

The bundle's peers resolve from a DSH installation — either a source
checkout (`DSH_CHECKOUT`) or the running DSH's module fallback
(`$DSH_HOME/profiles/node_modules`).

```sh
DSH_CHECKOUT=/path/to/dsh pnpm build
```

`build.mjs` links the DSH peers into `node_modules`, runs `tsc` (types into
`types/`) then `tsdown` (host bundle + client bundle into `lib/`), and
removes the link afterwards.

## Regenerate the corpus

The corpus is a snapshot of the DSH repo's documentation. Regenerate it from
any DSH source checkout:

```sh
pnpm gen-corpus                        # uses the resolved DSH checkout
# or explicitly:
tsx scripts/gen-dsh-101-corpus.ts /path/to/dsh
```

## Upgrade

When the DSH repo gets a new snapshot, sync this bundle from the upgraded
checkout:

```sh
node scripts/upgrade.mjs --checkout /path/to/upgraded-dsh
```

This copies the 101 packages' sources into `src/`, rewrites the internal
imports to relative paths, regenerates the corpus, and rebuilds. Review the
diff, commit, bump the version, and tag:

```sh
git add -A && git commit -m "sync with DSH <snapshot>"
git tag v0.2.0 && git push origin main --tags
```

## Why single package?

- One version / one tag / one `dsh plugin add` for consumers.
- The `client-modules` scan discovers the browser bundle through the package
  root's `dshClient` declaration, so the reader app row is named as the
  package root (`@dsh-external/dsh-101`); the host-only tutor row uses the
  `./tutor` subpath.
- Internal imports between app/core/tutor are rewritten to relative paths,
  so the bundle has no `@deepseek-ai/dsh-101-*` runtime dependencies.

## License

BSD-3-Clause
