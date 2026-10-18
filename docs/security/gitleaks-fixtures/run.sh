#!/usr/bin/env bash
# Checks .gitleaks.toml against the fixtures in this folder (issue #245, R-501, R-508).
# Run from the repo root: bash docs/security/gitleaks-fixtures/run.sh
# Needs gitleaks on PATH. Copies the fixtures to a temp folder first, because the config allowlists
# the positive fixtures by their repo path and the test must see them as ordinary files.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
config="$here/../../../.gitleaks.toml"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/positive" "$tmp/clean"
cp "$here"/positive-*.txt "$tmp/positive/"
cp "$here"/clean.txt "$tmp/clean/"

fail=0

# Each positive fixture must be flagged by its own rule.
report="$tmp/positive.json"
gitleaks dir --no-banner --redact --config "$config" --report-format json --report-path "$report" "$tmp/positive" >/dev/null 2>&1 && {
  echo "FAIL: positive fixtures passed the scan"
  fail=1
} || true
for pair in "positive-sections.txt:job-description-sections" "positive-eeo.txt:job-description-eeo"; do
  file="${pair%%:*}"
  rule="${pair##*:}"
  if node -e '
    const [report, file, rule] = process.argv.slice(1);
    const hits = JSON.parse(require("fs").readFileSync(report, "utf8"));
    process.exit(hits.some((h) => h.File.endsWith("/" + file) && h.RuleID === rule) ? 0 : 1);
  ' "$report" "$file" "$rule"; then
    echo "ok: $file flagged by $rule"
  else
    echo "FAIL: $file not flagged by $rule"
    fail=1
  fi
done

# The clean fixture must pass.
if gitleaks dir --no-banner --redact --config "$config" "$tmp/clean" >/dev/null 2>&1; then
  echo "ok: clean.txt passes"
else
  echo "FAIL: clean.txt was flagged"
  fail=1
fi

# The repo itself must pass (the positive fixtures are allowlisted by path).
if (cd "$here/../../.." && gitleaks dir --no-banner --redact --config .gitleaks.toml . >/dev/null 2>&1); then
  echo "ok: repo tree passes"
else
  echo "FAIL: repo tree has findings (run gitleaks dir --config .gitleaks.toml . for details)"
  fail=1
fi

exit "$fail"
