# ERP-02 — Booking & Reservation

- Purpose: online + reception booking with real-time availability, pricing, hold lifecycle, promos, advance payments. Audience: architects, ERP-02 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §5 (CORE). REQs: REQ-ERP02-001…010 (see `01-requirements/REQUIREMENTS.md`). Phase: 3.2. Status: requirements baselined; design/code/test pending Phase 2/3.

## Actors/roles
Guest (online), Reception (walk-in/modify), Manager (override/approve), Admin (rate config). Permissions per REQ-ERP08-002.

## Business rules (each with source; `[ASSUMED]` = placeholder config)
1. Quote → hold (15 min `[ASSUMED]`, SOW §5 + user-assumed default) → confirmed on payment/approval → checked-in (front-office) → checked-out/cancelled. Expired holds auto-release (REQ-ERP02-005).
2. Availability is transactional: concurrent holds for same room/date → exactly one wins (SOW §5 real-time availability + engineering rule: no double-booking). WHY: money + reputation loss on double-booking.
3. Categories/rooms/rates/seasons/promos are config, never hard-coded `[ASSUMED: Deluxe/Suite/Villa, 30 rooms, +20% weekend, WELCOME10 10%]` (SOW §5 seasonal/custom pricing; Rule 2 placeholder policy).
4. Price lock: confirmed booking keeps quoted price; config change affects new quotes only. WHY: guest trust + audit clarity.
5. Cancellation tiers as config `[ASSUMED: free ≥48h, else 1-night charge]` (SOW §5 modification/cancellation).
6. Advance to confirm `[ASSUMED: 30%]` (SOW §5 advance/partial). Under-payment blocks confirmation.
7. Every create/modify/cancel writes append-only audit (who/when/before/after). No hard deletes — status change with reason.

## Data model (Phase 2 will finalise; requirements-level entities)
`room_category` (id, name, base_price_paise, capacity) · `room` (id, category_id, room_no unique, status) · `rate_plan` (id, category_id, season, multiplier, dates) · `promo` (code, %off, validity, usage_count) · `reservation` (id, guest_id, room_id, checkin_date, checkout_date, nights, quoted_total_paise, status, source: web/walk-in/OTA, idempotency_key unique) · `reservation_hold` (reservation_id, expires_at). Money in paise (engineering rules).

## State machine
`hold → confirmed → checked-in → checked-out` + `hold → expired` + `confirmed → cancelled` (with charge/refund). Illegal transitions rejected server-side.

## API endpoints (Phase 2 contracts; names stable)
`GET /api/v1/availability?from&to&category` · `POST /api/v1/reservations` (idempotency-key) · `GET /api/v1/reservations/{id}` · `PATCH /api/v1/reservations/{id}` (modify) · `POST /api/v1/reservations/{id}/cancel` · `GET /api/v1/reservations?guest=&date=&status=` (paginated).

## Screens
Availability calendar (empty rooms by date/category), price quote view, booking form, reservation dashboard (reception/admin), booking history per guest.

## Permissions
Guest: create own booking, view own history. Reception: create/modify/cancel per policy. Manager: approve overrides. Admin: rate/promo config. All enforced server-side (deny-by-default).

## Configuration options
Categories, rooms, seasons, multipliers, promos, hold minutes, advance %, cancellation tiers — admin UI (REQ-ERP08-005), audited, effective-dated.

## Integrations/adapters
Pricing/tax engine (single module), payment adapter (advance capture), notification adapter (confirm/cancel/reminder), OTA adapter (inventory push + import). Timeouts/retries/dead-letter per adapter rule.

## Events/audit entries
`booking.created/modified/cancelled`, `hold.expired`, `price.quoted`, `promo.applied/rejected`, `advance.received`. Each: actor, timestamps (UTC), before/after, idempotency key, channel.

## Tests (Phase 3.2/5)
Concurrency no-double-booking test (mandatory), hold-expiry test, tier/price/promo matrix, idempotent replay test, RBAC test. Coverage floor 80% on availability/pricing paths.

## Known limits
Real rates/tax/cancellation pending client answers — assumed defaults apply until replaced. Multi-property partitioning is ADR-level (Phase 2) — single property now.

## Troubleshooting
Double-booking report → check transaction isolation + constraint + hold-expiry job. Wrong price → check rate effective dates + locked quote on reservation. Hold stuck → check expiry job + audit.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §5 + assumed defaults (user authorised assumptions). No design/code yet.
- 2026-10-09 (3.2, as-built): `V4__booking` (room/rate_plan/promo/reservation/reservation_hold + 30 rooms + weekend plans + WELCOME10 + `booking.max_nights`); category-pool model (holds consume pool, rooms assigned at check-in 3.3); pessimistic category lock per write; PricingService (per-night round-DOWN, plan-wins-then-config-fallback, promo strict-400, price-lock, advance recorded-not-collected until 3.4); BookingService (hold 15m + sweeper 60s, confirm/modify/cancel + tiers, idempotent replay header); race test green (last-room exactly-one-winner); shell booking screen. Known gaps → 3.4: advance capture gate, folio fee/refund posting. Code: `services/erp-app/.../erp02/`, `web/src/{App.tsx (Booking), api.ts}`.
