# Live explorer refresh

Home, Recent Transactions, Blocks and Knowledge now include a shared **Refresh**
button and **Auto-refresh (15s)** control. This refreshes the existing Next server
page and its ordinary blockchain reads; there is no experiment endpoint, run ID
or workload-specific route.

Automatic refresh is on by default, except for block-history pages after page 1.
Each block page gets a fresh control state when its page number changes. Users
can pause automatic updates or refresh manually. Background tabs skip automatic
ticks, and pending router transitions suspend the timer and disable the button.
The timer is removed when the component unmounts or automatic refresh is disabled.

## Monitoring native activity

1. Open Knowledge, enter a publisher and load its records. Leave automatic refresh
   enabled to observe updated training states, dataset/model labels and inference
   batch records from that publisher's native paths.
2. Open Recent Transactions or Blocks to watch newly included writes. Follow a
   transaction hash for execution status and submission-to-inclusion latency.
3. Home refreshes its recent tables and server-loaded network metadata. Its existing
   onchain TPS sampler still runs independently at its 3-second interval.

The 15-second value is a requested refresh cadence, not a freshness guarantee or
latency measurement. RPC/index delays, sparse-chain fallback scans and failed
reads can delay updates. Existing unavailable/partial-state warnings still apply.
Refreshing multiple panels does not establish an atomic chain snapshot. Training
statuses and model/dataset counts remain sender-reported; an update does not prove
70-way training concurrency, model support, inference quality or achieved TPS.

## Validation

Controlled hook/timer checks cover default state, automatic/manual updates, hidden
tabs, disabling, pending transitions, resumption and cleanup. Page wiring checks
cover the four screens and block-page defaults. These are component-level checks,
not proof of public deployment or real workload execution. Fifteen checks passed.

Headless Chrome 145.0.7632.116 also ran the actual component with React DOM and
real timers. Five checks passed: initial enablement, manual refresh, an automatic
refresh after 15 seconds, pausing via the checkbox for a further 16 seconds, and
manual refresh while paused. The Next router was stubbed to count calls, so this
does not verify actual Next server transitions or blockchain polling. The local
fixture server, browser and temporary profile were cleaned up.

The changed files pass TypeScript checking and targeted Next ESLint with no
warnings. This feature requires deploying the updated explorer; committing or
pushing it does not change the running public website.
