# Traceability — requirement → source → design → test

Design and test columns get filled in as increments are built. "TBD" means not built yet.

| REQ | Source | Design | Test |
|---|---|---|---|
| REQ-IAM-001 | BP §2/§18, AB | ADR-002; AUTHENTICATION §1, §9 | TBD (Inc 1) |
| REQ-IAM-002 | AB, BP §13 | AUTHENTICATION §4 step 1; api.md §3 | TBD |
| REQ-IAM-003 | AB, BP §13 | AUTHENTICATION §4 step 2; KEYCLOAK-SETUP §5.3 | TBD |
| REQ-IAM-004 | AB, BP §9 | AUTHENTICATION §4 step 3; KEYCLOAK-SETUP §8 | TBD |
| REQ-IAM-005 | AB | AUTHENTICATION §7, §8 | TBD |
| REQ-IAM-006 | AB, BP §3 | AUTHENTICATION §5; KEYCLOAK-SETUP §2–5 | TBD |
| REQ-IAM-007 | AB, BP §3/§11, SOW §25.2 | AUTHENTICATION §5 step 4; api.md §1; access-service `SecurityConfig` | `MeEndpointTest` (no token, expired, other realm, other audience, unknown key → 401) ✅; `GatewayRoutingTest` (no token / wrong audience → 401 before routing) ✅ |
| REQ-IAM-008 | AB, BP §11, SOW §22 | AUTHENTICATION §3; KEYCLOAK-SETUP §6 | TBD |
| REQ-IAM-009 | AB | AUTHENTICATION §6 | TBD |
| REQ-IAM-010 | AB, BP §13 | AUTHENTICATION §7 | TBD |
| REQ-IAM-011 | AB | AUTHENTICATION §10 | TBD |
| REQ-IAM-012 | BP §17, SOW §25.1 | AUTHENTICATION §9, §11; KEYCLOAK-SETUP §7; Flyway V1 trigger | `AuditAppendOnlyTest` (append-only) ✅; audit writes: S5/S6 |
| REQ-IAM-013 | AB | KEYCLOAK-SETUP §10 | TBD |
| REQ-IAM-014 | ASSUMED | AUTHENTICATION §7 | TBD |
| REQ-LEAD-001 | AB, LP | api.md §2 | TBD (Inc 2) |
| REQ-LEAD-002 | BP §6/§9/§12.2 | api.md §2 (D-114) | TBD (Inc 2) |
| REQ-LEAD-003 | BP §9, SOW §4 | api.md §2 | TBD |
| REQ-LEAD-004 | BP §5/§9 | ARCHITECTURE §5; api.md §5 | TBD |
| REQ-LEAD-005 | BP §10.1 | api.md §4 | TBD |
| REQ-LEAD-006 | BP §10.4 | api.md §4 | TBD |
| REQ-LEAD-007 | BP §9 | api.md §2 | TBD |
