# Evidence Ledger seed

Verified October 2026, client decisions applied. The App/Data Engineer turns this into `src/content/claims.json` in Phase 1; after that, `claims.json` is the source of truth and this file is history. QA verifies every entry (R-303).

App/Data Engineer turns this into `claims.json`. Where the client chose the résumé value over the repo, the claim's `source` is "Résumé, client-confirmed" and the repo value is recorded in a `note` field for internal reference only.

| Claim | Value shown | Source |
|---|---|---|
| Goldman tenure | ~4 years, Jan 2021 to Jun 2024; STEM Intern to Data Analyst to Data Scientist; Asset Management, Bengaluru | Résumé, client-confirmed |
| Production experience (role summaries) | 3.5+ years of production experience | Client's role descriptions |
| Settlement model impact | 40% fewer pending trades; ~$65k a quarter less in regulatory penalties | Résumé, client-confirmed |
| Loan servicing agent v1 (Goldman) | GPT-4 and GPT-3.5-turbo, RAG with pgvector, 10-module pipeline, 7 tools, 2 human approvals across 14 checks, saved 40 hours a month, eliminated erroneous database writes | Résumé, client-confirmed |
| KYC OCR | 96% accuracy, 4 additional teams | Résumé, client-confirmed |
| KPI/KRI pipeline | 10+ systems, equivalent of 3 FTEs | Résumé, client-confirmed |
| Workflows | 4 to 18 automated workflows (350% increase), 180+ hours a quarter saved | Résumé, client-confirmed |
| Interns | 3 mentored to full-time offers; program adopted division-wide | Résumé, client-confirmed |
| Loan Servicing Agent v2 | 10 agents, 2 parallel subgraphs, 15 tools, 4 human approvals across 22 checks, Claude Sonnet + GPT-4o-mini routing by cost and quality, Docker on GKE Autopilot via GitHub Actions, A2A; Apr to Aug 2026 | Résumé; repo `loan-servicing-agent` |
| Settlement Fail Predictor | 3.1M synthetic trades, ~3% fail rate, 20 features, 12 model variants, XGBoost PR-AUC 0.333 vs random 0.045 (~7x), Brier 0.213 to 0.035, SHAP rank correlation 0.96; all 3 planted interactions ranked top 3 of 190 pairs (client-decided, résumé); Oct 2026 | Résumé; repo `trade-settlement-fail-predictor`, figures fig3 and fig4 |
| Computer-Use Automation | 2 capabilities, 22 model calls to discover, ~10 s per replay with no model, 137 tests with no model calls; Sep 2026 | Repo `computer-use-automation` README |
| FinCompress | 109M params (client-decided, résumé); 9.1x smaller (437.9 MB to 47.7 MB) across 7 variants; CPU latency 286.9 ms to 19.8 ms (14.5x); pruning 50% of attention heads improved val Macro F1 by +0.9 points; Feb to Mar 2026 | Résumé, client-confirmed (repo note: chart peak at 29.2%); repo `FinCompress` |
| TariffAgent | 82.5% exact 10-digit on 40 rulings dated after 2026-07-01 vs 15.0% zero-shot; 44,139 CBP rulings; 8 MCP tools; Sep 2026 | Repo `customs-court` README |
| Self-Healing Code Agent | 3 of 8 tasks first try, 7 of 8 after self-repair, on its own 8-task benchmark; Feb to Aug 2026 | Repo `Self-Healing-Code-Agent` README |
| Market Regime Classifier | 81.78% accuracy, 0.480 MCC, outperforming 6 baseline architectures; 88.4% F1 with optimized thresholds under 68/32 class imbalance; 24 years of S&P 500 data; Nov to Dec 2025 | Résumé, client-confirmed (repo note: README F1 72.70%); repo `transformer-market-regime` |
| Medical LLM | Mistral 7B, LoRA on 1.14% of parameters, 100% format adherence vs 0% base (the "10-prompt check" was removed under R-005: no source; claim `med-prompts` deleted); Jan 2026 | Repo `medical-llm-finetuning` |
| GraphBench | GNN-RAG 5.0% vs GraphRAG 3.2% exact match on 500 HotpotQA questions; pip `graphbench-kg`; Mar to Aug 2026 | Repo `graphbench` README |
| IEEE paper | MLP-ELM, 95% accuracy, 6,400+ MRI scans, 17% better than baselines | Résumé, client-confirmed |
| Education | MS Applied ML, University of Maryland, Aug 2024 to May 2026; B.Tech ECE, PES University, Aug 2017 to May 2021 | Résumé, client-confirmed |
| Contact | rohanjain2312@gmail.com; +1 240 495 9682; New York, NY; linkedin.com/in/jaroh23; github.com/Rohanjain2312; huggingface.co/rohanjain2312; medium.com/@rohanjain2312 | Client-confirmed |

Where the site and mockup differ from these client decisions (FinCompress pruning figure, Market Regime F1, Goldman tenure, location), the client decisions win. The Supervisor updates the figure captions accordingly (for example, the FinCompress pruning figure caption describes the chart without contradicting the résumé claim).
