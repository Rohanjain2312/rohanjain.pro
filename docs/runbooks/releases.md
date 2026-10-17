# Releases

The Supervisor publishes a release at each phase gate. No bot opens release PRs.

1. Confirm `main` is green and `docs/status.md` is current.
2. Publish: `gh release create v0.N.0 --target main --generate-notes`.
3. The `Release` workflow runs on `release: published`. It builds the site, generates a CycloneDX SBOM in a read-only job, and a separate job attaches `sbom.cdx.json` to the release.
4. If the run failed, re-run it with `gh workflow run release.yml -f tag=v0.N.0`.

Pushes to `main` do not run the Release workflow.
