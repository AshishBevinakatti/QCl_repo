# API contract — Phase 2 design baseline

- Purpose: one versioned contract frontend, website, terminal, and channel adapters code against. Audience: user (approver), backend + frontend developers. Last verified: 2026-10-09. Owner: project team.
- Sources: module docs `04-modules/*` (endpoint lists), data-model.md (resources), ADR-001 (Spring Boot + React, OpenAPI codegen). OpenAPI file itself is generated in the hello-world slice (springdoc) and kept at `services/.../openapi.yaml` + published copy in `docs/02-architecture/openapi/` — this doc is the human-readable contract the generator must match.
- Slice proof (2026-10-09, verified live): generated spec saved at `docs/02-architecture/openapi/erp-app.json`
  (paths: `/api/v1/health`, `/api/v1/room-categories`, `/api/v1/room-categories/{id}`); runtime UI at `/v3/api-docs`.
- Known gap (3.3–3.4, 2026-10-09): the runtime spec still lists only the 14 pre-3.3 paths although the
  stay/housekeeping/payment endpoints are live and green through MockMvc full-stack tests (200/409/422,
  never 404). Tried: `springdoc.packages-to-scan` (no effect) + DEBUG logging (no springdoc output —
  suspicious in itself). Next leads: version bump with Boot upgrade, or explicit GroupedOpenApi per
  module. Single source of truth until fixed: the controllers + tests + this doc. NOT release-blocking
  (consumers use this contract + typed clients), but must be fixed before UAT (Phase 6).

## Global conventions (no exceptions)
- Base: `/api/v1/...`; version in path; breaking change → `/api/v2` + `BREAKING CHANGE` footer + ADR line.
- Auth: Keycloak JWT (Bearer); every request carries it; server enforces RBAC (never UI-only). Request ID: client may send `X-Request-Id`, server always returns it (used in logs/tracing).
- Idempotency: `Idempotency-Key` header REQUIRED on `POST` booking-create, payment-initiate/confirm, refund-create, OTA-import. Same key replay → same result, no duplicate money/reservation (tests prove it).
- Errors (consistent shape): `{ "code": "ROOM_UNAVAILABLE", "message": "human text", "requestId": "...", "details": {...} }` with correct HTTP status (400 validation, 401/403 auth, 404 missing, 409 conflict e.g. double-hold race, 422 policy-blocked e.g. check-in on dirty room, 500 unexpected).
- Pagination: `?page=&size=` (default 20, max 100) + `Link`/envelope `{ "items": [...], "page": n, "total": m }`; filtering `?from=&to=&status=&search=`; sorting `?sort=at,desc`. No unbounded lists.
- Money: integers in paise (`amount_paise`) + `currency: "INR"`; dates `YYYY-MM-DD`, times RFC3339 UTC (`2026-10-09T13:30:00Z`); stays counted in nights.
- Webhooks (gateway/OTA/terminal callbacks): signature header verified (`X-Signature`), timestamp tolerance, replay-safe via idempotency map; failures → retry queue, never silent.

## Endpoints by module (resource → method + path)

Booking (ERP-02):
`GET /api/v1/availability?from&to&category_id` · `POST /api/v1/reservations` (idem) · `GET /api/v1/reservations/{id}` · `PATCH /api/v1/reservations/{id}` · `POST /api/v1/reservations/{id}/cancel` · `GET /api/v1/reservations?guest_id&date&status&page` · `GET /api/v1/room-categories` · `CRUD /api/v1/admin/rate-plans /promos` (config, ERP-08).

Front-office (ERP-03):
`GET /api/v1/front-office/dashboard?date=` · `POST /api/v1/walk-ins` · `POST /api/v1/stays/check-in` · `POST /api/v1/stays/{id}/transfer` · `POST /api/v1/stays/{id}/check-out` · `GET /api/v1/arrivals?date=` · `GET /api/v1/departures?date=`.

Guest CRM (ERP-04):
`POST /api/v1/guests` · `GET /api/v1/guests/{id}` · `PATCH /api/v1/guests/{id}` · `GET /api/v1/guests?search&page` · `GET /api/v1/guests/{id}/stays` · `POST /api/v1/guests/merge` (manager).

Membership (ERP-05):
`POST /api/v1/members` · `GET /api/v1/members/{id}` · `POST /api/v1/members/{id}/earn|redeem|adjust|renew` (adjust = approve role) · `GET /api/v1/members/{id}/ledger?page`.

RFID (ERP-06):
`POST /api/v1/rfid/cards` · `POST /api/v1/rfid/cards/{id}/activate|suspend|replace` · `POST /api/v1/rfid/verify` (uid, facility, device_id → allow/deny + reason) · `GET /api/v1/rfid/logs?member&facility&from&to&page`. Simulator exposes identical paths (base URL differs only).

Billing (ERP-07):
`POST /api/v1/payments/initiate` (idem) · `POST /api/v1/payments/confirm` (webhook, signed) · `GET /api/v1/payments/{id}` · `POST /api/v1/refunds` (idem) · `GET /api/v1/folios/{id}` · `POST /api/v1/folios/{id}/entries` · `POST /api/v1/invoices` · `GET /api/v1/reconciliation?from&to=`.

Admin/reporting (ERP-08):
`GET /api/v1/admin/overview` · `CRUD /api/v1/admin/users|roles` · `GET /api/v1/reports/{reservations|occupancy|revenue|payments|refunds|membership|rfid|operations}?filters` · `POST /api/v1/exports` (async job → download) · `GET /api/v1/audit?filters&page` · `CRUD /api/v1/config/{key}`.

OTA (ERP-09):
`CRUD /api/v1/channels` · `POST /api/v1/channels/{id}/push-inventory` · `POST /api/v1/channels/webhook/{channel}` (signed, idem) · `GET /api/v1/channels/{id}/diffs` · `GET /api/v1/reports/ota?from&to=`.

Facilities/housekeeping/maintenance:
`CRUD /api/v1/facilities` · `POST /api/v1/facilities/{id}/entries` · `CRUD /api/v1/spa-services|spa-appointments` · `GET /api/v1/housekeeping/board` · `CRUD /api/v1/housekeeping/tasks` · `CRUD /api/v1/service-requests` (+ assign/resolve/close actions).

## Frontend integration (React + website)
- Typed client generated from OpenAPI (no ad-hoc fetch); auth via Keycloak JS adapter (PKCE); availability calendar polls `GET availability` per date change (debounced) — Redis-backed; WebSocket/STOMP topic `/topic/rooms` for live room-status flips (housekeeping → reception) with REST fallback.
- Website (existing, external — Q-008): integrates via `POST /reservations` + `GET /availability` + shared Keycloak realm; contract version pinned per release.

## Terminal / channel integration
- ESP32 terminal: `POST /rfid/verify` with device credential + UID; offline → queue taps, deny-safe default (config), sync on reconnect (protocol detail in environments.md).
- OTA mock + real adapters implement one interface (`pushInventory/importReservations/syncCancel/getDiffs`); webhook path per channel; sandbox now, keys later via config only.

## Tests for the contract (Phase 3/5)
Contract tests per adapter; idempotency-replay tests; pagination + error-shape tests; RBAC tests per endpoint; OpenAPI-to-implementation drift check in CI (generated spec must match published copy).
