# Security design — Phase 2 baseline

- Purpose: who can do what, and how secrets/money/data stay safe. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Sources: SOW §§22/25, REQ-ERP08-002, REQ-XCUT-003, engineering rules (RBAC, secrets, payments, privacy, hardening, RFID).

## Auth
Keycloak (OAuth2/OIDC, PKCE for SPA): one realm `golden-hills`, clients `erp-web` + `terminal-service` + `channel-service`. JWT access (short-lived) + refresh; logout revokes server-side. Failed-login throttling + lockout; MFA for SuperAdmin/Manager/Accounts.

As-built 2026-10-10 (login unit, local dev): realm `resort` (file `infra/keycloak/realm-golden-hills.json`, auto-imported), Keycloak on host port **8081**, public PKCE client `erp-web`, 6 DEV-ONLY demo staff; backend issuer via `KEYCLOAK_ISSUER_URL`; `realm_access.roles` → authorities (unit-tested + proven live: reception 200/403, anon/garbage 401, SUPERADMIN 200). Runbook: `05-operations/keycloak.md`.

## RBAC matrix (deny-by-default, enforced server-side; `[ASSUMED]` until client confirms D-110)

| Capability | SuperAdmin | Manager | Reception | Membership | Accounts | Housekeeping | Ops/Spa |
|---|---|---|---|---|---|---|---|
| bookings view/create/edit | full | view/approve | yes | — | — | — | — |
| check-in/out/transfer | full | approve-override | yes | — | — | — | — |
| guests view/edit/merge | full | merge | view/edit | link | — | — | — |
| members/tiers/adjust | full | approve | — | enroll/link | — | — | — |
| RFID issue/verify/logs | full | suspend | verify | issue/replace | — | — | verify(facility) |
| payments collect/refund | full | approve-refund | collect | — | invoice/refund | — | — |
| folio/invoice view | full | yes | own-desk | — | yes | — | own-facility |
| reports/export | full | yes | own-lists | member-reports | financial | own-tasks | facility-reports |
| users/roles/config | full | — | — | — | — | — | — |
| housekeeping tasks | full | view | read-status | — | — | yes | — |

Permission verbs: view/create/edit/delete-where-authorized/approve/export/configure/report-access (SOW §22). Every row above gets a test (allowed + denied cases).

## Ops console roles (3.9 Phase 1, as-built 2026-10-20)
Separate from the resort `OPS` (spa/facilities) role. Permissions are resolved from `role_permission` per request (never trusted from JWT claims); Phase 1 is read-only.

| Role | Read scope |
|---|---|
| `OPS_VIEWER` | status, integrations, flags, metrics, alerts |
| `OPS_DEVELOPER` | viewer + logs, traces, jobs |
| `OPS_OPERATOR` | viewer + incidents, jobs, deployments |
| `OPS_ADMIN` | everything + audit (write actions arrive with later phases) |
| `OPS_APPROVER` | everything read-only + audit (approvals arrive with later phases) |
| `SUPERADMIN` | all (`*`) |

- `/api/v1/ops/{status,integrations,flags,audit}` enforce `ops.read`, `ops.integrations.read`, `ops.flags.read`, `ops.audit.read` server-side; 401 unauthenticated, 403 insufficient.
- Successful ops reads are themselves audited (deduped per actor/action/60s); audit responses are bounded (≤100 rows, ≤90 days) and redacted.
- Management health is on loopback `127.0.0.1:9091`, exposes only `health,info`, and is independent of the API security chain. Never proxy it publicly.
- Keycloak realm roles `OPS_*` must be provisioned; existing realms need a re-import/recreate to pick them up.

## Secrets (never in repo — names only)
`KEYCLOAK_CLIENT_SECRET, DB_URL/USER/PASSWORD, REDIS_URL, KAFKA_BOOTSTRAP, GATEWAY_API_KEY, GATEWAY_WEBHOOK_SECRET, OTA_*_API_KEY, SMTP_* , SMS_* , WHATSAPP_* , TERMINAL_API_KEYS, S3_* , JWT_SIGNING (Keycloak-managed)`. Local: `.env` (git-ignored) from `.env.example` (fake values). Staging/prod: Vault or K8s Secrets; rotation runbook in `05-operations/`. CI scans for secrets pre-commit + pre-merge; logs never print secrets, card PANs, or full ID numbers (mask: `XXXX-XXXX-1234` style).

## Money & data protection
- Gateway hosted/tokenised only; webhook signatures verified; reconciliation dashboard (REQ-ERP07-006). No card data in DB/logs (test asserts it).
- PII minimum: guest/member fields only; ID images encrypted at rest, access-controlled, retention windows documented (DPDP: counsel confirms obligations — we document, not advise).
- HTTPS everywhere (TLS 1.2+), secure cookies, security headers, rate limits on login/booking/OTP/verify/webhook endpoints, input validation at boundary, least-privilege DB roles (app vs migrate vs readonly-reports), dependency + image vulnerability scan in CI (fail on high/critical).

## RFID trust
UID = identifier, not secret; terminal authenticates with its own key; every verify decided server-side; offline = deny-safe default `[ASSUMED]` + queued taps synced later (client confirms in UAT); all decisions logged.

## Audit (append-only)
Booking/payment/refund/loyalty-adjust/role/config/card/tap/login events: who, when (UTC), what, before/after, reason, IP/device. Viewer + export in ERP-08; retention policy documented here at build time (proposed: 7 years financial, 2 years operational — `[ASSUMED]`, counsel/client confirms).

## Security verification (Phase 5)
Dependency audit + secret scan (CI, every PR), OWASP baseline (ZAP) on staging, RBAC matrix tests, webhook-signature tests, backup/restore drill. No open criticals at gate.
