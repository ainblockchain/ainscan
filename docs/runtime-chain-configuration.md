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

## Network selection

AINSCAN serves two networks, chosen per request by the `network` query parameter:

| `?network=` | JSON-RPC | Events | Chain ID |
|---|---|---|---|
| `mainnet` (default) | `https://mainnet-api.ainetwork.ai/json-rpc` | `wss://mainnet-event.ainetwork.ai` | 1 |
| `testnet` | `https://testnet-api.ainetwork.ai/json-rpc` | `wss://testnet-event.ainetwork.ai` | 0 |

The header selector switches networks. Internal links, search and pagination keep
the parameter, so a testnet URL is shareable as-is. The last explicit choice is
remembered in `localStorage` and in the `ainscan_network` cookie; a page load
without `?network=` is redirected by `middleware.ts` to the remembered network, so
server rendering never uses a different network than the URL shows. Unknown values
fall back to mainnet. Browser SWR keys and the database browser include the
network, so cached results from one network are never shown under the other.

Server-rendered pages, `/api/rpc`, `/api/benchmarks` and `/api/knowledge` all take
the network from the request. Endpoints can be overridden per network on the
server with `AIN_MAINNET_RPC_URL` and `AIN_TESTNET_RPC_URL`:

```sh
AIN_TESTNET_RPC_URL=http://your-testnet-node:8081/json-rpc npm run start
```

The former single-endpoint `AIN_RPC_URL` / `NEXT_PUBLIC_RPC_URL` settings are no
longer read: one endpoint would serve the same chain under both network labels.
Browser updates call same-origin `/api/rpc` with `{ network, method, params }`;
no browser CORS access to the chain node is required.

The public gateways answer the REST history index (`/recent_transactions`,
`/recent_blocks_with_transactions`, `/network_status`) with 403, so recent blocks
and transactions come from a bounded RPC scan of the latest 1,000 blocks
(`RECENT_SCAN_BLOCKS` in `lib/rpc.ts`) and Node Count shows `-`. Mainnet can go
thousands of blocks without a transaction, so an empty "latest transactions" list
is expected there. Transaction lookups that miss the hash index scan the same
window rather than the whole chain.

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

## KPI AWS network (2026-09-21, superseded)

Superseded by the mainnet/testnet selection above: the gateway below stopped
accepting connections, which made the homepage server render exceed the Vercel
function timeout.


The production deployment selects `http://3.89.93.84:8088/json-rpc` in
`vercel.json`. This is a read-only gateway on the first KPI EC2 validator,
not its write-capable RPC port. It allows only the explorer read-method list
and the two recent-history REST endpoints. Transaction submissions and
other methods are rejected. Validator port 8080 remains restricted.

The ten instances belong to run `ain-p2p-20260921225407` in `us-east-1b`.
Changing the AWS deployment requires updating this endpoint and redeploying;
EC2 public IPs can change after stop/start. Do not silently fall back to devnet
when the test chain is unavailable.
