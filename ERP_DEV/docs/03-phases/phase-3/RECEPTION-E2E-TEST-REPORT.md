# Reception E2E Test Report — Unit 3.10

- Purpose: record the executed reception demo-data run, prove where dashboard data is stored, and list product gaps found. Audience: user, developers, QA. Date: 2026-10-21. Owner: project team.
- Environment: local only — Postgres `resort_erp` at `127.0.0.1:5432`, backend `:8080`, management `:9091`, web `:5173`, Keycloak `:8081`. Branch `feature/3.9-observability-ops-console`, base `45c8e88` + `775373e`. No commit or merge for this test work.
- Approval: user approved this plan and the narrow local demo-fixture exception on 2026-10-21, choosing to preserve the pre-existing `ashish` guest, two expired reservations, and `DEL-101`.
- Prerequisite backup: `/tmp/opencode/resort_erp_pre_reception_demo_20261021.dump` (58 KB, custom format) taken before loading the fixture.

## 1. Fixture and baseline

Commands:

```bash
ALLOW_DEMO_SEED=1 PGPASSWORD=... ./scripts/dev/reception-demo.sh load
ALLOW_DEMO_SEED=1 PGPASSWORD=... ./scripts/dev/reception-demo.sh verify
```

Loaded: six `Demo` guests, six reservations (3 in-house, 1 current arrival, 1 future hold, 1 future confirmed), three open housekeeping tasks, three occupied rooms, three dirty rooms, four captured payments, three stay folios. Existing rows were preserved.

Dashboard baseline (API, reception token): **1 arrival, 2 departures (1 Ready / 1 Pending Payment), 3 in-house, 3 alerts, 30 rooms**. Room grid: Deluxe 2 occupied / 8 free, Suite 1 / 9, Villa 1 / 9 (includes the pre-existing `DEL-101` occupied anomaly).

## 2. Result summary

**17 / 17 executed API scenarios passed.** No source code was changed. The run used the live backend, the live Postgres database, real Keycloak tokens for `reception-staff` and `admin-staff`, and the exact endpoints used by the UI.

| ID | Scenario | Evidence | Result |
|---|---|---|---|
| T1 | Dashboard baseline | 1 arrival, 2 departures, 3 in-house, 3 alerts | PASS |
| T2 | Guest search | G1 found by phone; six Demo guests by name | PASS |
| T3 | Guest create + duplicate guard | 201 created; second POST 409 `GUEST_EXISTS` with same id | PASS |
| T4 | Booking + idempotency | hold created; same `Idempotency-Key` replayed 200, same id | PASS |
| T5 | Advance gate + capture + confirm | confirm without money 422; replay-safe capture; confirm 200 | PASS |
| T6 | Arrival check-in + folio | stay checked-in; room `DEL-104`; room +500000, advance −150000, outstanding 350000 | PASS |
| T7 | Same-category transfer | SUI-201 → SUI-202; old dirty, new occupied; transfer row | PASS |
| T8 | Pending-payment departure | outstanding 500000 → 0 after sandbox payment; checkout succeeded | PASS |
| T9 | Fully settled departure | checkout succeeded without payment | PASS |
| T10 | Checkout guard | outstanding checkout 422; after payment checkout 200 | PASS |
| T11 | Walk-in | guest + hold/confirm + payment + stay checked-in + open folio in one call | PASS |
| T12 | Booking-ref search | 8-char prefix found the exact reservation | PASS |
| T13 | Housekeeping board | 30 rooms; dirty DEL-102 with open task; reception reads | PASS |
| T14 | Housekeeping transitions (admin) | todo → doing → inspect → done; DEL-102 ready | PASS |
| T15 | Reception role boundaries | merge, refund, invoice, hsk advance, folio entry all 403 | PASS |
| T16 | Alerts | DEL-102 cleared; SUI-203/VIL-302 remain; checkout tasks added | PASS |
| T17 | Audit + ops read | ops audit 200; `stay.checked-in`, `payment.captured`, etc. present | PASS |

Full temporary evidence: `/tmp/opencode/reception_e2e_results.json` and `/tmp/opencode/reception_e2e_console.log` (not committed). The harness itself was a throwaway `/tmp` script; the committed fixture scripts are reproducible.

## 3. Storage evidence

The UI is a projection; the writes land in these tables:

| Screen / action | Storage |
|---|---|
| Guest search/create | `guest` (`property_id`, unique phone); audit `guest.created` |
| Availability/booking | `reservation` (`hold`, dates, quote, advance due), `reservation_hold`; pricing/promo reads |
| Collect advance / confirm | `payment` pending→captured; reservation hold→confirmed; hold deleted; audit |
| Check-in | `reservation` checked-in + `room_id`; `stay`; `room` occupied; `folio` + room charge/payment entries |
| Transfer | `stay.room_id`, `room_transfer`, old room dirty/new occupied, housekeeping task |
| Folio/payment/check-out | `folio_entry` signed entries; `payment` captured; stay/reservation checked-out; room dirty; task |
| Housekeeping/alerts | `housekeeping_task` and `room.status`; alerts computed at read time |
| Audit console | `audit_event` append-only rows |

Post-run counts before cleanup: 10 guests, 10 reservations, 5 stays, 5 folios, 11 folio entries, 8 payments, 7 housekeeping tasks, 67 audit events. `DEL-104` was the auto-assigned arrival room; `SUI-201` became dirty and `SUI-202` occupied after transfer; `DEL-103` and `VIL-301` became dirty after checkouts.

## 4. Findings (not fixed in this test unit)

1. **P1 — Business-audit actor is a Keycloak UUID, not a username.** Rows from reception actions show actor `7c1b953d-…`, while ops reads show `admin-staff`. The 3.9 fix covered `OpsAuditService` only; `ReservationController`, `StayController`, `GuestController` and others still use `request.getUserPrincipal().getName()` (the JWT `sub`). Dashboard/ops audit is therefore hard to read for business events. Suggested fix: one shared principal display-name helper (preferred_username → username → sub) used by all controllers; tests for each actor.
2. **P2 — Refund card is visible to reception but the API returns 403.** The UI should hide role-forbidden actions or route them to Accounts/Manager; T15 proves the server boundary is correct.
3. **P2 — Guest stay history is empty.** `GET /api/v1/guests/d0000000-…-0001/stays` returns `items=[]` although that guest has a full reservation history. The guest profile screen therefore cannot show history; this is an existing unimplemented hook, not a fixture defect.
4. **P2 — Housekeeping transitions have no UI.** Reception sees the board read-only; only an admin API call can advance tasks. T14 passed via API, but the screen cannot perform the documented todo→doing→inspect→done flow.
5. **P3 — Walk-in UI uses a hard-coded name/phone.** Repeated walk-ins can collide on the unique phone. The API flow works with supplied values; the screen needs real inputs.
6. **P3 — Pre-existing `DEL-101` is occupied with no stay.** Preserved on purpose. It makes the room grid show an unexplained occupied room and should be cleaned or explained separately.
7. **Info — Fixture rows bypass services.** They were inserted directly into Postgres, so their presence is not evidence of API validation. The 17 API scenarios are the persistence/validation evidence; fixture rows are clearly `Demo` data and have no audit rows.

## 5. Cleanup and final state

The temporary test rows (fixed phones `+91-9000000197/198/199`) were removed, then the fixture was reset and reloaded. The live dashboard again shows **1 arrival, 2 departures, 3 in-house, 3 alerts**; final DB counts are 7 guests (existing `ashish` + 6 Demo), 8 reservations (2 expired + 6 Demo), 3 stays, 3 folios, 4 payments, 3 open tasks. No pre-existing guest/reservation was deleted. Audit rows from the test remain append-only.

## 6. Not covered / next

- Browser click-through was not automated because this environment has no installed browser/Playwright. API contracts and live data were verified; the user should still click the dashboard/Book/Guests/Front Desk/Billing screens using `reception-staff` / `change-me-dev-only`.
- Post-run regression check: backend `mvn verify` 71/71, BUILD SUCCESS; web tests 4/4; lint exit 0 (pre-existing warnings only); production build 313.26 kB JS / 93.96 kB gzip. No source code changed.
- No invoice, merge, refund-approval or membership-desk UI exists for reception; those are manager/accounts scopes. The plan lists optional admin checks.
- Fixing P1–P5 needs a separate approved work unit. P1 is the highest-value fix because it affects every audit read.
- Do not commit the fixture/test artifacts until the user approves the commit.
