# Project State
Updated: 2026-11-15T11:23:49+05:30
Phase: 1 (new baseline): Guest Acquisition, Identity & Sales Lead Operations. Work unit: **Milestone 1: documentation + skeleton** (no application code).
Branch: `feature/phase1-fresh-start` (local, not pushed). Archive: `archive/hotel-draft` + tag `archive-hotel-draft-2026-11-15` (825f3fe, pushed).

State:
1. Milestone 0 is done: archive pushed and verified; `a40defe` carried over Ashish's WIP; `5d220ab` removed 322 old files. Ignored local files (`ERP_DEV/.env`, `target/`, `node_modules`, `ERP_DEV/logs`) were left untouched.
2. Milestone 1 docs are **committed on `feature/phase1-fresh-start` (not pushed)**: phase1_plan v2.0, ARCHITECTURE, api, identity/AUTHENTICATION + KEYCLOAK-SETUP, ADR-001..003, REQUIREMENTS/TRACEABILITY/CHANGE_REQUESTS, source extracts (5 restored and hash-checked, 1 new), logs, onboarding, service/web/infra READMEs, new CI workflow.
3. Decisions of 2026-11-15: Keycloak for employees; Blueprint scope (no booking/payment); Blueprint microservices; same tech stack; later features deferred.

4. Resource folder rule updated to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (Q-001 answered).

Next action:
1. Push `feature/phase1-fresh-start` only with Ashish's approval; the first CI run checks the landing-page build (R-010).
2. Answer blockers: Q-003 (guest identity vs the frozen landing-page contract) before increment 2; Q-020 (version upgrade) and Q-023 (new dev/test dependencies) before increment 1 code.
3. Then plan increment 1 (`docs/03-phases/phase-1/inc1-PLAN.md`) and wait for approval.
