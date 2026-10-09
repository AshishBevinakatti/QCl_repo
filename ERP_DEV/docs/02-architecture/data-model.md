# Data model — Phase 2 design baseline

- Purpose: agreed tables, keys, states, and rules every module builds on. Audience: user (approver), backend developers. Last verified: 2026-10-09. Owner: project team.
- Sources: REQUIREMENTS (REQ-ERP02…09 + FAC/HSK/XCUT), module docs `04-modules/*`, ADR-001 (Postgres, monolith-first). All money/tax/rate assumptions are config data, not schema.

## Conventions (apply to every table)
- `id` UUID PK, `property_id` UUID NOT NULL on every business row (single-property now, multi-property later without re-model — WHY: SOW Phase 4 needs partitions; adding the key now is free, adding it later is a migration nightmare).
- Time: `timestamptz` stored UTC; display Asia/Kolkata. Money: `BIGINT ..._paise` + `currency CHAR(3) DEFAULT 'INR'`; never float.
- Soft-delete: `status` + `status_reason` + `updated_by/at`; no `DELETE` on guest/booking/payment/folio/member/card rows.
- Audit: `created_by/at`, `updated_by/at` on rows + append-only event tables per domain (see §Audit tables).
- Migrations: forward-only, versioned (`V1__...`), seed data kept separate from migrations.

## ERD (text; `──<` = one-to-many)

```
property ||──< room_category ||──< room
property ||──< rate_plan        (category_id, season, multiplier, dates)
property ||──< promo            (code unique per property)
guest ||──< reservation         (guest_id)
room  ||──< reservation         (room_id)
reservation ||──o reservation_hold (expires_at)
reservation ||──< stay          (checkin/out)
stay ||──< room_transfer        (from_room → to_room)
guest ||──o member              (guest_id unique)
member ||──< loyalty_ledger     (append-only)
member ||──< rfid_card          (one active; replaced_by chain)
folio ||──< folio_entry         (source_type/source_id → room/spa/facility/membership)
folio ||──o invoice             (immutable once issued)
payment ||──< refund            (capped at captured)
facility ||──< facility_entry   (member/guest, allow/deny, charge)
spa_service ||──< spa_appointment
room ||──< housekeeping_task    (todo→doing→inspect→done)
service_request (room/facility ref, department, assignee, priority, status)
channel ||──< channel_listing   (category → rate-code map)
channel ||──< ota_reservation_map (channel_booking_id unique → reservation_id)
app_user + role_permission + app_config (key, value jsonb, effective_from)
```

## Data dictionary (key columns; full DDL in migrations, Phase 3)

| Table | Key fields | Constraints / indexes |
|---|---|---|
| property | id, name, status | seed: one row `Golden Hills (ASSUMED single)` |
| room_category | id, property_id, name, base_price_paise, capacity | unique(property_id, name) |
| room | id, property_id, category_id, room_no, status (vacant-ready/occupied/dirty/cleaning/ready) | unique(property_id, room_no); index(status) |
| rate_plan | id, property_id, category_id, name, multiplier_bps, from_date, to_date | index(category_id, from_date, to_date) |
| promo | id, property_id, code, pct_bps, valid_from/to, max_uses, used | unique(property_id, code) |
| guest | id, property_id, name, phone, id_type, preferences jsonb, status, merged_into | unique(property_id, phone) where merged_into null; trigram index(name) |
| reservation | id, property_id, guest_id, room_id, checkin_date, checkout_date, nights, quoted_total_paise, status (hold/confirmed/checked-in/checked-out/cancelled/expired), source, idempotency_key | unique(property_id, idempotency_key); EXCLUDE overlapping confirmed holds per room (enforced in txn + app lock; concurrency test proves it); index(room_id, checkin_date, checkout_date, status) |
| reservation_hold | reservation_id PK, expires_at | index(expires_at) for expiry job |
| stay | id, property_id, reservation_id, room_id, checkin_at, checkout_at, status | index(reservation_id); index(room_id, status) |
| room_transfer | id, stay_id, from_room_id, to_room_id, actor, reason, at | append-only |
| member | id, property_id, guest_id unique, membership_no unique, tier, status, valid_from/to | index(status, valid_to) for expiry job |
| loyalty_ledger | id, member_id, points_delta, balance_after, reason, ref, actor, at | append-only; index(member_id, at) |
| rfid_card | id, property_id, uid unique, member_id, status, issued_at, expires_at, replaced_by | partial unique: one active per member; index(uid) |
| access_log | id, property_id, card_id, member_id, facility, device_id, decision, reason, tapped_at | append-only; index(member_id, tapped_at); index(facility, tapped_at) |
| folio | id, property_id, guest_id, stay_id, member_id, status (open/settling/settled) | index(guest_id, status); index(stay_id) |
| folio_entry | id, folio_id, source_type/source_id, amount_paise, actor, at | append-only; index(folio_id) |
| payment | id, property_id, folio_id/booking_id, amount_paise, currency, status, gateway_ref, idempotency_key | unique(property_id, idempotency_key); index(status) |
| invoice | id, property_id, folio_id, lines jsonb, tax_paise, total_paise, status (draft/issued/credited) | immutable once issued (app rule + test) |
| refund | id, property_id, payment_id, amount_paise, reason, approver, status | check amount ≤ captured (app + test) |
| facility | id, property_id, type, hours jsonb, capacity, status, charge_config jsonb | — |
| facility_entry | id, facility_id, guest/member_id, decision, charge_paise, at | append-only |
| spa_service/appointment | service(id, price_paise, duration_min); appointment(service_id, guest/member_id, staff, status, folio_entry_id) | index(status, at) |
| housekeeping_task | id, property_id, room_id, assignee, status, notes | index(status, assignee); index(room_id) |
| service_request | id, property_id, dept, assignee, priority, status, notes, ref | index(status, dept) |
| channel/listing/map/sync_run | as ERD; `ota_reservation_map.channel_booking_id` unique per channel | index(channel, status) |
| app_user/role_permission/app_config/audit_view | users, least-privilege grants, versioned config, read-only audit union | — |

## State machines (enforced server-side; illegal transitions rejected)
- Reservation: `hold → confirmed → checked-in → checked-out`; `hold → expired`; `confirmed → cancelled`. WHY: money + inventory move only on legal transitions.
- Room: `vacant-ready → occupied → dirty → cleaning → ready` (front-office reads; housekeeping writes dirty→ready).
- Payment: `pending → captured | failed`. Refund: `requested → approved → processed | rejected`. Folio: `open → settling → settled`. Invoice: `draft → issued → credited`.
- Member: `active → expired → renewed(active)`; ledger entries append-only (never edits).
- Card: `unissued → active → suspended/expired → replaced` (chain preserved).
- Housekeeping task: `todo → doing → inspect → done`. Service request: `open → assigned → in-progress → resolved → closed`.

## Audit tables (append-only; viewer in ERP-08)
`reservation_events, payment_events, loyalty_events, card_events, access_log, config_changes, auth_events` — each: actor, at (UTC), object, before/after, reason, source IP/device. Retention documented in security.md.

## Indexes & performance notes
- Availability query path (`room_id, dates, status`) + guest search (trigram) + ledger/log time-range indexes are mandatory in V1 migration (no N+1 list screens; pagination everywhere).
- Overlap protection: exclusion/unique guard where the engine supports it + serialised transaction + concurrency test (Phase 3.2 proves no double-booking; the test is the real guarantee, not the diagram).

## What this decides / defers
- Decides: property-scoped keys now; paise integers; UTC; soft-delete; append-only audit; idempotency keys; adapter-owned external refs (gateway_ref, channel_booking_id) stay OUT of core tables except as mapped columns above.
- Defers to migrations (Phase 3.0): exact DDL, Flyway/Liquibase choice (ADR line), seed datasets, backup-before-migrate runbook steps.
