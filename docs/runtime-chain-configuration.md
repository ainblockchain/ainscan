# One runtime chain for server and browser

## Genesis identity on Home

The home statistics display a Genesis Block hash linked to `/blocks/0`. Each TPS
observation reads genesis before and after its consecutive block window; missing
identity or a changed hash prevents a TPS value. If a later sample identifies a
different genesis from the server-rendered page, the statistics are hidden and a
reload warning appears, avoiding a new-chain TPS beside old-chain block tables.
Failed initial height queries are unavailable, not height zero. Peer/consensus
props remain page-load observations, not independent live liveness measurements.
Genesis equality alone cannot distinguish forks sharing genesis or replace
consensus verification.

Genesis polling explicitly requests full transactions to avoid the destructive
hash-only projection in older nodes. Verification
found an old-node bug where hash-only genesis reads altered cached transactions
and eventually returned HTTP 500. The blockchain fix and read-only reproduction
are in `ain-blockchain/docs/rpc-block-read-safety.md` on the
`year3/m1-sharding-protocol` branch. Deploy that fix to protect other hash-only
RPC consumers as well. This explorer change does not restart
nodes or repair their already-mutated caches.

## Runtime endpoint

Set `AIN_RPC_URL` on the running AINSCAN server to select its blockchain endpoint:

```sh
AIN_RPC_URL=http://your-chain-node:8081/json-rpc npm run start
```

Both server-rendered pages and the existing `/api/rpc` proxy use this runtime
setting. Browser SWR updates, including block/TPS polling, call same-origin
`/api/rpc` instead of contacting a build-time upstream URL directly. The database
browser already uses that proxy. No browser CORS access to the chain node is
required. The URL must be reachable from the AINSCAN server/container; its
`localhost` is not the user's workstation or a separate blockchain container.

Selection order is `AIN_RPC_URL`, legacy `NEXT_PUBLIC_RPC_URL`, then the existing
devnet default. `AIN_RPC_URL` is server-side runtime configuration and is not
exposed as a browser-selectable target. Legacy `NEXT_PUBLIC_RPC_URL` can still be
inlined during a Next.js build, so prefer `AIN_RPC_URL` when promoting one build
between environments. Restart the server/container after changing its environment.
REST index reads also use the selected server endpoint; browser fallback scans
use the same-origin RPC proxy, not another direct REST endpoint.

The proxy allows only the read methods used by the explorer: native state reads,
block/transaction reads, balance/nonce, validators, rule/function/owner matching,
and network status. Submission, key injection and other unsupported methods are
rejected before any upstream request. It is not a wallet or administrative RPC
gateway. Requests cannot supply an alternative upstream URL. Upstream reads use
a 15-second timeout and no caching. JSON upstream HTTP statuses are preserved;
transport and non-JSON failures return a generic 502 without upstream exception
text or internal endpoint details. This is not rate limiting or authorization for
private chain state; do not expose a private explorer without its access controls.

## Confirm chain identity

Compare block zero from the expected chain with the same read through AINSCAN:

```sh
curl -sS http://localhost:3000/api/rpc \
  -H 'Content-Type: application/json' \
  --data '{"method":"ain_getBlockByNumber","params":{"number":0,"getFullTransactions":true}}'
```

Check the returned genesis hash against the agreed chain, then inspect the same
native transaction hash in Transactions and its current records in Knowledge.
No Run ID or experiment API is involved. Source-level checks exercise runtime
override, browser proxy routing, protocol handling, rejected write/admin methods,
429 propagation and generic errors. Public deployment and performance tests remain
separate from configuration and build validation.

## Built-server check — 2026-09-14

The updated working tree passed `verify-production-build.sh` in the two-CPU,
four-GiB Docker build environment. The built server was then started in a separate
one-CPU, one-GiB container, bound only to `127.0.0.1:39461`, with
`AIN_RPC_URL=http://127.0.0.1:23181/json-rpc` supplied at **runtime**, not build time.
Its proxy returned the same block-zero hash as a direct read of that existing
local chain. An unsupported method returned 400, and the actual Knowledge page
returned 200 with both Training Records and Inference Records, without an
Experiments link. No transactions were submitted and existing chain nodes were
not modified. Both temporary verification containers were removed afterwards.

The [runtime check](evidence/runtime-rpc-20260914/runtime-check.json),
[build resource metadata](evidence/runtime-rpc-20260914/docker.json) and
[build result](evidence/runtime-rpc-20260914/result.json) are retained. The build
included uncommitted RPC changes; its [working-tree status](evidence/runtime-rpc-20260914/source-status.txt)
is included rather than presenting the earlier Git HEAD as the entire build input.
Full local output is `/mnt/newdata/gov/kpi/results/ainscan-runtime-rpc-build-20260914`.
This confirms runtime endpoint routing and compiled page availability, not live
browser automation, populated data on that chain, public deployment or KPI success.

## KPI AWS network (2026-09-21)

The production deployment selects `http://3.89.93.84:8088/json-rpc` in
`vercel.json`. This is a read-only gateway on the first KPI EC2 validator,
not its write-capable RPC port. It allows only the explorer read-method list
and the two recent-history REST endpoints. Transaction submissions and
other methods are rejected. Validator port 8080 remains restricted.

The ten instances belong to run `ain-p2p-20260921225407` in `us-east-1b`.
Changing the AWS deployment requires updating this endpoint and redeploying;
EC2 public IPs can change after stop/start. Do not silently fall back to devnet
when the test chain is unavailable.
