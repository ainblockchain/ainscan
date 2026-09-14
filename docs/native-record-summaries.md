# Native records in ordinary transaction lists

The home page, Recent Transactions and block detail pages share the transaction
table. Its **Native Records** column identifies training writes, inference
batches, state-channel references and escrow references without an experiment
section or run identifier. Open the transaction hash for full native fields,
execution/finalization information and, where available, training record latency.

Full tables preview the first training job, reported status, dataset ID and model
ID, plus the first inference model. The compact home table shows category counts
without the ID previews. Displayed previews are limited to 120 characters;
transaction details retain the full values. Summaries never render question or
answer fields.

Counts refer to recognized operations/references within one transaction, not
distinct jobs, concurrent pipelines, supported models or successful outcomes.
Repeated lesson writes count separately. Inference request rates are not summed
or presented as blockchain TPS. Existing parsers inspect at most 1,000 operation
items and 32 nesting levels; reaching the limit displays a partial-inspection
warning. The result is a navigation aid, not independent validation of payloads.

Both flattened REST rows (`operation`) and full block transactions
(`tx_body.operation`) are supported. Full block transactions were previously
mislabelled TRANSFER because only the flattened field was read. Hash-only rows
now display UNKNOWN rather than inventing a transfer type.

## Verification on 2026-09-14

- Twelve SSR checks passed, covering raw/flattened rows, compact rendering,
  nested mixed records, malformed inference payloads, channel/escrow paths,
  bounded traversal, escaped labels, preview limits and hash-only rows.
- Real retained isolated-chain transactions were rendered for training
  `0x754a947eafdaeacc9492bf3903ebcf797f1bf9f3df10d18e1595e8ab0a834530`
  and inference
  `0xb966241731995759b58b0121dab4176f3fe02835ec6c34b385c088bd1bf4cb23`.
  Their source evidence lives in ainize-core's
  `test/evidence/training-state-20260914` and
  `test/evidence/write-acknowledgement-20260914` directories. Both use synthetic
  records; this check did not execute training or inference workloads.
- TypeScript `tsc --noEmit` passed. SSR markup and the check summary are retained
  in `evidence/native-record-summaries-20260914/`. The HTML omits stylesheet assets
  and stubs Next Link as a normal anchor; it is not a browser screenshot.

This change has not been deployed to the public explorer. These checks do not
establish the six performance targets or replace the workload reproduction steps.
