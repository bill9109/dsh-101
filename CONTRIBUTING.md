# Contributing to dsh-101

Focused fixes, tests, and documentation changes are welcome. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

1. Read [README.md](README.md) — install, usage, and troubleshooting.
2. Search existing [issues](https://github.com/bill9109/dsh-101/issues) and pull requests before opening duplicate work.
3. Open an issue before changing the corpus model, the reader surface, the tutor tools, or the profile/install layout.
4. Keep each change narrowly scoped. Do not mix a feature or fix with unrelated refactoring or generated-output churn.

## Architecture and scope

dsh-101 is an out-of-tree DeepSeek Harness **profile bundle** (standalone profile, not a `web` profile plugin). Contributions must preserve these responsibilities:

- The bundle aggregates three packages — dsh-101-app (host plugin + client reader shell), dsh-101-core (corpus model), and dsh-101-tutor (model tools / curator skill) — with sources under `src/` and built output committed in `lib/`.
- The corpus under `assets/dsh-101/` is a generated snapshot of the DSH repository's docs; edit the generator (`scripts/gen-dsh-101-corpus.ts`) or regenerate, not the artifacts by hand.
- `profile/` ships a ready-to-use profile, and `scripts/install.sh` installs it as a standalone profile — it must keep rejecting `--profile web` (dsh-101 disables `ui-layout` and would break the web GUI).

## Development

```sh
pnpm install
pnpm run build      # tsc + tsdown -> lib/ (committed)
pnpm run gen-corpus # regenerate corpus from a DSH source tree (needs DSH_CHECKOUT)
node scripts/verify-i18n.mjs   # bilingual README consistency
```

Keep the bilingual README in sync (edit both `README.md` and `README.zh.md`, then `node scripts/verify-i18n.mjs --write`).

## Commit and release

- Bump the version and update `CHANGELOG.md` (Keep a Changelog format) in the same change that ships a user-visible difference.
- Tag releases with a semantic version (`v0.1.7`) and push tags with the release.
