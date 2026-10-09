# Unit 3.2 Plan — Booking & Reservation engine (the heart)

- Purpose: real-time availability, holds that cannot double-book, priced quotes, promos, advance policy — the money-critical core. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Entry: 3.1 merged green on `develop`. No code until this plan is approved (Rule 3).

## Goal
`V4__booking` (room, rate_plan, promo, reservation, reservation_hold + 30-room seed), availability engine, 15-min hold lifecycle + expiry job, pricing engine (base × season × weekend + promo, price-locked quotes), advance-policy gate (30% — capture itself lands in 3.4), modification/cancellation tiers, concurrency-proof booking path with a parallel-hold test, reservation dashboard endpoints, shell booking screen (calendar + quote + book).

## SOW / REQ references
REQ-ERP02-001…010 (SOW §5); module doc `04-modules/erp-02-booking-reservation.md`; data-model.md (reservation/room/rate/promo tables, idempotency, states); api.md (availability/reservation endpoints); screens.md §1.

## In scope
1. `V4__booking` migration: `room` (room_no unique per property, category FK, status), `rate_plan` (category, season, multiplier_bps, dates), `promo` (code unique, pct, validity, uses), `reservation` (guest FK, room FK nullable until allocation? — decision: booking holds a CATEGORY first, room assigned at check-in (3.3); overlap guard on category inventory count, not physical room), `reservation_hold` (reservation FK, expires_at, index). Seed: 30 rooms (10/category `[ASSUMED]`), weekend rate plan, WELCOME10, from config-consistent values.
2. Availability: `GET /availability?from&to&category` = rooms in category − overlapping confirmed/hold-active reservations; computed in one query; cached later (Redis in 3.4/Phase 4 — in-memory note now, documented).
3. Booking: `POST /reservations` (idempotency-key, guest create-or-link, category, dates, promo) → price quote (locked on reservation) → hold 15 min → `POST /reservations/{id}/confirm` (advance-policy check: 30% recorded as `advance_due`, capture in 3.4) → confirmed; `PATCH` modify (re-quote, tier check); `POST /cancel` (tiered charge → folio entry stub for 3.4).
4. Expiry job: scheduled sweeper flips expired holds → released + audit (job-runner pattern: `@Scheduled` + visible last-run in admin overview; real runner tuning in Phase 4).
5. Concurrency: booking write in a serialised transaction (pessimistic lock on category inventory row or `SERIALIZABLE` + retry); **parallel-hold test** (N threads, same category/dates, last-room scenario → exactly one wins, rest 409) — mandatory, the single most important test in the system.
6. Pricing tests: weekend uplift, promo valid/invalid/expired, price-lock (config change doesn't move confirmed quotes), cancellation tiers, idempotent replay (same key → same reservation, no duplicate).
7. Shell: booking screen (date/category pick → availability grid → guest form → quote → book → confirmation ref).
8. Reservation dashboard endpoints for reception (`GET /reservations?date&status&page`) — full dashboard UI in 3.3/3.7.

## Out of scope
Payment capture/refund/invoice (3.4 — advance recorded as due, folio entries stubbed with TODO(3.4) markers + tests asserting the stub), room-level allocation (3.3 check-in assigns physical room), OTA import (4.1), Redis caching (note + interface, real cache in 3.4), night-audit routine (documented as 3.7/Phase-4 job).

## Design decisions (locked here, all `[ASSUMED]` → config)
- Category-level inventory (not room-level holds): availability = physical rooms − overlapping stays; holds decrement category pool. WHY: guests book categories, reception assigns rooms — overbooking protection at the level guests buy.
- Hold 15 min, advance 30%, free cancel ≥48h else 1-night, WELCOME10 10% — all read from `app_config` (seeded V2), never constants.
- Money in paise; quote snapshot stored on reservation (price-lock).

## Config vs code
All tiers/rates/holds/promos in config; overlap algorithm + transaction isolation in code (reviewed, concurrency-tested).

## Tests to write (tests-first where logic matters)
Parallel-hold race (mandatory), hold-expiry sweeper, pricing matrix (season/weekend/promo/lock), cancel tiers, idempotent replay, RBAC (guest books own; reception books any; anon 401), V3→V4 migration, validation (bad dates → 400).

## Docs to update
`erp-02` module as-built, TRACEABILITY REQ-ERP02 code/tests, data-model (if V4 deviates), openapi (regenerate at live verify), DAY-ONE only if new commands, DEVLOG/STATE.

## Risks
- Race windows under real Postgres differ from H2 — isolation level chosen conservatively (pessimistic) + documented; load test in Phase 5 confirms.
- Category-vs-room model confusion → documented in module doc with example; reception training note for 3.3.

## Open questions
None new (OTA/payment hooks stay stubbed with contracts).

## Definition of done
- [ ] V3→V4 migrates clean; race test green; pricing/tier/idempotency green; full suite green; web builds.
- [ ] Live boot re-verified (migrations V1→V4, anon booking endpoints 401, openapi regenerated).
- [ ] Docs + traceability in same change; user approves commit; merge separate.

## Estimated slices
1. V4 + entities + availability query. 2. Booking/hold/confirm/modify/cancel + expiry job. 3. Pricing/promo/tiers + idempotency. 4. Race + matrix tests. 5. Shell screen. 6. Docs + present.

## Approval
- Requested at presentation. Branch `feature/3.2-booking-engine` created only after approval.
