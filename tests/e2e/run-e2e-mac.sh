#!/bin/bash
# run-e2e-mac.sh — browser e2e (e2e-v11.mjs) or UI speed benchmark (bench-ui.mjs) for H-Plast IPC on macOS.
#
# Per run it: serves a COPY of a PWA build on 127.0.0.1:$APP_PORT (API URL rewritten to http://127.0.0.1:8787/exec,
# no sw.js — same as the old sandbox), starts a FRESH `wrangler dev --local` on 127.0.0.1:8787 from a scratch copy of
# cloudflare/src (state wiped, own wrangler.jsonc, .dev.vars ADMIN_KEY="uji-lokal"), runs the script, stops both.
# Nothing is written inside the repo; everything lives under $E2E_HOME.
#
#   tests/e2e/run-e2e-mac.sh --setup                      # once: npm deps into $E2E_HOME/deps + Playwright WebKit
#   tests/e2e/run-e2e-mac.sh                              # e2e, Chromium (system Chrome), normal motion
#   tests/e2e/run-e2e-mac.sh --reduced-motion             # e2e, Chromium, prefers-reduced-motion: reduce
#   tests/e2e/run-e2e-mac.sh --browser webkit             # e2e, WebKit (Playwright build)
#   tests/e2e/run-e2e-mac.sh --bench                      # UI benchmark (Chromium)
#   ... --build /path/to/docs/app                         # test another build (default: <repo>/docs/app)
#
# Options: --browser chromium|webkit  --reduced-motion  --build DIR  --cf DIR (worker source, default <repo>/cloudflare)
#          --bench  --keep (leave worker + static server running)  --setup
# Env:     E2E_HOME (default $TMPDIR/ipc-e2e)  WRANGLER (wrangler binary; default <repo>/cloudflare/node_modules/.bin/wrangler,
#          then $E2E_HOME/deps)  CHROME_PATH  PW_DIR (dir with node_modules/playwright-core; default $E2E_HOME/deps)
#          H2P_JS  APP_PORT (default 8090)  E2E_TIMEOUT_S  BENCH_REPS  BENCH_SAVE_REPS
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
E2E_HOME="${E2E_HOME:-${TMPDIR:-/tmp}/ipc-e2e}"; E2E_HOME="${E2E_HOME%/}"
DEPS="$E2E_HOME/deps"
WORK="$E2E_HOME/run"
APP_PORT="${APP_PORT:-8090}"
API_PORT=8787                     # fixed: it is baked into the served copy of the build
API_LOKAL="http://127.0.0.1:$API_PORT/exec"
CHROME_PATH="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PW_DIR="${PW_DIR:-$DEPS}"
H2P_JS="${H2P_JS:-$DEPS/node_modules/html2pdf.js/dist/html2pdf.bundle.min.js}"

BROWSER=chromium; RM=0; BUILD="$REPO/docs/app"; CF="$REPO/cloudflare"; MODE=e2e; KEEP=0; SETUP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --setup) SETUP=1 ;;
    --browser) BROWSER="${2:-}"; shift ;;
    --webkit) BROWSER=webkit ;;
    --chromium) BROWSER=chromium ;;
    --reduced-motion) RM=1 ;;
    --build) BUILD="${2:-}"; shift ;;
    --cf) CF="${2:-}"; shift ;;
    --bench) MODE=bench ;;
    --keep) KEEP=1 ;;
    -h|--help) sed -n '2,/^set -uo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "run-e2e-mac: unknown option $1 (see --help)" >&2; exit 2 ;;
  esac
  shift
done

die() { echo "run-e2e-mac: $*" >&2; exit 2; }
command -v node >/dev/null || die "node not found"

if [ -z "${WRANGLER:-}" ]; then
  for c in "$REPO/cloudflare/node_modules/.bin/wrangler" "$DEPS/node_modules/.bin/wrangler"; do
    if [ -x "$c" ]; then WRANGLER="$c"; break; fi
  done
fi

if [ "$SETUP" = 1 ]; then
  mkdir -p "$DEPS" || die "cannot create $DEPS"
  [ -f "$DEPS/package.json" ] || echo '{ "name": "ipc-e2e-deps", "private": true }' > "$DEPS/package.json"
  (cd "$DEPS" && npm install --ignore-scripts --no-audit --no-fund playwright-core@1.64.1 html2pdf.js@0.10.1) || die "npm install failed"
  if [ -z "${WRANGLER:-}" ]; then
    echo "run-e2e-mac: no wrangler found — installing wrangler@4 into $DEPS"
    (cd "$DEPS" && npm install --no-audit --no-fund wrangler@4) || die "npm install wrangler@4 failed"
  fi
  node "$DEPS/node_modules/playwright-core/cli.js" install webkit || die "playwright webkit install failed"
  echo "run-e2e-mac: setup done ($DEPS)"
  exit 0
fi

case "$BROWSER" in chromium|webkit) ;; *) die "--browser must be chromium or webkit" ;; esac
BUILD="$(cd "$BUILD" 2>/dev/null && pwd)" || die "build dir not found"
CF="$(cd "$CF" 2>/dev/null && pwd)" || die "worker dir not found"
[ -f "$BUILD/index.html" ] || die "no index.html in $BUILD (build it: python3 tools/build-app.py)"
[ -f "$CF/src/worker.js" ] || die "no src/worker.js in $CF"
[ -n "${WRANGLER:-}" ] && [ -x "$WRANGLER" ] || die "wrangler not found — set WRANGLER=/path/to/node_modules/.bin/wrangler or run --setup"
[ -d "$PW_DIR/node_modules/playwright-core" ] || [ -d "$PW_DIR/node_modules/playwright" ] || die "playwright not found in $PW_DIR/node_modules — run --setup or set PW_DIR"
[ -f "$H2P_JS" ] || die "html2pdf bundle not found ($H2P_JS) — run --setup or set H2P_JS"
if [ "$BROWSER" = chromium ]; then [ -x "$CHROME_PATH" ] || die "Chrome not found at $CHROME_PATH — set CHROME_PATH"; fi

# one run at a time (shared ports + worker state)
mkdir -p "$E2E_HOME" || die "cannot create $E2E_HOME"
LOCK="$E2E_HOME/.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  op="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$op" ] && kill -0 "$op" 2>/dev/null; then die "another run (pid $op) is active"; fi
  rm -rf "$LOCK"; mkdir "$LOCK" || die "cannot take lock $LOCK"
fi
echo $$ > "$LOCK/pid"

WPID=""; HPID=""
cleanup() {
  if [ "$KEEP" = 1 ]; then
    echo "run-e2e-mac: --keep → worker (pid $WPID, http://127.0.0.1:$API_PORT) and app (pid $HPID, http://127.0.0.1:$APP_PORT/) still running"
  else
    [ -n "$HPID" ] && kill "$HPID" 2>/dev/null
    if [ -n "$WPID" ]; then
      kill -INT -- "-$WPID" 2>/dev/null || kill -INT "$WPID" 2>/dev/null
      for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$WPID" 2>/dev/null || break; sleep 0.5; done
      kill -TERM -- "-$WPID" 2>/dev/null
    fi
  fi
  rm -rf "$LOCK"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

busy() { lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $1" (pid "$2")"}' | sort -u | tr '\n' ' '; }
b="$(busy $API_PORT)"; [ -z "$b" ] || die "port $API_PORT already in use by: $b— stop it first (another wrangler dev / e2e run?)"
b="$(busy "$APP_PORT")"; [ -z "$b" ] || die "port $APP_PORT already in use by: $b— pick another with APP_PORT=..."

mkdir -p "$WORK/out"

# ---- served copy of the build, pointed at the local worker -------------------------------------------------------
rm -rf "$WORK/pwa"; mkdir -p "$WORK/pwa"
cp -R "$BUILD/." "$WORK/pwa/" || die "copy of $BUILD failed"
rm -f "$WORK/pwa/sw.js"
find "$WORK/pwa" -type f \( -name '*.html' -o -name '*.js' -o -name '*.mjs' -o -name '*.json' -o -name '*.webmanifest' \) -print0 |
  xargs -0 perl -pi -e "s#https://ipc-api[A-Za-z0-9.-]*\\.workers\\.dev/exec#$API_LOKAL#g"
left="$(grep -rIlE 'workers\.dev|script\.google\.com/macros' "$WORK/pwa" || true)"
[ -z "$left" ] || die "served copy still references a remote API in: $left"
grep -q "$API_LOKAL" "$WORK/pwa/index.html" || die "$API_LOKAL not found in served index.html"
echo "run-e2e-mac: served copy OK — API = $API_LOKAL, no workers.dev / Apps Script URL left"

# ---- fresh local worker -------------------------------------------------------------------------------------------
rm -rf "$WORK/cf"; mkdir -p "$WORK/cf"
cp -R "$CF/src" "$WORK/cf/src" || die "copy of $CF/src failed"
COMPAT="$(grep -oE '"compatibility_date"[^"]*"[0-9]{4}-[0-9]{2}-[0-9]{2}"' "$CF/wrangler.jsonc" 2>/dev/null | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)"
cat > "$WORK/cf/wrangler.jsonc" <<EOF
{
  // LOCAL e2e worker only — generated by tests/e2e/run-e2e-mac.sh. Never deploy from this folder.
  "name": "ipc-api-e2e-lokal",
  "main": "src/worker.js",
  "compatibility_date": "${COMPAT:-2025-09-01}",
  "workers_dev": false,
  "vars": { "LOKASI": "apac" },
  "durable_objects": { "bindings": [{ "name": "IPC_DB", "class_name": "IpcDb" }] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["IpcDb"] }],
  "kv_namespaces": [{ "binding": "BACKUP", "id": "e2e-lokal" }]
}
EOF
printf 'ADMIN_KEY="uji-lokal"\n' > "$WORK/cf/.dev.vars"
set -m   # own process group → wrangler + workerd can be stopped together
( cd "$WORK/cf" && exec env WRANGLER_SEND_METRICS=false CLOUDFLARE_CF_FETCH_ENABLED=false \
    "$WRANGLER" dev --local --ip 127.0.0.1 --port "$API_PORT" ) > "$WORK/wrangler.log" 2>&1 < /dev/null &
WPID=$!
set +m
for _ in $(seq 1 120); do
  grep -q "Ready on" "$WORK/wrangler.log" && break
  kill -0 "$WPID" 2>/dev/null || { tail -30 "$WORK/wrangler.log"; die "wrangler dev exited"; }
  sleep 0.5
done
curl -sf -o /dev/null "http://127.0.0.1:$API_PORT/ping" || { tail -30 "$WORK/wrangler.log"; die "local worker not answering"; }

# ---- static server for the served copy -----------------------------------------------------------------------------
python3 -I -m http.server "$APP_PORT" --bind 127.0.0.1 --directory "$WORK/pwa" > "$WORK/http.log" 2>&1 < /dev/null &
HPID=$!
for _ in $(seq 1 40); do curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/" && break; sleep 0.25; done
curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/" || die "static server on :$APP_PORT failed (see $WORK/http.log)"

# ---- run ------------------------------------------------------------------------------------------------------------
SCRIPT="$HERE/e2e-v11.mjs"; [ "$MODE" = bench ] && SCRIPT="$HERE/bench-ui.mjs"
TAG="$MODE-$BROWSER"; [ "$RM" = 1 ] && TAG="$TAG-reduced-motion"
if [ "$MODE" = bench ] && [ "${BENCH_CPU_THROTTLE:-1}" != 1 ]; then TAG="$TAG-cpu${BENCH_CPU_THROTTLE}x"; fi
LOG="$WORK/$TAG.log"
echo "run-e2e-mac: $TAG · build $BUILD · worker $CF · wrangler $("$WRANGLER" --version 2>/dev/null | tail -1) · log $LOG"
PW_DIR="$PW_DIR" E2E_BROWSER="$BROWSER" E2E_REDUCED_MOTION="$RM" CHROME_PATH="$CHROME_PATH" H2P_JS="$H2P_JS" \
  E2E_OUT="$WORK/out" APP_URL="http://127.0.0.1:$APP_PORT/" BENCH_JSON="$WORK/$TAG.json" \
  node "$SCRIPT" 2>&1 | tee "$LOG"
RC=${PIPESTATUS[0]}
echo "run-e2e-mac: exit $RC · log $LOG · screenshots $WORK/out"
exit "$RC"
