# Architecture

Stack, repository layout, content model, engine and generator specs, and the ADR list.

### 5.1 Stack
| Layer | Choice | Why | Rejected alternatives |
|---|---|---|---|
| Framework | Astro (latest stable), static output | Ships HTML by default, islands for interactivity, content collections with schemas | Next.js (heavier runtime), SvelteKit (smaller content ecosystem), hand-written HTML (no content model or tests) |
| Language | TypeScript, strict | Type safety for content and logic | JavaScript |
| Interactivity | Vanilla TypeScript islands; Preact only if a component truly needs it | Smallest JS cost | React (size) |
| Styling | Plain CSS with custom properties, scoped Astro styles | Exact design fidelity, no framework weight | Tailwind |
| Content | Astro content collections, JSON with Zod schemas | Typed, validated at build | Markdown front matter, a CMS |
| Fonts | Newsreader and IBM Plex Mono, self-hosted via Fontsource, subset WOFF2, `font-display: swap`. Margin notes use Newsreader italic (no handwriting font) | Privacy, speed, stable CSP, no cost | Google Fonts CDN, paid handwriting font |
| Images | Astro image pipeline to AVIF and WebP, explicit dimensions | Performance and CLS | Raw PNG |
| Résumé PDFs | Generated at build with Playwright (Chromium) from an Astro print route | PDFs always match the content | Hand-maintained PDFs |
| Tests | Vitest, Playwright, axe-core, Lighthouse CI | Industry standard | Jest, Cypress |
| Hosting (Phase 7) | Cloudflare Pages | Free, global edge, header control, previews | Vercel Hobby, Netlify, GitHub Pages (no custom headers) |
| DNS (Phase 7) | Cloudflare DNS (free), with the domain staying registered at Porkbun | Required for an apex custom domain on Cloudflare Pages; DNSSEC; headers and analytics in one place | Porkbun DNS with a CNAME (no apex support on Pages), moving the registration to Cloudflare (not needed) |
| Analytics (Phase 7) | Cloudflare Web Analytics (cookieless) | Free, no consent banner | Plausible, Umami |
| CI/CD | GitHub Actions | Free for public repos, auditable | Other CI |

### 5.2 Repository layout
```
/
├─ .claude/
│  ├─ agents/                # one file per role (7)
│  ├─ rules/                 # path-scoped rules, load when matching files are touched
│  ├─ skills/                # procedures, load on demand
│  ├─ hooks/                 # enforcement and context hooks, owners.json, test-hooks.mjs
│  ├─ state/                 # git-ignored: hook log, compaction snapshot, verify stamp, audit lists
│  └─ settings.json          # env, permissions, hook wiring
├─ .github/
│  ├─ workflows/             # ci.yml, codeql.yml, status.yml, release.yml, scorecard.yml, cleanup.yml, deploy.yml (previews; production deploys from the private repo, ADR-0016)
│  ├─ CODEOWNERS
│  ├─ pull_request_template.md
│  ├─ ISSUE_TEMPLATE/
│  └─ dependabot.yml
├─ docs/
│  ├─ adr/  design/  security/  runbooks/  reviews/  demos/
│  ├─ spec/                  # this specification, split by topic
│  ├─ rules.md               # rule inventory
│  ├─ architecture.md  content-guide.md
│  ├─ status.md              # live progress and the resume pointer (skill `session-protocol`)
│  └─ needs-client.md        # the only things the client must do
├─ public/
│  ├─ _headers  _redirects  robots.txt
│  ├─ fonts/
│  └─ .well-known/security.txt
├─ reference/                # mockups and source material (read-only)
├─ scripts/
│  ├─ for.ts                 # per-application page generator
│  ├─ resume-pdf.ts          # builds the three résumé PDFs
│  ├─ check-claims.ts        # truthfulness test on built HTML and PDFs
│  └─ validate-content.ts
├─ src/
│  ├─ components/
│  ├─ content/
│  │  ├─ claims.json  projects.json  skills.json  roles.json
│  │  ├─ figures.json  samples.json  resume.json  site.json
│  │  └─ applications/       # .gitkeep only; result files live in a private repo (ADR-0016)
│  ├─ lib/
│  │  ├─ fitcheck/           # engine, matcher, scorer, types
│  │  └─ format/
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ index.astro  privacy.astro  404.astro
│  │  ├─ for/[slug].astro
│  │  └─ print/resume/[role].astro   # source for PDF generation, noindex
│  └─ styles/                # tokens.css, base.css, print.css
├─ tests/
│  ├─ unit/  e2e/  property/  a11y/  visual/
│  └─ fixtures/golden/       # synthetic requirement lists, ADR-0028 (`docs/spec/09-quality.md` §9.4)
├─ CLAUDE.md                 # always loaded, small
├─ plan.md                   # index and load map
├─ README.md  CONTRIBUTING.md  SECURITY.md  CHANGELOG.md  LICENSE
├─ .nvmrc  package.json  package-lock.json  tsconfig.json
├─ stryker.config.json       # mutation testing (`docs/spec/09-quality.md` §9.5)
└─ astro.config.mjs
```

### 5.3 Content model (Zod schemas)
- `claims.json`: `{ id, value, display, source, sourceUrl?, verifiedOn, note? }`.
- `projects.json`: `{ id, name, dateRange, featured, order, oneLiner, headlineClaimId, contextClaimIds[], links[], demo?, stack[] }`.
- `skills.json`: `{ name, category, tier: "shipped"|"work"|"studied", evidence[], roles[], aliases[] }`.
- `roles.json`: `{ id: "ai"|"ml"|"ds", title, summary, pdfFile }`.
- `figures.json`: `{ id, projectId, kind: "image"|"bars", src?, alt, bars?, axisLabel, caption, note, claimIds[] }`.
- `resume.json`: header, education, skills groups, experience bullets, projects, publication; each bullet references claim IDs.
- `site.json`: name, location ("New York, NY"), availability ("available now"), email, profile links (LinkedIn, GitHub, Hugging Face, Medium), `showPhoto: false`.
- `applications/<slug>.json` (in the private `APPLICATIONS_DIR`, ADR-0016): `{ slug, company, roleTitle, createdOn, expiresOn, verdict, provenSkills[], gaps[], evidenceRows[], roleFamily }`. Never contains job description text.

### 5.4 Fit-check engine specification (App/Data Engineer)
- Pure function `analyze(text, skills, extras, evidence) -> Report`. No DOM, no network, no storage, no randomness, no time dependence.
- Input: trimmed, Unicode-normalized (NFKC), lowercased, whitespace-collapsed, hard-capped at 8,000 characters before processing.
- Matching: precompiled, escaped patterns with word-boundary guards built at build time from curated aliases. User input is never turned into a regex. A ReDoS test with adversarial 8,000-character input must finish under 50 ms. (R-402, R-406)
- Tiers: `shipped` and `work` count as proven. `studied` and unknown market skills (Swift, Kotlin, CUDA, etc.) count as gaps. Studied skills never count as matches. (R-403)
- Scoring: `ratio = proven / (proven + gaps)`. Fewer than 4 total matches: "Not enough to go on". ratio >= 0.80: "Strong fit". 0.55 to 0.80: "Good fit, with gaps". Below 0.55: "Not a strong fit". Thresholds live in config and are tuned only against the golden set (`docs/spec/09-quality.md` §9.4).
- Output: top 4 evidence rows by matched-skill count, up to 8 tags per row, gaps list, role family (ai/ml/ds).
- Rendering: text nodes or framework-escaped templates only. `innerHTML` and similar are banned by lint rule. (R-405)

### 5.5 Per-application pages (`/for/<slug>`)
- `npm run for -- --company "Acme" --role "ML Engineer" --jd ./posting.txt [--expires 90]` runs the engine locally and writes `<slug>.json` to `APPLICATIONS_DIR`, a private repo outside this one (ADR-0016). Result files are never committed here.
- Slug format: `<company-kebab>-<6 random base32 chars>`, so live pages cannot be guessed. The list of applications stays private because the data is not in this repo (ADR-0016).
- The job description file is read, analyzed and discarded. It is never written to the repo. `postings/` and `*.jd.txt` are in `.gitignore` and blocked by a pre-commit hook. (R-501, R-502)
- Pages are excluded from the sitemap and carry `noindex, nofollow` (meta tag and `X-Robots-Tag`).
- Expired pages show a short notice with a link to the main site; a monthly job removes them.

### 5.6 Demo embeds
- Default state is a static screenshot with a "Load live demo" button. The Hugging Face iframe is created only on click, with `loading="lazy"`, `sandbox="allow-scripts allow-same-origin allow-forms"`, `referrerpolicy="no-referrer"` and a title.
- Only `https://*.hf.space` is allowed in `frame-src`.
- Copy explains that free demos may take up to a minute to wake.

### 5.7 Scheduled status workflow
- `status.yml` runs daily on GitHub Actions. It checks each demo URL and the latest commit date of each featured repo (public, no token needed) and writes `status.json` to the orphan branch `status-data` (ADR-0027). It never writes `main` and opens no PR.
- The site reads `status.json` at build time; the production build workflow in the private applications repo (ADR-0016) copies it from `status-data` into `public/` first. No runtime calls. No file means no status line.

### 5.8 Résumé PDF generation
- `src/content/resume.json` is seeded verbatim from `reference/resume/Rohan_Resume_v26.docx`, with the client decisions in `docs/spec/05-evidence-ledger.md` §4.4 applied, the location set to New York, NY, and no work authorization line.
- Three variants share all content except the summary, which comes from `roles.json`.
- `scripts/resume-pdf.ts` renders `/print/resume/[role]` with Playwright and writes `public/resume/Rohan-Jain-<Role>.pdf` during the build. PDFs are text-selectable (ATS-friendly), single column, one to two pages, standard fonts embedded.
- The claims check also runs on the PDF text.

## Architecture Decision Records

The Supervisor writes these in `docs/adr/` in Phase 0 (format: context, decision, consequences, alternatives):
1. ADR-0001 Use Astro with static output.
2. ADR-0002 Local-first build; production on Cloudflare Pages with Cloudflare DNS; domain `rohanjain.pro` registered at Porkbun.
3. ADR-0003 No runtime server code and no runtime LLM calls.
4. ADR-0004 Deterministic client-side fit check with tiered skills.
5. ADR-0005 Content-driven numbers and the Evidence Ledger, with client-confirmed résumé values taking precedence.
6. ADR-0006 Self-hosted fonts; italic serif for margin notes.
7. ADR-0007 Per-application pages store results only, never job descriptions.
8. ADR-0008 Cookieless analytics only.
9. ADR-0009 Public repo from day one, trunk-based, signed commits.
10. ADR-0010 Résumé PDFs generated from content at build time.
11. ADR-0011 Autonomous phase progression with usage-aware session control.
12. ADR-0012 Instructions by progressive disclosure: one home per rule, hard rules enforced by hooks and CI, small always-loaded `CLAUDE.md`.
