# Unit 3.x Plan — Staff login (Keycloak SSO, self-hosted via Docker)

- Purpose: turn the login hint into a real sign-in so every reviewed screen shows live data. Audience: user (approver), developers. Last verified: 2026-10-10. Owner: project team.
- Entry: backend already validates Keycloak JWTs (3.0); frontend has login-hint + Preview mode. No code until this plan is approved (Rule 3).

## Goal
`docker compose` stack (Postgres already global — Keycloak + Redis + Kafka join it), `golden-hills` realm with the role matrix, frontend login/logout buttons (PKCE) lighting up all 7 views with live data, backend issuer wired by env, demo staff logins for review, docs updated.

## SOW / REQ references
REQ-ERP08-002 (users + RBAC), security.md (Keycloak design), environments.md; SOW §§11/22/25.

## In scope
1. User runs (needs sudo — agent cannot): `sudo dnf install -y docker docker-compose-plugin`,
   `sudo systemctl enable --now docker`, add user to `docker` group or use `sudo docker`.
2. Realm as code: `infra/keycloak/realm-golden-hills.json` (realm + roles SUPERADMIN…OPS + desk test users with DEV-ONLY passwords, clearly marked; prod gets real users, never these).
3. Compose: Keycloak service (already sketched in `docker-compose.local.yml`) importing the realm on boot; Postgres reuse (external `resort_erp` host or compose DB — decision: compose-local DB for Keycloak's own storage, resort data stays in the global Postgres).
4. Frontend: `keycloak-js` (pinned), login/logout buttons, token attached to every API call, role-gated nav (e.g. Billing visible but refund needs Accounts role — server still enforces), session expiry handling.
5. Backend: `KEYCLOAK_ISSUER_URL` wired (already read from env); realm-role → authority mapping already tested (JwtRolesMappingTest) — extended with a Keycloak-shaped `realm_access` test.
6. Docs: DAY-ONE login section (verified commands), `05-operations/` Keycloak runbook start, TRACEABILITY REQ-ERP08-002 (tests column: SSO wiring), demo-staff list (names only, passwords via secure handover — never in repo).

## Out of scope
Production realm hardening/password policies (Phase 7 ops), user self-registration (admin-created staff only), website guest login (guest flows stay public/token-light per SOW).

## Design decisions
- PKCE public client `erp-web` (no client secret in the browser — WHY: secrets in SPAs leak).
- Roles from `realm_access.roles` (already mapped); SuperAdmin gets all via Keycloak composite roles.
- Demo staff passwords: DEV-ONLY, flagged in realm file + runbook; CI never boots Keycloak (contract tests keep stub users).

## Tests to write
Realm JSON validity (structure test), role-mapping for Keycloak-shaped tokens, login/logout button render, token-attach on API calls (mocked), full suite stays green. Live SSO click-through verified on the user's Docker host (agent has no Docker — recorded, not claimed).

## Docs to update
DAY-ONE (login section), `02-architecture/security.md` (as-built realm notes), TRACEABILITY, DEVLOG/STATE, new `05-operations/keycloak.md` runbook.

## Risks
- No Docker on agent machine → realm import + click-through verified by user on their host with agent-provided checklist (honest reporting, not skipped).
- Demo credentials leaking to prod → DEV-ONLY markers + runbook warning + separate prod realm step in Phase 7.

## Open questions
Q-007 web-fetch (keycloak-js docs if needed — ask per use).

## Definition of done
- [ ] `docker compose up` starts Keycloak with realm imported; login button signs in demo staff; all views show live data; logout works; token expiry handled.
- [ ] Suite green; docs + traceability in same change; user approves commit; merge separate.

## Estimated slices
1. Realm JSON + compose. 2. Frontend auth (login/logout/token attach/role nav). 3. Backend issuer wiring + tests. 4. Docs + user-verified click-through checklist. 5. Present.

## Approval
- Requested at presentation. Branch `feature/auth-keycloak-sso` created only after approval.
