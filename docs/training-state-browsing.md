# Browse native publisher training state

Open **Knowledge → Training Records**. Select a publisher suggested by the native
chain state, or enter its ID, then select **Load Records**. A direct link can use
`/knowledge?publisher=<node-id>#training-records`. The ID identifies the writer in
the native lesson path; it is not a test label or Run ID.

The existing Knowledge page queries `ain_get` with `is_shallow: true` at
`/apps/knowledge/market/lessons` to discover publishers. The selected publisher's
records come from `/apps/knowledge/market/lessons/<node-id>`. No Ainize web or node
API, benchmark database, experiment API or private credential is used. The
explorer must be configured for the same chain that receives the lesson writes.

The panel displays:

- Loaded dataset-backed lessons and their current reported status.
- The number of loaded records whose status is `TRAINING`.
- Distinct reported dataset IDs within that publisher.
- Distinct nonempty model IDs reported by those records.
- A table linking each job to its native state in the database browser, with
  dataset ID, model ID and reported training rows.

These counts do not certify simultaneous GPU execution, successful inference,
Hugging Face support, content uniqueness, dataset publication or quality.
Repeated jobs using the same dataset ID count once as a dataset; identical data
with different IDs can count more than once. Model labels are not model revision
attestations. Stored `TRAINING` statuses may be stale after a failed later write.

The panel summarizes current state, not historical inclusion or execution
receipts. Follow an original submission transaction hash through the ordinary
Transactions search to inspect those, including reported submission-to-block
latency. The publisher view is refreshed by loading the page again; it is not
an independently synchronized snapshot or concurrency measurement.

Suggestions are limited to 100 publisher IDs; other IDs can be entered directly.
At most 1,000 lesson entries are interpreted and 100 recognized lessons shown in
the table. Invalid or shallow records and truncation trigger a partial-summary
warning. Counts describe only recognized loaded records, never network totals.
RPC errors produce an unavailable message, not invented zero counts. If a large
publisher subtree cannot be returned by the chain, use Browse Native State to
inspect smaller paths; this panel does not claim paginated network-wide coverage.

Validation used TypeScript checking and in-memory server rendering with 70
synthetic dataset-backed lessons, scoped dataset/model deduplication, malformed
entries, oversized input, invalid publisher paths and RPC errors. This is not
evidence that 70 real jobs ran concurrently or that the public site was deployed.
