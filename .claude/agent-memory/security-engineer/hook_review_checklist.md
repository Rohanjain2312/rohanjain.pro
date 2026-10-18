---
name: hook-review-checklist
description: Bypass classes to probe when a PR changes guard-bash, guard-write, guard-read, lib.mjs or owners.json; confirm each miss with a read-only live call
metadata:
  type: feedback
---

When a PR changes a hook, probe each class below with synthetic PreToolUse JSON (a node script in the scratchpad), against the PR head and against `main`. Confirm every miss with a read-only live call before filing it.

**Why:** In Phase 0 the hook needed fixes in PRs #2, #37 and #53 (issues #9, #32, #60, #61), and #47 and #54 are still open, because each review probed mostly the forms the PR named. PR #53 looked complete until these classes found two Medium issues (#60, #61).

**How to apply:**
- Command substitution and expansion: `echo $(cmd)`, `X=$(cmd); echo $X`, backticks, `"$VAR"` operands.
- `VAR=value` prefixes that change the target or the credential: `GH_REPO=`, `GH_TOKEN=`, `GH_HOST=`, also through `env`.
- Flag spellings: `--flag=value`, `--flag value`, `-Rvalue`, `-R value`, `-XPOST`, `--method=`, `-F`/`--field`, `--input`.
- Hidden or alternate subcommands: `gh auth git-credential`, `git credential fill`, `gh alias set`, `gh api graphql`.
- Alternate addressing: `repositories/<id>`, `repos/{owner}/{repo}` placeholders, full URLs, URL-encoded segments, GraphQL mutations (not only merge and labels).
- Git config routes: `git -c remote.origin.url=`, `git config remote.origin.pushurl`, `git push --repo=`.
- Working directory: `cd <other clone> && gh ...`, commands that take the repo from the cwd.
- Wrappers and interpreters: `env`, `timeout`, `nice`, `eval`, `sh -c`, `( )`, `{ }`, `xargs`, absolute path to `gh`, `node -e`, `python3 -c`. These stay Low under ADR-0018 unless they bypass an input-side control.
- Path normalization: `..` inside absolute worktree paths, sibling-prefix directories, case variants, `//`.
- Fail-open: a command that hangs the hook (`/dev/zero`), a bad `%` escape that throws, the 15 s timeout. A timed-out PreToolUse hook does not block.
- Legitimate commands that must still allow (own-role review, own label, supervisor merge, reads of other repos). Count false positives.

- npm config tripwires (PR #136, 2026-10-16): confirm each form live with npm in a scratch project (`.npmrc` ignore-scripts=true plus a root `install` script writing a marker). Facts on npm 11: flag works only as `false` or `--no-ignore-scripts`; env var also accepts `null`, `0`, `00`, `0.0`; `npm_config_ignore-scripts` (hyphen) works; `npm set ... --location=project` rewrites `.npmrc` (alias of `npm config set`). Filed as #148 (Low). Use spawnSync from a node script; shell loops with variables are refused by the worktree guard.

Related: [[escaped-hook-path-traversal]], [[severity-calibration]]
- Subcommand aliases and attached short flags (PR #217, 2026-10-18): run `gh <group> <sub> --help` to find aliases (`gh repo new` = `gh repo create`, unblocked for all roles). pflag accepts `-fk=v`, `-Fk=v`, `-X=POST`, `-f=k=v`; the `gh api` parser ignores them, so write detection fails. Confirm read-only live (`gh api graphql -fquery='{viewer{login}}'`). Approved PR #217 with these as Low on #215.
