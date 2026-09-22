# L1 and L2 benchmark throughput

The home page retains the existing on-chain TPS window and adds separate **L1 experiment peak TPS** and **L2 peer TPS** cards. L1 leads with its observed block-interval maximum; L2 leads with its average. Each shows its average, observed peak, measurement count and duration, phase, run ID, and completion/update timestamp. Completed runs remain visible after traffic stops. The L2 chart uses one-second bins; the L1 chart uses finalized block intervals.

`/api/benchmarks` reads finalized state under `/apps/ai_network_dag/benchmarks/{l1,l2_peer}/latest` on the configured chain. Each record contains `version:1`, its kind, run ID, genesis hash, timestamps, phase, elapsed milliseconds, measured transfers, average/peak/current rates, failures, `samplesJson`, and final checkpoint hash. Arrays are JSON-encoded strings because AIN's state object format does not accept arrays. The API checks chain identity and arithmetic, and verifies that completed runs reference a successful checkpoint transaction in an archived canonical block at least two blocks behind the head, at the matching run's expected path. It returns no cached success on an upstream error. Live updates older than 30 seconds are marked interrupted.

L2 numbers count signed peer transfers verified by the sender after receiver persistence. They are not added to on-chain TPS. A low on-chain TPS during an L2-only load is expected: only setup, opening, monitor updates, and the final checkpoint are on-chain.

The single M2 entrypoint is `kpi_test/m2/run-m2-layer2-tps-benchmark.sh`, which checks the 7,000 average L2 TPS target and publishes the result. Previous L1 experiments use the separate underlying `kpi/harness/l1-load.js` harness. That harness increases transaction submission rates across ten AWS nodes, independently matches block hashes, and counts successful finalized transactions. Its maximum is an observed per-block-interval peak, not a claimed theoretical limit. Submission rejects and pending transactions are retained in the experiment evidence.

Checks: `scripts/verify-benchmark-status.sh`, `npm run build`, and local `/api/benchmarks` against the AWS chain. The historical L2 run `m2_optimized_20260921T235045Z` provides 489,778 measured transfers / 60 seconds = 8,162.97 TPS, with a finalized checkpoint.

## Current activity versus completed experiments

The page separates **Latest experiment results** from **Current network activity**.
Current L1 TPS is the rolling average over the latest ten block intervals for all
included chain transactions. It is expected to fall after the load finishes.
The experiment cards preserve the measured run window, using the L1 successful
transaction peak per block interval and L2 acknowledged-transfer average.

The former “Today’s observed TPS peak” chart was removed: it only held samples
from the current browser session and could not establish a daily network peak.
It also took the maximum of rolling averages, which is a different metric from
the experiment's peak per block interval. No historical experiment result is
substituted into the live chain counter.
