# Unit 3.x Plan — Reception dashboard UI (image-based redesign)

- Purpose: rebuild the web workspace around the user-approved reference image (side nav, KPI cards, arrivals, room donut, bookings) while keeping our theme. Audience: user (approver), developers. Last verified: 2026-10-10. Owner: project team.
- Entry: chat-approved layout mapping + 4 user decisions (2026-10-10, see Approval). No source code until this plan is approved (Rule 3).

## Goal
The Dashboard view matches the reference image section-for-section — same side nav, topbar search, greeting banner, 5 KPI cards, Today's Arrivals with Check-In, Room Status donut, Recent Bookings, Manage-Rooms promo — rendered with **live backend data wherever an endpoint exists** and an honest **"coming soon"** card wherever one does not. Zero backend changes; our light warm theme untouched.

## SOW / REQ references
ERP-03 front office (reception dashboard, check-in/out); ERP-08-002 (staff identity for greeting/user card); `docs/02-architecture/screens.md` reception flow; TRACEABILITY REQ-ERP03 group.

## User decisions (chat, 2026-10-10 — binding for this unit)
1. Icons from Google (Material Symbols CDN approved); font is SF Pro (system stack, no download).
2. Banner photo to be supplied by user into the resource folder; gradient placeholder meanwhile.
3. Departures / Alerts & Tasks / In-House Guests tables → "coming soon" now; backend endpoints (if ever) are a later unit.
4. Order: merge `feature/auth-keycloak-sso` to `develop` first, then branch `feature/ui-reception-dashboard` from `develop`.

## In scope
1. Sidebar exactly per image: Dashboard, Reservations, Guests, Room Management, Check-in / Check-out, Billing & Payments, Service Requests (coming-soon view), Housekeeping, Reports (coming-soon view); bottom user card (Keycloak username + roles), Settings (coming-soon view), Logout (working). Live/Preview toggle moves to sidebar footer (small — the image has no slot, workflow needs it).
2. Topbar: search (guests via `searchGuests`, booking ID via `GET /reservations/{id}`, room number matched client-side against dashboard `rooms[]`), live date-time, API pill. Bell renders without badge as coming-soon affordance. No dark-mode toggle (would change the kept theme).
3. Greeting banner: time-of-day greeting + username; theme-gradient background + photo slot (`web/src/assets/banner.jpg` wired only when the user-supplied file lands — no invented imagery).
4. KPI cards (live): Rooms Available (`rooms` status `ready` / total), Expected Arrivals (`arrivals.length`), In-House (`inHouse.length`), Awaiting Readiness (`dirty`/`cleaning`/`inspect` count). Expected Departures card renders "coming soon" (no departures endpoint).
5. Today's Arrivals table (live): rows from `arrivals` IDs enriched via existing `GET /reservations/{id}` + `GET /guests/{id}` (+ category name lookup); columns Time→"—" (backend stores dates, not times), Status badge (Arriving/Confirmed from reservation status), Check-In button wired to existing `checkIn`, overflow "…" disabled with title="Coming soon".
6. Room Status donut (live): `ready`→Available, `occupied`→Occupied, `dirty`/`cleaning`/`inspect`/`out_of_order`→Maintenance; counts + % of total; **Reserved slice shows "—"** (rooms carry no reserved status — reservations hold categories, not rooms).
7. "Coming soon" cards: Today's Departures, Alerts & Pending Tasks, In-House Guests (no stay-detail GET / checkout listing / alerts API exists — verified in `StayController`).
8. Recent Bookings (live): `GET /reservations` + guest-name enrichment via the same helper as arrivals (shared `enrichReservations` in `api.ts`).
9. Fonts/icons: `'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,…` first in stack (real SF Pro on Apple, system fallback elsewhere — SF Pro is Apple-licensed, not bundlable); Material Symbols via Google Fonts CDN `<link>` in `index.html` (approved 2026-10-10) with text fallback when offline.
10. Preview mode: extend `demo.ts` with full dashboard rows so the design is reviewable without login.

## Out of scope
Any backend/API change (verified sufficient read endpoints exist); dark mode or any `:root` theme change; departures/alerts/in-house endpoints (later unit if requested); banner photo (blocked on user file — OPEN_QUESTIONS entry); Service Requests / Reports / Settings views (coming-soon shells only); browser click-through by agent (no browser here — user reviews visually).

## Design decisions
- Enrichment in frontend (N+1 `GET` per arrival/booking row, capped at page size 100 — WHY: no backend change; volumes are tens of rows; keeps this unit UI-only).
- New components in `web/src/dashboard.tsx` (`Sidebar`, `Topbar`, `KpiCards`, `ArrivalsTable`, `RoomDonut`, `BookingsTable`, `SoonCard`); shared bits into `ui.tsx`; CSS appended to `index.css`, existing rules/vars untouched.
- Donut is SVG conic (no chart dependency — WHY: no new dependency approvals needed).

## Tests to write
No backend tests (no backend change). Web has no test runner: verification is `npm run build` (tsc + vite, must pass), `vite preview` curl (200 + `/api` proxy UP), and a Preview-mode visual checklist by the user (login-gated live data needs Keycloak, already up).

## Docs to update
This PLAN; `docs/04-modules/erp-03-front-office.md` (as-built dashboard section + coming-soon list + donut mapping); DEVLOG/STATE; OPEN_QUESTIONS (banner photo pending).

## Risks
- N+1 enrichment latency on large arrival lists → capped pages; acceptable for a desk UI.
- "Reserved 0/—" and "Time —" may read as bugs → labeled with reason in UI title text + module doc.
- ENOSPC file-watcher limit on this host degrades vite hot-reload (serving unaffected; needs root to raise — not this unit).
- Live data needs Keycloak sign-in; signed-out users see the login hint (existing pattern).

## Open questions
- Q-banner: user to add resort banner photo to `/run/media/ash_63/DATA/ERP_Resouce`; swap-in is a follow-up micro-change.

## Definition of done
- [ ] Dashboard matches image sections 1:1 (modulo coming-soon cards + kept theme), SF Pro stack + Material Symbols live.
- [ ] Live mode shows real arrivals/bookings/KPIs/donut post-login; signed-out shows login hint; Preview shows full sample layout.
- [ ] `npm run build` green; preview 200 + proxy UP; backend suite untouched (no backend change).
- [ ] Module doc + logs updated in the same change; user approves commit; merge separate.

## Estimated slices
1. Sidebar + topbar + banner shell. 2. KPI cards + donut. 3. Arrivals + bookings enrichment. 4. Coming-soon cards + preview data + fonts/icons. 5. Docs + verify + present.

## Approval
- Requested at presentation. Branch `feature/ui-reception-dashboard` from `develop` (after auth merge) only after approval.
