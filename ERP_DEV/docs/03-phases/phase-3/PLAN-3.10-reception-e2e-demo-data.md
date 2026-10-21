# Unit 3.10 Plan — Reception end-to-end testing and demo data

- Purpose: define how we will populate a realistic receptionist demo, prove where each screen's data is stored, and let the user exercise the reception flows against a live Postgres database. Audience: user (approver), developers, QA. Date: 2026-10-21. Owner: project team.
- Entry: 3.9 committed at `45c8e88` + records `775373e`; backend 71/71, web 4/4, live stack running. Tree clean except pre-existing root `.vscode/`.
- Status: **approved and executed 2026-10-21** — local fixture/scripts added, 17/17 API scenarios passed, test report written. No commit yet; commit approval is separate.
- As-built: `scripts/dev/reception-demo.sh` + load/reset/verify SQL, `docs/03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md`, `docs/05-operations/local-demo-data.md`. No application, schema or dependency change. The fixture was reset/reloaded after the run; existing `ashish`, the two expired reservations and `DEL-101` were preserved.

## 1. Goal

1. Add a repeatable, clearly labelled **local development demo dataset** for the receptionist screens.
2. Provide a written test plan that covers the reception-reachable flows end to end: guest, booking, advance, confirm, check-in, in-house, transfer, folio, payment, check-out, walk-in, housekeeping board, alerts and audit.
3. Show exactly which database tables/columns feed each dashboard card, so "data is stored and processed" can be verified with SQL after every UI action.
4. Record pass/fail evidence and product gaps discovered during the run in a test report.

## 2. Baseline observed (2026-10-21, local Postgres)

| Table | Current rows | Notes |
|---|---:|---|
| `room` | 30 | 29 `ready`; `DEL-101` is `occupied` with no `stay`, `reservation.room_id`, or housekeeping task. Pre-existing inconsistency; not touched without approval. |
| `guest` | 1 | `ashish` / `9141133713` — pre-existing user-entered test data. |
| `reservation` | 2 | Both `expired`, 2026-10-11/12, same guest. Pre-existing test data. |
| `stay`, `folio`, `payment`, `invoice`, `housekeeping_task` | 0 | No live front-office lifecycle yet. |

Consequence: the dashboard currently has no arrivals/departures/in-house/billing data, which is why the user sees empty states.

## 3. Conflict that needs an explicit decision

- User rule recorded 2026-10-10: **"no customer/guest seed data anywhere"**; `V8__remove_demo_guests.sql` deleted the three V3 demo guests, and Preview mode no longer invents guest rows.
- The current request asks to **add demo data**. To satisfy it without silently breaking the earlier rule, this plan proposes a **narrow, explicitly approved exception**:
  - fabricated guests only, every name prefixed `Demo ` and every phone in the reserved-looking range `+91-90000001xx`;
  - local development only; **not** a Flyway migration, **not** loaded on application start, **not** present in production/UAT;
  - fixture data is added by an explicit script under `scripts/dev/` and can be removed with one command;
  - no real client/guest data is copied, invented histories are not presented as real activity.
- If the user does not approve this exception, the alternative is a temporary fixture created only in `/tmp` and never committed; reproducibility is lost, but the repository stays free of guest seed data.

## 4. Role and UI reality (scope guard)

| Flow | Reception (`reception-staff`) | Manager/Superadmin (`admin-staff`) | Current UI |
|---|---|---|---|
| Dashboard, arrivals, departures, in-house, alerts | Yes | Yes | Live dashboard |
| Guest search/create | Yes | Yes | Guests screen |
| Guest merge | No (403) | Yes | No UI yet |
| Availability/booking/confirm/cancel | Yes | Yes | Book screen + dashboard confirm |
| Advance capture (sandbox) | Yes | Yes | Dashboard "Collect advance" |
| Check-in/out/transfer/walk-in | Yes | Yes | Dashboard + Front Desk |
| Folio read/payment/check-out gate | Yes | Yes | Billing screen |
| Refund request | **No (403)** | Accounts/Manager/Superadmin | Refund card is visible to reception — expected finding |
| Invoice issue | **No (403)** | Accounts/Manager/Superadmin | No UI |
| Housekeeping board | Read yes | Read/write | Board is read-only in UI |
| Housekeeping task advance | **No (403)** | Housekeeping/Manager/Superadmin | No UI button |
| Reports / requests / settings | — | — | "Coming soon" placeholders |

The test plan verifies these boundaries rather than pretending every visible control is authorised. Product gaps found during the run are recorded, not fixed inside this unit.

## 5. Proposed demo dataset

Let `D0` = business today in `Asia/Kolkata` (the same zone the backend uses). All dates are computed when the fixture is loaded; re-run the fixture if testing on a later day. All money is paise. Fixture rows use a fixed `d…` UUID scheme so reset is exact.

| Ref | Guest (all `Demo ` prefixed) | Phone | Category / room | Reservation | Story | Folio state |
|---|---|---|---|---|---|---|
| G1/R1 | Demo Aarav Mehta | +91-9000000101 | Deluxe / unassigned | `D0 → D0+1`, **confirmed**, 1 night, total 500000, advance due 150000 | Today's arrival; advance captured, ready for check-in | None until check-in |
| G2/R2 | Demo Diya Shah | +91-9000000102 | Suite / `SUI-201` | `D0 → D0+1`, **checked-in**, 1 night, total 900000 | In-house guest, partial payment | Room +900000, payment −450000 → outstanding 450000 |
| G3/R3 | Demo Kabir Rao | +91-9000000103 | Villa / `VIL-301` | `D0−1 → D0`, **checked-in**, 1 night, total 1500000 | Today's departure, fully settled | Room +1500000, payment −1500000 → **Ready** |
| G4/R4 | Demo Meera Nair | +91-9000000104 | Deluxe / `DEL-103` | `D0−1 → D0`, **checked-in**, 1 night, total 500000 | Today's departure with balance | Room +500000 → **Pending Payment** |
| G5/R5 | Demo Rohan Iyer | +91-9000000105 | Suite / unassigned | `D0+1 → D0+2`, **hold**, 1 night, total 900000, advance due 270000, hold expires `now + 2h` | Future hold for booking-search testing | None |
| G6/R6 | Demo Ananya Verma | +91-9000000106 | Villa / unassigned | `D0+7 → D0+9`, **confirmed**, 2 nights, total 3000000, advance due 900000 | Future confirmed booking | None (advance payment linked to booking) |

Additional fixture rows:

- `stay`: S2, S3, S4 for R2/R3/R4; `checkin_at` = yesterday/today as appropriate; status `checked-in`.
- `payment`: captured advance for R1 (150000) and R6 (900000); captured payments for F2 (450000) and F3 (1500000). Booking payments have `folio_id = null` until check-in links them, matching the real flow.
- `folio` + `folio_entry`: F2/F3/F4 as above; signed entries only.
- `housekeeping_task`: `DEL-102` → `todo`, `SUI-203` → `inspect`, `VIL-302` → `doing`; rooms marked `dirty`, producing dashboard alerts.
- Room statuses: `SUI-201`, `VIL-301`, `DEL-103` → `occupied`; `DEL-102`, `SUI-203`, `VIL-302` → `dirty`; all other rooms stay as they are. `DEL-101` is untouched.
- No invoice, membership, refund, coupon or communication rows are seeded. Those are optional follow-on tests with their authorised roles.

Expected dashboard after load: 1 arrival, 2 departures (1 Ready / 1 Pending Payment), 3 in-house (including the two departures), 3 occupied seeded rooms (+ pre-existing DEL-101), 3 housekeeping alerts, recent bookings for the current date.

Fixture totals use the category base price, not the pricing engine, because direct fixture inserts bypass services. New bookings created through the UI are priced normally; the fixture is test data, not evidence of pricing correctness.

## 6. Fixture mechanics

Files (to be created after approval):

- `scripts/dev/reception-demo.sh` — safe wrapper with `load`, `reset`, `verify` commands.
- `scripts/dev/reception-demo.sql` — fixture/reset SQL with fixed UUIDs.
- `docs/03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md` — executed evidence, pass/fail, findings.

Rules:

1. **No Flyway migration and no automatic startup seeding.** Production/UAT schemas and app code are unaffected.
2. Wrapper refuses to run unless `DB_NAME` resolves to the local dev database name (default `resort_erp`) and `ALLOW_DEMO_SEED=1` is set explicitly.
3. `load` first removes only the fixed fixture IDs, then inserts in one transaction; `reset` removes only fixture rows, restores only the six fixture-affected rooms to `ready` (unless they are occupied by post-test data), and leaves every other guest/reservation untouched. `verify` runs SQL assertions.
4. Existing `ashish` guest, the two expired reservations, and `DEL-101` stay untouched. Cleaning those requires a separate decision.
5. Fixture rows are labelled `source = 'demo'`/fixed IDs; the test report states they were inserted directly, so they are **not** proof that the API persisted them. The UI actions performed during the test are the persistence proof.

## 7. Test plan

### 7.1 Preparation

1. Ensure backend `:8080`, web `:5173`, Keycloak `:8081` are running and healthy.
2. Load fixture: `ALLOW_DEMO_SEED=1 ./scripts/dev/reception-demo.sh load`.
3. Run `./scripts/dev/reception-demo.sh verify` and save output.
4. Log in at `http://localhost:5173` as `reception-staff` / `change-me-dev-only`; run baseline SQL for counts.

### 7.2 Scenario matrix

| ID | Scenario | Steps | Expected UI | Expected storage |
|---|---|---|---|---|
| T1 | Dashboard baseline | Open Dashboard after login | 1 arrival, 2 departures, 3 in-house, 3 alerts, occupancy reflects room statuses | `reservation`/`stay`/`folio` counts match; dashboard is a read-only projection |
| T2 | Guest search | Search `9000000101` and `Demo Aarav` | G1 found; no duplicate active profile | `guest` row by phone; GIN/trigram or name index path |
| T3 | Guest create + duplicate guard | Create unique guest `Demo Test Guest` `+91-9000000199`; repeat G1 phone | Created once; duplicate shows `GUEST_EXISTS` and existing-profile action | New `guest` row; unique `(property_id, phone)`; audit `guest.created` |
| T4 | Availability and booking | Book Deluxe `D0 → D0+1`, new guest, promo `WELCOME10` | Hold returned with quote and advance due | New `reservation` (`hold`), `reservation_hold` expires in 15 min, pricing rows read; audit `booking.created` |
| T5 | Advance gate + confirm | Confirm new hold before payment; then Dashboard collect advance and confirm | First attempt rejected with 422 "advance not collected"; capture succeeds; confirm succeeds | `payment` pending→captured; `reservation` hold→confirmed; hold deleted; audit events |
| T6 | Check-in arrival G1 | Dashboard → Check in | Room auto-assigned; G1 leaves arrivals, enters in-house | `reservation` checked-in + room_id; `stay` checked-in; `room` occupied; folio room charge + advance linked; audit `stay.checked-in` |
| T7 | Transfer G2 | Front Desk transfer SUI-201 → SUI-202 | Success; old room dirty, new room occupied | `stay.room_id`; `room_transfer`; source room dirty + task; destination occupied; audit `stay.transferred` |
| T8 | Departure with balance G4 | Dashboard → View folio → pay balance → check out | Outstanding becomes zero; then checkout succeeds | `payment` captured, `folio_entry` payment negative, `folio` sum zero; `stay`/`reservation` checked-out; room dirty + task; audit |
| T9 | Departure Ready G3 | Check out without payment | Succeeds directly | Same transitions; no extra payment |
| T10 | Check-out guard | Attempt checkout on a stay with outstanding balance without payment | 422 with balance | No state change (transaction rollback) |
| T11 | Walk-in | Front Desk → Walk in guest | Guest, booking, advance, confirmation, check-in all at once | `guest` + `reservation` confirmed + `payment` captured + `stay` + `room` occupied + folio charge |
| T12 | Booking-search ref | Copy 8-char ref; search in bookings/search | Exact reservation found | Prefix search over UUID |
| T13 | Housekeeping read | Open Housekeeping as reception | Board with dirty rooms/open tasks; no advance action available | `room` + `housekeeping_task` read; no writes |
| T14 | Housekeeping transition (admin) | API `PATCH /api/v1/housekeeping/tasks/{id}/advance` three times as `admin-staff` | Task todo→doing→inspect→done; room becomes ready | `housekeeping_task.status`; final room `ready`; audit |
| T15 | Role boundaries | As reception: guest merge, refund, invoice, hsk advance | 403 on each | No rows written; expected finding for visible refund card |
| T16 | Alerts | Open Dashboard after dirty rooms and pending balance | Medium hsk alerts and high payment/overstay alert as applicable | Alerts computed, not stored |
| T17 | Audit/log trace | Admin opens ops audit after T4–T11 | Recent actor/action entries with request ID in logs | `audit_event` append-only rows; structured log correlation |

### 7.3 Manual sequence

1. Dashboard baseline and SQL counts.
2. Guest search/create/duplicate.
3. Availability → booking → confirm without advance (expected rejection) → collect advance → confirm.
4. Check in G1; load its folio; pay the advance/balance path; check out after settlement.
5. Transfer G2; verify rooms and transfer row.
6. Pay and check out G4 (Pending Payment); check out G3 (Ready).
7. Walk-in once; verify one-step creation.
8. Housekeeping board (reception read), then admin transitions one task to done.
9. Role-boundary checks.
10. Run `verify` assertions + storage queries; save outputs in the test report.
11. Run `reset` at the end; confirm only fixture rows are gone and pre-existing rows remain.

### 7.4 Storage verification queries

```sql
-- Dashboard inputs
SELECT r.id, g.name, r.status, r.checkin_date, r.checkout_date, r.quoted_total_paise
FROM reservation r JOIN guest g ON g.id = r.guest_id
WHERE r.status IN ('confirmed','checked-in','hold') ORDER BY r.checkin_date;

SELECT s.id AS stay_id, r.id AS reservation_id, rm.room_no, s.status
FROM stay s JOIN reservation r ON r.id = s.reservation_id
JOIN room rm ON rm.id = s.room_id ORDER BY s.checkin_at;

-- Folio balance = sum of signed entries (never stored)
SELECT f.id, f.stay_id, COALESCE(SUM(e.amount_paise),0) AS outstanding_paise
FROM folio f LEFT JOIN folio_entry e ON e.folio_id = f.id
GROUP BY f.id, f.stay_id ORDER BY f.id;

-- Payment -> folio linkage and booking advances
SELECT p.id, p.status, p.booking_id, p.folio_id, p.amount_paise, p.gateway_ref, p.idempotency_key
FROM payment p ORDER BY p.created_at;

-- Room status vs active stay (pre-existing DEL-101 will show the known anomaly)
SELECT rm.room_no, rm.status, s.id AS active_stay
FROM room rm LEFT JOIN stay s ON s.room_id = rm.id AND s.status = 'checked-in'
ORDER BY rm.room_no;

-- Housekeeping alerts
SELECT t.id, rm.room_no, t.status, t.assignee, t.notes
FROM housekeeping_task t JOIN room rm ON rm.id = t.room_id
WHERE t.status <> 'done' ORDER BY t.created_at;

-- Audit trace produced by the UI actions
SELECT created_at, actor, action, object_type, object_id, before_state, after_state
FROM audit_event ORDER BY created_at DESC LIMIT 40;
```

Additional assertions in `verify`: no overlapping checked-in stays on the same room/date range; no negative availability; every checked-in stay has exactly one active folio; every fixture departure balance matches its entries; fixture row counts exactly as specified.

## 8. Out of scope / expected findings

- No changes to business rules, endpoints, schema, UI or dependencies unless the test exposes a blocker; fixing findings requires a separate approved unit.
- Housekeeping transitions have no UI button today; they are API-only and manager-gated.
- Refund card is visible to reception but the API returns 403; record as a UX/permission finding.
- Reports, requests and settings remain "coming soon".
- Invoice issue, refund approval, merge UI and membership desk flows are not receptionist scope; optional admin-only checks only.
- `DEL-101` occupied-without-stay and the two expired test reservations are pre-existing; not silently "fixed".
- Fixture data is not load-tested; no concurrency/race scenario is repeated here beyond existing automated tests.
- No production/UAT data or credentials are used.

## 9. Execution and records

1. After approval: create the fixture/scripts, load them, run scenarios T1–T17 against the live stack.
2. Add `docs/03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md` with actual counts, SQL output summaries, pass/fail per scenario and findings.
3. Update this plan with as-built notes and, if relevant, the front-office/guest/billing module docs and `docs/05-operations/local-demo-data.md` (how to load/reset the fixture).
4. Update `STATE.md`/`DEVLOG.md`; leave commit for a separate explicit approval.
5. Stop/reset the fixture on request; do not reset the database or delete user-entered rows without a separate instruction.

## 10. Risks

- **The "no guest seed data" rule** — resolved only by explicit approval of the narrow local fixture exception in §3.
- Direct SQL fixture bypasses services, so it cannot prove API validation; the UI/API actions do.
- Date-relative fixture becomes stale after midnight IST; reload before testing.
- Existing `DEL-101` inconsistency makes the room grid look partially unexplained; untouched unless separately approved.
- Walk-in uses a hard-coded demo name/phone in the UI (`Walk-in Guest`, `+91-9000000000`); running it twice can collide on the unique phone. Test once per reset; record as a finding.
- Local database only; no production readiness claim.

## 11. Approval

- [x] Approve the narrow local demo-fixture exception in §3 (fake `Demo` guests, no Flyway, no auto-seed). — user approved 2026-10-21.
- [x] Approve adding the fixture/scripts and running T1–T17 against local Postgres. — executed 17/17 PASS.
- [x] Confirm pre-existing data handling: preserve `ashish`, the two expired reservations and `DEL-101` (recommended default). — preserved.
- [ ] Commit approval is separate and will be requested only after the run. — **pending**.
