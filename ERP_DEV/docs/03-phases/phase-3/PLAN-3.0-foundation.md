# Unit 3.0 Plan — Foundation (auth, RBAC, audit, config, base shell, CI, seed tooling)

- Purpose: shared backbone every later unit builds on — no feature works without it. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Entry: Phase 2 closed (design + proven slice on `develop`). No code until this plan is approved (Rule 3).

## Goal
On `develop`: Keycloak-backed auth wiring (local-dev stub realm + JWT validation), RBAC deny-by-default enforcement + matrix tests, append-only audit-log module, `app_config` + admin config endpoints, seeded reference data + fake-data generators, base UI shell contract (React decision: scaffold in 3.0 or 3.7 — proposed: scaffold shell now, screens per unit), CI hardened (dependency + secret scan), all covered by tests and module-doc updates.

## SOW / REQ references
REQ-ERP08-002 (users + RBAC), REQ-ERP08-005/006 (config + audit viewer), REQ-XCUT-003/004/005 (security/hosting/migration+seed); SOW §§11/22/23/25; security.md, data-model.md (`app_user`, `role_permission`, `app_config`, audit tables), api.md (admin/config/audit endpoints).

## In scope
1. `V2__foundation` migration: `app_user`, `role_permission` (seeded `[ASSUMED]` matrix), `app_config` (all D-101…D-114 defaults), audit event tables (reservation/payment/loyalty/card/config/auth).
2. Auth: Spring Security + Keycloak JWT validation (sandbox realm for tests via embedded stub; real realm config only); `401/403` contract shapes; `@PreAuthorize`/filter enforcement (never UI-only).
3. Audit writer: single `AuditLog` interface + JPA appender (who/when/what/before-after/reason/IP); audit viewer endpoints (filter + page).
4. Config: `GET/PATCH /api/v1/config/{key}` (approve role, audited, effective-dated) + seed of all assumed defaults.
5. Seed/fake-data tooling: deterministic seed for dev (property + categories + demo users/roles) + faker-based guest/booking generator (dev/staging only — never prod).
6. CI: add dependency-audit (OWASP) + secret-scan steps to `ci.yml`; red builds block merge.
7. UI shell: Vite React + TS scaffold behind `web/` (or defer to 3.7 — decision in plan approval; proposed: scaffold now so 3.1+ screens stack onto it).
8. Tests-first: RBAC matrix tests (allow + deny per role), audit-append tests, config-versioning tests, migration-upgrade test (V1→V2 on seed).

## Out of scope
Feature screens/logic (3.1+), real Keycloak realm provisioning (ops task, Phase 7), gateway/OTA/RFID wiring (Phase 4), exports engine detail (3.7), React screens (units 3.1+ own theirs).

## Design
- Security filter chain: JWT → authentication → method-level authorization; deny-by-default (`anyRequest().denyAll()` + explicit permits); test slice per role using stub JWTs (no external Keycloak in tests).
- Audit: synchronous JPA append in same transaction as business write (lossless); viewer reads replicas later.
- Config: `app_config(key, value jsonb, effective_from, actor)`; reads cached (Redis when available, in-memory now); writes audited + versioned.

## Tests to write
RBAC matrix (every permission allow+deny), audit-append on booking/config/role writes, config effective-dating, V1→V2 migration on seeded DB, CI scan steps present (workflow lint). Coverage floor 80% on auth/audit/config paths.

## Docs to update
`04-modules/erp-08-admin-reporting.md` (foundation section), `02-architecture/security.md` (as-built notes), `TRACEABILITY.md` (Code/Tests columns for REQ-ERP08-002/005/006 + REQ-XCUT-003/005), `DAY-ONE.md` (new commands), DEVLOG/STATE.

## Risks
- Keycloak without Docker here → tests use stub JWTs; real-realm runbook verified on Docker host (marked, not silent).
- Assumed role matrix (D-110) → config-seeded, client answer swaps without code.

## Open questions
Q-007 web-fetch (library docs if needed — ask per use), Q-008 website auth integration (adapter-shaped until location known).

## Definition of done
- [ ] Migration V1→V2 applies clean on seed; RBAC/audit/config tests green; `mvn verify` green.
- [ ] Docs + traceability updated in same change; DAY-ONE still works (fresh-clone check for the unit).
- [ ] User approves commit; merge to develop only with separate approval.

## Estimated slices
1. Migration + entities + audit writer. 2. Auth chain + RBAC tests. 3. Config endpoints + seed. 4. CI scans + UI shell scaffold. 5. Docs + present.

## Approval
- Requested at presentation. Branch `feature/3.0-foundation` created only after approval.
