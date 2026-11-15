# Project State
Updated: 2026-11-15T12:22:28+05:30
Phase: 1 (new baseline): Guest Acquisition, Identity & Sales Lead Operations. Work unit: **Increment 1: S1–S3 committed (8d5f9bc, bd8d799, 88176a5); S4 web shell done (15/15 live login checks), waiting for commit approval**. Branch `feature/phase1-inc1-identity`.
Branch: `feature/phase1-fresh-start` (local, not pushed). Archive: `archive/hotel-draft` + tag `archive-hotel-draft-2026-11-15` (825f3fe, pushed).

State:
1. Milestone 0 is done: archive pushed and verified; `a40defe` carried over Ashish's WIP; `5d220ab` removed 322 old files. Ignored local files (`ERP_DEV/.env`, `target/`, `node_modules`, `ERP_DEV/logs`) were left untouched.
2. Milestone 1 docs are **committed on `feature/phase1-fresh-start` (not pushed)**: phase1_plan v2.0, ARCHITECTURE, api, identity/AUTHENTICATION + KEYCLOAK-SETUP, ADR-001..003, REQUIREMENTS/TRACEABILITY/CHANGE_REQUESTS, source extracts (5 restored and hash-checked, 1 new), logs, onboarding, service/web/infra READMEs, new CI workflow.
3. Decisions of 2026-11-15: Keycloak for employees; Blueprint scope (no booking/payment); Blueprint microservices; same tech stack; later features deferred.

4. Resource folder rule updated to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (Q-001 answered).

Next action:
1. Ashish approves the S4 commit.
2. Optional: Ashish clicks through http://localhost:5173 in a real browser (keycloak-js in-browser redirect not yet seen live).
3. Push still blocked: GitHub token needs the `workflow` scope.
4. Then S5: employee onboarding (create → Keycloak user + role + invite email → status sync → bootstrap admin) + Employees screens; includes the brute-force lockout check and following the invite link.
