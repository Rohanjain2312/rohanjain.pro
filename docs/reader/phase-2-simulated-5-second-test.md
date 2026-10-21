# Phase 2 simulated 5-second test

Reader Advocate, 2026-10-17, from `npm run shots` on `main` at the merge of PR #198 (home page, privacy and 404 as built by PR #186). Judged from the rendered files only.

## Verdict
PASS. On `home-390-fold.png` the role, one proof point and the contact are visible without scrolling:
- Role: "ML and AI Engineer · New York, NY · available now".
- Proof point: "40% fewer pending trades from my settlement model at Goldman Sachs".
- Contact: the email address under the headline.

The hero, results strip and contact are not vetoed. No work-authorization mention, no em dashes. No "3.5+ years" or "~4 years" claim appears, so the two never sit side by side; the only tenure signal is "Jan 2021 to Jun 2024".

## Findings
### Medium
1. The Settlement caption "the SVM I shipped holds up" sat under XGBoost PR-AUC 0.333 vs random 0.045 on `main`. Resolved in PR #187: the caption now lists XGBoost 0.333, RBF SVM 0.319 and logistic regression 0.305.
2. The privacy page mentioned a fit check and analytics that do not exist. Resolved in PR #187 (page rewritten to what exists now).
3. Jargon past the fold at 390 px: SMOTE, PR-AUC, SHAP, INT8, LoRA, A2A, GKE Autopilot, LangGraph, MCP, RAG, zero-shot, MCC appear in section headlines and figure captions without a plain-words clause. Resolved: plain-words glosses added in PR #206 (issue #205); QA re-checked the built page text and the Reader Advocate finding is closed. The Reader Advocate has not re-run the test on the glossed page.

### Low (posted on issue #190)
- The third hero number (82.5% vs 15% zero-shot) is TariffAgent's, but its card under "More projects" shows no number.
- The hero says "ML and AI Engineer" while the job entry says "Data Scientist".
- "Mentored 3 interns to full-time offers" appears three times.
- The location is New York, NY, and the MS is at Maryland.
- The 390 px fold cuts the credentials line mid-sentence.
- "Real numbers" in "Four projects, real numbers" reads slightly defensive.
- The phone number appears only in the final contact block.
- The 404 traceback joke may not land for non-technical readers; its last line is plain and helpful.
- Figure legibility at 390 px was not verified (full-page screenshot is 8703 px tall).
