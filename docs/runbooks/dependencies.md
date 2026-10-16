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

## A package that needs its script

1. Open an issue that names the package and why the script is needed.
2. Run the script as a named, reviewed step (a package.json script or CI step), for example `npm rebuild <pkg> --ignore-scripts=false`.
3. Security reviews the step before merge. Never turn scripts on globally.

## Dependabot

- Weekly, grouped minor and patch updates for `npm` and `github-actions`.
- `cooldown.default-days: 7` for both. New releases wait 7 days before a PR opens.
- Patch auto-merge only after the cooldown and all gates pass.
