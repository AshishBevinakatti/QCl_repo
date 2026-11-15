# API Contracts — Phase 1

- Status: **Proposed. Waiting for Ashish's review.** Each service will publish an OpenAPI 3 document (springdoc) that must match this file. If code and this file disagree, it is a bug, and the fix updates both.
- Every call goes through `api-gateway` at `http://localhost:8082` (dev).

## 1. Common rules

- JSON, UTF-8. Dates `YYYY-MM-DD`; timestamps ISO-8601 UTC (`2026-11-15T05:30:00Z`); IDs are UUIDs.
- Staff endpoints need `Authorization: Bearer <access token from realm gh-staff>` ([AUTHENTICATION §5](identity/AUTHENTICATION.md)).
- `X-Correlation-Id` is optional on requests; the gateway generates one if it's missing, and it is always echoed back.
- `Idempotency-Key` (UUID) is **required** on create operations marked ⓘ. The same key with the same body returns the first response; the same key with a different body → 422.
- Lists: `?page=0&size=20&sort=createdAt,desc`, with `size` at most 100. The response is `{ "items": [...], "page": 0, "size": 20, "total": 57 }`.
- Error body (every service, every status ≥ 400):

```json
{ "code": "FORBIDDEN", "message": "You do not have permission to do this.", "status": 403,
  "correlationId": "4f3c…", "timestamp": "2026-11-15T05:30:00Z", "fields": { "email": "must be a valid email" } }
```

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Bad input; `fields` lists the problems |
| 401 | `AUTH_REQUIRED` | No, expired, wrong-issuer or wrong-audience token |
| 403 | `FORBIDDEN` | Valid token, missing permission |
| 404 | `NOT_FOUND` | Missing **or out of the caller's scope** (existence not revealed) |
| 409 | `CONFLICT` | Duplicate, optimistic-lock clash, lead already claimed, invalid transition |
| 422 | `IDEMPOTENCY_MISMATCH` | Same Idempotency-Key, different body |
| 429 | `RATE_LIMITED` | Gateway limit |
| 502 | `UPSTREAM_FAILED` | Keycloak or another dependency failed; nothing was changed |

## 2. Public portal contract — FROZEN (used by the unchanged landing page)

Source of truth: `landing-page/src/app/portal-client.ts`, base `NEXT_PUBLIC_LEAD_API_URL`, default `http://localhost:8082/api/v1/portal`. **Field names and shapes must not change.** Contract tests pin them (increment 2). The landing page reads `message` from error bodies.

| Method & path | Auth | Request | Response 2xx |
|---|---|---|---|
| `POST /api/v1/portal/auth/register` | none | `{ name, email, phone, password }` | `{ guestId, name, email, phone, token }` |
| `POST /api/v1/portal/auth/login` | none | `{ email, password }` | `{ guestId, name, email, phone, token }` |
| `POST /api/v1/portal/inquiries` | optional `Bearer <guest token>` | `{ name, email, phone, checkinDate, checkoutDate, roomCategory, guestCount, notes }` | `InquiryResponse` |
| `GET /api/v1/portal/inquiries/me` | `Bearer <guest token>` | — | `InquiryResponse[]` |

`InquiryResponse` = `{ id, publicReference, name, email, phone, checkinDate, checkoutDate, roomCategory, guestCount, notes, status, priority, claimedBy, claimedAt, slaDeadline, slaBreached, createdAt }`.

**Decided (Q-003, D-114, 2026-11-15):** these two endpoints are served by `guest-service`, which passes them through to the Keycloak realm **`gh-guests`**:
- `register` → Admin API creates the user (email verification per Q-007) and the guest profile is linked by `keycloak_sub`;
- `login` → token request with the password grant on a dedicated confidential client `guest-portal` (the only client in either realm with that grant enabled);
- `token` in the response is the Keycloak access token.

The ERP never stores or logs the password. Moving the landing page to a Keycloak redirect (PKCE) is a later improvement. The Blueprint's guest paths (`/api/v1/guests/me`, `/api/v1/leads/me`) can be added beside this contract later; they don't replace it.

Gateway routes: `/api/v1/portal/auth/**` → guest-service, `/api/v1/portal/inquiries/**` → lead-service. Both have rate limits (Blueprint §9: anonymous submissions are rate-limited more strictly).

## 3. Staff — access-service (increment 1)

| Method & path | Permission | Purpose |
|---|---|---|
| `GET /api/v1/me` | any authenticated employee | Own profile + roles + permissions + permitted modules |
| `GET /api/v1/admin/employees?status=&role=&q=` | `employees.read` | List with live account status |
| `GET /api/v1/admin/employees/{id}` | `employees.read` | Detail |
| `POST /api/v1/admin/employees` ⓘ | `employees.manage` | Create + provision in Keycloak + send invite → `201 {…, status:"INVITED"}` or `202 {…, status:"PENDING_PROVISIONING"}` |
| `PATCH /api/v1/admin/employees/{id}` | `employees.manage` | Edit name, mobile, WhatsApp preference; email change triggers re-verification. Needs the `If-Match: <version>` header |
| `PUT /api/v1/admin/employees/{id}/role` | `roles.assign` | `{ role, reason }`, where role is one of `ADMIN, MANAGER, SALES_EXECUTIVE` |
| `PATCH /api/v1/admin/employees/{id}/status` | `employees.manage` | `{ active: false|true, reason }` → disable/enable in Keycloak, then revoke sessions |
| `POST /api/v1/admin/employees/{id}/resend-invite` | `employees.manage` | Re-send the Keycloak action email (3 per hour) |
| `POST /api/v1/admin/employees/{id}/retry-provisioning` | `employees.manage` | Retry failed Keycloak steps |
| `GET /api/v1/admin/audit?entityId=&actorId=&from=&to=` | `audit.read` | Account audit trail |

Create request:

```json
{ "firstName": "Rahul", "lastName": "Sharma", "email": "rahul.sharma@example.com",
  "username": "rahul.sharma", "mobile": "+919876543210", "jobRole": "SALES_EXECUTIVE",
  "whatsappOptIn": false }
```

`whatsappOptIn` is optional (default `false`). Response (`EmployeeView`): `{ id, firstName, lastName, email, username, mobile, jobRole, whatsappOptIn, status, statusReason, identityLinked, createdAt, updatedAt, version }`. Email and username are stored lowercase; spaces and dashes are removed from the mobile. Duplicate email/username/mobile → 409 with the field named in `message`.

(Example values are illustrative, not client data. Extra fields such as staff code and joining date: Q-017.)

Account changes return the updated `EmployeeView`. Errors: 400 without a reason; 409 for the guards (self, last admin, not set up yet, row busy); 429 after 3 resends in an hour; 502 `UPSTREAM_FAILED` if Keycloak is down (nothing changed) or the email failed (status kept as `INVITE_EMAIL_FAILED`).

Audit response: page of `{ id, occurredAt, actorId, actor, actorIp, action, entityType, entityId, before, after, reason, correlationId, outcome }`, newest first; `size` at most 200.

## 4. Staff — lead-service (increment 2)

| Method & path | Permission | Scope rule |
|---|---|---|
| `GET /api/v1/sales/leads?view=queue` | `leads.read_queue` | Unclaimed leads |
| `GET /api/v1/sales/leads?view=mine` | `leads.read_assigned` | Claimed by or assigned to the caller |
| `GET /api/v1/sales/leads?view=team` | `leads.read_team` | All |
| `GET /api/v1/sales/leads/{id}` | one of the above | 404 if out of scope |
| `POST /api/v1/sales/leads/{id}/claim` | `leads.claim` | Atomic conditional update; a second claimant gets 409 |
| `GET /api/v1/sales/dashboard/summary` | `leads.read_queue` | Counts for the caller's scope |

The executive's identity always comes from the token's `sub`, **never from the request body** (Blueprint §12.3). Endpoints for assign/reassign, status, activities, follow-ups and conversion requests come with their later increment, using the Blueprint §12.3 paths.

## 5. Events (increment 2)

| Topic | Event | Producer | Payload (beyond the envelope) |
|---|---|---|---|
| `leads.v1` | `LeadCreated` v1 | lead-service | `leadId, publicReference, source, createdAt`. No guest contact data; consumers fetch it if they're allowed |
| `leads.v1` | `LeadClaimed` v1 | lead-service | `leadId, claimedBy (employee id), claimedAt` |

Envelope: `eventId, eventType, eventVersion, occurredAt, producer, correlationId, aggregateId` (Blueprint §5).
