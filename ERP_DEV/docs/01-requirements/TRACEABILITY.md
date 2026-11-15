# Traceability — requirement → source → design → test

Design and test columns get filled in as increments are built. "TBD" means not built yet.

| REQ | Source | Design | Test |
|---|---|---|---|
| REQ-IAM-001 | BP §2/§18, AB | ADR-002; AUTHENTICATION §1, §9 | Schema check: no password/OTP/token columns ✅; log scans S5/S6: 0 secrets/JWTs ✅; S4/S5 live: passwords typed only on Keycloak pages ✅ |
| REQ-IAM-002 | AB, BP §13 | AUTHENTICATION §4 step 1; api.md §3 | `EmployeeOnboardingTest` (create 201, normalisation, duplicate 409, validation 400, idempotency) ✅; S5 live check 7–8 ✅ |
| REQ-IAM-003 | AB, BP §13 | AUTHENTICATION §4 step 2; KEYCLOAK-SETUP §5.3 | `EmployeeOnboardingTest` (real Keycloak: user + required actions + role) ✅ |
| REQ-IAM-004 | AB, BP §9 | AUTHENTICATION §4 step 3; KEYCLOAK-SETUP §8 | `EmployeeOnboardingTest` (email in Mailpit) ✅; S5 live checks 1–3 (link → set password) ✅ |
| REQ-IAM-005 | AB | AUTHENTICATION §7, §8 | `EmployeeOnboardingTest` (sync → ACTIVE) ✅; S5 live check 5 ✅ |
| REQ-IAM-006 | AB, BP §3 | AUTHENTICATION §5; KEYCLOAK-SETUP §2–5; web `auth.ts` | S1 live checks 2–3 (password grant refused, PKCE enforced) ✅; S4 scripted code+PKCE login: wrong password refused, code replay refused ✅; S5 live lockout ✅ |
| REQ-IAM-007 | AB, BP §3/§11, SOW §25.2 | AUTHENTICATION §5 step 4; api.md §1; access-service `SecurityConfig` | `MeEndpointTest` (no token, expired, other realm, other audience, unknown key → 401) ✅; `GatewayRoutingTest` (no token / wrong audience → 401 before routing) ✅ |
| REQ-IAM-008 | AB, BP §11, SOW §22 | AUTHENTICATION §3; KEYCLOAK-SETUP §6 | CI realm-check (composites, MANAGER without employees.manage) ✅; `EmployeeOnboardingTest.onlyAdminsManageEmployees`, `AccountManagementTest` (roles.assign) ✅; S6 live 3, 12–14 ✅ |
| REQ-IAM-009 | AB | AUTHENTICATION §6; web `auth.ts`/`api.ts` | `api.test.ts` (401 → refresh → sign-in) ✅; S4 live: refresh rotation, end-session logout, password asked again ✅ |
| REQ-IAM-010 | AB, BP §13 | AUTHENTICATION §7 | `AccountManagementTest` (real Keycloak: disable/enable, reason required, sync keeps DISABLED) ✅; `ProvisioningFailureTest` (Keycloak down → 502, nothing changed) ✅; S6 live 4–9 ✅ |
| REQ-IAM-011 | AB | AUTHENTICATION §10 | `ProvisioningFailureTest` F1 (down → 202 → job), F2 (adopt / refuse), F4 (email failed → retry) ✅ |
| REQ-IAM-012 | BP §17, SOW §25.1 | AUTHENTICATION §9, §11; KEYCLOAK-SETUP §7; Flyway V1 trigger | `AuditAppendOnlyTest` (append-only) ✅; `EmployeeOnboardingTest` audit sequence ✅; S5 live audit trail ✅ |
| REQ-IAM-013 | AB | KEYCLOAK-SETUP §10 | `ProvisioningFailureTest` bootstrap (+ no duplicate on restart) ✅; S5 live bootstrap → email → ACTIVE ✅ |
| REQ-IAM-014 | ASSUMED | AUTHENTICATION §7 | `ProvisioningFailureTest` (last admin, self) ✅; S6 live 15 ✅ |
| REQ-LEAD-001 | AB, LP | api.md §2 | TBD (Inc 2) |
| REQ-LEAD-002 | BP §6/§9/§12.2 | api.md §2 (D-114) | TBD (Inc 2) |
| REQ-LEAD-003 | BP §9, SOW §4 | api.md §2 | TBD |
| REQ-LEAD-004 | BP §5/§9 | ARCHITECTURE §5; api.md §5 | TBD |
| REQ-LEAD-005 | BP §10.1 | api.md §4 | TBD |
| REQ-LEAD-006 | BP §10.4 | api.md §4 | TBD |
| REQ-LEAD-007 | BP §9 | api.md §2 | TBD |
