# Architecture Decision Records

Format: context, decision, consequences, alternatives. New ADRs take the next number.

| ADR | Decision |
|---|---|
| [0001](0001-astro-static-output.md) | Use Astro with static output |
| [0002](0002-local-first-cloudflare.md) | Local-first build; Cloudflare Pages and DNS; domain at Porkbun |
| [0003](0003-no-runtime-server-or-llm.md) | No runtime server code and no runtime LLM calls |
| [0004](0004-deterministic-fit-check.md) | Deterministic client-side fit check with tiered skills |
| [0005](0005-evidence-ledger.md) | Content-driven numbers and the Evidence Ledger |
| [0006](0006-self-hosted-fonts.md) | Self-hosted fonts; italic serif for margin notes |
| [0007](0007-applications-store-results-only.md) | Per-application pages store results only |
| [0008](0008-cookieless-analytics.md) | Cookieless analytics only |
| [0009](0009-public-repo-trunk-signed.md) | Public repo, trunk-based, signed commits |
| [0010](0010-resume-pdfs-at-build.md) | Résumé PDFs generated from content at build time |
| [0011](0011-autonomous-phases.md) | Autonomous phase progression with usage-aware session control |
| [0012](0012-progressive-disclosure.md) | Instructions by progressive disclosure |
| [0013](0013-bootstrap-empty-main.md) | Bootstrap main with an empty root commit |
| [0014](0014-signed-commit-rule-paused.md) | Pause the signed-commit rule until the signing key is uploaded (superseded: rule restored by PR #68) |
| [0015](0015-design-outline-decisions.md) | Decisions on the design spec outline's open questions |
| [0016](0016-applications-data-private.md) | Keep per-application data out of the public repo |
| [0017](0017-r511-fix-prs.md) | PRs that close open findings may merge under R-511 |
| [0018](0018-hooks-are-tripwires.md) | Hooks are tripwires; input controls and token scope are the boundary |
| [0019](0019-license-scope.md) | License scope: site copy is reserved, repository docs are MIT |
| [0020](0020-faster-reviews.md) | Faster reviews: sonnet reviewers, parallel review order |
| [0021](0021-osv-braces-waiver.md) | Time-boxed OSV waiver for dev-only braces advisory |
| [0022](0022-parallel-agents-and-low-deferral.md) | More parallel agents, haiku for chores, Low findings deferred to their trigger |
| [0023](0023-npm-release-cooldown.md) | Seven-day release cooldown for manual npm installs; "latest stable" means newest release at least 7 days old |
| [0024](0024-ship-faster.md) | Ship faster: product first, bigger slices, bounded reviews |
| [0025](0025-gate-time-releases.md) | Gate-time releases instead of release-please |
| [0026](0026-combined-review-lean-gates.md) | One combined review, merged phases, lean gates |
| [0027](0027-status-data-branch.md) | Status data goes to a data branch, not a daily PR |
| [0028](0028-synthetic-golden-set.md) | The golden set is synthetic: no real posting text, URLs or companies |
| [0029](0029-fitcheck-initial-thresholds.md) | Fit-check initial thresholds (spec 5.4 values, untuned) |
