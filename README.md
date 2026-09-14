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
- **State Channels** — Automatically shows the current on-chain state and proof hash for channel paths found in a transaction, including batched operations
- **Validators** — Active validators with stake amounts and proposal rights
- **Accounts** — Balance, nonce, and transaction history per address
- **Knowledge Graph** — Interactive visualization of the on-chain decentralized knowledge base: topics, explorations, relationships, and explorer stats
- **Database Explorer** — Raw on-chain data inspection (getValue, getRule, getOwner, getFunction)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS |
| Charts | Recharts |
| Data Fetching | SWR |
| Backend | Direct JSON-RPC to AIN blockchain nodes |

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

## License

MIT
