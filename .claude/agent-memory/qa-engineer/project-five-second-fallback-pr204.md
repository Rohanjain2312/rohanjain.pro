---
name: five-second-fallback-pr204
description: PR #204 (head ddaa561) changed the 5-second test to a plain-file fallback; the skill still scored first click, which a screenshot cannot measure. Check every pass clause when an instrument changes.
metadata:
  type: feedback
---

When a test instrument changes (form to plain file, honour system), check every pass clause in the skill against what the new instrument can measure. A static screenshot cannot produce a first click.

**Why:** PR #204 (head ddaa561) added a plain-file fallback and said results are "scored the same way". The skill's Pass line still required "4 of 5 first clicks land on View résumé" in the Phase 2 run, while the packet and gate row 5 deferred first click to Phase 4 and the Phase 6 repeat. The three files disagreed. Reviewed as Medium, CHANGES REQUESTED.

**How to apply:** for any change to a validation method, list each question and pass rule in the skill, mark which the new method can produce, and confirm the packet and gate row defer the rest the same way. Also check that the packet's message wording matches the method (for example, a chat image cannot be "taken away"). Related: [[escaped-defects]].
