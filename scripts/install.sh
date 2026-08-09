#!/usr/bin/env bash
# Install @dsh-external/dsh-101 as a standalone `dsh-101` profile.
#
# Why this exists: `dsh plugin add` only manages OUT-OF-TREE packages. The
# reader runs on top of the IN-BUILT `@deepseek-ai/dsh-web-app` bundle
# (which provides httpServer), and official DSH has no `dsh-101` profile
# template — so a bare `dsh plugin --profile dsh-101 add ...` would create a
# profile missing web-app and fail with `waiting for service: httpServer`.
# This script composes the profile correctly.
#
# Usage:
#   ./scripts/install.sh [--port 3081] [source]
#
#   source   where to install from. Default: this repo (local checkout).
#            Pass a git spec to install from GitHub, e.g.
#            github:dsh-external/dsh-101#v0.1.0
#   --port N write a cordis.patch.yml binding the reader to port N
#            (default: no patch — uses the web profile's :3080)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_NAME="${DSH_101_PROFILE:-dsh-101}"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME_DIR/profiles/$PROFILE_NAME"
SOURCE="${1:-.}"
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

# 1) Create the profile directory with base + web-app layers if absent.
mkdir -p "$PROFILE_DIR"
if [[ -f "$PROFILE_DIR/package.json" ]]; then
  echo "==> profile already exists; will add missing bundles only"
else
  cat > "$PROFILE_DIR/package.json" <<EOF
{
  "name": "dsh-profile-$PROFILE_NAME",
  "private": true,
  "dependencies": {},
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"] } }
}
EOF
  echo "==> initialized $PROFILE_DIR (dsh-base + dsh-web-app)"
fi

# 2) Ensure the web-app layer is present (idempotent).
if ! grep -q '"@deepseek-ai/dsh-web-app"' "$PROFILE_DIR/package.json"; then
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
  echo "==> ensured dsh-web-app layer in $PROFILE_DIR/package.json"
fi

# 3) Install this bundle (pnpm add + append to bundles).
if [[ "$SOURCE" == "." || "$SOURCE" == "$ROOT" ]]; then
  cd "$ROOT"
  dsh plugin --profile "$PROFILE_NAME" add .
else
  dsh plugin --profile "$PROFILE_NAME" add "$SOURCE"
fi

# 4) Optional port patch.
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
fi

echo
echo "==> done. Verify + boot:"
echo "    python3 -c \"import json; print(json.load(open('$PROFILE_DIR/package.json'))['dsh']['profile']['bundles'])\""
echo "    dsh --profile $PROFILE_NAME"
