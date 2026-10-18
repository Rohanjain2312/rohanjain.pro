---
name: project-pr206-jargon-gloss-review
description: PR #206 (plain-words glosses, issue #205) round 1 at f5e60f4 asked for changes; what to recheck in round 2 and why a textbook gloss can still be wrong.
metadata:
  type: project
---

PR #206 round 1 (head f5e60f4, CHANGES REQUESTED, 2026-10-17). Two Mediums:
- Zero-shot gloss "(the model given no examples)" is the textbook meaning but not what the customs-court README compares: "Zero-shot, no tools". The control model also differs from the agent model, so a fix must not say "same model".
- FinCompress card metric line still shows "INT8 student" with no clause; the gloss was only added to the figure caption. Fix is a `glosses.projects.fc` entry in `src/components/copy/home.json`.

**Why:** a gloss that defines the term in general can still misdescribe the specific baseline in the headline stat.
**How to apply:** on round 2, grep `.shots/home-390.txt` for each term and check every occurrence on a card, caption or headline, including claim display strings that render on cards. Compare each gloss with the project README row, not only the standard definition. Layout was clean at 390/768/1280 in round 1 (no overflow; page +405/+290/+156 px). See [[escaped-defects]].
