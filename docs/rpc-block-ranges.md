# Complete block ranges without a transaction index

AIN blockchain's `ain_getBlockList` and `ain_getBlockHeadersList` use
`[from, to)`: the upper bound is excluded. AINSCAN previously passed an inclusive
last height as `to`, dropping the newest block and one block at every 20-block
boundary. The same issue affected block pagination and fallback hash lookup.
A chain containing only genesis was also treated as empty.

The explorer now requests `last + 1` for inclusive windows, handles height zero,
and sorts each returned block batch before taking the requested recent count.
Failed fallback RPC reads propagate instead of silently becoming empty results.
Genesis detail reads request full transactions to avoid mutating cached genesis
transactions in older blockchain servers. These changes use ordinary read-only
RPC methods; no experiment API, run identifier, AWS runner or external index is
required.

## Verified on 2026-09-14

- Before the change, a fixture whose only transaction was in head block 20
  returned no recent transaction. The assertion failed against the old source.
- Fifteen in-memory RPC assertions passed after the change: head heights 0, 1,
  20 and 40; transactions at 40/20/0; newest-first block selection; full-body
  reads; invalid heights; and propagation of RPC failures.
- Six server-rendered page fixture checks passed: complete first/second block
  pages, the genesis-only page, and index-free transaction lookup at 0/20/40.
  Genesis lookup issued only full-transaction block reads.
- TypeScript `tsc --noEmit` and `git diff --check` passed.
- The production Next.js build passed in the constrained Docker build wrapper
  (2 CPU equivalents, 4 GiB RAM). `evidence/rpc-ranges-20260914/build.json` records
  its build ID, image, result and code-file digests. Existing warnings concern
  outdated Browserslist data and `KnowledgeGraph.tsx`'s `findNodeAt` dependency.
- A fresh isolated real blockchain reached height 2. `[2, 3)` returned block 2;
  fallback recent-block and recent-transaction reads found genesis block 0 and
  its transaction. A separate full-block read confirmed hash membership. The
  REST index response was deliberately replaced with an empty response in the
  probe; RPC responses were real. See
  `evidence/rpc-ranges-20260914/chain-read.json` for calls, hashes and image ID.
  The temporary internal-network node used 2 CPU equivalents and 4 GiB memory
  with no extra swap, no published ports and only the standard public development
  key. Its container and network were removed; existing services were untouched.

The real-chain probe establishes RPC range compatibility, not successful training
or inference throughput. Boundary transactions and page rendering used fixtures.
No public website deployment or achievement of the six performance targets is
claimed.

## Operator verification

Point the server's `AIN_RPC_URL` at the intended node and start the built explorer
as described in `runtime-chain-configuration.md`. On a chain with known block history:

1. Open `/blocks`. The first row should be the current head. When enough history
   exists, each full page has 20 consecutive block heights without a gap between
   pages. A genesis-only chain displays block 0.
2. Open `/blocks?filter=tx` and `/transactions` against a node without the optional
   REST transaction index. Compare listed hashes/heights with full blocks from
   that same node.
3. Open `/transactions/<hash>` without a block hint. If the hash index cannot
   answer, fallback lookup must still find transactions at the head and at
   20-block scan boundaries. For a lesson transaction, inspect its native fields
   and Training Record Latency; inclusion alone does not prove execution success.

Fallback scans can still be expensive for sparse or long chains. This change
does not add a history index or promise bounded lookup latency.
