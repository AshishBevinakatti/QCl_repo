# Project State
Updated: 2026-10-20T13:52:00+05:30
Phase: 3 – Core Development      Work unit: 3.8 merged to develop (`f121009`); Module 2 records committed (`915716f`); cross-platform launcher pending merge
Status: awaiting — (1) launcher branch merge approval, (2) 3.8 browser click-through, (3) Module 2 plan approval, (4) stale-branch deletion
Branch: feature/cross-platform-run (develop merged in; clean tree except untracked root .vscode/ and ignored phase-4 PDF)
Last approved by user: 2026-10-20 — commit 3.8 first, then launcher on its own branch; merge 3.8 now; commit Module 2 records now
Pending question to user: (1) merge feature/cross-platform-run → develop (`--no-ff` + suite)? (2) browser click-through: 3.7 collect→confirm + 3.8 search/arrivals/loading/View-all (3) approve Module 2 plan + CR-001/Q-012? (4) delete fix/hide-table-scrollbar?
Next action: on launcher merge approval — merge `0b6aefc` → develop (`--no-ff`), rerun `mvn -B verify` + web build on merged result; no tag/push (no remote)
Servers: backend :8080 PID 6540 (run-local.mjs), web :5173 PID 6570, Keycloak :8081 — all up (verified 13:42). Restart: `node run-local.mjs postgres --web`; open http://localhost:5173 (not 127.0.0.1)
Open items: Q-002…Q-004, Q-007…Q-009, Q-012; Q-008 website location (ERP-01 not started); springdoc spec lag (pre-UAT must-fix); Windows launcher path written to spec but untested on a Windows host
