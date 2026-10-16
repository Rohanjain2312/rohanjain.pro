# Git hooks runbook

## Install

`.npmrc` sets `ignore-scripts=true`, so `npm ci` never runs `prepare`. Install the hooks once per clone:

```
npm ci
npm run hooks:install
```

`npm run prepare` does the same. It sets `core.hooksPath` to `.husky/_`. CI installs with `--ignore-scripts` and does not use the hooks.

## What each hook does

| Hook         | Check                                                                                                                | Rule         |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ------------ |
| `pre-commit` | Blocks staged `postings/` and `*.jd.txt`; runs gitleaks on staged changes; lint-staged (Prettier, ESLint, Stylelint) | R-501, R-508 |
| `commit-msg` | commitlint: Conventional Commits, header ends with `(#<issue>)`, trailer `Agent-Role: <role>`                        | R-105, R-106 |
| `pre-push`   | Refuses any push to `main`                                                                                           | R-101        |

Never bypass with `--no-verify` (R-116).

## gitleaks

gitleaks is a binary and is not an npm package. If it is not on PATH, `pre-commit` prints a notice and skips the scan. CI runs it for real. Install it with your package manager (`brew install gitleaks`) to scan locally. Its config is `.gitleaks.toml`, owned by Security; the hook passes it when the file exists.

## Commit message format

```
[role] type(scope): summary (#issue)

Agent-Role: <role>
```

The `[role] ` prefix is optional and a trailing PR number `(#n)` is allowed. Roles: see `commitlint.config.mjs`.

## Tests

`npm run hooks:test` runs a block case and an allow case for each hook. `npm run verify` includes it.
