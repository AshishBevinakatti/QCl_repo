# ERP-05 — Membership & Loyalty

- Purpose: members, tiers, points earn/redeem, validity/renewal, manual adjustments, dashboards. Audience: architects, ERP-05 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §8 (CORE). REQs: REQ-ERP05-001…006. Phase: 3.5. Status: baselined.

## Actors/roles
Membership desk (enroll/RFID link), Admin/Manager (tiers/adjustments), Member (dashboard view), Accounts (redeem at settlement).

## Business rules
1. Tiers/benefits/validity/earn-redeem are config `[ASSUMED: Silver/Gold/Platinum; 1 pt/Rs 100; 100 pts=Rs 100; 1-yr validity]` (SOW §8 tiers/validity/renewals).
2. Points math in integers; earn on paid amounts only; redemption capped by config; balances concurrency-safe (same rule family as no-double-booking).
3. Manual adjustments require authorized role + reason + audit before/after (SOW §8 manual adjustments).
4. Expiry is a job, not manual; expired → benefits blocked with reason; renewal extends + logs.
5. Member dashboard shows tier/points/validity/history; reports for admin.

## Data model
`member` (id, guest_id, membership_no unique, tier, status, valid_from, valid_to) · `loyalty_ledger` (id, member_id, points_delta, reason, ref_type/ref_id, actor, created_at; append-only) · `tier_rule` (tier, earn_rate, benefits json).

## State machine
Member: `active → expired → renewed(active)`; adjustments are ledger entries, never edits.

## API endpoints
`POST /api/v1/members` · `GET /api/v1/members/{id}` · `POST /api/v1/members/{id}/earn` · `POST /api/v1/members/{id}/redeem` · `POST /api/v1/members/{id}/adjust` (approve role) · `POST /api/v1/members/{id}/renew` · `GET /api/v1/members/{id}/ledger`.

## Screens
Enrollment form, member dashboard, tier management, adjustment dialog (reason required), ledger/history, membership reports.

## Permissions
Membership desk: enroll/link. Manager/Admin: tiers + adjustments + renewal overrides. Member: read own. Server-side enforcement + tests.

## Configuration options
Tiers, earn/redeem rates, caps, validity length, grace period — all admin-editable, audited.

## Integrations/adapters
Guest CRM (member↔guest link), folio/billing (earn on payment, redeem as tender), RFID (member status check), reports.

## Events/audit entries
`member.enrolled/tier-changed/renewed/expired`, `points.earned/redeemed/adjusted` with actor + reason + before/after balances.

## Tests
Earn/redeem/adjust math tests, expiry-job test, concurrency on ledger, RBAC test. Floor 80% on loyalty paths.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §8 + assumed earn/redeem/validity.
- 2026-10-10 (3.5, as-built): `V7__membership_loyalty` (member/ledger/tier_rule + tier seed); LoyaltyService (enroll GHM-IDs, earn hook on capture idempotent by payment, redeem with 50% folio cap, adjustments with mandatory reason, renew, nightly expiry, spend-threshold upgrades); earn race fixed for real (payment-row lock + violation-as-replay — concurrent captures post exactly once); guest profile member chip (REQ-ERP04-004 done); shell Members screens. Rounding: earn floors paise→points (guest-visible, documented). Code: `services/erp-app/.../erp05/`, `web/src/{App.tsx (Members), api.ts}`.
- 2026-10-21 (Unit 3.11, as-built): the standalone Members card was removed; membership now lives in the selected guest profile (`web/src/guests.tsx`). Enrolment calls `POST /members` with `selected.id`, shows live tier/status/points/valid-to, refreshes the member chip, and retains points redemption behind a secondary disclosure. Actions are role-gated for `RECEPTION/MEMBERSHIP/MANAGER/SUPERADMIN` (redeem adds `ACCOUNTS`) with explicit 403 messaging. No API/backend change. Verified with mocked tests (enrolment uses the selected guest id; unauthorized role sees no enrol button) and live: `Demo Diya Shah` enrolled as Silver `GHM-2026-A9C790`, then the local fixture was reset/reloaded to remove the test membership.

- 2026-10-21 (Unit 3.12, as-built): presentation-only restyle of the membership block inside the Guests profile (`web/src/guests.tsx`) using shared cards, badges, alerts and tokenised colours. Enrolment/redemption rules, role gates and API calls are unchanged; no backend change.
