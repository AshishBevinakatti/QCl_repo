# Phase 1 Requirements Baseline

- Status: **Draft. Waiting for Ashish's review** (2026-11-15). The client hasn't approved these items yet. Anything not taken from a client source is marked `[ASSUMED]` or linked to an open question.
- Source key: **SOW** = `sow-extract.md`; **BP** = `phase1-blueprint-extract.md`; **DC** = `discovery-call-extract.md`; **LP** = `landing-page-extract.md`; **AB** = Ashish's decision of 2026-11-15 (DEVLOG).
- Priority: Must / Should. Inc = delivery increment ([phase1_plan.md §6](../03-phases/phase-1/phase1_plan.md)).

## Identity & employee accounts (Increment 1)

| ID | Requirement | Source | Pri | Inc | Acceptance criteria |
|---|---|---|---|---|---|
| REQ-IAM-001 | Keycloak is the only authentication and credential store for employees; the ERP stores no passwords, OTPs or tokens | BP §2 ADR-006, §18; AB | Must | 1 | No password/OTP/token column in any ERP schema; code review + schema test |
| REQ-IAM-002 | An Admin creates an employee (first/last name, email, username, mobile, job role, WhatsApp preference); the profile is stored in `access_db` | AB; BP §13 | Must | 1 | POST creates a row; validation errors return 400 with fields; duplicate email/username/mobile → 409 |
| REQ-IAM-003 | Creating an employee creates and links the Keycloak user (both directions) and assigns its realm role | AB; BP §13 | Must | 1 | Keycloak user exists with attribute `erp_employee_id`; row has `keycloak_user_id`; role mapped |
| REQ-IAM-004 | Keycloak sends the verify-email + set-password email over the configured SMTP; no custom OTP or password page | AB; BP §9 | Must | 1 | Email arrives in Mailpit; link verifies email and sets password |
| REQ-IAM-005 | Admin sees each employee's account status (`PENDING_PROVISIONING`, `INVITED`, `INVITE_EMAIL_FAILED`, `ACTIVE`, `DISABLED`), kept in sync with Keycloak | AB | Must | 1 | Status becomes ACTIVE after setup without manual steps; job fixes drift within 5 min |
| REQ-IAM-006 | Employees log in with Keycloak OIDC Authorization Code + PKCE; wrong password, disabled or locked accounts are refused | AB; BP §3 | Must | 1 | Password grant disabled; PKCE required; lockout after 5 failures |
| REQ-IAM-007 | Every API checks the JWT (signature, issuer, expiry, audience): 401 without a valid token, 403 without permission | AB; BP §3, §11; SOW §25.2 | Must | 1 | Negative tests for each protected endpoint |
| REQ-IAM-008 | RBAC with realm roles ADMIN / MANAGER / SALES_EXECUTIVE made of permission client roles; record scope is checked separately | AB; BP §11; SOW §22 | Must | 1 | Permission matrix tests; out-of-scope record → 404 |
| REQ-IAM-009 | Logout ends the Keycloak session; expired sessions and invalid tokens send the user back to sign-in | AB | Must | 1 | After logout, the refresh token is rejected |
| REQ-IAM-010 | Admin activates or deactivates an employee (with a reason); deactivation disables the Keycloak user and revokes sessions | AB; BP §13 | Must | 1 | Login and refresh fail after deactivation; audit row written |
| REQ-IAM-011 | Keycloak API failures leave a visible, retryable status; employees are never half-created without the admin knowing | AB | Must | 1 | Failure tests F1–F6 (AUTHENTICATION §10) |
| REQ-IAM-012 | Account actions (create/edit/role/activate/deactivate/invite) are written to an append-only audit; logins come from Keycloak events | BP §17; SOW §25.1 | Must | 1 | Audit rows contain actor, time, IP, before/after, correlation id |
| REQ-IAM-013 | The first Admin is bootstrapped through the same invite flow; no password in env, scripts or realm file | AB (follows REQ-IAM-001) | Must | 1 | Fresh environment → invite email for the bootstrap admin |
| REQ-IAM-014 | Last-admin and self-deactivation guards | `[ASSUMED]` safety rule | Should | 1 | 409 on attempt |

## Guest inquiry & leads (Increment 2)

| ID | Requirement | Source | Pri | Inc | Acceptance criteria |
|---|---|---|---|---|---|
| REQ-LEAD-001 | The unchanged landing page keeps working: frozen `/api/v1/portal/**` contract | AB; LP | Must | 2 | Contract tests on field names; manual run of the landing page |
| REQ-LEAD-002 | A guest can register, log in and view own inquiries; guest credentials are held by Keycloak (`gh-guests`), never by an ERP service | BP §6, §9, §12.2 | Must | 2 | **Blocked by Q-003** |
| REQ-LEAD-003 | Inquiry submission validates dates/numbers, is rate-limited, and returns a unique public reference without internal IDs | BP §9 Journey D; SOW §4 (inquiry forms) | Must | 2 | Invalid dates → 400; burst → 429; reference format documented |
| REQ-LEAD-004 | Lead and `LeadCreated` outbox event commit in one transaction; a Kafka outage loses nothing | BP §5, §9 Journey E | Must | 2 | Kafka-down test |
| REQ-LEAD-005 | Sales Executive sees the queue and their own leads only | BP §10.1 | Must | 2 | Scope tests |
| REQ-LEAD-006 | Claiming is atomic: with concurrent claims, exactly one succeeds | BP §10.4 | Must | 2 | Parallel-claim test |
| REQ-LEAD-007 | Guests never see staff-only data (notes, SLA, assignee details beyond the frozen contract) | BP §9 Journey C | Must | 2 | Guest A cannot read guest B's inquiry; response fields checked |

## Deferred within Phase 1 (AB 2026-11-15: "we will add new features later")
Follow-ups and activity notes (BP §10.5), the status machine (BP §10.3), SLA escalation + notification-service (BP §10.6, §12.4), assign/reassign (BP §10.4), conversion request (BP §7), CMS (BP §12.5, Q-015).

## Out of Phase 1
Booking, room allocation, payment collection (SOW ERP-02/03/07; BP §8). See phase1_plan.md §7.
