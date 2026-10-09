# Phase 2 Plan — UI/UX & Architecture (design baseline)

- Purpose: agreed screens, data model, APIs, and locked technical choices so Phase 3 code has no guessing. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Entry: Phase 1 baseline approved + committed (`e68cee5`); user chose Continue to Phase 2 (2026-10-09). No code in this phase until design baseline approved (Rule 3).

## Goal
Design baseline: stack ADR lock-in (proposal confirmed by user — record as accepted ADR, no options theatre), ERD + data dictionary, state machines, OpenAPI contract, adapter designs (gateway/OTA/RFID-simulator/notifications), RBAC + audit design, config model, environments plan, RFID terminal protocol, screen flows per role, backup/recovery plan, confirmed Phase 3–4 build order, plus a hello-world vertical slice (UI→API→DB→test→CI) running from a clean clone (Phase 2 exit).

## SOW / source references
- Phase 1 baseline: REQUIREMENTS (REQ-ERP02…09 + FAC/HSK/XCUT), TRACEABILITY, module docs.
- Proposal stack (user-confirmed 2026-10-09, Q-010): Java 21 LTS + Spring Boot 3 / Spring Cloud, React 18 + TS, PostgreSQL + Redis + Kafka, Keycloak OIDC/RBAC, Docker + K8s, Prometheus/Grafana/Jaeger/ELK. Modular monolith first (proposal §10 + playbook §1: split only when a module needs independent scaling).
- SOW §§18–25 (facilities depth lite per baseline; technical/security/hosting/backup; integrations client-responsibility).

## In scope
1. ADR-001 stack lock-in (accepted): language/framework, DB, cache/queue, auth, hosting target, API style, frontend, testing tools, CI — each with why + consequences. Small follow-up ADRs only if a choice genuinely varies (e.g. export engine, PDF lib).
2. `02-architecture/`: data-model.md (ERD + dictionary, property-scoped keys from day one), api.md (OpenAPI per service, versioned, error/pagination conventions), security.md (RBAC deny-by-default matrix, secrets, hardening), integrations.md (one adapter per external: gateway-sandbox, OTA-mock, RFID-simulator, email/SMS/WhatsApp-stub; timeouts/retries/dead-letter/visibility), environments.md (dev/staging/prod, hosting-undecided → Docker Compose now, cloud-ready).
3. Screen flows per role (text-first flows + wireframe notes; branding pending Q-004 — ERP-01 excluded anyway): reception dashboard, booking, guest, member, folio/pay, admin/reports, housekeeping board, RFID enrollment, channel dashboard.
4. Config model (all `[ASSUMED]` defaults as data), audit-log design, job design (hold-expiry, OTA-sync, expiry, reconciliation, exports), backup/restore + deployment notes start.
5. Hello-world slice: monorepo skeleton (`services/`, `web/`, `infra/`, `shared/`) + one entity end-to-end + CI green on a branch — demo only, merged only after design approval.
6. Commit `PHASE-REPORT.md` of Phase 1 (uncommitted) together with Phase 2 plan approval — asked explicitly, never silent.

## Out of scope
- Full module implementation (Phase 3), real credentials/hardware (simulators stay), ERP-10…14, payroll/accounting/POS extras (SOW §30), production deploy (Phase 7).

## Design approach
- Modular monolith: one deployable, strict module boundaries (erp-02…09 packages), cross-module via interfaces so a module can be disabled/extracted later.
- Money: paise integers, single tax module, single rounding policy. Time: UTC store, Asia/Kolkata display. Availability: transactional + constraint + concurrency test hooks. Idempotency keys on booking/payment/refund/OTA-import. Soft-delete + append-only audit everywhere.
- API: `/api/v1/...`, OpenAPI generated from code (springdoc) or kept beside code; consistent errors + request IDs + pagination.

## Config vs code
All D-101…D-114 defaults land in `app_config` seed (admin-editable, audited, effective-dated). No business value in constants.

## Tests to write (Phase 2 slice + Phase 3 hooks)
- Slice: integration test (API→DB via Testcontainers-style or equivalent), RBAC smoke test, contract-test harness for adapters.
- Documented test plan for Phase 3.2+ concurrency + money paths (written in Phase 3, listed here for traceability).

## Docs to update
ADRs, `02-architecture/*.md`, screen flows, `04-modules/*` (design refs fill TRACEABILITY Design column), `DAY-ONE.md` (skeleton run commands — must actually run), runbook start, DEVLOG/STATE/OPEN_QUESTIONS/DECISIONS/RISKS.

## Risks
- Hosting undecided → keep everything Compose-runnable + cloud-ready; no cloud-only coupling.
- Website location unknown (Q-008) → booking integration stays adapter-shaped.
- Premature microservice split → forbidden in Phase 2; monolith first per proposal §10.

## Open questions
Q-008 website location, Q-009 real creds/hardware timing, Q-007 web-fetch permission for library docs (ask once this phase).

## Definition of done
- [ ] ADRs accepted; ERD + OpenAPI + adapter designs reviewed against every REQ.
- [ ] Hello-world slice runs from clean clone (commands + outputs in DAY-ONE).
- [ ] TRACEABILITY Design column filled; no code merged until user approves design baseline.
- [ ] User approves design baseline (phase-gate).

## Estimated slices
1. This PLAN + commit of Phase 1 report (ask first). 2. ADRs + data-model + api. 3. Security/integrations/environments + screens. 4. Skeleton slice + DAY-ONE verification. 5. PHASE-REPORT + gate.

## Approval
- Phase 2 start approved (gate Continue 2026-10-09). Plan approval: requested at presentation — no branches/code until then.
