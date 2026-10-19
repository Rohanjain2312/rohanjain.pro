# Launch (Phase 7)

Owner: Platform, with Supervisor and Security. Spec: `docs/spec/11-phases.md` Phase 7, `docs/spec/12-operations.md` launch checklist, ADR-0016, ADR-0027. Start only after the Phase 6 gate and tag `v0.9.0`.

Phase 7 has two parts: three short client steps (section 1), then work Claude Code does alone (sections 2 to 7).

## 1. Client steps (nothing else is asked of the client)

Each step lists what to do and what to send back.

1. Cloudflare account and domain.
   1. Open https://dash.cloudflare.com/sign-up and create a free account with the email you use for this project.
   2. Turn on a passkey or two-factor sign-in: top right, My Profile, Authentication.
   3. Choose Add a domain, enter `rohanjain.pro`, pick the Free plan. Cloudflare shows two nameservers, for example `name.ns.cloudflare.com`. Keep that page open.
   4. Tell Claude Code the two nameservers, the Zone ID and the Account ID. Both IDs are on the right side of the domain overview page in Cloudflare. They are not secrets.
2. Porkbun.
   1. Sign in at https://porkbun.com, open your domain list and open the details for `rohanjain.pro`.
   2. Turn DNSSEC off if it is on. It must be off before the nameservers change.
   3. Replace the nameservers with the two Cloudflare nameservers. Save.
   4. Confirm the transfer lock and auto-renew are on.
   5. In Cloudflare, wait for the status "Active" (minutes to a few hours). Cloudflare also emails you.
   6. Later, Claude Code gives you one DS record (four values). Paste it into the DNSSEC box at Porkbun. This is the only second visit to Porkbun.
3. One setup token (ADR-0032).
   1. Open the template link Claude Code gives you. It creates a setup token with the permissions listed in section 5. Set a short expiry (a few days). Choose Continue, then Create token. Copy the token once.
   2. In Terminal, run the one command Claude Code prepares. It asks you to paste the token and the Account ID (shown on the right side of the domain overview page in Cloudflare). The token is used only in that Terminal session. It is never stored in GitHub.
   3. The command applies the DNS records, DNSSEC, CAA, email records and Web Analytics (section 6). It then creates a second token with Pages edit only (account-wide for Pages, as in section 5), and stores that second token and the Account ID as secrets of the `production` environment with `gh secret set`.
   4. Close the terminal tab.
   5. Second command, after Claude Code says the release candidate tag is published (section 4). Run `node .github/scripts/launch-deploy-setup.mjs`. It needs no Cloudflare token. It sets two variables on the private applications repo and adds the deploy workflow file there. Claude Code gives you the exact command (it first runs with `--dry-run` for review). Only if the command says the file write was refused, run `gh auth refresh -s workflow` once and run it again.
6. As soon as the setup run has succeeded, delete the setup token (Cloudflare, My Profile, API Tokens, the setup token, Delete). Done on 2026-10-19. DNS changes later need a new setup token.

Passkeys or 2FA: GitHub is done (2026-10-16). Cloudflare is step 1.2. Porkbun needs 2FA too: Account, Security.

## 2. Before the client starts (Claude Code)

- Confirm the Phase 6 gate record, tag `v0.9.0`, and a green `npm run verify` on the tag.
- The deploy workflow and variables are added by the second client command, `.github/scripts/launch-deploy-setup.mjs` (section 4), because the guard-bash hook stops agents from writing to `Rohanjain2312/rohanjain.pro-applications` (private, ADR-0016). Do not create or push to it from an agent worktree without the Supervisor-only exception.
- Variables, set by that command: `SITE_TAG` (the first-deploy tag, section 4) and `CF_PAGES_PROJECT=rohanjain-pro` (the project the setup command created).
- The `production` environment, limited to `main` (ADR-0032), is created by the setup command (`.github/scripts/launch-setup.mjs`) with the client's own `gh`, before any Cloudflare change (the guard-bash hook stops agents from writing to the private repo, so the client's run is the place for it). It runs these calls, with the bodies below, which were checked on 2026-10-20 against https://docs.github.com/en/rest/deployments/environments (PUT) and https://docs.github.com/en/rest/deployments/branch-policies (POST and list):
  1. Read `repos/Rohanjain2312/rohanjain.pro-applications/environments/production`. Only when GitHub answers "not found" (HTTP 404) does it `PUT` the same path with `{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}` (the page documents `PUT` as "create or update", so the script never sends it for an environment that already exists).
  2. `POST .../environments/production/deployment-branch-policies` with `name=main` and `type=branch` (needs `custom_branch_policies` true, which is why step 1 comes first).
  3. Read the policy list back; it must be exactly one entry, `main` of type `branch`.

  Idempotent: an environment that already has the main-only policy is left alone; one with any other policy stops the run with no change, for Claude Code to review. `--dry-run` prints the calls. If GitHub refuses (environments may need a paid plan for private repos), the run stops before any Cloudflare change and says so. Do not fall back silently: record it for Security. The fallback to put to Security is repository secrets with no other workflow in that repo, dispatch limited to `main`, and `environment: production` removed from the deploy job. Only the deploy job reads the secrets.
- Security reviews the copied workflow. The template passed `ci-checks.mjs pins` (all actions pinned).
- Run a dry run with a fixture result (section 3).

## 3. Production build rules (issue #221)

The private workflow builds in GitHub Actions and uploads `dist`. Cloudflare Pages does not build. It runs the repo's own commands from the tag, so it cannot drift from CI.

- Chromium: `npm run browsers:install` before the build, because the build renders the three résumé PDFs.
- Status line: the workflow downloads `status.json` from the `status-data` branch into `public/` (ADR-0027). A missing file only hides the line. A launch check confirms the line shows.
- Claims check for `/for` pages (ADR-0031). Decision: `npm run build` is split into its three steps (`astro build`, `node scripts/resume-pdf.ts`, `node scripts/check-claims.ts`). The claims check runs on the whole of `dist`, `/for` pages included. Only the counts line (for example `9 proven · 1 to ramp up`) is exempt from the numeric match, because it is engine output bounded by the result schema (R-502). Proof text on `/for` pages is built from claim display text (`src/lib/content/evidence.ts`) and stays checked. A result file with stale proof text fails the build and must be regenerated. How the check tells the counts line from other text (a marker element or an allowlisted pattern) is decided in the Phase 7 deploy workflow plan and tested in the private repo with a fixture result. App/Data owns any change to `check-claims.ts`.
- Output guard: the build fails if `dist/_headers` is missing or if a result JSON file is in `dist`.
- No raw result file is ever uploaded. The `dist` artifact keeps one day and holds rendered pages only. The repo is private, so its logs and artifacts are private.
- Monthly cleanup: `list-expired` runs `npm run for -- --list-expired` (names only, nothing deleted). `remove-expired` validates names, deletes those files, pushes to `main`, and the build job then redeploys.
- Test with no result file: git does not track empty directories, so the private repo has no `applications/` directory until a result file exists. Before adding the fixture, run `workflow_dispatch` once with no result file. `list-expired` must pass with "expired files: 0" (the step creates the directory), `remove-expired` and `build` must run, and the build must succeed with no `/for` pages. The rollback command in section 8 depends on this.
- Test before launch: add one fixture result to the private repo (generate it with `npm run for` against a made-up posting), run the workflow with `SITE_TAG` set, and check that `/for/<slug>` is in the deployed preview and that the claims step passes. Only the first real run proves the wrangler step with the deploy token stored by the setup command.

## 4. Cloudflare Pages

State after the client's setup run: zone Active, DNS, DNSSEC, Pages project `rohanjain-pro` with `rohanjain.pro` and `www.rohanjain.pro` as custom domains, and the two deploy secrets in the `production` environment. A re-run of the setup command skips what exists: Cloudflare error codes 8000002 (Pages project), 8000018 (Pages domain) and 10023 (Web Analytics) mean "already there" and are logged as skips, not failures.

- Pages is a direct-upload project (no Git connection). The workflow deploys `dist` with a pinned wrangler.
- Headers come from `public/_headers` inside `dist`. Do not duplicate them in Cloudflare rules. HSTS and the Web Analytics origins are added to `_headers` by Security (issue #283); the first deploy waits for that change.
- Cloudflare Web Analytics is created by the setup command with `auto_install`. Do not add a cookie.
- Always HTTPS, Automatic HTTPS rewrites and minimum TLS 1.2 are set by the setup command.
- `www` to apex 301. `public/_redirects` cannot do this: Cloudflare's Pages redirects page (https://developers.cloudflare.com/pages/configuration/redirects/) lists domain-level redirects as not supported and documents the source as a file path. The documented route is a Redirect Rule: https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/ (request URL wildcard pattern `https://www.*`, target `https://${1}`, status 301, preserve query string). Decision (ADR-0035): no rule is added; `www` serves the same site, with the canonical and `og:url` on the apex. Creating the rule needs a token with "Zone > Single Redirect > Edit" (https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/); the template key for it, and the rulesets API call, are unverified (R-005), so the script does not do it. Decision for the Supervisor: either the client adds the rule in the dashboard (Rules, Redirect Rules, using the pattern above; a client-only step to add to the list) or Claude Code adds the permission to a new setup link once the key is verified. The `www` redirect is not a blocker for the first deploy.

First deploy tag. Decision: not `v0.9.0`. It predates content fixes and the Phase 7 headers change. The first deploy uses a release candidate `v0.9.1`, published by the Supervisor (`docs/runbooks/releases.md`) from `main` after Security's `_headers` change (#283) is merged and `npm run verify` is green on it. Security accepts it before the first deploy (section 7, order). `v1.0.0` follows only after every check in section 7 passes. The deploy workflow accepts any `vX.Y.Z` tag and reads it from `SITE_TAG`.

First-deploy steps, in order:

1. Supervisor publishes `v0.9.1` (needs #283 merged).
2. Client runs `node .github/scripts/launch-deploy-setup.mjs --dry-run`, Claude Code and Security read the output, then the client runs it without `--dry-run`. It stops, changing nothing, when no published release `v0.9.1` exists or when `deploy.yml` already exists and differs. If the file write is refused, the client runs `gh auth refresh -s workflow` and runs it again. Its calls: `GET releases/tags/<tag>` (https://docs.github.com/en/rest/releases/releases), `GET` and `PUT` on `contents/.github/workflows/deploy.yml` (create needs `message` and base64 `content`; `sha` only when updating, https://docs.github.com/en/rest/repos/contents), and `gh variable set NAME --body VALUE --repo R` (https://cli.github.com/manual/gh_variable_set).
3. Security reviews the workflow now in the private repo (it is the template).
4. No-result-file run first (section 3): `gh workflow run deploy.yml --repo Rohanjain2312/rohanjain.pro-applications`. `list-expired` must print "expired files: 0", `build` must succeed with no `/for` pages, `deploy` must go green. This is also the first test of wrangler `4.149.0` with install scripts disabled.
5. Open https://rohanjain.pro and the `*.pages.dev` URL. Run the checks in section 7 (headers, Lighthouse, axe, DNS, analytics, status line).
6. Fixture `/for` page test (section 3), then remove the fixture.
7. Rollback test (section 8), then publish `v1.0.0` and redeploy with `SITE_TAG=v1.0.0`.

## 5. API tokens (ADR-0032)

Two tokens. The deploy secret is never the broad one (`docs/spec/08-security.md`: deploy token is Pages edit only).

Setup token. Created by the client from a prepared link, scoped to the one account and the one zone, short expiry (set it to a few days). Used once from the client's Terminal. Never stored in GitHub. Deleted as soon as the setup run has succeeded. Permissions:

| Use | Permission (Cloudflare name) | Template key | Status |
|---|---|---|---|
| DNS records, CAA, email records, DNSSEC | Zone, DNS, Write | `dns` edit | Key and name verified [1][2]. The DNSSEC endpoint lists "DNS Write" as its only accepted permission [3]; there is no separate DNSSEC permission. |
| Zone settings (HTTPS, TLS) | Zone, Zone Settings, Write | `zone_settings` edit | Verified [1][2][4] |
| Web Analytics | Account, Account Settings, Write | `account_settings` edit | Endpoint lists "Account Settings Write" [5]. There is no "Web Analytics" permission group in the reference. Key verified [1]; `edit` as the level for it is assumed. |
| Pages project and custom domains | Account, Cloudflare Pages, Write | `page` edit | Key and names verified [1][2][6][7] |
| Create the deploy token | Account, Account API Tokens, Write | `account_api_tokens` edit | Creation endpoint lists "Account API Tokens Write" [8]; the guide says to create the token with "Account > Account API Tokens > Edit" [9]. Key verified [1]. Whether the user-token template form accepts it is unverified until the client opens the link. |

Sources (all Cloudflare documentation, read 2026-10-19):

1. Template URL format and keys: https://developers.cloudflare.com/fundamentals/api/how-to/account-owned-token-template/
2. Permission names: https://developers.cloudflare.com/fundamentals/api/reference/permissions/
3. DNSSEC edit: https://developers.cloudflare.com/api/resources/dns/subresources/dnssec/methods/edit/
4. Zone setting edit: https://developers.cloudflare.com/api/resources/zones/subresources/settings/methods/edit/
5. Web Analytics site create: https://developers.cloudflare.com/api/resources/rum/subresources/site_info/methods/create/
6. Pages project create: https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/create/
7. Pages domain add: https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/domains/methods/create/
8. Token create: https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/create/
9. Creating tokens through the API: https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/

The setup command is `.github/scripts/launch-setup.mjs` (no dependencies, tests in `.github/lint-fixtures/launch-setup.test.mjs`). It cannot live in `scripts/` because Platform does not own that folder (R-112).

Template link. The format is documented [1]: `https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=<url-encoded JSON array of {key,type}>&accountId=<id>&zoneId=<id>&name=<name>`. The template has no expiry parameter, so the client sets the expiry (a few days) in the form. Claude Code builds the link with the account and zone IDs (not secrets, shown in the zone overview; the client sends them back in step 1.1.4):

`node .github/scripts/launch-setup.mjs --link --account <account_id> --zone <zone_id>`

Check that the form shows the five permissions, the one account and the one zone before sending the link to the client.

Run order: `--dry-run` first (prints every API call, sends nothing, asks for no token); Security reviews the output; then the client runs the command without flags. The token and Account ID come from prompts (the token prompt is hidden and refuses piped input). The script is safe to re-run, skips records that exist, and never deletes. Conflicting records that Cloudflare imported from Porkbun (parking A or CNAME records on the apex or `www`) make the matching `POST` fail; the script reports it and continues. Claude Code reads the failure list the client pastes back and decides. Before any Cloudflare change the script checks that `gh` runs, then creates or confirms the main-only `production` environment (section 2). If a token named `rohanjain.pro pages deploy` already exists it makes no second one and reports the id; delete the old one in Cloudflare and run again. It skips any existing apex SPF record, so Porkbun-imported SPF text is left for Claude Code to review. It prints the new token name and id, never the value.

Deploy token. Created by the setup command with the setup token. Pages edit only (Account, Cloudflare Pages, Write, key `page` edit), on the one account (Cloudflare documents the account as the resource, not a single project), 90-day expiry. Only this token and the Account ID are stored, with `gh secret set` into the `production` environment. The deploy job reads only these two secrets. Rotation is in `docs/spec/12-operations.md`, `rotate-secrets.md`.

Still unverified (R-005): the `edit` level for `account_settings` and the acceptance of `account_api_tokens` by the user-token form (table above); that Cloudflare can limit a Pages token to one project (the documented resource is the account, so the deploy token is account-wide for Pages and can touch every Pages project in this account; the account has only this one); the `subdomain` field of the Pages project response (the script falls back to `<project>.pages.dev`); and whether Cloudflare accepts `.` as null MX content. Fallback if a token cannot create another token: a second prepared link and a second client-created token with Pages edit only. In the same change, update `docs/needs-client.md` and CLAUDE.md client-only item 3 (Supervisor-owned).

The `www` to apex 301 is not done by the script and is not planned (ADR-0035): a proxied CNAME serves the site on `www`, with the canonical on the apex. `public/_redirects` cannot do it (domain-level redirects are not supported); the options are in section 4.

## 6. DNS record plan

Set after the zone is Active, by the setup command with the setup token (section 5). The deploy token cannot change DNS. Domain has no email (`docs/spec/08-security.md`).

| Type | Name | Value | Note |
|---|---|---|---|
| CNAME (flattened) | `@` | the Pages project hostname | created by the setup command; skipped if the custom-domain step already created it |
| CNAME | `www` | `@` | serves the site; canonical on the apex (no redirect rule, ADR-0035) |
| MX | `@` | `0 .` | null MX |
| TXT | `@` | `v=spf1 -all` | |
| TXT | `_dmarc` | `v=DMARC1; p=reject; adkim=s; aspf=s` | |
| CAA | `@` | `0 issue` and `0 issuewild` for `pki.goog; cansignhttpexchanges=yes`, `letsencrypt.org`, `ssl.com`, `sectigo.com` | the list Cloudflare documents as its CAs, not exhaustive. Check the Cloudflare "Certificate authorities" page before saving, and check that Universal SSL still issues. |

DNSSEC: enable in Cloudflare after the zone is Active. Cloudflare shows a DS record. Give it to the client for Porkbun (step 1.2.6). Verify with `dig +dnssec rohanjain.pro` and https://dnsviz.net.

## 7. Verify, then tag

Run the launch checklist in `docs/spec/12-operations.md`. Specifically:

- Production URL: headers A+ on securityheaders.com and Mozilla Observatory; Lighthouse on the production URL (mobile); axe; links; `/for` pages carry `noindex` and are absent from the sitemap; OG preview in link debuggers.
- DNSSEC, CAA, SPF, DMARC, null MX with `dig` and a DNS checker.
- Analytics receives a visit and sets no cookie.
- The status line shows (ADR-0027).
- Rollback tested once (section 8).
- Order. The tag `v1.0.0` does not exist until it is published, and the workflow checks out `SITE_TAG`, so it cannot deploy `v1.0.0` first.
  1. First deploy and all smoke tests above use `SITE_TAG=v0.9.1` (the release candidate, section 4; not `v0.9.0`).
  2. If every check passes, publish `v1.0.0` (`docs/runbooks/releases.md`); the SBOM attaches to the release.
  3. Set `SITE_TAG` to `v1.0.0` and deploy again; confirm the live site matches. Later deploys keep using `v1.0.0` until the next release.
- The real 5-second test and recruiter ratings were dropped by the client (ADR-0035); the Reader Advocate's simulated 5-second test stands.
- Submit HSTS preload only after 30 stable days (Phase 8).

## 8. Rollback

Rollback never needs the client.

1. Fastest: redeploy the previous tag. `gh workflow run deploy.yml --repo Rohanjain2312/rohanjain.pro-applications -f tag=<last good tag>` (for example `v0.9.1`, or `v1.0.0` once published). This rebuilds and deploys in about the build time.
2. Instant (dashboard or API): in Cloudflare Pages, Deployments, pick the last good deployment, Rollback. The deploy token (Pages edit) should allow it; if not, the client does it from the dashboard.
3. Leaked or wrong `/for` page: delete the file in the private repo and push to `main`; the workflow redeploys. Pages are `Cache-Control: no-store`.
4. After any rollback, set `SITE_TAG` back to the good tag so the next push does not redeploy the bad one.

## Unknowns recorded, not guessed (R-005)

- The Pages project name.
- The items listed as still unverified in section 5.
- Whether the private repo's GitHub plan supports environments.
- Whether wrangler `4.149.0` deploys cleanly with install scripts disabled. First deploy confirms.
