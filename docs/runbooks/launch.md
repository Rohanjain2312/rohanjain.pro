# Launch (Phase 7)

Owner: Platform, with Supervisor and Security. Spec: `docs/spec/11-phases.md` Phase 7, `docs/spec/12-operations.md` launch checklist, ADR-0016, ADR-0027. Start only after the Phase 6 gate and tag `v0.9.0`.

Phase 7 has two parts: three short client steps (section 1), then work Claude Code does alone (sections 2 to 7).

## 1. Client steps (nothing else is asked of the client)

Each step lists what to do and what to send back.

1. Cloudflare account and domain.
   1. Open https://dash.cloudflare.com/sign-up and create a free account with the email you use for this project.
   2. Turn on a passkey or two-factor sign-in: top right, My Profile, Authentication.
   3. Choose Add a domain, enter `rohanjain.pro`, pick the Free plan. Cloudflare shows two nameservers, for example `name.ns.cloudflare.com`. Keep that page open.
   4. Tell Claude Code the two nameservers.
2. Porkbun.
   1. Sign in at https://porkbun.com, open your domain list and open the details for `rohanjain.pro`.
   2. Turn DNSSEC off if it is on. It must be off before the nameservers change.
   3. Replace the nameservers with the two Cloudflare nameservers. Save.
   4. Confirm the transfer lock and auto-renew are on.
   5. In Cloudflare, wait for the status "Active" (minutes to a few hours). Cloudflare also emails you.
   6. Later, Claude Code gives you one DS record (four values). Paste it into the DNSSEC box at Porkbun. This is the only second visit to Porkbun.
3. One API token.
   1. Open the template link Claude Code gives you. It creates a token with the permissions listed in section 5. Choose Continue, then Create token. Copy the token once.
   2. In Terminal, run the two commands Claude Code prepares. Each asks you to paste a value. They look like this:
      `gh secret set CLOUDFLARE_API_TOKEN --env production --repo Rohanjain2312/rohanjain.pro-applications`
      `gh secret set CLOUDFLARE_ACCOUNT_ID --env production --repo Rohanjain2312/rohanjain.pro-applications`
      The second value is the Account ID shown on the right side of the domain overview page in Cloudflare.
   3. Close the terminal tab. The token is not stored anywhere else.

Passkeys or 2FA: GitHub is done (2026-10-16). Cloudflare is step 1.2. Porkbun needs 2FA too: Account, Security.

## 2. Before the client starts (Claude Code)

- Confirm the Phase 6 gate record, tag `v0.9.0`, and a green `npm run verify` on the tag.
- Copy `.github/templates/production-deploy.yml` to `.github/workflows/deploy.yml` in `Rohanjain2312/rohanjain.pro-applications` (private, already created, ADR-0016). Do not create or push to it from an agent worktree without the Supervisor-only exception.
- In that repo set variables: `gh variable set SITE_TAG --body v0.9.0 --repo Rohanjain2312/rohanjain.pro-applications` and `CF_PAGES_PROJECT`. The project name is a choice made at launch (suggested: `rohanjain-pro`); it is not recorded anywhere yet.
- Create the `production` environment (`gh api -X PUT repos/Rohanjain2312/rohanjain.pro-applications/environments/production`). Environments in private repos may need a paid GitHub plan. If the call fails, remove `environment: production` from the deploy job and set the two secrets as repository secrets instead. Only the deploy job reads them.
- Security reviews the copied workflow. The template passed `ci-checks.mjs pins` (all actions pinned).
- Run a dry run with a fixture result (section 3).

## 3. Production build rules (issue #221)

The private workflow builds in GitHub Actions and uploads `dist`. Cloudflare Pages does not build. It runs the repo's own commands from the tag, so it cannot drift from CI.

- Chromium: `npm run browsers:install` before the build, because the build renders the three résumé PDFs.
- Status line: the workflow downloads `status.json` from the `status-data` branch into `public/` (ADR-0027). A missing file only hides the line. A launch check confirms the line shows.
- Claims check for `/for` pages. Decision: `npm run build` is split into its three steps (`astro build`, `node scripts/resume-pdf.ts`, `node scripts/check-claims.ts`). The claims check runs on a copy of `dist` with `for/` removed, so R-301 still covers the site and the PDFs. The `/for` counts and proof text are engine output bounded by the result schema (R-502) and are not in `claims.json`. No script changed. A cleaner long-term option is a `--skip for` flag in `check-claims.ts` (App/Data owns it); the workflow would then call it.
- Output guard: the build fails if `dist/_headers` is missing or if a result JSON file is in `dist`.
- No raw result file is ever uploaded. The `dist` artifact keeps one day and holds rendered pages only. The repo is private, so its logs and artifacts are private.
- Monthly cleanup: `list-expired` runs `npm run for -- --list-expired` (names only, nothing deleted). `remove-expired` validates names, deletes those files, pushes to `main`, and the build job then redeploys.
- Test before launch: add one fixture result to the private repo (generate it with `npm run for` against a made-up posting), run the workflow with `SITE_TAG` set, and check that `/for/<slug>` is in the deployed preview and that the claims step passes. Only the first real run proves the wrangler step, because no Cloudflare token exists yet.

## 4. Cloudflare Pages

- Create the Pages project as a direct-upload project (no Git connection): wrangler creates it on the first deploy, or `npx wrangler pages project create <name> --production-branch main`.
- Add the custom domain `rohanjain.pro` in the project. Cloudflare creates the apex record. Add `www` as a second custom domain or a redirect rule to the apex.
- Headers come from `public/_headers` inside `dist`. Do not duplicate them in Cloudflare rules. HSTS and the Web Analytics origins are added to `_headers` in Phase 7 only (see the comment at the top of that file); Security owns the change.
- Turn on Cloudflare Web Analytics for the site. Do not add a cookie. Add its origins to `script-src` and `connect-src` in `_headers` (Security).
- Always HTTPS and Automatic HTTPS rewrites on; minimum TLS 1.2.

## 5. API token

One token, scoped to the one account and the one zone, 90-day expiry (`docs/spec/08-security.md`). Permissions needed:

| Use | Permission | Template key (verify in the Cloudflare permission reference at launch) |
|---|---|---|
| Deploy | Account, Cloudflare Pages, Edit | `page` edit |
| DNS records, CAA, email records | Zone, DNS, Edit | `dns` edit |
| Zone settings, DNSSEC | Zone, Zone Settings, Edit; Zone, DNSSEC, Edit | `zone_settings` edit; DNSSEC key not documented |
| Web Analytics | Account, Web Analytics, Edit | not documented |

Template link format: `https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=<url-encoded JSON array of {key,type}>&name=rohanjain.pro%20launch`. Claude Code builds and checks the link at launch.

The deploy workflow and the setup work share this token because the client supplies only one. Open question for the Supervisor and Security: after setup, replace it with a token limited to Pages edit (rotation is in `docs/spec/12-operations.md`, `rotate-secrets.md`).

## 6. DNS record plan

Set after the zone is Active. Domain has no email (`docs/spec/08-security.md`).

| Type | Name | Value | Note |
|---|---|---|---|
| CNAME (flattened) | `@` | the Pages project hostname | created when the custom domain is added |
| CNAME | `www` | `@` or redirect rule | redirect to the apex |
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
- Set `SITE_TAG` to the release, deploy, then publish `v1.0.0` (`docs/runbooks/releases.md`); the SBOM attaches to the release.
- Real 5-second test (skill `external-validation`) passed, or failures fixed and re-tested.
- Submit HSTS preload only after 30 stable days (Phase 8).

## 8. Rollback

Rollback never needs the client.

1. Fastest: redeploy the previous tag. `gh workflow run deploy.yml --repo Rohanjain2312/rohanjain.pro-applications -f tag=v0.9.0` (use the last good tag). This rebuilds and deploys in about the build time.
2. Instant (dashboard or API): in Cloudflare Pages, Deployments, pick the last good deployment, Rollback. Claude Code uses this only if the token allows; otherwise the client does it from the dashboard.
3. Leaked or wrong `/for` page: delete the file in the private repo and push to `main`; the workflow redeploys. Pages are `Cache-Control: no-store`.
4. After any rollback, set `SITE_TAG` back to the good tag so the next push does not redeploy the bad one.

## Unknowns recorded, not guessed (R-005)

- The Pages project name.
- The Cloudflare permission keys for DNSSEC and Web Analytics.
- Whether the private repo's GitHub plan supports environments.
- Whether wrangler `4.149.0` deploys cleanly with install scripts disabled. First deploy confirms.
