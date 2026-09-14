# Multi-operation transaction execution status

AIN blockchain's compact receipts can contain `result_list` with one numeric
code per operation and no top-level `code`. Transaction detail now reads these
receipts instead of classifying every such transaction as Unknown.

- Numeric code 0 indicates success. Success requires valid, nonempty result lists
  and successful entries throughout the inspected receipt.
- A known positive failure code is displayed even if the top-level code is 0 or
  another entry is malformed. A top-level success cannot mask a failed entry.
- Missing codes, malformed entries, empty/non-contiguous lists and inspection
  beyond 1,000 receipt objects yield Unknown unless a failure was already found.
- `is_executed` must still be true for Succeeded or Failed. A false execution flag
  displays Not executed; a missing flag displays Unknown. Finalization is shown
  independently from `is_finalized`.

This interprets the connected node's receipt. It does not re-execute transactions,
prove every operation was rolled back atomically, or count operations as separate
blockchain transactions. Onchain TPS and training-record latency are unchanged.

## Verification on 2026-09-14

Twenty-eight in-memory checks passed, including retained real single-write
responses, valid/malformed multi-operation receipts, nested failures, cycle and
size limits, and execution/finalization flags. Two regressions were confirmed
against the previous implementation: a valid multi-operation receipt returned
Unknown, while top-level code 0 masked a failed sub-operation as Succeeded.

A fresh isolated chain also supplied four actual finalized setup receipts,
including two multi-operation receipts. The updated reader classified all four
as Succeeded and Finalized. `evidence/multi-operation-receipts-20260914/receipts.json`
retains the hashes, block numbers, native flags, receipts and parser outputs.
The source RPC observations are captured by ainize-core's
`scripts/test-inference-chain.sh` in `evidence.json.writes.json` under
`setupConfirmations`. The temporary chain used 2 CPU equivalents, 4 GiB RAM and
an internal network; it was removed after the check. No public service changed.

TypeScript and targeted ESLint passed. The live check exercised receipt parsing,
not a newly deployed website or a performance workload. Public deployment and
the six performance targets remain separate verification steps.
