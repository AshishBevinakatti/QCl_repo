# Project State
Updated: 2026-10-17T15:07:08+05:30
Phase: 3 – Core Development      Work unit: 3.7 committed (`c44f2e5`, not merged); PLAN-3.8 approved — starts after 3.7 lands on develop      Status: awaiting (1) merge approval for 3.7, (2) user click-through, (3) stale-branch decision
Branch: feature/desk-confirm-flow @ c44f2e5         Uncommitted: docs/logs/{DEVLOG.md,STATE.md} (post-commit log updates); untracked: docs/03-phases/phase-3/PLAN-3.8-dashboard-completeness.md, root .vscode/ (never commit)
Last approved by user: 2026-10-17 — commit 3.7 as proposed + approve PLAN-3.8 ("start after 3.7")
Pending question to user: (1) merge 3.7 → develop (`--no-ff` + full suite)? (2) `fix/hide-table-scrollbar` (8ab2e26+77e9a0b, index.css scrollbar-hide only) — merge or drop? (3) browser click-through: hold → Collect advance → Confirm (+ expired → rebook link)
Next action: on merge approval — merge c44f2e5 → develop (--no-ff), full `mvn -B verify` + web build on merged result; then branch `feature/dashboard-completeness` from develop and implement PLAN-3.8 (slice 1: business-date helper)
Servers: backend Postgres+Keycloak :8080 (PID 18406), web :5173 — up (verified 15:05); restart via DAY-ONE §5 / run-local.sh; open http://localhost:5173 (not 127.0.0.1)
Open items: Q-002…Q-004, Q-007…Q-009; Q-008 website code location; springdoc spec lag (pre-UAT must-fix); 127.0.0.1 realm-URI durable fix offered, pending approval
