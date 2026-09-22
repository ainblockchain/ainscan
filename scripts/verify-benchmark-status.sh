#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
output=$(mktemp -d)
trap 'rm -rf "$output"' EXIT
node_modules/.bin/tsc lib/benchmark-status.ts --target es2022 --module commonjs --outDir "$output" --skipLibCheck
BENCHMARK_STATUS_MODULE="$output/benchmark-status.js" node --test tests/benchmark-status.cjs
