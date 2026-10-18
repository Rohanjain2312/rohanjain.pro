# Fit-check rubric and expected verdicts

Owner: QA Engineer. Spec: `docs/spec/09-quality.md` §9.4 and ADR-0028 (synthetic golden set). Issue #193.

This rubric gives the expected verdict for each golden posting in `tests/fixtures/golden/`. QA wrote it from the Evidence Ledger, `src/content/skills.json` and the postings. It was written before the engine was run on any posting. App/Data does not set expected verdicts.

## Status of raters

| Rater | Status |
|---|---|
| QA Engineer | Done. Version 2, 2026-10-17. |
| Reader Advocate (second rater, §9.4) | Not yet rated. Rate the 18 postings and 3 samples from this rubric, record disagreements below, and QA will resolve each in a new rubric version. |
| Real recruiter ratings | None yet. They replace this rubric as ground truth when they arrive (skill `external-validation`, §9.4 item 7). |

## Source of truth for skills

- **Proven** means tier `shipped` or `work` in `src/content/skills.json`. Every such skill carries evidence ids that resolve to Ledger rows. The ids are goldman, loan, settle, cua, fc, tariff, shca, mr, med, gb and ieee (`docs/spec/05-evidence-ledger.md`, `reference/skills_tiered.json`).
- `shipped` skills point to a project row in the Ledger (Loan Servicing Agent v1 and v2, Settlement Fail Predictor, FinCompress, TariffAgent, and so on). `work` skills point to the Goldman Sachs tenure row (Jan 2021 to Jun 2024).
- **Gap** means tier `studied` (75 skills, none with evidence), or a named technology that is not in `skills.json` at all (Swift, CUDA, FastAPI, GCP and so on).
- Studied skills never count as proven, however often the posting repeats them (R-403).
- The Ledger and `skills.json` are the only inputs. The rubric does not add skills, and it does not credit Rohan with a skill because a related one is listed. Example: GCP is not a listed skill, so it is a gap, even though GKE and Vertex AI are proven.

## Counting rules

Read each requirement line and list the skills it names. Then count.

1. **Names.** A requirement names a skill when it contains the skill's name, a standard abbreviation, plural or hyphenation of it, or the same words in another grammatical form. Examples: "fine-tune" names Supervised fine-tuning, "define KPIs" names KPI definition, "orchestrate workflows" names Workflow orchestration, "quantize" names Model quantization.
2. **Coordination.** "Training and inference pipelines" names both Training pipelines and Inference pipelines. "Unit and integration tests" names both.
3. **Containment.** A phrase that contains a shorter skill name names that skill too. "Text classification" names Text classification and Classification. "Hugging Face Transformers" names Hugging Face, Transformers and Hugging Face Transformers. "LLM agents" names AI agents and Large Language Models. "Function calling" names Function calling and Tool calling.
4. **Short forms.** A shortened form counts only when it is unambiguous in the field: distillation, Spark. These do not count: "parsing" (document parsing), "tracing" (agent tracing), "stakeholders" (stakeholder management), "CI" (also a confidence interval in data science postings).
5. **Paraphrase does not count.** A line that describes a capability without using the skill's words names nothing. Examples: "route requests between models", "citations back to source passages", "communicate findings to stakeholders", "explain model results".
6. **Each skill counts once.** Repeats do not add.
7. **Unlisted technologies.** A named language, framework, platform or tool that is not in `skills.json` is one gap. Techniques and domain words that are not in `skills.json` (Bayesian methods, ranking, fraud, churn) are not counted. Lab equipment, degrees, years of experience and personality traits are not counted.
8. **Ratio and bands.** `ratio = proven / (proven + gaps)`. Fewer than 4 counted skills: "Not enough to go on". Ratio 0.80 or more: "Strong fit". 0.55 to below 0.80: "Good fit, with gaps". Below 0.55: "Not a strong fit". These are the values in ADR-0029. Only an ADR changes them (R-404).

A "plus" or "preferred" requirement counts like any other line. The engine cannot tell them apart, so the rubric does not either.

## Expected verdicts

The full skill lists for each posting are in `tests/fixtures/golden/verdicts.json`. The golden test checks that every listed skill exists with the right tier, and that the counts give the expected verdict by rule 8. That part needs no engine.

"Margin" is the smallest number of single-skill changes (one skill counted or not counted) that would move the posting to another band. A margin of 1 means one disputed call changes the verdict.

| Posting | Family | Expected verdict | Proven / counted | Ratio | Margin |
|---|---|---|---|---|---|
| ai-01 | ai | Strong fit | 18 / 19 | 0.947 | 4 |
| ai-02 | ai | Good fit, with gaps | 15 / 19 | 0.789 | 1 |
| ai-03 | ai | Not a strong fit | 7 / 13 | 0.538 | 1 |
| ai-04 | ai | Good fit, with gaps | 8 / 14 | 0.571 | 1 |
| ml-01 | ml | Good fit, with gaps | 11 / 20 | 0.550 | 1 |
| ml-02 | ml | Not a strong fit | 6 / 14 | 0.429 | 4 |
| ml-03 | ml | Good fit, with gaps | 12 / 20 | 0.600 | 2 |
| ml-04 | ml | Strong fit | 16 / 18 | 0.889 | 3 |
| ds-01 | ds | Good fit, with gaps | 9 / 15 | 0.600 | 2 |
| ds-02 | ds | Good fit, with gaps | 9 / 15 | 0.600 | 2 |
| ds-03 | ds | Strong fit | 13 / 14 | 0.929 | 3 |
| ds-04 | ds | Not a strong fit | 1 / 6 | 0.167 | 3 |
| neg-ios | unrelated | Not a strong fit | 0 / 6 | 0.000 | 3 |
| neg-hw | unrelated | Not a strong fit | 0 / 5 | 0.000 | 2 |
| neg-game | unrelated | Not a strong fit | 0 / 4 | 0.000 | 1 |
| adj-de | adjacent | Not a strong fit | 6 / 12 | 0.500 | 2 |
| adj-ae | adjacent | Not a strong fit | 1 / 5 | 0.200 | 2 |
| adj-be | adjacent | Not a strong fit | 5 / 11 | 0.455 | 2 |

### On-site samples (`reference/mockup/Main.dc.html`, `docs/design/spec.md` §7.9)

| Sample | Expected verdict | Proven / counted | Ratio | Margin |
|---|---|---|---|---|
| AI Engineer | Strong fit | 16 / 18 | 0.889 | 3 |
| Data Scientist | Not a strong fit | 7 / 14 | 0.500 | 2 |
| iOS Engineer | Not a strong fit | 0 / 7 | 0.000 | 4 |

The Data Scientist sample comes out "Not a strong fit" under the current tiers. A/B testing, experimental design, power analysis, causal inference, forecasting, Snowflake and dbt are all `studied`, and they are half of what the sample asks for. This is an honest result under R-403, not an engine fault. If Design wants that sample to show a different verdict, change the sample text. Do not change a threshold or a tier for it.

## Edge cases and why they were called this way

- **ai-02 (0.789, strong needs 0.80).** One more counted skill makes it "Strong fit". FastAPI is counted as an unlisted gap. "Route requests between models" is a paraphrase and does not count as Model routing.
- **ai-03 (0.538, good needs 0.55).** GCP is an unlisted gap, so it counts. Without it the posting is "Good fit, with gaps". "Tool boundaries and orchestration" and "tracing" do not count, by rules 4 and 5.
- **ai-04 (0.571).** TypeScript is an unlisted gap. "Parsing", "citations back to source passages", "evaluate retrieval quality" and "hallucination rates" do not count, by rules 4 and 5.
- **ml-01 (0.550, exactly on the good edge).** Counted: batch inference, training pipelines and inference pipelines by rule 2. "Train and deploy ... models" is not Model deployment, because the words are not adjacent.
- **ml-03.** "Deploy models behind REST APIs" counts as Model deployment by rule 1. "Time-series forecasting" counts Time-series analysis through its alias "time series".
- **ds-01 and the DS sample.** "Communicate findings to stakeholders" does not count (rule 4). A/B testing appears as "A/B tests", a plural of a listed alias.
- **ds-02.** "Exploratory data analysis" names both Exploratory data analysis and Data analysis (rule 3). The degree line does not count.
- **ds-04.** "PhD or equivalent experience" is a degree line and does not count. "Bayesian methods" is an unlisted technique and does not count.
- **neg-game.** Exactly four counted skills: Unity, C#, Android and iOS. One missed match gives "Not enough to go on" instead of the expected verdict.
- **adj-de.** "Orchestrate workflows" counts as Workflow orchestration by rule 1. Without it the ratio is 0.455.

## What the rubric tests

- **In-family postings are not all strong.** Three of the 12 in-family postings are "Strong fit", six are "Good fit, with gaps" and three are "Not a strong fit". Postings that lean on studied tools (Airflow, Spark, MLflow, vLLM, LangChain, dbt) land lower. That follows from R-403 and from ADR-0029.
- **Adjacent roles are weak.** Data, analytics and backend engineer postings share SQL, Python, Kubernetes and CI/CD with Rohan but ask mostly for studied or unlisted tools.
- **Unrelated roles show no proven skill.** All three have at least four counted gaps, so they read "Not a strong fit", not "Not enough to go on".

## First engine run (19da6ab plus thresholds rename)

No expected verdict was changed because of the engine. Four postings disagreed: ai-02 (engine Strong fit), ai-04 and ml-01 (engine Not a strong fit), and neg-game (engine Not enough to go on). The causes are missing aliases (fine-tune, quantize, distillation, KPIs, time-series, Spark, "A/B tests", coordinated phrases such as "unit and integration tests"), missing extras (FastAPI, GCP) and Unity being alias-only. With those additions in a scratch copy, the engine agreed with the rubric on all 18 postings and 3 samples. The fixes belong to App/Data (R-407).

## Change control

- A change to an expected verdict needs a new rubric version, a reason, and the Reader Advocate's rating on record. The engine disagreeing is not a reason by itself. First decide whether the engine or the rubric is wrong at skill level.
- If the engine disagrees: fix aliases or tiers first (R-407). Change a threshold only with a new ADR in the same PR (R-404).
- Real recruiter ratings replace this rubric as ground truth when they arrive.

## Version history

| Version | Date | Change |
|---|---|---|
| 1 | 2026-10-17 | First rubric by QA. Written before the engine ran on any posting. Reader Advocate not yet rated. |
| 2 | 2026-10-17 | Made after the first engine run, to fix one error of mine: "CI" is ambiguous (confidence interval), so rule 4 no longer counts it. The iOS sample goes from 1 / 8 to 0 / 7. No expected verdict changed. The engine's output did not change any verdict in the rubric. |
