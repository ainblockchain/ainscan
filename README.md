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

## Live experiment monitoring

The home page polls `/api/experiment/status` for a P2P experiment and also polls
the configured AIN JSON-RPC node for the latest block and transaction hashes.
P2P nodes may publish a status snapshot with a bearer token:

```bash
curl -X POST "$AINSCAN_URL/api/experiment/status" \
  -H "Authorization: Bearer $AINSCAN_EXPERIMENT_STATUS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"runId":"m2-p2p-20260913","nodeId":"peer-01","phase":"running","targetTPS":7000,"currentTPS":10421,"averageTPS":10250,"peakTPS":11818,"measured":631265,"errors":0,"block":{"number":482,"hash":"0x...","transactionCount":20,"transactionHashes":["0x..."]}}'
```

Set `AINSCAN_EXPERIMENT_STATUS_TOKEN` in the AINscan deployment environment.
The POST route is write-authenticated; the GET route is read-only for the UI.
```

## License

MIT
