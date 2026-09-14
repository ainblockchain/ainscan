# AINscan

Blockchain explorer for [AI Network](https://ainetwork.ai).

**Live**: [ainscan.ainetwork.ai](https://ainscan.ainetwork.ai)
**Repo**: [github.com/ainblockchain/ainscan](https://github.com/ainblockchain/ainscan)

## Features

- **Dashboard** — Live network stats: current block, peer count, consensus status, latest blocks and transactions
- **Blocks** — Browse all blocks or filter to blocks with transactions, with pagination
- **Transactions** — Search and inspect transactions by hash, address, or block number
- **On-chain TPS** — Counts included transactions over consecutive block intervals, including empty blocks; separate from Layer 2 or inference throughput
- **Training Records** — Decodes native lesson records in transaction details, with dataset ID/hash, reported training rows, knowledge or draft ID/hash, backend and submission-to-inclusion latency when the required timestamps exist. These are sender-reported fields, not proof of model quality or inference success; rows are not a dataset count.
- **Execution Receipts** — Transaction Details shows RPC-reported execution and finalization separately, plus the raw receipt. Success requires explicit execution and a numeric zero receipt code. Missing receipts, including block-scan fallbacks, remain unknown rather than successful. Failed transactions retain their requested operations for inspection; inclusion latency does not establish that a write succeeded.
- **Publisher Training State** — Knowledge → Training Records reads native lesson state for a selected publisher, with job links, reported status, dataset IDs, model IDs and row counts. This is part of the existing knowledge explorer, not an experiment dashboard. See [training state browsing](docs/training-state-browsing.md) for count scope and limitations.
- **Publisher Inference State** — The same Knowledge publisher selection shows native inference batches, distinct reported model IDs, interval timestamps and per-batch request rates. Rates are never summed across overlapping intervals or presented as blockchain TPS. See [inference state browsing](docs/inference-state-browsing.md).

- **State Channels** — Automatically shows the current on-chain state and proof hash for channel paths found in a transaction, including batched operations
- **Escrow Contracts** — Recognizes native `/escrow` contract operations, escrow service-account balances and incoming/outgoing transfer paths used by the cooperative channel SDK. Transaction details link both participants and the contract database path and show current configuration/approval/release records. Closing sequences are not presented as verified off-chain TPS.
- **Validators** — Active validators with stake amounts and proposal rights
- **Accounts** — Balance, nonce, and transaction history per address
- **Knowledge Graph** — Interactive visualization of the on-chain decentralized knowledge base: topics, explorations, relationships, and explorer stats
- **Database Explorer** — Raw on-chain data inspection (getValue, getRule, getOwner, getFunction)

## Tech Stack

See [resource-limited production build verification](docs/production-build-verification.md)
for the Docker build command and [runtime chain configuration](docs/runtime-chain-configuration.md)
to keep server-rendered pages and browser updates on the same blockchain.

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS |
| Charts | Recharts |
| Data Fetching | SWR |
| Backend | Server-side JSON-RPC with a same-origin read-only browser proxy |

## Getting Started

```bash
git clone https://github.com/ainblockchain/ainscan.git
cd ainscan
npm install
npm run dev
```

## Explorer data

AINscan reads blocks, transactions and network state from the configured AIN
JSON-RPC node. It does not accept benchmark status uploads or require a run ID.
Benchmark execution, sample selection and pass/fail assessment belong to external
scripts, not to the blockchain explorer.

Transaction details recognize native Ainize inference batch writes under
`/apps/knowledge/market/inference_batches/<node-address>/<batch-id>`. Valid version-1
records show the model, completed request count, observation interval, reported
requests per second and receipt commitment. Malformed records remain visible as
raw operations, without a derived rate. Counts, clocks and commitments are not
independently verified, and transaction fields alone do not prove execution
success. These rates never replace network onchain TPS or aggregate overlapping
intervals. Automatic node receipt production and real-load reconciliation remain
separate integration work; this display does not establish measured throughput.

Native training and inference records inside `SET.op_list` batches are also
shown in transaction details, in operation order. Each expandable item identifies
its exact operation position and database path, including repeated writes to the
same path. Training items expose dataset/model/knowledge fields and the reported
submission-to-block latency; inference items expose their reported observation
interval and request count. These are transaction writes, not a count of
simultaneously running jobs or independently verified datasets/models.

The shared operation traversal used by native records, state channels and escrow
references examines at most 1,000 items and 32 nesting levels. A visible warning
identifies a truncated inspection; at most 100 recognized nested native records
are expanded into detail panels, with the full raw operation still available.
Invalid out-of-range training timestamps display as unavailable rather than
breaking the transaction page. Existing top-level record details are unchanged.

## License

MIT
