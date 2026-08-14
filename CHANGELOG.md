# Changelog

All notable user-facing changes to dsh-101 are documented in this file. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic version tags.

## [Unreleased]

## [0.1.8] - 2026-08-14

### Fixed

- Removed build-machine paths leaked into the committed `lib/` by the bundler's `//#region` debug comments: an absolute `/Users/.../dsh-101/src/client/ReaderRoot.module.css.mjs` path in `lib/client.js` and two `../../../.dsh/source/staging-.../vendor/...` paths in `lib/index.js`. The labels now use repo-relative names; no personal or machine-specific paths remain in the repository.

## [0.1.7] - 2026-08-14

### Changed

- Repositioned the README around the project's role as a standalone DeepSeek Harness document-reader profile, in the shared bilingual convention: `README.md` (English) is now the main file, `README.zh.md` carries the Chinese side, and `README.i18n.yaml` records their git blob hashes with a `scripts/verify-i18n.mjs` consistency check.
- Added versioned static badges, the one-liner `install.sh` command (with the explicit "do NOT install into the `web` profile" warning), and sections for Why this exists, Usage, Upgrade/Uninstall lifecycle, Troubleshooting, and Development and verification.
- Expanded `package.json` metadata: English description, `keywords`, `engines`, the `./cordis.patch.yml` export, and README/CHANGELOG files in `files`.
- Added `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md`.

## [0.1.6] - 2026-08-14

### Fixed

- `dsh101_publish` rejected every curator session (job token mismatch): the publish tool now matches the curator session's job token correctly.

## [0.1.5] - 2026-08-14

### Fixed

- rc.6 client declaration key: renamed `dshClient` → `dsh.client` and aligned the bundle registration name with the package scope.

## [0.1.4] - 2026-08-14

### Changed

- Pinned install commands in the README to v0.1.4.

## [0.1.3] - 2026-08-14

### Changed

- Renamed the package scope to `@bill9109/dsh-101` and introduced the bilingual README (`README.md` zh + `README.en.md`).
- Bumped the `package.json` version field to 0.1.3 to align with the tag.

## [0.1.2] - 2026-08-14

### Added

- Launch-time `--port` override for dsh-101 (dsh 0.1.0-rc.6 flag-driven webserver).

## [0.1.1] - 2026-08-14

### Changed

- Adapted the install tutorial to dsh 0.1.0-rc.6.

## [0.1.0] - 2026-08-14

### Added

- Initial release: the document-first reader profile bundle over `dsh-base` + `dsh-web-app` (module tree, article reader, search, tutor panel), aggregating dsh-101-app, dsh-101-core, and dsh-101-tutor.
