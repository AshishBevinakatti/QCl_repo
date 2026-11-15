# Project State
Updated: 2026-11-15T11:55:38+05:30
Phase: 1 (new baseline): Guest Acquisition, Identity & Sales Lead Operations. Work unit: **Increment 1: S1 committed (8d5f9bc); S2 access-service skeleton done, waiting for commit approval**. Branch `feature/phase1-inc1-identity`.
Branch: `feature/phase1-fresh-start` (local, not pushed). Archive: `archive/hotel-draft` + tag `archive-hotel-draft-2026-11-15` (825f3fe, pushed).

State:
1. Milestone 0 is done: archive pushed and verified; `a40defe` carried over Ashish's WIP; `5d220ab` removed 322 old files. Ignored local files (`ERP_DEV/.env`, `target/`, `node_modules`, `ERP_DEV/logs`) were left untouched.
2. Milestone 1 docs are **committed on `feature/phase1-fresh-start` (not pushed)**: phase1_plan v2.0, ARCHITECTURE, api, identity/AUTHENTICATION + KEYCLOAK-SETUP, ADR-001..003, REQUIREMENTS/TRACEABILITY/CHANGE_REQUESTS, source extracts (5 restored and hash-checked, 1 new), logs, onboarding, service/web/infra READMEs, new CI workflow.
3. Decisions of 2026-11-15: Keycloak for employees; Blueprint scope (no booking/payment); Blueprint microservices; same tech stack; later features deferred.

4. Resource folder rule updated to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (Q-001 answered).

Next action:
1. Ashish approves the S2 commit.
2. Push still blocked: GitHub token needs the `workflow` scope.
3. Ashish adds the new variables from `ERP_DEV/.env.example` to his `ERP_DEV/.env`.
4. Then S3: api-gateway (Spring Cloud 2025.1.4 + Boot 4.1.2 compatibility is checked there).
