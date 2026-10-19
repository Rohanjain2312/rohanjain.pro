# Handoff

For the client. Written at the Phase 6 release candidate (`v0.9.0`). Plain steps only. Launch details for the team are in `docs/runbooks/launch.md`.

## 1. What is built

A static portfolio site for Rohan Jain (ML Engineer, AI Engineer, Data Scientist), built with Astro. It runs locally today and is not yet on the internet.

- Home page, project pages, a fit check that runs in the visitor's browser, a print view, three résumé PDFs made at build time, and a privacy page.
- Personal `/for/<name>` pages: one page per job application, with a fit result for that role. Their addresses carry a random suffix. They are not listed in the sitemap and tell search engines not to index them.
- Security headers and accessibility tests that run on every pull request. Lighthouse budgets and the cross-browser matrix (`npm run test:browsers`) are not enforced in CI yet; Claude Code runs them locally before launch.
- A daily status check of the demo links, written to the `status-data` branch.
- Production workflow, Cloudflare plan, DNS plan and launch runbook, prepared and waiting for you (section 3).

Where numbers come from: `docs/spec/05-evidence-ledger.md` and `src/content/claims.json`. Every number on the site must match a claim. Your résumé wording wins over repository values.

## 2. Run it locally

You need Node 24.21.0 (see `.nvmrc`) and the GitHub CLI.

```
npm ci
npm run dev        # editing mode at http://localhost:4321
npm run build      # production build, also makes the PDFs (needs Chromium: npm run browsers:install)
npm run preview    # serves the build with production headers
npm run verify     # every check CI runs
```

## 3. What launch needs from you

Three short steps, details and exact commands in `docs/runbooks/launch.md` section 1:

1. Create a free Cloudflare account with a passkey or 2FA, and add `rohanjain.pro`.
2. At Porkbun, turn DNSSEC off, replace the nameservers with the two Cloudflare shows, and later paste one DS record.
3. Create one Cloudflare setup token from a prepared link and run the prepared command that uses it once on your computer. It sets up DNS and creates a narrow deploy token for GitHub (ADR-0032). Delete the setup token as soon as the run has succeeded.

Claude Code does the rest: DNS records, DNSSEC, CAA, email-hardening records, deploy, analytics, external header scans, smoke tests and tag `v1.0.0`.

## 4. Application links (`npm run for`)

Each result is one file in a private repo, `Rohanjain2312/rohanjain.pro-applications`, in its `applications` folder. Result files never go into this public repo (ADR-0016).

1. Save the job posting text in a file outside the project folder, for example `~/Desktop/posting.txt`.
2. Run:
   ```
   npm run for -- --company "Acme" --role "ML Engineer" --jd ~/Desktop/posting.txt
   ```
   Optional: `--expires 90` (days, 1 to 365, default 90), `--out <folder>`. Without `--out`, files go to `rohanjain.pro-applications/applications` next to this project.
3. The command prints the page address, `/for/<name>-<suffix>`. The posting text is read and discarded; only the result is saved.
4. Commit and push the new file in the private repo. After launch, that push redeploys the site.
5. `npm run for -- --list-expired` lists results past their expiry. It deletes nothing. The monthly workflow removes them.

## 5. Application log (`npm run apps`)

Not built yet. It is Phase 8 work (rule R-902). When it lands:

- `npm run apps -- add` logs an application in a git-ignored file and picks at random, 3 of 4 times, whether to give the application a `/for` link.
- `npm run apps -- reply <id>` marks a reply.
- `npm run apps -- report` shows reply and interview rates per group, and says plainly when there are too few applications to judge (fewer than about 30 per group).

After launch, log every application. Without the log, the team cannot tell whether `/for` links help.

## 6. After launch

- Phase 8 (operate): weekly dependency updates, a monthly security review, a quarterly content check against your repositories, and a monthly report on reply rates.
- After 30 stable days Claude Code submits the site for HSTS preload.
- Monthly, the private workflow removes expired `/for` files and redeploys.
- The Cloudflare deploy token expires after 90 days. Claude Code tells you before it does and prepares the replacement steps.
- Domain renewal is yearly at Porkbun. Keep auto-renew on.
- Rollback: Claude Code can redeploy an earlier tag in minutes (`docs/runbooks/launch.md` section 8).

## 7. Open items still on your side

See `docs/needs-client.md`. The real 5-second test and recruiter fit ratings were dropped (ADR-0035).
