# ADR-0033: client-decided values override repo values

Status: accepted · 2026-10-18 · Supervisor (R-004), from issue #244 rows 163-g and 163-h

## Context
R-302 says client decisions override repo values. Some rows in `docs/rules.md` (R-302, R-306), `docs/spec/01-product.md` row 8 and `docs/spec/05-evidence-ledger.md` still list older repo values. `src/content/skills.json` keeps Docker, Kubernetes, Docker images, Dockerfiles, Deployments, Deployment automation and A2A at tier `shipped` with evidence `["loan"]` only, because the résumé says so.

## Decision
- Where the client's résumé and a repo differ, the résumé value is the claim. The spec and rule rows that list an older value are read as superseded; the value in `src/content/claims.json` and the evidence ledger's client-decided notes is the source.
- The skills above stay at tier `shipped` with the evidence the résumé gives. Nobody changes them to match the repos (R-005: no invented evidence, no silent downgrade).
- Agents do not "correct" a client-decided value. A question about one goes to `docs/needs-client.md`.

## Consequences
- QA checks claims against the résumé first (R-303), then the repos.
- The older rows are updated when their file is next edited; until then this ADR is the record.
