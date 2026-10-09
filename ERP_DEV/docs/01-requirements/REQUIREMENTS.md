# Requirements baseline — Phase 1 (CORE only, assumed defaults)

- Purpose: single approved description of what will be built. Audience: user (approver), architects, developers. Last verified: 2026-10-09. Owner: project team.
- Scope: ERP-02…ERP-09 + facilities/housekeeping/maintenance (lite). ERP-01 website = ready per user (integration only, see Q-008). ERP-10…14 = excluded (user 2026-10-09, CORE only).
- Sources: SOW extract `source-extracts/sow-extract.md` (from `QuantumCLK_Resort_ERP_SOW.docx`, sha `2adc277b…e9ceda04`).
- Rule: anything tagged `[ASSUMED]` is a placeholder default as configuration (Rule 2) — never presented as a client fact, never hard-coded as a rule. Real client answer replaces the default with no code change.
- Engineering defaults applied to all REQs: money in integer paise + currency INR + one rounding policy; times stored UTC, displayed Asia/Kolkata; nights = checkoutDate − checkinDate; soft-delete/status-change with reason (no hard deletes of guests/bookings/payments/folios/members/cards); append-only audit (who/when/what/before/after/source); idempotency on money-affecting writes; RBAC deny-by-default server-side; sandbox/mock adapters for gateway/OTA/RFID until real credentials/hardware.

## ERP-02 — Booking & Reservation (SOW §5)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP02-001 | Online room booking: guest selects dates → availability + pricing → guest details → payment where applicable → confirmation, visible to reception/admin | Must | End-to-end booking creates reservation + guest profile link; confirmation shown; reception sees it within 5 s of commit |
| REQ-ERP02-002 | Real-time availability by date range + room category; no double-booking under concurrent holds | Must | Parallel hold attempts for same room/date → exactly one succeeds; others get clean unavailable error; concurrency test passes |
| REQ-ERP02-003 | Room categories + room master as config `[ASSUMED: Deluxe, Suite, Villa; 30 rooms total]` | Must | Admin can add/edit category, room no, capacity, status without code change |
| REQ-ERP02-004 | Seasonal/custom pricing as config `[ASSUMED: base/night per category + 20% weekend uplift]` | Must | Price for any date range computed from rate config; change config → new quotes change, old confirmed bookings keep quoted price |
| REQ-ERP02-005 | Hold lifecycle with expiry `[ASSUMED: 15-min hold → confirmed on payment/approval, else released]` | Must | Expired hold auto-releases inventory; audit entry written |
| REQ-ERP02-006 | Modification + cancellation with tiered charges as config `[ASSUMED: free ≥48h before check-in, else 1-night charge]` | Must | Cancel/modify applies correct tier from config; refund/charge raised; guest notified (notification adapter) |
| REQ-ERP02-007 | Promo codes as config `[ASSUMED: WELCOME10 = 10% off, one per booking, configurable]` | Should | Valid code discounts quote; invalid/expired code rejected with reason; usage logged |
| REQ-ERP02-008 | Booking states + history: hold/confirmed/checked-in/checked-out/cancelled; per-guest history | Must | State machine enforced; illegal transition rejected; history lists all bookings per guest |
| REQ-ERP02-009 | Advance + partial payments linked to booking `[ASSUMED: 30% advance to confirm; balance at checkout]` | Must | Under-payment blocks confirmation per policy config; over-payment blocked; amounts in paise |
| REQ-ERP02-010 | Occupancy + availability reports (by date/category/channel) | Must | Report matches reservation states; exportable (see XCUT) |

## ERP-03 — Front Office (SOW §6)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP03-001 | Reception dashboard: today arrivals, departures, in-house, room status (free/occupied/dirty/clean), outstanding balances | Must | Dashboard loads from live reservation + room + folio states; balances shown where billing integrated |
| REQ-ERP03-002 | Check-in: verification + room allocation; only if room Ready + booking confirmed/paid per policy | Must | Check-in on dirty/unpaid booking blocked with reason; success sets room Occupied + booking checked-in + audit |
| REQ-ERP03-003 | Walk-in reservation (no prior booking): create guest + booking + allocate + check-in in one flow | Must | Walk-in produces same records as online booking with source=walk-in |
| REQ-ERP03-004 | Room transfer (move checked-in guest to another free+ready room) | Must | Old room released to dirty, new room occupied; folio follows guest; audit both legs |
| REQ-ERP03-005 | Check-out + settlement: folio total → collect balance → release room to dirty | Must | Check-out with outstanding balance blocked unless role has approve-override (logged); success sets booking checked-out |
| REQ-ERP03-006 | Room + booking search; daily arrivals/departures lists; occupancy overview | Must | Search by name/phone/booking-id/room; lists correct for business date (Asia/Kolkata) |
| REQ-ERP03-007 | Reception activity log (who did what check-in/out/transfer/modify) | Must | Every front-office write has audit entry with actor + before/after |

## ERP-04 — Guest / CRM (SOW §7)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP04-001 | Guest registration + profile (name, phone, ID type, contact, preferences) `[ASSUMED: phone = unique key]` | Must | Duplicate phone merges or warns; no hard delete; ID images encrypted per privacy rule |
| REQ-ERP04-002 | Booking + stay history per guest; returning-guest recognition | Must | Profile shows all stays; returning flag on repeat phone/ID |
| REQ-ERP04-003 | Guest search (name/phone/ID) + admin panel | Must | Search returns ranked matches; permission-gated |
| REQ-ERP04-004 | Link membership + enabled service activity to guest profile (SOW §2.2) | Must | Member-linked profile shows tier/points; folio charges visible |
| REQ-ERP04-005 | Communication records per guest (what was sent, when, channel) | Should | Every notification write references guest; history viewable |

## ERP-05 — Membership & Loyalty (SOW §8)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP05-001 | Member enrollment + membership ID generation | Must | ID unique; enrollment creates member account + audit |
| REQ-ERP05-002 | Tiers + benefits as config `[ASSUMED: Silver/Gold/Platinum; benefits % configurable]` | Must | Tier change by rule or admin; benefits applied from config |
| REQ-ERP05-003 | Points earn/redeem engine `[ASSUMED: 1 pt per Rs 100; 100 pts = Rs 100; earn on paid folio, redeem at checkout/billing]` | Must | Earn/redeem math in paise/points integers; redemption capped by config; concurrency-safe balances; 80%+ unit coverage |
| REQ-ERP05-004 | Validity + renewal + status `[ASSUMED: 1-year validity; active/expired/renewed]` | Must | Expiry job flips status; renewal extends + logs; expired members blocked from member benefits with reason |
| REQ-ERP05-005 | Manual point/validity adjustments by authorized role only, with reason | Must | Adjustment requires approve permission + reason; audit before/after |
| REQ-ERP05-006 | Member dashboard + transaction/points history + membership reports | Must | Member sees tier/points/validity/history; admin sees reports + export |

## ERP-06 — RFID Membership & Access (SOW §9, §20A)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP06-001 | Card lifecycle: issue → activate → suspend/deactivate → replace; expiry/renewal status; member↔card mapping | Must | One active card per member enforced (or explicit multi-card config); every transition audited |
| REQ-ERP06-002 | Verification: UID treated as identifier (not secret); server checks member active + facility eligibility + card status → allow/deny + log | Must | Forged/expired/deactivated card denied with reason; every tap logged (allow + deny) |
| REQ-ERP06-003 | ESP32 enrollment/reception terminal integration behind adapter; sandbox simulator until hardware arrives (hardware not procured 2026-10-09) | Must | Same API for simulator and real terminal; terminal API authenticated; offline behaviour documented |
| REQ-ERP06-004 | Access/activity logs + reports; facility verification for pool/spa/member areas where configured | Must | Log: who/when/where/device/decision; report filterable |
| REQ-ERP06-005 | Hardware scope respected: 1 terminal + 100 cards in base; extras = separately priced add-on (SOW §20A/§30) | Must | System supports >100 cards technically but commercial gate noted in docs; no extra hardware procured in code |

## ERP-07 — Payment & Billing (SOW §10, §21)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP07-001 | Gateway integration behind adapter, hosted/tokenised flow only (card data never touches servers); UPI/card/netbanking via selected gateway | Must | Sandbox adapter for dev/tests; webhook signature verified; no card PAN in logs/DB |
| REQ-ERP07-002 | Booking payments: advance/partial/final; payment states pending→captured/failed; idempotent initiation + confirmation | Must | Replay of same idempotency key never double-charges; reconciliation shows gateway vs internal |
| REQ-ERP07-003 | Invoice generation with tax as config `[ASSUMED: GST 12% single-rate engine, rate table configurable; SOW §21 final treatment pending]` | Must | Invoice totals = sum(lines) + tax per single tax module; rounding policy documented; invoice immutable once issued (credit-note for corrections) |
| REQ-ERP07-004 | Refunds (full/partial) with approval + reason; refund states | Must | Refund capped at captured amount; duplicate refund blocked; audit + report |
| REQ-ERP07-005 | Guest folio: room + enabled spa/facility/membership charges in one account per stay/member; folio visibility per role | Must | Every charge links source (room/spa/facility/membership) → folio; folio total reconciles |
| REQ-ERP07-006 | Payment dashboard + history + transaction reports + reconciliation view | Must | Mismatches (gateway vs internal) surfaced, not silent |

## ERP-08 — Administration & Reporting (SOW §11, §§22–23)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP08-001 | Central admin dashboard: bookings, occupancy, revenue, membership, payments, operations at a glance | Must | Numbers reconcile with module reports for same filters |
| REQ-ERP08-002 | User management + RBAC deny-by-default `[ASSUMED matrix: SuperAdmin full; Manager view/approve; Reception bookings+guests+check-in/out; Membership members+RFID; Accounts payments+refunds; Housekeeping tasks; see §22 permission verbs]` | Must | Server-side enforcement; every permission has a test; role change audited |
| REQ-ERP08-003 | Reports: reservation/occupancy/cancellation/source; revenue/payment/refund/outstanding/service-wise; membership/RFID; operations (front-office/housekeeping/facility/service) | Must | Each report has defined filters + totals; seeded-data spot-check passes |
| REQ-ERP08-004 | Excel/CSV/PDF export for supported reports | Must | Export matches on-screen totals; large exports paginated/job-based, not timeout |
| REQ-ERP08-005 | Configuration panel: rates, seasons, promos, tax, cancellation tiers, tiers/points, facility hours/capacity, templates — all editable by authorized roles | Must | Config change audited; effective-dating (old bookings keep old price) |
| REQ-ERP08-006 | Audit log viewer (filterable, exportable) | Must | All §audit events searchable by actor/object/date |

## ERP-09 — OTA / Channel (SOW §12)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-ERP09-001 | Channel adapter(s) behind interface; sandbox/mock until client supplies credentials (SOW §24/§29 client responsibility) | Must | Mock channel drives integration tests; real credentials swap with config only |
| REQ-ERP09-002 | Inventory push: availability updates to supported channels `[ASSUMED: every 5 min + on booking event; retry 3× backoff]` | Must | Sold-out locally → channel shows sold-out within interval; failures visible in admin, not silent |
| REQ-ERP09-003 | Reservation import: OTA booking → central reservation + inventory decrement + front-office visibility; idempotent | Must | Duplicate webhook/API delivery creates exactly one reservation |
| REQ-ERP09-004 | Cancellation/modification sync where channel API supports it | Should | Unsupported operations show clear status + manual-resolution path |
| REQ-ERP09-005 | Channel dashboard + OTA reports (bookings by channel, sync failures, availability diffs) | Must | Failures + diffs listed with retry action |

## Facilities / Housekeeping / Maintenance (SOW §§18–20, lite for 2-month MVP)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-FAC-001 | Facility master as config: spa/pool/gym/activities + hours + capacity/session rules + open/closed status `[ASSUMED defaults editable]` | Must | Closed facility blocks booking/ tapping with reason |
| REQ-FAC-002 | Eligibility + RFID/member check + entry/usage logging + folio charge where configured | Must | Entry writes usage log; charge posts to folio where benefit/charge config says so |
| REQ-FAC-003 | Spa catalogue + price/duration + appointment record + staff assignment + status + folio link (lite; no advanced scheduling/POS per §18/§30) | Should | Appointment create/serve/complete/cancel; revenue reportable |
| REQ-HSK-001 | Housekeeping board: task assignment, live room status, progress, supervisor view, readiness push to reception | Must | Checkout → dirty task; clean→inspect→ready flips room status; reception sees within seconds |
| REQ-HSK-002 | Maintenance/service requests: create → department → assign → in-progress → resolve → close + history + reports | Should | Guest-assistance routing stubbed where portal excluded; audit each transition |

## Cross-cutting (SOW §§21–25, §28)

| REQ id | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REQ-XCUT-001 | Folio posting rules as config; tax treatment replaceable when SOW §21 finalised | Must | Posting engine reads config; client tax answer swaps without code change |
| REQ-XCUT-002 | Notifications via adapters (email/SMS/WhatsApp/OTP) with templates, retry + dead-letter, history; provider charges/approvals are client responsibility (SOW §24/§30) | Should | Booking confirm/cancel/reminder paths emit events; failures retried then surfaced |
| REQ-XCUT-003 | Audit + RBAC + validation + HTTPS + rate limits + least-privilege DB (SOW §25) | Must | Security checklist in Phase 2/5; dependency/secret scan in CI |
| REQ-XCUT-004 | Hosting-agnostic build; backup + recovery procedure documented (SOW §25.3–25.4; hosting undecided 2026-10-09) | Must | Deploy + restore scripts + docs; staging mirrors prod config |
| REQ-XCUT-005 | Data migration limited to agreed datasets in usable digital format (SOW §29.1); seed/fake data for dev/staging only | Must | Importer validates + reports errors; prod data never copied down |

## What is NOT in this baseline
- ERP-10…14 (add-ons) — excluded by user 2026-10-09; each needs separate confirmation + feature flag + Change Request if later requested.
- ERP-01 content build — user states ready; integration points only (auth/session, room list, booking handoff) pending Q-008.
- Payroll/statutory HR, accounting-software integration, standalone POS, biometric devices beyond §20A, networking/cabling (SOW §30).
