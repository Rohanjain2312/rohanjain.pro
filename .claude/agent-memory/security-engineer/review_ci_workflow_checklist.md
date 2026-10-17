---
name: review-ci-workflow-checklist
description: Checks for PRs that add CI workflows, gate scripts or scanner waivers (PR #125 review, issues #13 and #16); includes the symlink entry-guard fail-open
metadata:
  type: feedback
---

For a CI or gate-script PR, check these beyond the diff:

1. **Read the CI logs of the head, not only the check status.** For a waiver, the OSV log line "GHSA-... and 1 alias have been filtered out ... Filtered 1 vulnerability" proves it filters one ID. gitleaks logs "no gitleaks config found" until `.gitleaks.toml` lands (#111).
2. **Entry guards fail open.** `import.meta.url === file://${process.argv[1]}` skips `main` through a symlink (macOS `/tmp` is `/private/tmp`): no output, exit 0. Run each gate CLI through a symlinked path and with a failing input. Filed as Low in #127.
3. **Test hatches in gate scripts** (`--gh-fixture`, `PHASE_GATE_REPO`) are tripwire-class (ADR-0018) when an env var like `PHASE_GATE_TEST=1` re-enables them. Ask that the OK line print the data source.
4. **Pin checks that grep lines** miss `uses :`, flow style, next-line values and `docker://`. Probe each form. `sha_pinning_required: true` is the live backstop.
5. **Test the config on the merge result with current main.** `git merge-tree --write-tree origin/main pr<N>` gives a tree to `git archive`. The PR head can miss fonts or styles that landed since (PR #125 lacked #124). Then check dist for `<style>`, inline scripts and `data:` URIs against `public/_headers`.
6. **Waiver pattern accepted (ADR-0021):** ID-only, `ignoreUntil` cap, reason, ADR, `docs/needs-client.md` entry, and a removal condition. Verify the advisory with `gh api /advisories/<GHSA>` (patched version null) and `npm ls <pkg> --omit=dev`.
7. **Re-review scope:** limit to the files my findings named, say so in the first review, and confirm unchanged files by diffing the two heads (`git diff <old>..<new> --stat`).

**Why:** PR #125 had three review rounds' worth of items; the symlink fail-open was found only by probing the CLI path, not by reading it.

Related: [[review-checklist-escaped-defects]], [[dependency-review-checklist]], [[tooling-quirks]]
