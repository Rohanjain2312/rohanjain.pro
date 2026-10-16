---
name: public-repo-ci-leaks
description: Review check for designs that keep data private while this repo is public (Actions logs, artifacts, repo vs environment secrets, previews, cleanup jobs)
metadata:
  type: project
---

This repo is public, so its Actions logs and artifacts are public too. Any signed-in user can download the artifacts. `astro build` prints every route in the log. A repository secret is readable by every workflow on every branch. Only an environment secret with a deployment rule limits it. A Cloudflare Pages token is account-scoped, so a preview token can also deploy production.

**Why:** at dab006b, ADR-0016 moved `/for` data to a private repo but kept the deploy build here, which would have recreated TM-1. I filed #62 (Medium) on 2026-10-15. The fix (cb25b10) moved the build, deploy and cleanup to the private repo.

**How to apply:** for any PR or ADR that touches private data, deploys, previews or scheduled jobs, check four things. Where do the logs live? Is any artifact uploaded? Is each secret repo-scoped or environment-scoped? Can a PR preview read the data? Probe new guard-bash path rules with directory, trailing-slash, `stage`, `mv`, `-C` and `cd` forms. Related: [[severity-calibration]], [[tooling-quirks]].
