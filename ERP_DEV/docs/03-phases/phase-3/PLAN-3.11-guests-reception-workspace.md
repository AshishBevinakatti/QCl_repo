# Unit 3.11 Plan — Guests reception workspace (targeted redesign)

- Purpose: turn the existing three-card Guests screen into a search-first reception workspace where staff can find a guest, inspect real profile/membership data, and act in context. Audience: user (approver), developers. Last verified: 2026-10-21. Owner: project team.
- Entry: working tree already carries uncommitted dashboard layout fixes and Unit 3.10 fixture/docs on `feature/3.9-observability-ops-console`. No source code for this unit until this plan is approved (Rule 3).
- SOW: ERP-04 Guest Management/CRM (SOW §7); ERP-05 Membership (SOW §8). No new requirement or backend behaviour.

## Goal
A receptionist can search by name or phone, read a clear result list, open the correct guest profile, see valid contact/status/membership data, create a guest with duplicate-phone recovery, and enroll the selected guest in membership without typing a guest ID. The page keeps the existing green/gold ERP shell and real APIs.

## Audit findings
- `App.tsx` renders `GuestsView` and a separate `MembersView`; the page is three unrelated cards (Find, New, Enroll). Search results have no select/open action and no detail area.
- Search already supports name substring and phone substring (`GET /api/v1/guests?search=`), server-paged at 20 by default. No email or booking search exists on the guest endpoint.
- Guest DTO exposes `id, name, phone, idType, preferences, status, mergedIntoId, memberId`; no email, address, reservation history or balances.
- `POST /api/v1/guests` requires name + phone, validates phone with `^[+]?[0-9][0-9 ()-]{5,}$`, and returns 409 `GUEST_EXISTS` with `details.existingGuestId`. The current UI already has the duplicate branch, but the create form competes with search.
- `POST /api/v1/members` accepts `{guestId}`, allows `RECEPTION/MEMBERSHIP/MANAGER/SUPERADMIN`, rejects duplicate enrollment with 409. `GET /api/v1/members/{id}` returns tier, status, valid-to and points.
- Existing membership redemption (`POST /members/{id}/redeem`) is available to reception and must not be lost when the standalone Members card is removed.
- `GET /api/v1/guests/{id}/stays` is still an empty hook. There is no guest-filter on `GET /api/v1/reservations`. The profile will not fabricate reservations or stay history; this remains a documented backend gap.
- Runtime roles are enforced server-side. The UI may hide membership actions for roles outside the API allow-list and must surface a 403 honestly.
- Preview mode has intentionally no guest sample rows; it must stay honest rather than invent guests.

## In scope
1. **Page header**: “Guests”, supporting sentence, one primary “Add New Guest” action.
2. **Search-first surface**: icon-bearing name/phone search, 300 ms debounce + Enter, clear-query control, result count, loading/no-results/error states. Empty query lists the first real page (20) so the workspace is useful immediately; when more records exist, show an honest “refine search” note rather than pretending all are loaded.
3. **Selectable results list**: guest name, phone, status, membership chip and a clear “Open profile” control. Responsive stacked rows on narrow widths.
4. **Contextual guest profile** in the same view (master/detail, no router):
   - Identity: name, phone, guest status.
   - Contact/basic data: phone, ID type if present, safe rendering of preference key/values if present.
   - Membership: live member details when `memberId` exists; otherwise “Not enrolled”.
   - Actions: “Enroll in Membership” using the selected `guest.id`; “Redeem points” retained for existing members; role-gated in Live; explicit permission message on 403.
   - Return to results control; empty-profile guidance until a guest is selected.
5. **Add New Guest modal**: name + phone (only required fields), matching client validation, trim-only phone handling (backend remains identity authority), submit lock, duplicate-phone alert with “Open existing guest” from `details.existingGuestId`, success message, refresh, and auto-open the new profile.
6. **Remove the standalone Find/New/Enroll cards** and remove the separate `MembersView`; move redemption into the selected guest’s membership section so no existing function disappears.
7. **Global-search jump**: when the topbar sends a phone query, search and auto-open the profile if exactly one guest matches; otherwise leave the filtered list for selection.
8. **Docs/records**: update ERP-04/ERP-05 module notes with the workspace, state handling, permissions and the stays/history limitation; DEVLOG/STATE.

## Out of scope
- Backend changes, schema/migrations, guest merge UI, guest editing UI, email/address fields, reservations/stays population, new search identifiers, loyalty renew/adjust, new dependencies, router.
- Fabricated activity, balances, preferences, membership benefits, prices or history.
- Dashboard, reservations, billing or other screens.
- Committing without explicit approval.

## Design decisions
- Master/detail inside `GuestsView` rather than a new route (WHY: current app has no router; smallest disruption, back control keeps results recoverable).
- Search results as accessible selectable rows instead of a wide table (WHY: clearer selection path and natural stacking on narrow screens).
- Membership actions live in the selected profile; enrollment passes `selected.id` directly (WHY: removes manual UUID entry and wrong-guest risk).
- Keep redemption behind a secondary disclosure in the membership section (WHY: preserves the only existing member action without re-creating a competing card).
- Trim the phone but do not rewrite allowed spaces/dashes (WHY: the backend compares the stored phone string; local normalization could defeat duplicate detection).
- Preview remains empty and explicit; no invented guest rows (standing user rule).

## Reused APIs/components
- `searchGuests`, `guestById`, `createGuest`, `enrollMember`, `memberDashboard`, `redeemPoints`, `HttpError`/`isAuthError`.
- `hasRole`, `isAuthenticated`, `login`.
- `Badge`, `Btn`, `Field`, `Alert`, `Icon`, `statusTone` and existing CSS tokens/patterns.
- `Pageable` search already supports `page`/`size`; the frontend may pass them without a contract change.

## States and edge cases
- Initial load, debounced search, stale-response guard, clear query, no results, 401 login guidance, 403 role message, 5xx/backend error with retry.
- Duplicate phone 409 with existing profile, validation 400, repeated submit lock, preview-mode no-save message.
- Membership loading/error/already-enrolled/expired/inactive responses shown from the real API; enrolled status refreshes immediately.
- Selected guest remains stable while search results refresh; if the selected guest is absent from a new result list, the detail remains visible until the user selects another or returns.

## Tests / verification
- Add frontend component tests: search + selection opens the correct profile; no-results/empty guidance; duplicate create offers the existing guest; enroll calls `enrollMember(selected.id)` and updates status; unauthorized membership action is not offered.
- `npm test -- --run`, `npm run lint`, `npm run build`, `git diff --check`.
- Live UI verification against the running stack and Demo fixture: search existing guest, select profile, create a fresh guest, repeat phone to hit 409, open existing, enroll the new guest, verify membership chip refresh, redeem form still present.
- CDP screenshots at 1366×768, 1024×768 and 390×844; no horizontal page overflow; keyboard Escape/overlay close for the modal.
- Confirm topbar guest jump still works, sidebar/navigation unchanged, no requests to unsupported endpoints.

## Risks
- Removing `MembersView` could drop redemption if not migrated — explicit profile action and test cover it.
- Membership enrollment mutates the local Demo fixture; verification will use a fresh created guest and reset the fixture if needed.
- Existing uncommitted dashboard/3.10 work shares `App.tsx`/styling; changes will be kept in new files where possible and separated for later commit review.
- Guest data has no email/address/stays; the UI must say “not available”, not fill gaps.

## Branch/process note
Creating a new branch from `develop` now would drag or strand the uncommitted dashboard and 3.10 work. This unit will therefore be implemented on the current feature branch, with Guests code isolated in `web/src/guests.tsx` + scoped CSS/API edits; branch/commit grouping will be decided at presentation. No commit without explicit approval.

## Definition of done
- Search, selection, profile, creation/duplicate recovery and selected-guest enrollment work against the real APIs.
- No misleading or invented data; stays/history limitation documented.
- Existing redemption, navigation, global search and unrelated screens preserved.
- Tests/lint/build green; live click-through + responsive screenshots complete.
- Docs/logs updated; commit approval requested separately.
