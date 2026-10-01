# DAY-ONE — from zero to first change (verified 2026-10-01, Phase 0)

- Purpose: get a new developer productive on day one. Audience: new developers. Owner: project team.
- Scope note: the repo is docs-only in Phase 0 (no application code yet). Steps marked [APP] activate
  when the first runnable slice lands (Phase 2/3); everything below was actually run on 2026-10-01.

## 1. What this project is
Integrated Resort Management ERP for Golden Hills Resort (QuantumCLK Technologies): reservations,
front office, housekeeping, guest CRM, membership/loyalty, RFID access, billing, OTA sync, reporting
(SOW modules ERP-01…ERP-09 core, ERP-10…ERP-14 optional). Requirements live in the read-only resource
folder `/run/media/ash_63/DATA/ERP_Resouce`; derived extracts live in `docs/01-requirements/source-extracts/`.

## 2. Prerequisites
- `git --version` → 2.55.0 (any recent git works). Check: `git --version`.
- A text editor. No runtimes needed yet ([APP]: Java 21 / Node LTS versions will be pinned here in Phase 2).

## 3. Clone and look around
```
git clone <org-remote-url> && cd ERP_Resort
git status            # expected: clean tree on develop
ls ERP_DEV/docs       # expected: README.md 00-onboarding 01-requirements ... logs templates
```
Read `ERP_DEV/docs/README.md`, then `ERP_DEV/docs/logs/STATE.md` (current phase + next action).

## 4. Run the tests
No test suite yet (docs-only). [APP]: `<test command>` → expected: all green (to be documented in Phase 2/3).

## 5. Repo map
`ERP_Resort/`: agent config (`.opencode/`, `AGENTS.md`) + `ERP_DEV/` (the project: `docs/` now;
`services/`, `web/`, `infra/` from Phase 3). Git root is `ERP_Resort/`; skill path `docs/...` = `ERP_DEV/docs/...`.

## 6. Workflow in one page
Work unit by work unit (Rule 3 loop): understand → docs-only plan (approved) → `feature/<unit>-<slug>`
from `develop` → tests-first where logic matters → thin vertical slices → verify → document → record →
present → **ask to commit, wait**. Phase gate at each phase end: report → fresh-developer test →
"continue to Phase N+1?" → wait. Conventional Commits; never commit/merge/push without explicit approval.

## 7. First small change (worked example, docs)
1. `git checkout develop && git pull && git checkout -b docs/day-one-fix`
2. Fix a typo in `ERP_DEV/docs/`, update `logs/DEVLOG.md` + `logs/STATE.md` in the same change.
3. Show `git status` / `git diff --stat`; ask the user to approve the commit; only then commit.

## 8. Where things are logged
Decisions: `logs/DECISIONS.md` (big ones → `02-architecture/adr/ADR-NNN-slug.md`).
Questions: `logs/OPEN_QUESTIONS.md`. Resources used: `logs/RESOURCES_LOG.md`. Risks: `logs/RISKS.md`.

## 9. Common problems
- Resource drive unreadable → stop, tell the user (never work around it or invent inputs).
- Plan-mode agent refusing writes → switch the agent to build mode; do not work around it.

## 10. When stuck
Read `STATE.md` (next action), `OPEN_QUESTIONS.md` (known unknowns), `WORKING-AGREEMENT.md` (process).
Ask the user — silence is not approval for commits, merges, or phase moves.
