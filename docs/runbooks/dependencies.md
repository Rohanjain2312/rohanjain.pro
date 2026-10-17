# Dependencies runbook

## Install scripts are off

- `.npmrc` sets `ignore-scripts=true`. This applies on the client's machine, in agent worktrees and in CI.
- Do not weaken it. Do not pass `--ignore-scripts=false` or edit `.npmrc` without Security review (R-209, R-506).
- Check: `npm config get ignore-scripts` must print `true` from the repo root.

## Playwright browsers

Scripts are off, so browsers are not downloaded on install. Install them with an explicit step:

```
npx playwright install chromium
```

CI runs this as its own named step.

## Which install command

- Agents use `npm ci`.
- Use `npm install <pkg>` only when adding a dependency under R-506. Security reviews that change.

## Release cooldown for manual installs

- `.npmrc` sets `min-release-age=7` (npm 11.19 or later). Manual `npm install`, `npm update` and `npm install <pkg>` skip versions published in the last 7 days. This matches Dependabot's cooldown.
- `npm ci` installs the lockfile exactly and does not read this setting.
- Check: `npm config get min-release-age` must print `7` from the repo root.
- "Latest stable" means the newest stable release at least 7 days old. Prereleases do not count.
- A security fix may ship inside the 7 days only in a PR that Security reviews. The PR names the advisory and the reason. Use `min-release-age-exclude` for a single package only with the same review.
- Do not raise the number or remove the setting without Security review (R-209, R-506).
- Re-locking after this setting changes is a separate step. Check each new version's publish date against the rule before you lock it. Decision record: ADR-0023.

## A package that needs its script

1. Open an issue that names the package and why the script is needed.
2. Run the script as a named, reviewed step (a package.json script or CI step), for example `npm rebuild <pkg> --ignore-scripts=false`.
3. Security reviews the step before merge. Never turn scripts on globally.

## Dependabot

- Weekly, grouped minor and patch updates for `npm` and `github-actions`.
- `cooldown.default-days: 7` for both. New releases wait 7 days before a PR opens.
- Patch auto-merge only after the cooldown and all gates pass.
