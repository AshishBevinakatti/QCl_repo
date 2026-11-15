# Project State
Updated: 2026-11-15T14:36:25+05:30
Phase: 1 (new baseline): Guest Acquisition, Identity & Sales Lead Operations. Work unit: **Increment 1: S1–S4 committed (…4a8ef19); S5 onboarding done (18 + 14 tests, 10/10 live), waiting for commit approval**. Branch `feature/phase1-inc1-identity`.
Branch: `feature/phase1-fresh-start` (local, not pushed). Archive: `archive/hotel-draft` + tag `archive-hotel-draft-2026-11-15` (825f3fe, pushed).

State:
1. Milestone 0 is done: archive pushed and verified; `a40defe` carried over Ashish's WIP; `5d220ab` removed 322 old files. Ignored local files (`ERP_DEV/.env`, `target/`, `node_modules`, `ERP_DEV/logs`) were left untouched.
2. Milestone 1 docs are **committed on `feature/phase1-fresh-start` (not pushed)**: phase1_plan v2.0, ARCHITECTURE, api, identity/AUTHENTICATION + KEYCLOAK-SETUP, ADR-001..003, REQUIREMENTS/TRACEABILITY/CHANGE_REQUESTS, source extracts (5 restored and hash-checked, 1 new), logs, onboarding, service/web/infra READMEs, new CI workflow.
3. Decisions of 2026-11-15: Keycloak for employees; Blueprint scope (no booking/payment); Blueprint microservices; same tech stack; later features deferred.

4. Resource folder rule updated to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (Q-001 answered).

Next action:
1. Ashish approves the S5 commit.
2. Push still blocked: GitHub token needs the `workflow` scope.
3. Then S6: deactivate/reactivate (Keycloak first, then logout, then DB), resend invite (3/hour), role change (`roles.assign`), last-admin and self guards, audit view.
