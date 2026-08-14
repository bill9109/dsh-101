#!/usr/bin/env bash
# Install @bill9109/dsh-101 as a standalone `dsh-101` profile.
#
# DSH distribution model: bundles are distributed, profiles are composed by
# the user. A profile is a directory under $DSH_HOME/profiles/<name> with a
# package.json bundles list + a user patch layer. This script installs the
# bundled `profile/` directory (base + web-app + this bundle) and then
# installs the bundle package, so the result is a working
# `dsh --profile dsh-101` that boots the reader.
#
# Why not just `dsh plugin --profile dsh-101 add ...`? `dsh plugin add`
# initializes an unknown profile name with only `dsh-base` (no template), and
# this reader needs the `dsh-web-app` layer (webServer). The profile
# directory ships that layer explicitly.
#
# Usage:
#   ./scripts/install.sh [--port 3081] [source]
#   bash <(curl -fsSL .../install.sh) github:bill9109/dsh-101#v0.1.3
#
#   source   where to install the bundle from. Default: this repo (local
#            checkout). Pass a git spec to install from GitHub.
#   --port N overwrite the profile's cordis.patch.yml to bind port N
#            (default: keep the shipped port 3081)
#   --profile NAME  install as NAME instead of dsh-101
set -euo pipefail

# When run from a checkout (bash scripts/install.sh), ROOT holds the repo;
# when run via bash <(curl ...) there is no checkout and profile/ files are
# fetched from raw.githubusercontent.com at the spec's ref instead.
LOCAL_CHECKOUT=""
if [[ -f "$(dirname "${BASH_SOURCE[0]}")/../profile/package.json" ]]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  LOCAL_CHECKOUT=1
else
  ROOT=""
fi
PROFILE_NAME="dsh-101"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME_DIR/profiles/$PROFILE_NAME"
SOURCE="."
PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --profile) PROFILE_NAME="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,30p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) SOURCE="$1"; shift ;;
  esac
done

echo "==> dsh-101 install (profile: $PROFILE_NAME, home: $DSH_HOME_DIR)"

# Resolve the profile/ file source: local checkout or GitHub raw at the ref.
PROFILE_SRC="$ROOT/profile"
if [[ -z "$LOCAL_CHECKOUT" ]]; then
  GIT_SPEC="${SOURCE#github:}"
  GIT_SPEC="${GIT_SPEC#git+}"
  GIT_SPEC="${GIT_SPEC#https://github.com/}"
  GIT_SPEC="${GIT_SPEC%.git}"
  OWNER="${GIT_SPEC%%/*}"
  REST="${GIT_SPEC#*/}"
  REPO="${REST%%/*}"
  REF="${GIT_SPEC##*#}"
  [[ "$REF" == "$GIT_SPEC" ]] && REF="main"
  RAW_BASE="https://raw.githubusercontent.com/$OWNER/$REPO/$REF/profile"
  echo "==> remote install: fetching profile files from $RAW_BASE"
  PROFILE_SRC="$RAW_BASE"
fi

fetch_file() {
  if [[ -n "$LOCAL_CHECKOUT" ]]; then cp "$PROFILE_SRC/$1" "$2";
  else curl -fsSL --max-time 60 "$PROFILE_SRC/$1" -o "$2"; fi
}

mkdir -p "$PROFILE_DIR"
if [[ -f "$PROFILE_DIR/package.json" ]]; then
  echo "==> profile exists; ensuring dsh-base + dsh-web-app layers present"
  python3 - "$PROFILE_DIR/package.json" <<'PYEOF'
import json, sys
path = sys.argv[1]
with open(path) as f:
    p = json.load(f)
bundles = p.setdefault('dsh', {}).setdefault('profile', {}).setdefault('bundles', [])
for b in ('@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'):
    if b not in bundles:
        bundles.insert(0, b)
with open(path, 'w') as f:
    json.dump(p, f, indent=2)
    f.write('\n')
PYEOF
else
  fetch_file "package.json" "$PROFILE_DIR/package.json"
  echo "==> wrote $PROFILE_DIR/package.json"
fi

if [[ ! -f "$PROFILE_DIR/pnpm-workspace.yaml" ]]; then
  fetch_file "pnpm-workspace.yaml" "$PROFILE_DIR/pnpm-workspace.yaml"
fi

if [[ -n "$PORT" ]]; then
  cat > "$PROFILE_DIR/cordis.patch.yml" <<EOF
# dsh-101 reader: bind on port $PORT by default so it can run alongside the
# default web profile's GUI on 3080; override at launch with
#   dsh --profile dsh-101 --port <n>  (launch flag wins; $PORT is the fallback).
- id: webserver
  inject: [webStartup]
  config:
    host: !!js ctx.webStartup.host ?? '127.0.0.1'
    port: !!js ctx.webStartup.port ?? $PORT
EOF
  echo "==> wrote port patch ($PORT) to $PROFILE_DIR/cordis.patch.yml"
elif [[ ! -f "$PROFILE_DIR/cordis.patch.yml" ]]; then
  fetch_file "cordis.patch.yml" "$PROFILE_DIR/cordis.patch.yml"
fi

# Prime the DSH module fallback so pnpm can resolve the in-box @deepseek-ai/*
# peers. --dump-config triggers the same prepareProfile ->
# healProfilesModuleFallback path without booting a server.
echo "==> priming DSH module fallback..."
dsh --profile "$PROFILE_NAME" --dump-config >/dev/null 2>&1 || true

# Install this bundle (pnpm add + append to bundles).
if [[ "$SOURCE" == "." || "$SOURCE" == "$ROOT" ]]; then
  cd "$ROOT"
  dsh plugin --profile "$PROFILE_NAME" add .
else
  dsh plugin --profile "$PROFILE_NAME" add "$SOURCE"
fi

echo
echo "==> done. Verify + boot:"
echo "    dsh --profile $PROFILE_NAME"
