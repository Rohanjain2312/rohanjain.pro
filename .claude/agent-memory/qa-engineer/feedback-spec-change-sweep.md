---
name: feedback-spec-change-sweep
description: When a PR changes a spec rule (for example a fixture path or a sourcing rule), grep every agent file, skill, path rule and phase plan for the old wording. PR #202 left five stale sites on main.
metadata:
  type: feedback
---

A spec change that replaces a rule is not complete until every instruction that carries the old rule is also changed. Grep `.claude/agents/`, `.claude/skills/`, `.claude/rules/`, `docs/spec/`, `docs/phases/`, and open issue bodies for the old terms, on the PR head and on the active phase branch.

**Why:** PR #202 (ADR-0028, synthetic golden set) changed §9.4 only. Five instruction sites still told a builder to research real postings, paraphrase them, or write to `tests/fixtures/postings/`. A sixth conflict was an ownership problem: §9.4 gave App/Data the write to `tests/fixtures/`, which R-112 denies. The R-112 probe is what showed it. Reading the diff alone would have passed the PR.

**How to apply:** For any PR that edits a spec section, run a `git grep` for the old path and key words against the PR head and the phase branch before writing the verdict. For each hit, check whether the owner of that file is the author of the change. Then run the R-112 guard with the builder's `agent_type` and the new path. If the write is denied, the spec cannot be carried out, which is a Medium. See [[escaped-defects]] and [[project-spec-sourcing-pr202]].

PR #295 (ADR-0035, dropped real 5-second test and recruiter ratings, round 1): the builder edited the named files (needs-client, spec 11 gate, runbook section 7, ADR index) but left spec 01 success criterion 9 ("Real readers confirm it"), spec 09 §9.7, spec 11 Phase 2 gate (pointed at a removed packet), spec 12 risk mitigations 1 and 4, and runbook sections 4 to 6 (the www Redirect Rule as open) and `docs/status.md` item 3. Grep the product spec success criteria and the risk register too, not only the sections the decision names.
**Why:** a decision ADR says what the decision is; the stale sites are the instructions that still carry the old rule.
Round 2 of PR #295 (head d21d0f9) still found five Mediums the builder missed on the first sweep: the `status.md` header phrase, a `status.md` item that said the dropped tests "stay open", `spec/08-security.md` line 60 ("www 301 to apex"), a runbook bullet that kept a Supervisor decision open beside the ADR's decision, and spec 12 risk 6. Run the whole-repo grep for the retired terms in the first round, not the second.
**How to apply:** when a PR retires or replaces a client-facing item, grep `docs/spec/01-product.md`, `docs/spec/09-quality.md`, `docs/spec/12-operations.md`, `docs/runbooks/`, `docs/status.md`, `docs/handoff.md` for the item's keywords, not only the named files.
