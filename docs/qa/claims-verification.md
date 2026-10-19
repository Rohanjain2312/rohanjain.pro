# Claims verification log

Owner: qa-engineer. Rule: R-303. Issues: #28, #170. Date of this pass: 2026-10-16.

Every claim in `src/content/claims.json` has one row below. The completeness check (`npm run claims:verified`, part of `npm run validate:content` and so of `npm run verify` and CI) fails when a claim has no row, a row has no claim, a row's value differs from `claims.json`, or a row is malformed. Change a claim's value and its row fails until QA re-verifies it.

## Method

- Each claim was checked against the files it cites, opened directly. The Evidence Ledger's own source notes were not trusted.
- Résumé: `reference/resume/Rohan_Resume_v26.docx`, read from `word/document.xml`. Cited here as "Resume, section, bullet n".
- Repos: read through the GitHub API on the default branch (all `main`, all public) at the head commit given in the table below. Line numbers refer to that commit. Dates were checked against first and last commit dates.
- Figures: `reference/figures/*.png`, viewed.
- PyPI: `graphbench-kg` checked on pypi.org.
- Employer work and the IEEE paper cannot be checked outside the résumé. Those claims are verified against the résumé only, which is their declared source ("Résumé, client-confirmed").

| Repo | Head checked | First to last commit |
|---|---|---|
| loan-servicing-agent | 0920ab4 | 2026-04-19 to 2026-08-29 |
| trade-settlement-fail-predictor | 3b74de3 | 2026-10-08 to 2026-10-10 |
| computer-use-automation | 1923a8c | 2026-09-17 to 2026-09-18 |
| FinCompress | 442af31 | 2026-02-27 to 2026-03-09 |
| customs-court | 324f4b1 | 2026-09-28 to 2026-10-01 |
| Self-Healing-Code-Agent | 37a6d8c | 2026-02-20 to 2026-08-29 |
| transformer-market-regime | 6946b7b | 2025-11-25 to 2025-12-13 |
| medical-llm-finetuning | b67025d | 2026-01-09 to 2026-01-12 |
| graphbench | 2b81ae9 | 2026-03-10 to 2026-08-29 |

## Results

Result values: `verified` (found in the cited source and consistent), `verified-note` (found, with a caveat in the source column), `mismatch #N` (the source disagrees or does not support it; issue N is open), `unsourced` (no source found).

Totals: 99 claims. 76 verified, 22 verified-note, 0 mismatch, 1 unsourced. See the summary at the end.

### Goldman Sachs (résumé)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `goldman-tenure` | `Jan 2021 to Jun 2024` | Resume, Work Experience, Goldman Sachs, "Data Scientist, Jan 2021 - June 2024"; bullet 1 "over 4 years" (client-confirmed, R-302). Note: the dates span 3 years 5 to 6 months, so "~4 years" is generous | verified-note | 2026-10-16 |
| `goldman-tenure-years` | `4` | Resume, Goldman bullet 1, "Progressed from STEM Intern to Data Analyst to Data Scientist over 4 years" (client-confirmed, R-302). Note: the Jan 2021 to Jun 2024 range is 3 years 5 to 6 months | verified-note | 2026-10-16 |
| `goldman-roles` | `STEM Intern to Data Analyst to Data Scientist` | Resume, Goldman bullet 1, "Progressed from STEM Intern to Data Analyst to Data Scientist". Asset Management and Bengaluru from the Goldman header and bullet 1 | verified | 2026-10-16 |
| `production-experience-years` | `3.5` | `reference/role_descriptions.md` lines 5, 9, 13 ("3.5+ years production experience") and Resume summary line | verified | 2026-10-16 |
| `settlement-pending-trades-reduction` | `40` | Resume, Goldman bullet 2, "reducing pending trades by 40%" | verified | 2026-10-16 |
| `settlement-penalty-savings` | `~$65k a quarter` | Resume, Goldman bullet 2, "~$65k/quarter" | verified | 2026-10-16 |
| `loan-v1-models` | `GPT-4 and GPT-3.5-turbo` | Resume, Goldman bullet 3, "GPT-4, GPT-3.5-turbo, RAG with pgvector" | verified | 2026-10-16 |
| `loan-v1-pipeline-modules` | `10` | Resume, Goldman bullet 3, "10-module pipeline" | verified | 2026-10-16 |
| `loan-v1-tools` | `7` | Resume, Goldman bullet 3, "7 tools" | verified | 2026-10-16 |
| `loan-v1-approvals` | `2` | Resume, Goldman bullet 3, "2 human-in-the-loop approval checkpoints" | verified | 2026-10-16 |
| `loan-v1-checks` | `14` | Resume, Goldman bullet 3, "14 validation checks" | verified | 2026-10-16 |
| `loan-v1-hours-saved` | `40` | Resume, Goldman bullet 3, "saved 40 hrs/month" | verified | 2026-10-16 |
| `loan-v1-rag` | `pgvector` | Resume, Goldman bullet 3, "RAG with pgvector" | verified | 2026-10-16 |
| `loan-v1-db-writes` | `eliminated` | Resume, Goldman bullet 3, "eliminated erroneous database writes" | verified | 2026-10-16 |
| `kyc-ocr-accuracy` | `96` | Resume, Goldman bullet 4, "at 96% accuracy" | verified | 2026-10-16 |
| `kyc-ocr-teams` | `4` | Resume, Goldman bullet 4, "for 4 additional teams" | verified | 2026-10-16 |
| `kpi-pipeline-systems` | `10+` | Resume, Goldman bullet 5, "data from 10+ systems" | verified | 2026-10-16 |
| `kpi-pipeline-ftes` | `3` | Resume, Goldman bullet 5, "saving the equivalent of 3 FTEs" | verified | 2026-10-16 |
| `workflows-before` | `4` | Resume, Goldman bullet 1, "scaling automated workflows from 4 to 18" | verified | 2026-10-16 |
| `workflows-after` | `18` | Resume, Goldman bullet 1, "from 4 to 18" | verified | 2026-10-16 |
| `workflows-increase` | `350` | Resume, Goldman bullet 1, "(350% increase)". 18 over 4 is 4.5, an increase of 350%: arithmetic holds | verified | 2026-10-16 |
| `workflows-hours-saved` | `180+` | Resume, Goldman bullet 1, "cutting manual work by 180+ hours/quarter" | verified | 2026-10-16 |
| `interns-offers` | `3` | Resume, Goldman bullet 6, "mentored 3 interns to full-time offers" | verified | 2026-10-16 |
| `interns-program` | `division-wide` | Resume, Goldman bullet 6, "program adopted as standard onboarding division-wide" | verified | 2026-10-16 |

### Loan Servicing Agent v2 (résumé, repo loan-servicing-agent)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `loan-v2-agents` | `10` | Resume, Loan Servicing Agent bullet 1, "10-agent". Repo README line 38 "Ten specialized agents"; `agents/` holds 9 agent files plus the orchestrator | verified | 2026-10-16 |
| `loan-v2-subgraphs` | `2` | Resume, Loan Servicing Agent bullet 1, "2 parallel subgraphs" (client-confirmed, R-302). Note: repo has `ca_branch` and `notice_branch` subgraphs (`graph/ca_branch.py` 69-76, `graph/notice_branch.py` 124-146); they are alternative paths, and only the Notice path fans out in parallel (validation and RAG validation) | verified-note | 2026-10-16 |
| `loan-v2-tools` | `15` | Resume, bullet 2, "15 least-privilege tools". Repo README line 128 "15 tools"; `tools/` holds 15 files | verified | 2026-10-16 |
| `loan-v2-approvals` | `4` | Resume, bullet 2, "4 HIL interrupts". Repo `graph/orchestrator.py` has four `interrupt()` calls (lines 218, 277, 302, 339), one per HIL node | verified | 2026-10-16 |
| `loan-v2-checks` | `22` | Resume, bullet 2, "22 validation checks". Repo `MasterPlan.md` line 14 "all 22 checks" and section 11, check 22 at line 431 | verified | 2026-10-16 |
| `loan-v2-routing` | `Claude Sonnet + GPT-4o-mini` | Resume, bullet 1. Repo README lines 62-63: orchestrator Claude Sonnet, extraction GPT-4o-mini, validation, storage and execution Claude Haiku. The claim leaves out Haiku, which is a third model | verified-note | 2026-10-16 |
| `loan-v2-deploy` | `Docker on GKE Autopilot via GitHub Actions` | Resume, Loan Servicing Agent bullet 3, "Containerized with Docker and deployed to Kubernetes (GKE Autopilot) using GitHub Actions CI/CD ... A2A protocol" (client-confirmed, R-302). Note: the public repo (48 files, one branch) has no Dockerfile, no Kubernetes manifest, no `.github/` and no A2A code | verified-note | 2026-10-16 |
| `loan-v2-dates` | `Apr to Aug 2026` | Repo commits 2026-04-19 to 2026-08-29 | verified | 2026-10-16 |

### Trade Settlement Fail Predictor (résumé, repo trade-settlement-fail-predictor)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `settle-trades` | `3.1M` | Resume, Trade Settlement bullet 1, "3.1M synthetic trades". Repo README line 48 "About 3.1 million trades"; synthetic stated at lines 6-8 | verified | 2026-10-16 |
| `settle-fail-rate` | `~3%` | Resume, bullet 1, "3% fail rate". Repo README line 48 "about 3% failed" | verified | 2026-10-16 |
| `settle-features` | `20` | Resume, bullet 1. Repo README lines 16 and 84 ("the 20 features") | verified | 2026-10-16 |
| `settle-variants` | `12` | Resume, bullet 1, "12 ... variants". Repo README does not state 12. The blog table (`docs/blog/predicting-trade-settlement-fails.md` lines 88-94) lists 4 model families (LR, linear SVM, RBF SVM, XGBoost) and README line 58 says each is trained three ways, which gives 12 | verified-note | 2026-10-16 |
| `settle-pr-auc` | `0.333` | Blog line 94 and line 98; figure `reference/figures/settle_pr.png` legend "XGBoost PR-AUC 0.333"; Resume bullet 1 | verified | 2026-10-16 |
| `settle-pr-auc-random` | `0.045` | Blog lines 36 and 90; figure footer "Random list scores the fail rate, 4.5%" | verified | 2026-10-16 |
| `settle-pr-auc-lift` | `~7x` | Blog line 98 "about 7 times better than random"; 0.333 over 0.045 is 7.4. Resume bullet 1 "7x" | verified | 2026-10-16 |
| `settle-brier-before` | `0.213` | Blog line 105 "Brier score went from 0.213 to 0.035 after calibration"; Resume bullet 3 | verified | 2026-10-16 |
| `settle-brier-after` | `0.035` | Blog lines 94 and 105; Resume bullet 3 | verified | 2026-10-16 |
| `settle-shap-correlation` | `0.96` | Blog line 114 "rank correlation 0.96"; figure `reference/figures/settle_shap.png` subtitle; Resume bullet 3 | verified | 2026-10-16 |
| `settle-shap-planted-rank` | `3 of 190` | Resume, Projects, Settlement Fail Predictor bullet 3, "all 3 planted interactions ranked top 3 of 190 pairs" (client-decided, R-302, ADR-0033; client confirmed in chat 2026-10-19). No repo source found; the résumé value is the claim | verified-note | 2026-10-19 |
| `settle-dates` | `Oct 2026` | Repo commits 2026-10-08 to 2026-10-10 | verified | 2026-10-16 |
| `settle-pr-auc-svm` | `0.319` | Blog `docs/blog/predicting-trade-settlement-fails.md` line 93, results table, row "RBF SVM", setup "Class weights": PR-AUC 0.319 (22% of fails in the riskiest 2%, Brier 0.036). Table is labelled test period, synthetic data (lines 94-95). Display "RBF SVM 0.319" matches the three decimals | verified | 2026-10-17 |
| `settle-pr-auc-lr` | `0.305` | Blog line 91, row "Logistic regression", setup "No resampling": PR-AUC 0.305 (21%, Brier 0.037). Same table, test period, synthetic data. Display "logistic regression PR-AUC 0.305" matches the three decimals | verified | 2026-10-17 |

### Computer-Use Automation (repo computer-use-automation README)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `cua-capabilities` | `2` | README lines 24-30, two capabilities in the table (`member_savings_balance_lookup`, `member_stop_payment_request`) | verified | 2026-10-16 |
| `cua-discovery-calls` | `22` | README line 136 "One discovery run is 22 model calls". Stated by the README; a discovery run needs a model key and was not re-run | verified-note | 2026-10-16 |
| `cua-replay-seconds` | `~10 s` | README line 174 "~10s, no model" (also lines 187 and 350). Stated by the README; not re-run | verified-note | 2026-10-16 |
| `cua-tests` | `137` | README line 95 "137 tests in about 75 seconds, none of which call a model". Stated by the README; the suite was not re-run | verified-note | 2026-10-16 |
| `cua-dates` | `Sep 2026` | Repo commits 2026-09-17 to 2026-09-18 | verified | 2026-10-16 |

### FinCompress (résumé, repo FinCompress)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `fc-params` | `109M` | Resume, Projects, FinCompress bullet 1, "109M params" (client-decided, R-302, ADR-0033; client confirmed in chat 2026-10-19). No repo source found; the résumé value is the claim | verified-note | 2026-10-19 |
| `fc-size-ratio` | `9.1x` | Repo README line 47 "9.1x smaller"; Resume bullet 1. 437.9 over 47.7 is 9.18, so 9.1x is truncated and understates slightly | verified-note | 2026-10-16 |
| `fc-size-before` | `437.9 MB` | Repo README line 44; `results/benchmark_results.csv` teacher size_mb 437.95; Resume says 438 MB (rounded) | verified | 2026-10-16 |
| `fc-size-after` | `47.7 MB` | Repo README line 47; Resume bullet 1 | verified | 2026-10-16 |
| `fc-variants` | `7` | Repo README lines 77, 92 and 174; Resume bullet 1 "7 benchmarked variants" | verified | 2026-10-16 |
| `fc-latency-before` | `286.9 ms` | `fincompress/results/article_assets/article_data.json` teacher 286.88 ms; figure `reference/figures/fc_latency.png`. The same repo's `results/benchmark_results.csv` shows teacher 77.0 ms and has no PTQ row, so the repo holds two latency sets | verified-note | 2026-10-16 |
| `fc-latency-after` | `19.8 ms` | `article_data.json` student_ptq 19.83 ms; figure. Student F1 for that model is 0.786 against 0.918 for the teacher on test. Same two-latency-sets note | verified-note | 2026-10-16 |
| `fc-latency-ratio` | `14.5x` | 286.88 over 19.83 is 14.47. Same sources and note as the two latency claims | verified-note | 2026-10-16 |
| `fc-pruning-heads` | `50` | Resume, Projects, FinCompress bullet 2, "pruning 50% of attention heads improved val Macro F1 by +0.9 pts" (client-confirmed, R-302). Note: repo README lines 49-50 and `article_data.json`: +0.9 is at 30% (29.2% pruned); 50% (48.6% pruned) gives +0.6 | verified-note | 2026-10-16 |
| `fc-pruning-f1-gain` | `+0.9 points` | Resume, Projects, FinCompress bullet 2, "+0.9 pts" (client-confirmed, R-302). Note: repo README line 49 gives +0.9 at 30% pruning; line 50 gives +0.6 at 50% (0.8936 against teacher 0.8876) | verified-note | 2026-10-16 |
| `fc-dates` | `Feb to Mar 2026` | Repo commits 2026-02-27 to 2026-03-09; checkpoints dated 2026-03-01 | verified | 2026-10-16 |
| `fc-f1-baseline` | `0.8876` | Repo README line 44, Results table, row "Teacher (FinBERT fine-tuned)": Val Macro F1 0.8876, marked baseline. Display "validation Macro F1 0.8876 for the full model" matches the four decimals and the validation split. This is the validation score, not a test score | verified | 2026-10-17 |
| `fc-f1-cost` | `0.7712` | Repo README line 47, row "Student - PTQ (INT8)", 12M params, 47.7 MB: Val Macro F1 0.7712. The Intermediate KD row (line 46) also shows 0.7712, so the value is the same for the FP32 student and the INT8 student, as the "same F1 as FP32" cell says. Display "F1 0.8876 to 0.7712 for the INT8 student" matches both numbers to four decimals. Note: the display does not say "validation"; both numbers are validation Macro F1, so the context (`fc-f1-baseline`) must carry that | verified-note | 2026-10-17 |

### TariffAgent (repo customs-court README)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `tariff-exact-match` | `82.5` | README lines 59 and 76-77: 82.5% 10-digit, fixed 40-item sample, interval [70.0, 92.5]. Run by Claude Opus 5.5 in a Claude Code session, labeled separately from API runs (line 91) | verified-note | 2026-10-16 |
| `tariff-rulings-eval` | `40` | Repo README line 68, "150 CBP rulings dated 2026-07-01 or later; the agent ran on a fixed 40-item sample". The display "on or after 2026-07-01" matches | verified | 2026-10-16 |
| `tariff-zero-shot` | `15` | README line 75: Claude Sonnet 5.5 zero-shot, same 40 items, 15.0%. The agent row is a different model (Opus 5.5); the same-model pair (Sonnet 5.5 agent, line 77) is also 82.5% | verified-note | 2026-10-16 |
| `tariff-rulings-corpus` | `44,139` | README line 11 "44,139 CROSS rulings" | verified | 2026-10-16 |
| `tariff-mcp-tools` | `8` | README line 11 "8 read-only tools" | verified | 2026-10-16 |
| `tariff-dates` | `Sep to Oct 2026` | Repo commits 2026-09-28 to 2026-10-01 (UTC) | verified | 2026-10-16 |

### Self-Healing Code Agent (repo Self-Healing-Code-Agent README)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `shca-first-try` | `3` | README line 202 "First-pass success 3 / 8 (37%)" | verified | 2026-10-16 |
| `shca-after-repair` | `7` | README line 204 "Final success rate 7 / 8 (87%)" | verified | 2026-10-16 |
| `shca-benchmark-tasks` | `8` | README line 196 "8 tasks across 6 categories"; harness in `evaluation/` (line 268) | verified | 2026-10-16 |
| `shca-dates` | `Feb to Aug 2026` | Repo commits 2026-02-20 to 2026-08-29 | verified | 2026-10-16 |

### Transformer Market Regime Classifier (résumé, repo transformer-market-regime)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `mr-accuracy` | `81.78` | Repo README line 35 and 46; Resume bullet 1 | verified | 2026-10-16 |
| `mr-mcc` | `0.48` | Repo README lines 36 and 46 (0.480); Resume bullet 1 | verified | 2026-10-16 |
| `mr-baselines` | `6` | Resume, Projects, transformer-market-regime bullet 1, "outperforming 6 baseline architectures" (client-confirmed, R-302). Note: repo README table lines 46-52 lists six other models and the CNN-Transformer leads them on accuracy and F1, but the Engineered Transformer has MCC 0.506 against 0.480 and README line 481 names MCC the primary metric | verified-note | 2026-10-16 |
| `mr-f1` | `88.4` | Resume, Projects, transformer-market-regime bullet 2, "optimized thresholds to achieve 88.4% F1" (client-confirmed, R-302). Note: repo README overall F1 is 72.70% (line 37); 88.44% is the Bullish-class F1 (lines 39 and 513), and the README does not tie it to threshold optimization | verified-note | 2026-10-16 |
| `mr-imbalance` | `68/32` | Repo README lines 399-400 (test set 68.3% Bullish, 31.7% Bearish) and line 514; Resume bullet 2 | verified | 2026-10-16 |
| `mr-years` | `24` | Repo README lines 223-224 and 294: data from 2000-01-01 to 2024-11-24 (about 24.9 years); Resume bullet 1 "24-year" | verified | 2026-10-16 |
| `mr-dates` | `Nov to Dec 2025` | Repo commits 2025-11-25 to 2025-12-13 | verified | 2026-10-16 |
| `mr-baseline-accuracy` | `61.16` | Repo README line 52, all-models table, row "Baseline" (Model 0, the vanilla transformer, lines 70-73): Test Acc 61.16%. Line 515 repeats "baseline 61% accuracy". Display "61.16% baseline accuracy" matches the two decimals and the percent unit | verified | 2026-10-17 |
| `mr-baseline-mcc` | `-0.036` | Repo README line 52, same row: MCC -0.036. Line 515 rounds it to -0.04. Display "-0.036 MCC for the baseline" matches the three decimals and the sign | verified | 2026-10-17 |
| `mr-test-window` | `Sep 2022 to Oct 2025` | Repo README lines 388-399, split section: time-based split, no random shuffle; test set 15% (756 samples), "Period: Sep 21, 2022 to Oct 3, 2025". Display "test window Sep 2022 to Oct 2025" is the same range at month precision | verified | 2026-10-17 |

### Medical LLM (repo medical-llm-finetuning README)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `med-base` | `Mistral 7B` | README lines 3 and 40 (Mistral 7B Instruct v0.3) | verified | 2026-10-16 |
| `med-lora-params` | `1.14` | README lines 47 and 56 "1.14% (83.9M / 7.3B)" | verified | 2026-10-16 |
| `med-format-tuned` | `100` | README lines 21 and 48 "Format Adherence: 100% (vs 0% base model)". The repo holds no results file and no sample size for this figure | verified-note | 2026-10-16 |
| `med-format-base` | `0` | README line 48, same statement and same caveat | verified-note | 2026-10-16 |
| `med-prompts` | `10` | No source found. README never states a 10-prompt check. `evaluation/evaluate_model.py` lines 90 and 250 only set a default `num_samples` of 10; `evaluation/manual_evaluation.py` lists 5 prompts. No recorded run | unsourced | 2026-10-16 |
| `med-dates` | `Jan 2026` | Repo commits 2026-01-09 to 2026-01-12 | verified | 2026-10-16 |

### GraphBench (repo graphbench README)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `gb-gnn-rag-em` | `5` | README line 59 "Exact Match (EM) 3.2% / 5.0%" (GraphRAG / GNN-RAG) | verified | 2026-10-16 |
| `gb-graphrag-em` | `3.2` | README line 59 | verified | 2026-10-16 |
| `gb-questions` | `500` | README lines 20 and 55 "500 HotpotQA distractor questions" | verified | 2026-10-16 |
| `gb-package` | `graphbench-kg` | README line 74 `pip install graphbench-kg`; PyPI lists graphbench-kg 0.2.0, first upload 2026-03-12 | verified | 2026-10-16 |
| `gb-dates` | `Mar to Aug 2026` | Repo commits 2026-03-10 to 2026-08-29 | verified | 2026-10-16 |

### IEEE paper and education (résumé)

| Claim ID | Value | Source checked | Result | Date |
|---|---|---|---|---|
| `ieee-model` | `MLP-ELM` | Resume, Publications, "Designed MLP-Extreme Learning Machine". The paper itself was not checked | verified | 2026-10-16 |
| `ieee-accuracy` | `95` | Resume, Publications, "achieving 95% accuracy" | verified | 2026-10-16 |
| `ieee-scans` | `6,400+` | Resume, Publications, "6,400+ MRI scans" | verified | 2026-10-16 |
| `ieee-improvement` | `17` | Resume, Publications, "17% improvement over baselines" | verified | 2026-10-16 |
| `edu-umd` | `Aug 2024 to May 2026` | Resume, Education, "Master of Science in Applied Machine Learning, Aug 2024 - May 2026", University of Maryland | verified | 2026-10-16 |
| `edu-pes` | `Aug 2017 to May 2021` | Resume, Education, "Bachelor of Technology in Electronics and Communication Engineering, Aug 2017 - May 2021", PES University | verified | 2026-10-16 |

## Summary

- Open mismatch issues: none. The rows for #140 to #146 were re-verified in the #170 pass (see below).
- Unsourced: `med-prompts`.
- Re-verification for #170 (2026-10-16). The résumé and client decisions are valid sources that override repo values (R-302 and the Evidence Ledger), so a claim that matches the résumé is `verified-note` with the repo value in the source column, not `mismatch`. Rows re-verified against `src/content/claims.json` as restored by PR #172 (head 1b50df1), which returns these claims to their values at commit 595c0bb: `goldman-tenure`, `goldman-tenure-years`, `loan-v2-subgraphs`, `loan-v2-deploy`, `fc-pruning-heads`, `fc-pruning-f1-gain`, `mr-baselines`, `mr-f1`. The tariff claims `tariff-rulings-eval` and `tariff-dates` keep the PR #165 wording and are `verified` against the repo README and commit dates. Résumé checked: `reference/resume/Rohan_Resume_v26.docx`. Repo heads checked (unchanged since the first pass): FinCompress 442af31, customs-court 324f4b1, transformer-market-regime 6946b7b, loan-servicing-agent 0920ab4. Claim values checked against `claims.json` at 1b50df1 (on top of `main` 7148fe1).
- Rows added for #183 (2026-10-17): `settle-pr-auc-svm`, `settle-pr-auc-lr`, `fc-f1-baseline`, `fc-f1-cost`, `mr-baseline-accuracy`, `mr-baseline-mcc`, `mr-test-window`. Each was read from the cited source (blog table, FinCompress README Results table, transformer-market-regime README table and split section), not from App/Data's notes. Value and display text match the source to the stated decimals. Repo heads at the check: FinCompress 442af31, transformer-market-regime 6946b7b, trade-settlement-fail-predictor 3b74de3 (all unchanged since the first pass). `fc-pruning-peak-f1` and `fc-pruning-peak-share` were removed from `claims.json` at 287fc37 and have no rows.
- The default check fails on missing, stale or malformed rows and warns on open findings. `node tests/fixtures/claims/check-verification-log.mjs --require-clean` also fails on open findings; use it at the phase gate.
