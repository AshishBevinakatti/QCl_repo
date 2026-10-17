# Unit 3.7 Plan — Desk confirm flow + table fit

- Purpose: close the loop the "expired" report exposed (UI books holds it can never confirm) and kill the scrollbar at its root. Audience: user (approver), developers. Last verified: 2026-10-12. Owner: project team.
- Entry: branch `feature/desk-confirm-flow` from `develop`; header-highlight CSS carried over uncommitted from `fix/highlight-table-headers` (same area, committed together). No source code until this plan is approved (Rule 3).

## Goal
A desk user can take a hold to confirmed without leaving Recent Bookings, and tables fit their panels without scrollbars at desktop widths. Backend untouched (all APIs exist).

## Evidence (why this, verified 2026-10-12)
- DB: booking `a611c4bc` (Oct 12→13, ₹4,500/advance ₹1,350) created Oct 11 09:25, never advance-paid/confirmed → sweeper expired it. Dashboard "expired" badge is correct.
- UI gap: `POST /reservations/{id}/confirm` exists (advance gate, manager override) but no screen calls it; advance-for-a-hold (`initiate {reservationId}`) is likewise uncalled. Holds made in the UI can only die.
- Scrollbar: hidden-bar CSS is served, yet the bar persists in the user's browser — so remove the need: tables fit, scroll stays as narrow-screen fallback only.

## SOW / REQ references
ERP-02 (REQ-ERP02 hold→confirm, advance gate); ERP-03 recent-bookings rows. TRACEABILITY REQ-ERP02/03 code columns (web-only delta).

## In scope
1. `api.ts`: `confirmReservation(id)` (POST …/confirm, `{}`); reuse `initiatePayment({reservationId})` + `confirmPayment` for the advance.
2. Recent Bookings rows (live): status `hold` → **Collect advance** (initiates + confirms sandbox payment for `advanceDuePaise`, shows captured receipt) then **Confirm** (enabled after advance; 422 message surfaced verbatim otherwise); status `expired` → greyed note "expired — rebook" linking to Reservations view (expired holds are terminal by design).
3. Enrichment carries `advanceDuePaise` + `status` for the row logic (already fetched via `reservationById`).
4. Table fit: `.dtbl` keeps auto layout; guest-name cells ellipsize (`max-width` + ellipsis) instead of forcing overflow; slightly tighter cell padding. Hidden-scroll fallback untouched. Header highlight (already built, user-requested) rides along.
5. Preview: buttons render disabled with reason (no invented flows).

## Out of scope
Backend/model changes; hold TTL or expiry policy changes; manager-override UI (endpoint supports it; desk uses advance path — override stays API-only until asked); rebooking automation (link only).

## Design decisions
- Two explicit taps (collect → confirm) instead of one magic button (WHY: money movement must be visible + separately fallible at a desk).
- Enrichment reuse, no new endpoints (WHY: UI-only unit, no migration, no backend tests needed).

## Tests to write
No backend tests (no backend change). Web has no runner: `npm run build` + preview curl + user click-through of hold→advance→confirm on a live booking (Keycloak up).

## Docs to update
This PLAN; `erp-02-booking-reservation.md` (desk confirm path); DEVLOG/STATE.

## Risks
- Advance 422 wording is backend-verbatim (may read technical — accepted, honest).
- Confirming near-expiry holds can still race the 60s sweeper → error surfaces, retry after rebook.

## Open questions
None new.

## Definition of done
- [ ] Hold → Collect advance → Confirm works live from Recent Bookings; expired rows explain + link rebook.
- [ ] No horizontal scrollbar at desktop widths; header highlight stands.
- [ ] Build green; docs + logs in same change; user approves commit; merge separate.

## Estimated slices
1. api.ts helpers. 2. Row actions + states. 3. Table fit CSS. 4. Docs + verify + present.

## Approval
- Requested at presentation. Code starts only after approval.
