---
name: token-step-review
description: When a PR touches token steps in docs/needs-client.md, check how the steps interact and what fine-grained permissions allow (PR #65 and #67 reviews, issue #66)
metadata:
  type: feedback
---

Reviews of `docs/needs-client.md` token steps must check two things: how the steps interact, and what each permission allows.

**Why:** The optional fine-grained token step (PR #65) looked safe, but a later `gh auth refresh` (a required client step) stores a new OAuth token over the fine-grained one and silently undoes it. Administration write also allows `DELETE /repos/{owner}/{repo}`, which the old classic token could not do. Narrowing to Administration read removed a duty: the Supervisor could no longer renew the interaction limit (`PUT .../interaction-limits`), ADR-0018's main input control, so renewal becomes a browser step for the client (67-I1, #63).

**How to apply:**
- Order the steps and ask whether a later step replaces or revokes an earlier one (`gh auth refresh`, `gh auth login`, `gh auth setup-git`, keychain edits).
- Look up each permission in GitHub's "Permissions required for fine-grained personal access tokens" page. Check delete, ruleset and settings endpoints. Projects permissions exist only for organizations.
- For each narrowed permission, list the agent duties that used it (interaction-limit renewal, ruleset edits, project board) and say who does them now.
- Check token expiry (§8.6) and what happens when it expires (fails closed).
- Keychain: a `github.com` internet-password entry feeds git over HTTPS; gh keeps its own `gh:github.com` entry. Erase only the first.

Related: [[signed-commits-paused]], [[severity-calibration]]
