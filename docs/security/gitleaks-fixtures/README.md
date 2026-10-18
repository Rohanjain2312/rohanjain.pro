# gitleaks fixtures

Test inputs for `.gitleaks.toml` (issue #245, rules R-501 and R-508). Security owns this folder.

| File                    | Holds                                                 | Expected result                  |
| ----------------------- | ----------------------------------------------------- | -------------------------------- |
| `positive-sections.txt` | Made-up posting with responsibilities and qualifications headings | flagged, `job-description-sections` |
| `positive-eeo.txt`      | One made-up line with the posting boilerplate sentence | flagged, `job-description-eeo`   |
| `clean.txt`             | Ordinary notes with a single heading                  | no finding                       |

Every file is synthetic: a made-up company and role. No real posting is stored here (R-501, R-509).

## Run

Install gitleaks (`brew install gitleaks`), then from the repo root:

```
bash docs/security/gitleaks-fixtures/run.sh
```

The script copies the fixtures to a temp folder, scans them with `.gitleaks.toml`, and scans the repo tree. It exits non-zero on any miss.

## Allowlist

`.gitleaks.toml` has one allowlist. It covers `positive-*.txt` in this folder, by path, for the two job-description rules only, so the repo scan and CI do not fail on the test inputs. There is no allowlist for `postings/` or `*.jd.txt`. The path block (`.gitignore`, pre-commit, guard-bash) still stops those files by name.

## Limits

- The rules read text. A posting that is reworded, split under the heading pair, or pasted without section headings or the boilerplate sentence is not caught. The path block and review remain the main controls.
- The first rule needs one responsibilities heading and one qualifications heading, each alone on a line, within 1000 characters. Several lists with the same heading do not match.
- CI scans only the commits of a pull request, so older commits are not re-scanned.
- `npm run verify` does not run `run.sh`: it needs the gitleaks binary, and `package.json` belongs to Platform. Run it when `.gitleaks.toml` changes.
