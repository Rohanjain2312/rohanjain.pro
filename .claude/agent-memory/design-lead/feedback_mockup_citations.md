---
name: feedback-mockup-citations
description: When citing reference/mockup line numbers in docs/design/spec.md, grep for exact lines; estimates drift by 1 to 3 lines
metadata:
  type: feedback
---

Cite mockup line numbers only after `grep -n` on a distinctive string. Never estimate from a chunked read.

**Why:** In issue #6 (2026-10-15) about 30 citations in `docs/design/spec.md` were off by 1 to 3 lines and had to be corrected before commit. The spec is the reference reviewers use against screenshots, so wrong pointers waste review time.

**How to apply:** Any time the spec or a review cites `Main.dc.html`, `For.dc.html` or `404.dc.html` lines. Also note: the worktree sandbox rejects compound shell commands that mix `git` with loops or `sed -n "${n}p"`; use `awk 'NR==..'` or plain single commands.

Technique that worked on #19: a small Python script in the scratchpad that extracts every `Lnn`, `For Lnn`, `404 Lnn` from the spec and prints the cited mockup line next to it (`awk -v` loops are rejected by the sandbox). The outline's 404 L30 to L33 cites were off by one (error span is L31, note L32, link L33).

Related: [[mockup-vs-rules-conflicts]]
