# rohanjain.pro

The portfolio site of Rohan Jain, an ML Engineer, AI Engineer and Data Scientist based in New York, NY. It will be served at `rohanjain.pro`. Until launch it runs locally.

## For recruiters and hiring managers
- The site shows what Rohan built, with a link to the source of every number: a repo, a demo, a figure or the résumé.
- A fit check compares a job posting with Rohan's evidence and gives an honest verdict, including "Not a strong fit", plus a one-page brief you can forward.
- The résumé is available on the site as text and as PDFs.
- This repository is public so you can check how the site was built and tested.

## How it was built
A team of Claude Code agents built the site, working like a small engineering organization: a Supervisor, a Design Lead, Frontend, App/Data, Platform, Security, QA and a Reader Advocate who judges only the rendered pages. Each piece of work is a GitHub Issue, a branch and a reviewed pull request. Rules are enforced by hooks in `.claude/hooks/` and by CI. The full plan starts at [`plan.md`](plan.md); progress is in [`docs/status.md`](docs/status.md).

Stack: [Astro](https://astro.build) with static output, TypeScript in strict mode, Vitest and Playwright. No server code and no tracking at runtime.

## Run it locally
Requirements: Node.js at the version in [`.nvmrc`](.nvmrc), and npm.

```bash
nvm use
npm ci
npm run browsers:install
npm run dev
```

`npm ci` runs with install scripts turned off (`.npmrc`), so the Playwright browser is installed by its own script.

| Script | What it does |
|---|---|
| `npm run dev` | Development server on localhost |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serves the built site on localhost |
| `npm run check` | `astro check` and `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run verify` | Everything CI runs; required before a pull request is marked ready |

## Repository map
| Path | Holds |
|---|---|
| `src/` | Site source: pages, components, styles, content and the fit-check engine |
| `docs/spec/` | The specification |
| `docs/adr/` | Architecture decision records |
| `docs/design/` | The design spec |
| `docs/security/` | Threat model and security reviews |
| `.claude/` | Agent roles, skills and the hooks that enforce the rules |
| `reference/` | Read-only source material: mockups, figures, résumé |

## Contributing and license
Workflow: [`CONTRIBUTING.md`](CONTRIBUTING.md). Code is MIT licensed; site content and résumé text are all rights reserved. See [`LICENSE`](LICENSE).
