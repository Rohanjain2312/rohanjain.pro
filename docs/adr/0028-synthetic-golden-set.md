# ADR-0028: the golden set is synthetic

Status: accepted · 2026-10-17 · Supervisor (R-004), closes issue #162

## Context
`docs/spec/09-quality.md` §9.4 planned a golden set of real job postings (source URLs and paraphrased requirements) in this public repo. R-501 (a hard rule) forbids committing job-description text and ignores `postings/` and `*.jd.txt`. A paraphrase of a real posting, with its URL, is still derived from the posting and ties the repo to named employers.

## Decision
The golden set is synthetic. App/Data writes 18 or more postings from scratch as short requirement lists, modeled on the patterns in real postings, in `tests/fixtures/golden/<id>.json`. Nothing from a real posting is stored: no text, paraphrase, URL, retrieval date or company name. The rest of §9.4 is unchanged: QA writes the rubric and expected verdicts, the alias audit runs against the negative controls, and thresholds change only by ADR.

## Consequences
- R-501 needs no exception: the path block still applies (`postings/` and `*.jd.txt` stay blocked). The content control is QA's review of each fixture for near-copies. The gitleaks rule for job-description text (#111) stays a Low on the Phase 3 backlog and is not a precondition.
- App/Data writes the lists; QA commits them (QA owns `tests/fixtures/`, R-112).
- The set tests the engine against realistic skill mixes, not against any one employer's wording. Real recruiter ratings (skill `external-validation`) remain the ground truth once they arrive.
- If a real posting is ever needed as a fixture, it stays out of this repo and out of the golden set.

## Alternatives
- Paraphrased real postings with source URLs: derived from the posting, ties the repo to employers, and the fixture path trips R-501.
- Fixtures in the private repo: CI in this repo could not run the golden tests.
