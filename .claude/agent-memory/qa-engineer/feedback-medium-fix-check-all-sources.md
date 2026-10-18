---
name: feedback-medium-fix-check-all-sources
description: On a re-review, a Medium that names several conflicting sources is fixed only when every named source agrees at head, not only the file the builder edited.
metadata:
  type: feedback
---

When a Medium lists N spec or ADR sources that disagree, check all N at the new head before clearing it. A diff that fixes the ADR and one spec section can leave a third source (or a fourth) stating the old owner.

**Why:** PR #189 (ADR-0027, issue #188). My round-1 Medium on the status-data fetch owner cited docs/spec/11-phases.md line 65 ("deploys via deploy.yml") as a conflicting source. The round-2 fix named the private production workflow in ADR-0027 and spec 06 5.7, consistent with ADR-0016 and spec 10 §10.2, but left 11-phases untouched. The owner criterion read as met, but the spec set still disagreed on where the production deploy runs. I blocked on that one line.

**How to apply:** on any re-review, grep the head tree for each source the earlier Medium named, and for each deploy, owner or claim term in the same sentence family (for PR #189: `deploy.yml`, `deploy workflow`, `production build`, `status-data`, `status.json`). Record each hit as fixed or open in the Checked list. If the user scopes the re-review to "the diff only," still report an open Medium in a cited source, because "a Medium blocks wherever found" overrides diff-only scope. See [[docs-review-checks]] and [[escaped-defects]].
