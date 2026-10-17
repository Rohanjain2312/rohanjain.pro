---
name: recruiter-copy-present-tense
description: Recruiter-facing docs (README, site copy) must not describe features, CI or pages that do not exist at the reviewed head; check every present-tense product claim against the tree
metadata:
  type: feedback
---

Recruiter-facing text describes only what exists at the reviewed head. Planned features and CI are labelled as planned, or point to `docs/status.md`.

**Why:** PR #84 (README) described a fit check, a forwardable brief, résumé PDFs on the site, `src/` pages and CI enforcement, none of which existed. R-005 bans invented claims, and a recruiter who clicks finds nothing. This was a Medium finding that required changes.

**How to apply:** For any README or copy PR, list each present-tense product claim and check it against the tree (`ls src`, `ls .github/workflows`, the routes that actually return 200). Anything missing gets "planned" wording or a link to status. Also check CI claims ("enforced by CI", "everything CI runs") against `.github/workflows/`.

Related: [[project-qa-tooling-gaps]].
