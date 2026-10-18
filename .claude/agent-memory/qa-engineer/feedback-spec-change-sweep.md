---
name: feedback-spec-change-sweep
description: When a PR changes a spec rule (for example a fixture path or a sourcing rule), grep every agent file, skill, path rule and phase plan for the old wording. PR #202 left five stale sites on main.
metadata:
  type: feedback
---

A spec change that replaces a rule is not complete until every instruction that carries the old rule is also changed. Grep `.claude/agents/`, `.claude/skills/`, `.claude/rules/`, `docs/spec/`, `docs/phases/`, and open issue bodies for the old terms, on the PR head and on the active phase branch.

**Why:** PR #202 (ADR-0028, synthetic golden set) changed §9.4 only. Five instruction sites still told a builder to research real postings, paraphrase them, or write to `tests/fixtures/postings/`. A sixth conflict was an ownership problem: §9.4 gave App/Data the write to `tests/fixtures/`, which R-112 denies. The R-112 probe is what showed it. Reading the diff alone would have passed the PR.

**How to apply:** For any PR that edits a spec section, run a `git grep` for the old path and key words against the PR head and the phase branch before writing the verdict. For each hit, check whether the owner of that file is the author of the change. Then run the R-112 guard with the builder's `agent_type` and the new path. If the write is denied, the spec cannot be carried out, which is a Medium. See [[escaped-defects]] and [[project-spec-sourcing-pr202]].
