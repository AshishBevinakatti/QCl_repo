# Project State
Updated: 2026-10-20T13:45:07+05:30
Phase: 3 – Core Development      Work unit: 3.8 committed (`90ab9a6`, not merged) + cross-platform launcher `run-local.mjs` (this branch)
Status: awaiting — (1) launcher commit approval, (2) 3.8 browser click-through, (3) 3.8 merge approval, (4) Module 2 plan approval + records, (5) stale-branch deletion
Branch: feature/cross-platform-run (from develop @ b2a70e8)      Uncommitted: Module 2 records only (CR-001/Q-012/R-010…R-012, README row, phase-4 plan); untracked: root .vscode/ (never commit)
Last approved by user: 2026-10-20 — commit 3.8 first, then the launcher on its own branch; launcher method = Node script (`run-local.mjs`)
Pending question to user: (1) commit the launcher as staged? (2) browser click-through: 3.7 collect→confirm + 3.8 search/arrivals/loading/View-all (3) merge 3.8 → develop (`--no-ff` + full suite)? (4) approve Module 2 plan + commit its records? (5) delete fix/hide-table-scrollbar?
Next action: on launcher commit approval — commit `chore(dev): cross-platform local launcher (Windows + Fedora)`; then 3.8 click-through + merge (separate approval), then Module 2 decision
Servers: backend :8080 PID 6540 (started via run-local.mjs), web :5173 PID 6570, Keycloak :8081 — all up (verified 13:42). Restart: `node run-local.mjs postgres --web`; open http://localhost:5173 (not 127.0.0.1)
Open items: Q-002…Q-004, Q-007…Q-009, Q-012; Q-008 website location (ERP-01 not started); springdoc spec lag (pre-UAT must-fix); Windows launcher path written to spec but untested on a Windows host
