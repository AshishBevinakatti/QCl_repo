# ERP-09 — OTA / Channel Management

- Purpose: inventory push + reservation import with supported channels, monitoring, reports. Audience: architects, ERP-09 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §12 (CORE). REQs: REQ-ERP09-001…005. Phase: 4.1 (sandbox/mock first). Status: baselined; credentials pending.

## Actors/roles
Reservations/Admin (channel config + failure triage). Guests book on OTA; system imports.

## Business rules
1. All channels behind one adapter interface; mock implementation drives dev/tests until client supplies credentials (SOW §24/§29; WHY: third-party approvals are outside our control).
2. Inventory push `[ASSUMED: every 5 min + on booking event; 3 retries backoff]`; sold-out locally → channel sold-out within interval.
3. Reservation import idempotent: duplicate delivery → exactly one reservation (same idempotency family as payments).
4. Cancel/modify sync only where channel API supports; otherwise clear manual-resolution state (SOW §12 "where supported").
5. Failures visible in channel dashboard (never silent) with retry action.

## Data model
`channel` (id, name, config json, status) · `channel_listing` (channel_id, category_id, mapped_rate_code) · `ota_reservation_map` (channel, channel_booking_id unique, reservation_id) · `sync_run` (channel, started_at, pushed, imported, failed, error).

## API endpoints
`CRUD /api/v1/channels` · `POST /api/v1/channels/{id}/push-inventory` · `POST /api/v1/channels/webhook/{channel}` (signature where supported) · `GET /api/v1/channels/{id}/diffs` · `GET /api/v1/reports/ota?from&to=`.

## Screens
Channel dashboard (status per channel, last sync, failures, availability diffs), OTA reports, failure queue with retry.

## Permissions
Admin/Reservations: configure + retry. Others: read reports only.

## Configuration options
Channels enabled, sync interval, retry policy, rate-code mapping, sandbox-vs-live switch — config, audited.

## Integrations/adapters
One adapter per channel (interface: pushInventory, importReservations, cancelSync, getDiffs); timeouts/retries/dead-letter; OTA approval/commercial terms are client responsibility (SOW §24/§30).

## Events/audit entries
`ota.inventory-pushed/imported/sync-failed`, `ota.booking-imported (→ reservation id)`, `channel.config-changed`.

## Tests
Idempotent-import test, push-on-booking-event test, failure-visibility test, unsupported-operation path test, contract tests per adapter.

## Known limits
Which channels + API docs pending (Q-009). Start with 1 mock + 1 real-style adapter; add channels without core changes.

## Troubleshooting
Overbooking from OTA → check sync interval + push-on-event + diff monitor. Duplicate reservation → check idempotency map + webhook retries. Auth failures → check client-supplied credentials + expiry.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §12 + mock-first + assumed sync policy.
