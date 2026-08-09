#!/usr/bin/env bash
# Install @dsh-external/dsh-101 as a standalone `dsh-101` profile.
#
# DSH distribution model: bundles are distributed, profiles are composed by
# the user (official docs: "a bundle is what you author and distribute; a
# profile is what a user boots with"). There is no official command to
# distribute a profile, but a profile is just a directory under
# $DSH_HOME/profiles/<name> with a package.json bundles list + a user patch
# layer. This script installs the bundled `profile/` directory (base +
# web-app + this bundle) and then installs the bundle package, so the result
# is a working `dsh --profile dsh-101` that boots the reader.
#
# Why not just `dsh plugin --profile dsh-101 add ...`? `dsh plugin add`
# initializes an unknown profile name with only `dsh-base` (no template), and
# this reader needs the `dsh-web-app` layer (httpServer). The profile
# directory ships that layer explicitly.
#
# Usage:
#   ./scripts/install.sh [--port 3081] [source]
#
#   source   where to install the bundle from. Default: this repo (local
#            checkout). Pass a git spec to install from GitHub, e.g.
#            github:dsh-external/dsh-101#v0.1.0
#   --port N overwrite the profile's cordis.patch.yml to bind port N
#            (default: keep the shipped port 3081)
#   --profile NAME  install as NAME instead of dsh-101
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

# 1) Place the profile directory (package.json bundles list + user patch +
#    pnpm-workspace.yaml). Existing profiles are kept; the script only fills
#    missing pieces so user edits survive re-runs.
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
  cp "$ROOT/profile/package.json" "$PROFILE_DIR/package.json"
  echo "==> wrote $PROFILE_DIR/package.json"
fi

if [[ ! -f "$PROFILE_DIR/pnpm-workspace.yaml" ]]; then
  cp "$ROOT/profile/pnpm-workspace.yaml" "$PROFILE_DIR/pnpm-workspace.yaml"
fi

if [[ -n "$PORT" ]]; then
  cat > "$PROFILE_DIR/cordis.patch.yml" <<EOF
# dsh-101 reader: bind on port $PORT so it can run alongside the default
# web profile's GUI on 3080.
- id: webserver
  config:
    host: 127.0.0.1
    port: $PORT
EOF
  echo "==> wrote port patch ($PORT) to $PROFILE_DIR/cordis.patch.yml"
elif [[ ! -f "$PROFILE_DIR/cordis.patch.yml" ]]; then
  cp "$ROOT/profile/cordis.patch.yml" "$PROFILE_DIR/cordis.patch.yml"
fi

# 2) Prime the DSH module fallback ($DSH_HOME/profiles/node_modules) so pnpm
#    can resolve the in-box @deepseek-ai/* peers (they are NOT on npm, and the
#    fallback is only created when dsh boots). --dump-config triggers the same
#    prepareProfile → healProfilesModuleFallback path without booting a server.
echo "==> priming DSH module fallback..."
dsh --profile "$PROFILE_NAME" --dump-config >/dev/null 2>&1 || true

# 3) Install this bundle (pnpm add + append to bundles).
if [[ "$SOURCE" == "." || "$SOURCE" == "$ROOT" ]]; then
  cd "$ROOT"
  dsh plugin --profile "$PROFILE_NAME" add .
else
  dsh plugin --profile "$PROFILE_NAME" add "$SOURCE"
fi

echo
echo "==> done. Verify + boot:"
echo "    python3 -c \"import json; print(json.load(open('$PROFILE_DIR/package.json'))['dsh']['profile']['bundles'])\""
echo "    dsh --profile $PROFILE_NAME"
