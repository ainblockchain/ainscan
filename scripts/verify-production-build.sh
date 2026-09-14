#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
IMAGE=${AINSCAN_BUILD_IMAGE:?Set a locally available pinned Node 24 Docker image ID}
OUTPUT=${1:?Usage: verify-production-build.sh NEW_OUTPUT_DIRECTORY}
[[ "$IMAGE" =~ ^sha256:[a-f0-9]{64}$ ]] || { echo 'Pinned local image ID required' >&2; exit 1; }
[[ ! -e "$OUTPUT" && -d "$ROOT/node_modules/next" ]] || { echo 'New output path and installed dependencies required' >&2; exit 1; }
docker image inspect "$IMAGE" >/dev/null
umask 077
mkdir -p "$OUTPUT/.next"
OUTPUT=$(cd "$OUTPUT" && pwd)
NAME="ainscan-build-check-$$-$(date +%s)"
CREATED=false
cleanup() { if "$CREATED"; then docker rm -f "$NAME" >/dev/null; fi; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
docker create --name "$NAME" --network bridge --cpus 2 --memory 4g --memory-swap 4g --pids-limit 256 \
  --user "$(id -u):$(id -g)" -e NEXT_TELEMETRY_DISABLED=1 -e NODE_OPTIONS=--max-old-space-size=2048 \
  -v "$ROOT:/work:ro" -v "$OUTPUT/.next:/work/.next" -w /work --entrypoint node \
  "$IMAGE" node_modules/next/dist/bin/next build >/dev/null
CREATED=true
docker inspect "$NAME" --format '{"image":"{{.Image}}","cpuNano":{{.HostConfig.NanoCpus}},"memoryBytes":{{.HostConfig.Memory}},"memorySwapBytes":{{.HostConfig.MemorySwap}},"pidsLimit":{{.HostConfig.PidsLimit}},"network":"{{.HostConfig.NetworkMode}}"}' > "$OUTPUT/docker.json"
git -C "$ROOT" rev-parse HEAD > "$OUTPUT/source-commit.txt"
git -C "$ROOT" status --short > "$OUTPUT/source-status.txt"
set +e
timeout 600 docker start -a "$NAME" 2>&1 | tee "$OUTPUT/build.log"
PIPE_CODES=("${PIPESTATUS[@]}")
set -e
STATUS=$(docker inspect "$NAME" --format '{{.State.ExitCode}}')
if [[ "${PIPE_CODES[0]}" != 0 ]]; then STATUS=${PIPE_CODES[0]}; fi
if [[ "${PIPE_CODES[1]}" != 0 ]]; then STATUS=${PIPE_CODES[1]}; fi
printf '{"exitCode":%s}\n' "$STATUS" > "$OUTPUT/result.json"
exit "$STATUS"
