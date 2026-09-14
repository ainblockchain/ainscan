# Resource-limited production build

Install the project's locked dependencies before this step. Supply a locally
available pinned image containing Node 24 and the native dependencies required by
the installed Next.js packages. The check does not install dependencies or deploy
the site. Run from the repository root:

```sh
AINSCAN_BUILD_IMAGE=sha256:52e634617c0fad0207eeba4262ecdf142fc886649253ac42e4730ce75bd04dd5 \
bash scripts/verify-production-build.sh /absolute/path/to/new-output
```

This image ID identifies the local image used for verification, not a publicly
downloadable registry reference. Preserve the image or supply a separately
prepared Node 24-compatible local image. Host-installed native dependencies must
be compatible with the image. This does not claim an Ubuntu-only deployment.

The script mounts source read-only and build output separately, uses the host
UID/GID, limits the container to two CPUs and four GiB RAM with no additional swap
and 256 PIDs, disables Next.js telemetry, and imposes a ten-minute build deadline.
There are no published ports. Only its own uniquely named container is removed on
exit, including failure. Bridge networking permits the existing `next/font`
Google Fonts dependency to download Inter; this is not an offline/hermetic build.

Outputs include `.next`, `build.log`, Docker image/resource metadata, Git HEAD,
working-tree status and an exit-code result when the build command returns.
Git HEAD alone does not identify uncommitted inputs: review `source-status.txt`.
The script propagates build, timeout and log-writing failures instead of assuming
that successful `docker start` means a successful build. Deployment, npm
publication, chain configuration and real-load tests are separate steps.

## Observed production build — 2026-09-14

The equivalent resource-limited Docker invocation built AINSCAN source at
`ce9e8fe` using Next.js 14.2.35. It completed webpack compilation, lint/type
checking, generation of 12 static pages and build trace collection with exit 0.
The generated route manifest contains the dynamic Knowledge and Transaction
Details routes, and no Experiments route. Local output is retained at
`/mnt/newdata/gov/kpi/results/ainscan-production-build-online-20260914`.
Build ID: `VbKBI--7Bqw0dkyHWI3ZS`. The actual
[app-paths manifest](evidence/production-build-20260914/app-paths-manifest.json)
is retained with this guide; compiled application bundles remain in the local output.

The first attempt with networking disabled failed at the existing Inter font
download; bridge networking resolved that build dependency. No font or unrelated
application code was changed. Remaining non-fatal warnings were stale Browserslist
data and the existing missing `findNodeAt` Hook dependency in KnowledgeGraph.
This full build supplements parser/rendering checks; it is not evidence of public
deployment, 70 simultaneous training jobs, 7,000 TPS or a five-GPU load run.
