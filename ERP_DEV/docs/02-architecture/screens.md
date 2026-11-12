# Screen flows — Phase 2 (text-first; visuals use client branding when it arrives)

- Purpose: agreed screens per role so frontend and API never drift. Audience: user (approver), frontend developers. Last verified: 2026-10-22. Owner: project team.
- Sources: module docs `04-modules/*`, api.md, REQ-ERP02…09 + FAC/HSK. Branding pending (Q-004) — layout/content agreed now, skin later. ERP-01 website excluded (existing, Q-008).

## Conventions
Responsive (SOW §25.1), keyboard-navigable, labelled inputs, contrast-safe; every write shows success/failure + reason (never silent); every money screen shows paise-exact totals + currency.

Presentation (shell, page headers, cards, tables, theme, icons, breakpoints) follows `02-architecture/ui-design-system.md` from Unit 3.12. The flows below are unchanged.

## Flows (role → steps → API → result)
1. Guest books online: dates + category → `GET availability` calendar (free/price) → details + promo → `POST reservations` (idem) → pay advance (gateway hosted) → confirmation + history. Fail: room taken → clean unavailable + alternatives.
2. Reception check-in: dashboard (`GET front-office/dashboard`) → arrival → verify ID → allocate ready room → `POST stays/check-in`. Blocked (dirty/unpaid) → reason shown, manager override path.
3. Walk-in: search guest → create/find → quote → `POST walk-ins` → allocate → check-in (one flow, source=walk-in).
4. Transfer: stay → free+ready room → `POST transfer` → folio follows; old room → dirty (housekeeping task appears).
5. Check-out: folio view (`GET folios`) → redeem points? → collect balance → invoice → `POST check-out` → room → dirty.
6. Guest 360 profile: `GET guests?search` → `GET guests/{id}/profile` → identity header + operational stay/booking summary → Overview / Reservations & stays / Billing & payments / Requests & notes. Edit contact data (Reception/Manager/SuperAdmin), enrol/redeem under existing membership rules, and jump to Front Office/Billing for state-changing work. Unsupported notes/service requests/verification show honest unavailable states; merge stays manager-only and has no UI yet.
7. Membership: enroll (`POST members`) → RFID assign → dashboard (tier/points/validity/ledger) → adjust (reason, approve role) → renew.
8. RFID enrollment: member → card assign → test tap → activate; access log viewer + terminal status.
9. Payment desk: folio → initiate/confirm → refund (reason + approver) → reconciliation view (mismatches actionable).
10. Admin: overview (`GET admin/overview`) → reports (filters + totals) → export job → users/roles → config panel (rates/tax/tiers/hours/templates) → audit viewer.
11. OTA desk: channel dashboard (status/sync/diffs/failures) → retry → OTA reports.
12. Housekeeping: board (room grid + status) → task start/inspect/done → reception sees flip live.
13. Facilities: master/hours/status → entry log → spa catalogue + appointments → usage/revenue reports.
14. Maintenance: queue → assign → resolve (notes) → close → history.

## Screen list (build order = Phase 3–4 units)
Dashboard shell + auth (3.0) → guest (3.1; Guest 360 profile 3.13) → booking + availability (3.2) → front-office + housekeeping board (3.3) → folio/pay (3.4) → membership (3.5) → admin/reports (3.7) → channel (4.1) → RFID (4.2) → facilities/maintenance (4.3).

3.13 as-built: Guests stays a search-first master/detail screen. Selecting a guest loads one bounded profile projection; the results become a compact rail on desktop and stack at ≤1100px. Identity, operational summary, tabs, role-gated edit and create-email are covered by the design system; history uses responsive rows (not a wide table) and page-level horizontal overflow was checked at 1440/1366/1024/768/390. No booking, check-in/out, payment or refund action is reimplemented inside the profile.
