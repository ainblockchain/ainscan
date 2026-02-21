# AINscan

Blockchain explorer for [AI Network](https://ainetwork.ai).

**Live**: [ainscan.ainetwork.ai](https://ainscan.ainetwork.ai)
**Repo**: [github.com/ainblockchain/ainscan](https://github.com/ainblockchain/ainscan)

## Features

- **Dashboard** — Live network stats: current block, peer count, consensus status, latest blocks and transactions
- **Blocks** — Browse all blocks or filter to blocks with transactions, with pagination
- **Transactions** — Search and inspect transactions by hash, address, or block number
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

## License

MIT
