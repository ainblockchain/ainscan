# Browse native inference records

Open **Knowledge**, enter an AIN publisher address in the shared publisher form,
and select **Load Records**. **Inference Records** shows the current native state
at `/apps/knowledge/market/inference_batches/<address>`. Publishers are discovered
from both lesson and inference-batch roots, so training is not a prerequisite.
The selected address is case-sensitive as stored in the chain path.

Each recognized version-1 batch displays its native database link, reported model
ID, completed request count, interval timestamps and requests per second. The
summary counts loaded batches and distinct model labels among them. It never
adds rates or claims an all-node TPS. A node may report overlapping batches or use
the same model in many batches; these are not independent supported models.

This view reuses the transaction-details batch parser and rejects malformed
schemas, node/path mismatches, invalid clocks and counts. It does not independently
recompute the receipt commitment or content-addressed path from off-chain receipts.
Those checks belong to the external client-to-chain reconciliation. Reported
state alone does not verify receipt coverage, client delivery, quality, Hugging
Face revisions, GPU count or training/dataset provenance.

At most 1,000 state entries are interpreted and the 100 most recent intervals
among those loaded are displayed. Partial or malformed responses carry warnings;
the selected table is not necessarily the newest across a larger unqueried state.
An unavailable RPC response does not become zero batches or zero TPS. Empty valid
state is shown as no recognized batches. The page refreshes on reload; no new
experiment API, background workload or public model invocation is introduced.

Use the original batch transaction hash in normal **Transactions** search for its
execution receipt and containing block. A database-state link is not a transaction
hash or historical receipt. Inference-only publishers can have an empty training
table while their inference batches are present.

Validation included TypeScript checking and in-memory server rendering using the
actual native operation from the previously completed real base-model chat
integration: `Qwen3.8-Flash-Next`, one request, isolated block 53. That retained
block was rendered with its exact native path. Additional checks covered partial
publisher discovery, RPC failure, invalid paths, node mismatch and bounded model
deduplication. This reuses existing real-request evidence; it is not a new GPU
load run, a 240-user result or a claim that the public website is deployed.
