# Work Unit Plan 3.14 — Lead Management & Guest Portal Microservice
**Golden Hills Resort | QuantumCLK Technologies**  
**Document:** `docs/03-phases/phase-3/PLAN-3.14-lead-portal-microservice.md`  
**Phase:** 3 – Core Development  
**Branch:** `feature/3.14-lead-portal-microservice`  
**Status:** Approved by user on 2026-11-12 | In Implementation  

---

## 1. Goal & Context
Connect the public Golden Hills Resort Landing Page (`Design-1`, Next.js) to the staff ERP through a dedicated, horizontally-scalable **Lead & Guest Portal Microservice** (`lead-service`).

Provide an automated lead intake pipeline:
1. Public visitors can register and log in on the landing page.
2. Logged-in guests can submit booking inquiries (room category, dates, guest count, requests).
3. Inquiries are stored in an independent database (`gh_leads`) and trigger an immediate WhatsApp message to the on-duty Sales Executive.
4. A durable 5-minute SLA timer watches the lead: if unacknowledged within 5 minutes, an automated voice call is placed to the Sales Executive's mobile phone.
5. Sales Executives log into the existing ERP web application to claim, contact, and convert leads into official ERP Guest profiles and reservations.
6. Once converted, Receptionists can immediately see the guest and reservation in the Guest 360 workspace.

---

## 2. SOW & Blueprint References
- **SOW**: ERP-04 Guest CRM (Core), ERP-10 Guest Portal (Add-on, client confirmed), ERP-12 Marketing & Communication Automation (Add-on, client confirmed).
- **Architecture Blueprint**: `QuantumCLK_Resort_ERP_Architecture_and_Phase_1_Blueprint.md` (ADR-001 microservices, ADR-009 service data ownership, Section 9 User Journeys, Section 10 Sales Executive role).

---

## 3. Microservice Architecture & Boundaries

```
[Landing Page: Next.js Design-1 (:3000)]
         │
         │ (REST / JSON + JWT)
         ▼
[Lead & Portal Service: Spring Boot (:8082)] ───► [Database: gh_leads (PostgreSQL)]
         │                                   ───► [Notification Adapters: Mock WhatsApp & Voice]
         │ (REST / Authorized Staff Proxy)
         ▼
[Core ERP: Spring Boot (:8080)]             ───► [Database: resort_erp (PostgreSQL)]
         ▲
         │ (Vite / React :5173)
[Staff ERP Webapp (Sales Executive & Receptionist)]
```

### Data Isolation
- **`lead-service` owns**: `portal_guest`, `lead`, `lead_activity`, `lead_sla_tracker`.
- **`erp-app` owns**: `guest`, `reservation`, `room`, `stay`, `folio`, `invoice`.
- Services communicate strictly via REST APIs with token verification; no shared database tables.

---

## 4. Execution Slices & Progress

### Slice 1: Keycloak Integration, Dual Security Filter Chains & Dead-Code Pruning (COMPLETED)
- **Status:** Completed & Verified (2026-11-13)
- **Scope & Deliverables:**
  - Added `spring-boot-starter-oauth2-resource-server` to `services/lead-service/pom.xml`.
  - Configured `KEYCLOAK_ISSUER_URL` (`http://localhost:8081/realms/resort`) and strict `${JWT_SECRET}` in `application.yml`.
  - Split security into dual filter chains in `SecurityConfig.java`:
    - `@Order(1) portalFilterChain`: Public access for guest registration, login, inquiry intake (`/api/v1/portal/**`).
    - `@Order(2) salesFilterChain`: Keycloak OAuth2 Resource Server protecting `/api/v1/sales/**` requiring any of `SALES_EXEC`, `SALES_SUPERVISOR`, `MANAGER`, `SUPERADMIN`.
  - Removed client-supplied `actor` fields from DTOs; derived actor securely server-side from JWT `preferred_username`.
  - Flyway migration `V3__drop_staff_user.sql`: dropped temporary `staff_user` table.
  - Deleted obsolete standalone staff classes (`StaffAuthService`, `StaffDtos`, `StaffUser`, `StaffRole`, `StaffUserRepository`, and staff token generator in `JwtTokenService`).
  - Added `SALES_EXEC` and `SALES_SUPERVISOR` realm roles and demo test users to `realm-golden-hills.json`.
- **Verification:**
  - 10/10 tests pass in `services/lead-service` (including `SalesSecurityTest`).
  - 29/29 tests pass in `ERP_DEV/web`.
  - Live smoke test verified 401 unauthorized, 201 public inquiry, Keycloak JWT issuance, 200 staff listing, and 200 atomic claim.

---

### Slice 1b: WhatsApp Cloud API Lead Alerts (IMPLEMENTED — awaiting live Meta test)
- **Status:** Code + automated tests done (2026-11-13). Real Meta send needs the manual Meta steps below.
- **Decisions (user, 2026-11-13):** alert **all on-duty sales staff** (leads are unassigned until claimed); staff phone numbers live in **Keycloak user attributes**; WhatsApp before slices 2–4.
- **How it works:**
  1. `LeadService.createInquiry` → `WhatsAppNotificationService.queueNewLeadAlerts` writes one `whatsapp_notification` row (PENDING) per on-duty sales user, in the same transaction as the lead (transactional outbox).
  2. Recipients = enabled Keycloak users with `SALES_EXEC`/`SALES_SUPERVISOR` and attribute `whatsapp_on_duty=true`; number from attribute `phone_number` (E.164). Read by `StaffDirectory` via the confidential client `lead-service` (realm-management `view-users` only).
  3. Nobody on duty / invalid number / Keycloak not configured or down → no message, a `WHATSAPP_SKIPPED` lead activity; the 5-minute voice escalation still applies. Never a fallback number.
  4. `dispatchDue()` (every 5 s) locks due rows (`FOR UPDATE SKIP LOCKED`), sends template `new_lead_assigned` via `WhatsAppSender` (`mock` or `meta`, chosen by `WHATSAPP_PROVIDER`), stores the Meta message id, status `ACCEPTED`. Temporary errors (429/5xx/timeout) retry 3× with backoff; permanent errors (bad number, template not approved, auth) → `FAILED` + `WHATSAPP_FAILED` activity.
  5. Webhook `GET/POST /api/v1/webhooks/whatsapp`: verify-token challenge; `X-Hub-Signature-256` HMAC check with the app secret (bad/missing → 401); statuses `sent/delivered/read/failed` only move forward, so duplicates and out-of-order events are no-ops; unknown ids → 200 + log.
  6. Only a masked phone (`+91******3210`) is stored; full numbers are read from Keycloak at send time and never logged.
- **Template `new_lead_assigned`** (category Utility, language `en`), body variables: {{1}} sales executive name, {{2}} customer name, {{3}} customer phone, {{4}} room category (inquiry type), {{5}} lead reference `GHR-xxxxxx`. Must be approved by Meta before real sends work.
- **Files:** `notification/{WhatsAppSender, WhatsAppSendException, MockWhatsAppSender, MetaWhatsAppSender, WhatsAppProperties, WhatsAppConfig, StaffDirectory, PhoneNumbers, WhatsAppNotificationService}.java`, `domain/{WhatsAppNotification, NotificationStatus}.java`, `repository/WhatsAppNotificationRepository.java`, `web/WhatsAppWebhookController.java`, `db/migration/V4__whatsapp_notification.sql`; changed `LeadService`, `SecurityConfig` (`@Order(0)` webhook chain), `application.yml`, `.env.example`, `realm-golden-hills.json`, `.github/workflows/ci.yml` (realm check skips service accounts). Deleted `WhatsAppNotificationAdapter.java`.
- **Verification:** `mvn -pl services/lead-service test` → 27/27 pass (`WhatsAppIntegrationTest` 11, `MetaWhatsAppSenderTest` 6, existing 10). Tests use hand-written fakes (Mockito/Byte Buddy cannot run on the local JDK 25).
- **Manual Meta steps (owner action, never share secrets in chat):**
  1. Meta Business app → add WhatsApp product → register/verify the resort number → note the Phone Number ID.
  2. Submit template `new_lead_assigned` (Utility, `en`, 5 body variables) and wait for approval.
  3. System User permanent token with `whatsapp_business_messaging` → `WHATSAPP_ACCESS_TOKEN`; App Secret → `WHATSAPP_APP_SECRET`; choose `WHATSAPP_VERIFY_TOKEN`.
  4. Webhook callback `https://<public-host>/api/v1/webhooks/whatsapp` (local: `cloudflared tunnel --url http://localhost:8082`), subscribe field `messages`.
  5. Keycloak: set `phone_number` and `whatsapp_on_duty` on each real sales user; set a real secret on client `lead-service` → `LEAD_SERVICE_CLIENT_SECRET`.
- **Go live with real Meta (local, 2026-11-13):**
  1. lead-service now imports `ERP_DEV/.env` (git-ignored, `KEY=VALUE`) via `spring.config.import: optional:file:${ENV_FILE:../../.env}[.properties]`; real environment variables still win. Start lead-service from `services/lead-service` so the relative path resolves.
  2. Keycloak: confidential client `lead-service` with service-account role `realm-management/view-users`, user-profile `unmanagedAttributePolicy=ADMIN_EDIT` (done live with `kcadm.sh`, no realm re-import). Its secret is in `.env` as `LEAD_SERVICE_CLIENT_SECRET`.
  3. Fill the `WHATSAPP_*` values in `.env` from the Meta app, set `WHATSAPP_PROVIDER=meta`, restart lead-service (it refuses to start if a value is missing).
  4. Set `phone_number` (E.164) + `whatsapp_on_duty=true` on each real sales user in Keycloak; with Meta's test number the recipient must also be added under API Setup → "To".
  5. Webhook: `~/.local/bin/cloudflared tunnel --url http://localhost:8082` prints a `https://….trycloudflare.com` URL (changes every start) → Meta → WhatsApp → Configuration → callback `<url>/api/v1/webhooks/whatsapp` + verify token, subscribe field `messages`.
  6. Failure codes on the lead activity: 190 token expired · 132001 template not approved / wrong language · 131030 recipient not in test list · 131026 not a WhatsApp number.
- **Out of scope:** voice escalation still uses the hard-coded number (next fix); no staff UI for message history; no guest-facing WhatsApp.

---

### Slice 2: Server-Side Atomic Lead Conversion (`lead-service` → `erp-app`) (NEXT)
- **Status:** Planned / Next in Queue
- **Problem Statement:**
  Previously, the frontend performed conversion in two fragile steps: calling `erp-app` `POST /api/v1/guests`, then calling `lead-service` `POST /api/v1/sales/leads/{id}/convert`. If the second call failed, the guest was created in ERP but the lead remained unconverted, creating split-brain state.
- **Scope & Deliverables:**
  1. `services/erp-app/src/main/java/com/quantumclk/erp/erp04/GuestController.java`:
     - Update `@PreAuthorize` on `POST /api/v1/guests` to include `SALES_EXEC` and `SALES_SUPERVISOR` roles (currently limited to `RECEPTION`, `MANAGER`, `SUPERADMIN`).
  2. `services/lead-service`:
     - Configure a Spring `RestClient` bean pointing to `${app.erp-app.base-url:http://localhost:8080}`.
     - Update `LeadService.convertLead(UUID leadId, String actor, String bearerToken)`:
       - Check idempotency: If lead is already `CONVERTED`, return existing `erpGuestId` immediately without redundant ERP calls.
       - If uncoverted: invoke `POST /api/v1/guests` on `erp-app` forwarding the staff's `Authorization: Bearer <bearerToken>`.
       - On `201 Created`: extract `id` as `erpGuestId`.
       - On `409 Conflict`: extract `existingGuestId` from the conflict response and link to the existing profile without failing.
       - Atomically update lead: `status = CONVERTED`, `erpGuestId = guestId`, append activity log entry, and persist.
     - Update `SalesLeadController.convertLead`:
       - Extract JWT string from `@AuthenticationPrincipal Jwt jwt` and pass down to `LeadService`.
- **Verification Plan:**
  - Add integration tests with `MockRestServiceServer` in `lead-service` verifying:
    - Successful guest creation & lead conversion.
    - Token forwarding in `Authorization` header.
    - Idempotency on repeated conversion calls.
    - Handling of existing phone conflict (linking to existing guest).

---

### Slice 3: Web Sales Workspace & API Client Alignment
- **Status:** Planned
- **Scope & Deliverables:**
  1. `ERP_DEV/web/src/api.ts`:
     - Remove `actor` argument from `claimSalesLead(id)`, `addLeadActivity(id, type, desc)`, and `updateLeadStatus(id, status, reason)`.
     - Align `convertLeadToGuest(id)`: remove `actor` and `erpGuestId` parameters; send single `POST /api/v1/sales/leads/${id}/convert`.
  2. `ERP_DEV/web/src/leads.tsx`:
     - Refactor `handleConvertToGuest`: remove separate `createGuest` invocation; trigger single atomic `convertLeadToGuest(selectedLead.id)`.
     - Remove unused `const actor = username() || 'sales_executive'`.
     - Provide direct navigation link to Guest 360 profile (`/guests/${erpGuestId}`) once converted.
  3. `ERP_DEV/web/src/leads.test.tsx`:
     - Update mock assertions to match the single-call conversion signature.
- **Verification Plan:**
  - Run `vitest run` in `ERP_DEV/web` — verify all test suites pass.
  - Run `npm run build` in `ERP_DEV/web` — verify zero TypeScript or bundler errors.

---

### Slice 4: Multi-Service Local Orchestration & Runner Updates
- **Status:** Planned
- **Scope & Deliverables:**
  1. `ERP_DEV/run-local.mjs`:
     - Add `lead-service` (:8082) compilation and process management alongside `erp-app` (:8080) and Vite (:5173).
     - Ensure unified clean shutdown on `SIGINT` / `SIGTERM` so no orphaned processes remain.
  2. `ERP_DEV/run-local.sh`:
     - Add `lead-service` invocation options.
  3. `AGENTS.md`:
     - Ensure path references point accurately to `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`.
- **Verification Plan:**
  - Test runner startup and shutdown lifecycle.

---

### Slice 5: Final End-to-End Verification & Commit Review
- **Status:** Planned
- **Scope & Deliverables:**
  1. Full regression testing:
     - `mvn clean test` across reactor (`lead-service` and `erp-app`).
     - `npm test && npm run build` in `ERP_DEV/web`.
     - `npm run typecheck && npm run build` in landing page `Design-1`.
  2. Live End-to-End Verification:
     - Submit room inquiry on Landing Page (`:3000`).
     - Verify instant WhatsApp mock alert in console.
     - Log in as `sales-staff` on ERP Web (`:5173`).
     - Claim lead, log phone call activity note.
     - Convert lead to official ERP guest via single atomic action.
     - Log in as Receptionist and verify guest appears in Guest 360 profile (`:5173/guests`).
  3. Documentation updates:
     - Append completion entry to `DEVLOG.md`.
     - Update `STATE.md` to unit complete.
  4. Git Commit Review:
     - Present full unified diff and commit breakdown to user for explicit approval per Rule 7.

---

## 5. Definition of Done
1. Guest can register and log in on the landing page (`Design-1`).
2. Guest can submit a room inquiry and receive a reference number.
3. WhatsApp notification is dispatched to Sales Executive.
4. If unacknowledged within 5 minutes, voice call escalation alert is triggered.
5. Sales Executive can log into the ERP via Keycloak, claim the lead, and add call notes.
6. Sales Executive can convert the lead into an official ERP guest record in a single atomic server-side call.
7. Receptionist can immediately view the guest profile in Guest 360.
8. Unit and integration tests pass across all services; documentation and logs updated.
9. Explicit user approval granted before any git commit.
