# Project State
Updated: 2026-10-20T13:53:37+05:30
Phase: 3 – Core Development      Work unit: 3.8 + cross-platform launcher merged to develop (`bdd7252`); Module 2 records committed; awaiting next-unit direction
Status: idle-awaiting — (1) 3.8 browser click-through, (2) Module 2 plan approval, (3) stale-branch deletion, (4) next unit choice
Branch: develop @ `bdd7252` (records sync via the follow-up merge off `feature/cross-platform-run`)      Tree: clean except untracked root .vscode/ and ignored phase-4 PDF
Last approved by user: 2026-10-20 — commit 3.8 → launcher; merge 3.8; commit Module 2 records; merge launcher branch
Pending question to user: (1) browser click-through: 3.7 collect→confirm + 3.8 search/arrivals/loading/View-all (2) approve Module 2 plan + CR-001/Q-012? (3) delete fix/hide-table-scrollbar? (4) pick the next unit
Next action: on user direction — next Phase 3 unit from develop, or Module 2 Gate 1 design package after plan approval (no build; stays behind module.restaurant.enabled=false)
Servers: backend :8080 PID 6540 (started via run-local.mjs), web :5173 PID 6570, Keycloak :8081 — all up (verified 13:42). Restart: `node run-local.mjs postgres --web`; open http://localhost:5173 (not 127.0.0.1)
Open items: Q-002…Q-004, Q-007…Q-009, Q-012; Q-008 website location (ERP-01 not started); springdoc spec lag (pre-UAT must-fix); Windows launcher path written to spec but untested on a Windows host
