# Phase 1 Report — Requirement Discovery (CORE, assumed defaults)

- Date: 2026-10-09. Branch: `develop`. Commit: `e68cee5` (user-approved 2026-10-09).

## Summary
Baselined CORE requirements (ERP-02…09 + lite facilities/housekeeping/maintenance) with every client-missing value as `[ASSUMED]` placeholder config. ERP-10…14 excluded (user: CORE only). RFID/gateway/OTA on simulator/sandbox path (hardware not procured, keys pending). Proposal stack confirmed by user for Phase 2 ADR lock-in. No code/schema/dependency added (docs-only phase).

## Deliverables (links)
- `docs/03-phases/phase-1/PLAN.md` · `docs/01-requirements/REQUIREMENTS.md` (REQ-ERP02…09 + FAC/HSK/XCUT) · `TRACEABILITY.md` (61 rows) · `DECISIONS-FROM-CLIENT.md` (confirmed + D-101…D-114) · 11 module docs in `docs/04-modules/` · updated `OPEN_QUESTIONS.md` (Q-005 answered; Q-008/009/010 added), `DECISIONS.md` (D-005…D-008), `RISKS.md` (R-007…R-009), `RESOURCES_LOG.md`, `GLOSSARY.md`.

## Exit checklist with evidence
- [x] Every requirement traced to a source — TRACEABILITY 61 rows, each with SOW §; design/code/tests marked TBD P2/3 (verified by re-read).
- [x] Every open question answered or parked with a default — Q-001/Q-005 answered; Q-002…004, Q-006…010 open with defaults (simulators, assumed config, proposal→ADR).
- [x] User approves the baseline — approved 2026-10-09 via question tool (logged in DEVLOG + this report).
- [x] No invented facts as real — all guesses tagged `[ASSUMED]`; no secrets/raw files (git status review + fresh clone clean).

## Deviations from plan
- User instruction "…and start coding" conflicts with Rule 3/Rule 4 (baseline + design approval before code) — flagged, no code started (D-008). Coding begins Phase 3 after Phase 2 design approval.
- Baseline committed directly on `develop` with approval (Phase 0 precedent) rather than via `docs/*` branch + merge — same trade-off as Phase 0, logged here.

## Test evidence
- No code → no test suite. Verification: re-reads, `git diff --stat` review (22 files, +773/−51), fresh-developer test: clean clone of `develop` to `/tmp/opencode/freshclone-p1` — phase-1 + requirements trees present, `git status` clean → pass.

## Docs updated
All files in commit `e68cee5` (see `git show --stat e68cee5`).

## Risks & open questions carried forward
R-007 (assumed defaults), R-008 (website location Q-008), R-009 (gate discipline); Q-002 agreement doc, Q-003 Decision Pack timing, Q-004 branding (ERP-01), Q-006/Q-010 stack ADR lock-in, Q-007 web-fetch permission, Q-008 website code, Q-009 sandbox→real creds/hardware.

## Commits
- `e68cee5` docs(core): phase 1 baseline (develop, user-approved). No merges/tags/pushes.

## Decision requested
Phase 1 is complete. Do you want to continue to Phase 2 (UI/UX & Architecture — stack ADR lock-in + design baseline)? — answer pending.
