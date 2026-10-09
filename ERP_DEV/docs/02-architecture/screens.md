# Screen flows — Phase 2 (text-first; visuals use client branding when it arrives)

- Purpose: agreed screens per role so frontend and API never drift. Audience: user (approver), frontend developers. Last verified: 2026-10-09. Owner: project team.
- Sources: module docs `04-modules/*`, api.md, REQ-ERP02…09 + FAC/HSK. Branding pending (Q-004) — layout/content agreed now, skin later. ERP-01 website excluded (existing, Q-008).

## Conventions
Responsive (SOW §25.1), keyboard-navigable, labelled inputs, contrast-safe; every write shows success/failure + reason (never silent); every money screen shows paise-exact totals + currency.

## Flows (role → steps → API → result)
1. Guest books online: dates + category → `GET availability` calendar (free/price) → details + promo → `POST reservations` (idem) → pay advance (gateway hosted) → confirmation + history. Fail: room taken → clean unavailable + alternatives.
2. Reception check-in: dashboard (`GET front-office/dashboard`) → arrival → verify ID → allocate ready room → `POST stays/check-in`. Blocked (dirty/unpaid) → reason shown, manager override path.
3. Walk-in: search guest → create/find → quote → `POST walk-ins` → allocate → check-in (one flow, source=walk-in).
4. Transfer: stay → free+ready room → `POST transfer` → folio follows; old room → dirty (housekeeping task appears).
5. Check-out: folio view (`GET folios`) → redeem points? → collect balance → invoice → `POST check-out` → room → dirty.
6. Guest profile: `GET guests?search` → profile (stays, preferences, member link, comms) → edit/merge (manager).
7. Membership: enroll (`POST members`) → RFID assign → dashboard (tier/points/validity/ledger) → adjust (reason, approve role) → renew.
8. RFID enrollment: member → card assign → test tap → activate; access log viewer + terminal status.
9. Payment desk: folio → initiate/confirm → refund (reason + approver) → reconciliation view (mismatches actionable).
10. Admin: overview (`GET admin/overview`) → reports (filters + totals) → export job → users/roles → config panel (rates/tax/tiers/hours/templates) → audit viewer.
11. OTA desk: channel dashboard (status/sync/diffs/failures) → retry → OTA reports.
12. Housekeeping: board (room grid + status) → task start/inspect/done → reception sees flip live.
13. Facilities: master/hours/status → entry log → spa catalogue + appointments → usage/revenue reports.
14. Maintenance: queue → assign → resolve (notes) → close → history.

## Screen list (build order = Phase 3–4 units)
Dashboard shell + auth (3.0) → guest (3.1) → booking + availability (3.2) → front-office + housekeeping board (3.3) → folio/pay (3.4) → membership (3.5) → admin/reports (3.7) → channel (4.1) → RFID (4.2) → facilities/maintenance (4.3).
