# Facilities — Spa, Pool, Gym, Activities (lite MVP)

- Purpose: administrate facilities (hours/capacity/status), eligibility + RFID/member checks, usage logs, folio charges where configured. Audience: architects, Phase 4.3 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §18 (depth finalised in requirements analysis — this baseline IS that decision for MVP). REQs: REQ-FAC-001…003. Status: baselined as lite; no standalone POS / advanced scheduling / major automation (SOW §18/§30 exclusions).

## MVP scope (2-month)
Facility master + open/closed + hours/capacity; member/guest eligibility + RFID check; entry/usage log; charge-or-benefit per config → folio; spa catalogue + price/duration + simple appointment (request → serve → complete/cancel) + staff assignment; usage + revenue reports. Full POS/scheduling/hardware control = Change Request if asked.

## Business rules
1. Closed/maintenance facility blocks booking/tap with reason.
2. Entry requires eligibility per config (member tier / guest / charge); RFID tap verified via ERP-06.
3. Charge posts to folio only where config says chargeable; member benefits applied from tier config.
4. Spa appointment is a record, not a scheduler: no resource-optimisation engine in MVP.

## Data model
`facility` (id, type, hours json, capacity, status, charge_config) · `facility_entry` (facility_id, member/guest_id, decided allow/deny, charge_paise) · `spa_service` (id, name, price_paise, duration_min) · `spa_appointment` (service_id, guest/member_id, staff, status, folio_entry_id).

## API/screens
`CRUD /api/v1/facilities` · `POST /api/v1/facilities/{id}/entries` · `CRUD /api/v1/spa-services` · `CRUD /api/v1/spa-appointments`; admin screens for master/hours/status, entry log, spa catalogue + appointments, reports.

## Permissions
Operations/Spa roles manage their facilities; Membership verifies; Accounts sees revenue. Deny-by-default.

## Events/audit
`facility.opened/closed/config-changed`, `facility.entry-allowed/denied`, `spa.appointment-*`, folio post links.

## Tests
Closed-blocks test, eligibility matrix, charge-posting test, appointment lifecycle test.

## Change history
- 2026-10-09: Phase 1 lite scope decided (user: CORE only, 2-month MVP).
