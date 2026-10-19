# Operations

Runbooks, launch checklist, pre-mortem and backlog.

## Runbooks (Platform Engineer, in `docs/runbooks/`)
- `local-dev.md`: run, test and preview locally.
- `new-application-link.md`: create and expire a `/for` link.
- `update-content.md`: add a project, change a claim, add a skill, update the résumé.
- `launch.md`: Phase 7 step by step, including the client's three steps.
- `deploy.md` and `rollback.md`: release and instant rollback on Cloudflare Pages.
- `rotate-secrets.md`: rotating the Cloudflare token.
- `incident.md`: site down, defacement, account compromise, leaked secret, or a wrong claim discovered: contain, assess, fix, communicate, blameless post-mortem in `docs/postmortems/`.
- `domain-renewal.md`.

## Launch checklist (Phase 7 go/no-go, run by the Supervisor)
- [ ] All phase gates passed and recorded.
- [ ] Claims check green on site and PDFs; client decisions in `docs/spec/05-evidence-ledger.md` §4.4 applied.
- [ ] Security assessment complete; zero Critical/High/Medium open.
- [ ] Headers A+ on securityheaders.com and Mozilla Observatory (production).
- [ ] Lighthouse budgets met on the production URL (mobile).
- [ ] Zero axe violations.
- [ ] All links valid; 404 works; `/for` pages noindex and excluded from sitemap.
- [ ] OG preview correct (checked with link-preview debuggers).
- [ ] DNSSEC, CAA, SPF, DMARC, null MX verified.
- [ ] Analytics working and cookieless.
- [ ] Rollback tested once.
- [ ] `v1.0.0` tagged with SBOM attached.

## Pre-mortem
Imagined launch-day failures, ranked by likelihood, with who catches each before merge. "Before v2.3" shows whether the six-role team had an owner.

| # | Failure | Caught by (role: check) | Before v2.3 |
|---|---|---|---|
| 1 | The fit check flatters: broad aliases make most AI postings "Strong fit" | QA: rubric set before the engine, alias audit, property tests, mutation score (the recruiter ratings were dropped, ADR-0035) | Partial (builder set its own expected answers) |
| 2 | Tests pass but don't test: trivial assertions, snapshots and baselines updated to match bugs | QA: mutation testing, acceptance tests from criteria; Design Lead approves baselines | No owner |
| 3 | A number is wrong, overstated or inconsistent across site and PDFs | App/Data: claims check; QA: claim re-verification and copy lint; Reader: cross-page consistency | Partial (ledger checked by its author) |
| 4 | A recruiter on a phone can't say who he is after 5 seconds | Reader Advocate: simulated test (the real test was dropped, ADR-0035) | No owner |
| 5 | Process theater: approvals recorded without a real review, or the same model agreeing with itself | Review rules in 2.11 (isolation, SHA and agent ID, read-only reviewers, model split); QA audit of 20% of PRs; seeded-defect audits | No owner |
| 6 | The site looks generic or AI-made | Design Lead: R-602 in `.claude/agents/design-lead.md` on a different model than the builders; external: 5-second test comments | Partial (same model judging its own spec) |
| 7 | Copy problems: em dashes, hype, work authorization mentioned, mismatched title or location | QA: copy lint; Reader Advocate | Partial (no mechanical check) |
| 8 | Security hole: XSS in the fit check, weakened CSP, unpinned Action, leaked posting text | Security: review and `docs/spec/08-security.md` §8.9; tools: CodeQL, gitleaks, ZAP, OSV; QA: rendering property test | Owned |
| 9 | The build stalls on usage limits or extra roles burn the budget | Supervisor: skill `session-protocol`; cost controls in 2.11 | Owned, risk raised by new roles |
| 10 | The features don't change outcomes: nobody uses the fit check, `/for` links don't lift replies, demos are asleep or links break | Reader Advocate: reply-rate tracking and link-open counts; Platform: lychee and status workflow; Frontend: demo fallbacks | Partial (links owned, outcomes not) |

Other risks kept from v2.2: account takeover (passkeys, registrar lock), phone spam (not in structured data), scope creep (Supervisor, ADRs), and repo READMEs that differ from client-chosen résumé values (follow-up issues to align them).

## Out of scope for v1 (backlog)
- LLM-assisted requirement extraction in the fit check (needs a server, rate limiting and a prompt-injection review).
- Dark mode.
- A full writing section (v1 links the Medium profile only).
- Additional projects: forecast_bench, Mini_Agentic_AI_Platform, grpo-reward-hacking-demo.
- Photo in the hero (slot exists; client adds later).
