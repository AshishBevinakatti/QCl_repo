# Git workflow

## Branch model (git-flow lite)
| Branch | Purpose | Rules |
|---|---|---|
| `main` | production-ready, tagged releases | no direct commits; merge only from `release/*` or `hotfix/*` with user approval |
| `develop` | integration of finished work units | no direct commits; merge only from `feature/*` / `fix/*` / `docs/*` with user approval |
| `feature/<unit>-<slug>` | one work unit, e.g. `feature/3.2-booking-engine` | branch from `develop`; delete after merge (ask first) |
| `fix/<slug>` | non-urgent bug fix | from `develop` |
| `docs/<slug>` | documentation-only work | from `develop` |
| `release/<x.y.z>` | stabilisation before production | from `develop`; only fixes + docs |
| `hotfix/<slug>` | urgent production fix | from `main`; merge to `main` **and** `develop` |

Creating a feature branch at the start of an approved work unit is allowed — tell the user the branch name. Everything else that changes shared history needs approval.

## Commit format — Conventional Commits
```
<type>(<scope>): <imperative summary, ≤72 chars>

<body: what and why, wrap at ~80>

Refs: REQ-ERP02-014, SOW §5
Docs: docs/04-modules/erp-02-booking.md
```
Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `revert`.
Scopes: `erp-01` … `erp-14`, `core`, `auth`, `rbac`, `audit`, `db`, `housekeeping`, `facility`, `maintenance`, `rfid-fw`, `docs`, `ci`, `infra`.
Breaking change: `!` after scope and a `BREAKING CHANGE:` footer.

Commit rules
- Atomic: one logical change per commit; tests and docs for a change go in the same commit as the change.
- Never commit a state where the build or tests are broken (WIP stays uncommitted or on a clearly named WIP commit only if the user asks).
- Stage explicit paths, review `git diff --cached` before committing. Check no secrets, `.env`, client raw files, personal data, build artefacts.
- Do not add AI-attribution trailers unless the user asks.

## Approval protocol (every commit)
1. Verify: tests, lint, build, docs, logs, traceability updated.
2. Present summary + `git status` + `git diff --stat` + proposed commit list (see SKILL.md Rule 7).
3. Ask the question; wait.
4. On *yes*: stage, commit, show `git log --oneline -n 5`, append to DEVLOG: timestamp, hash(es), branch, message(s), "approved by user". Update `STATE.md`.
5. On *no*: log feedback, do not commit, keep changes in the working tree, fix, present again.
6. Never push. Push only when the user says "push", names the remote/branch, and only after you show what will be pushed (`git log origin/<branch>..HEAD --oneline`).

## Merge and tag
- End of work unit: after the commit, ask separately: "Merge `feature/…` into `develop`?" Use `--no-ff` so the unit stays visible in history. Run the full test suite on the merged result before reporting success.
- End of phase: after the user's "continue" decision, ask: "Tag `develop` as `phase-N-complete`?" Use annotated tags (`git tag -a`) with the PHASE-REPORT summary.
- Releases: `release/x.y.z` → merge to `main` and `develop`, annotated tag `vX.Y.Z` (semver; `0.x` until production go-live, `1.0.0` at go-live). Update `CHANGELOG.md` (Keep a Changelog format) at release time.

## Forbidden without an explicit, specific instruction from the user
`git push --force` (never to `main`/`develop` at all), `git reset --hard`, `git clean -fd`, `git rebase` of shared branches, `git commit --amend` on commits already shared, `--no-verify`, deleting branches/tags, `git stash drop`, editing git config, adding remotes.

## Hygiene
- `.gitignore`: env files, secrets, build output, dependency dirs, local DBs, editor files, `*.pem`, `*.key`, uploaded media, backups.
- Commit `.env.example` (variable names and fake values only).
- Pre-commit (ask before installing): secret scanner, formatter, linter, commit-msg lint.
- Pull-request template (`.github/pull_request_template.md` or `docs/templates/PR.md`): summary, SOW/REQ refs, screenshots/evidence, tests, docs updated, migration notes, rollback notes.
- Large binary assets (images) → ask before adding; prefer optimised files and record source in RESOURCES_LOG.
