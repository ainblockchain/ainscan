# Transaction-bearing block pagination

The ordinary Blocks page's **With Transactions** filter now requests one extra
block beyond the current page's boundary. The extra block is used only to decide
whether Next should be enabled; it is not shown on the current 20-block page.

Previously, the page requested exactly `20 * page` blocks, then tested whether
the response contained more than `20 * page` blocks. For a provider honoring the
requested limit, this condition was impossible. Next stayed disabled even when
more transaction-bearing blocks existed.

## Verification on 2026-09-14

Twelve server-rendered fixture checks passed. With 70 transaction-bearing blocks,
pages 1–3 enable Next, page 4 does not, and all 70 block numbers are visited once
without gaps or duplicates. Previous and the `filter=tx` parameter are preserved.
Additional checks cover histories of 0, 1, 19, 20, 21, 40 and 41 matching blocks.
The old source was checked against the same fixture and left Next disabled on
page 1. TypeScript and targeted ESLint passed without warnings.

These are pagination fixtures, not 70 training jobs or proof of a live node's
complete index. Index availability and sparse-chain RPC scan cost still depend
on the selected provider. This patch does not add an experiment API, change TPS
calculation, or deploy the public explorer.
