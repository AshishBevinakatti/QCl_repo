# Unit 3.5 Plan — Membership & loyalty (tiers, points, validity, adjustments)

- Purpose: members earn on what they pay and redeem against what they owe — closing the guest→member→folio triangle. Audience: user (approver), developers. Last verified: 2026-10-10. Owner: project team.
- Entry: 3.4 merged green on `develop`. No code until this plan is approved (Rule 3).

## Goal
`V7__membership` (member, loyalty_ledger, tier_rule), enrollment + ID generation, tier engine, earn on paid folios + redeem as folio credit, validity/expiry job + renewals, manual adjustments (approved + reason + audit), member↔guest link (fills the 3.1 stub), member dashboard endpoints, shell member screens.

## SOW / REQ references
REQ-ERP05-001…006 (SOW §8); module doc `erp-05-membership-loyalty.md`; data-model.md (member/ledger/tier); api.md; screens.md §7.

## In scope
1. `V7__membership` migration: `member` (guest FK unique, membership_no unique, tier, status, valid_from/to), `loyalty_ledger` (member, points_delta, balance_after, reason, ref, actor, append-only), `tier_rule` (tier, earn_rate, benefits JSON) seeded `[ASSUMED]` Silver/Gold/Platinum.
2. Enrollment `POST /members` (guest link required — one member per guest enforced; membership ID `GHM-YYYY-XXXX` generated) + dashboard `GET /members/{id}` (tier/points/validity/history).
3. Earn: on folio payment capture (hook in PaymentService — earn 1pt/Rs100 on captured paise, member resolved via guest link); ledger appends with running balance; concurrency-safe (row lock on member, same pattern as refunds).
4. Redeem: `POST /members/{id}/redeem {points}` → folio credit entry (100pts = Rs100) + ledger debit, capped by balance and by config max-per-folio; redemption posts to folio as tender (shows on invoice lines).
5. Validity: nightly job flips expired → status expired (benefits blocked with reason); `POST /members/{id}/renew` extends 1yr + audit.
6. Manual adjustments: `POST /members/{id}/adjust` (MANAGER/SUPERADMIN + reason mandatory) ± points with audit before/after.
7. Guest link: `POST /guests/{id}/link-member` + profile shows member chip (fills 3.1 stub `REQ-ERP04-004`).
8. Tests-first: earn math (paise→points floors), redeem caps + folio credit, double-earn race (concurrent captures → exactly-once ledger), expiry job, renewal, adjustment RBAC (reception 403), tier upgrade rule.
9. Shell: member dashboard (tier/points/validity/ledger), enroll form, adjust dialog (reason required).

## Out of scope
RFID card mapping (4.2 — member record ready, card link lands there), points-as-online-payment at booking (folio tender only in MVP), tier auto-upgrade complexity beyond spend thresholds (documented rule: upgrade on cumulative paid crossing tier floor).

## Design decisions (locked here, all `[ASSUMED]` → config)
- 1pt per Rs 100 paid (floor on paise), 100pts = Rs 100 credit, 1-yr validity, redeem cap 50% of folio per use `[ASSUMED]` (prevents full-point stays draining liability).
- Ledger is the truth (balances derived); adjustments are ledger entries, never edits.

## Config vs code
Tiers/rates/caps/validity in `tier_rule` + config; earn/redeem math + locks in code (tested).

## Tests to write (tests-first where money-like value moves)
Earn floor math, redeem cap + folio credit, concurrent earn race, expiry/renew, adjustment approval + audit, RBAC matrix, V6→V7 migration.

## Docs to update
`erp-05` module as-built, TRACEABILITY REQ-ERP05 code/tests (+ REQ-ERP04-004 done), openapi note unchanged (lag carried), DEVLOG/STATE.

## Risks
- Points liability (unlimited earn, no expiry of points themselves) → points inherit member validity (expire with status, documented); finance sign-off flagged for UAT.
- Earn hook placement (payment capture) double-fires on redelivery → idempotent by payment id in ledger ref (tested).

## Open questions
None new.

## Definition of done
- [ ] V6→V7 clean; earn/redeem/race/expiry tests green; full suite green; web builds; live re-verified.
- [ ] Docs + traceability in same change; user approves commit; merge separate.

## Estimated slices
1. V7 + entities + tier seed. 2. Enroll/dashboard/link + earn hook. 3. Redeem + folio tender + adjustments + renew + expiry job. 4. Race + matrix tests. 5. Shell screens. 6. Docs + present.

## Approval
- Requested at presentation. Branch `feature/3.5-membership` created only after approval.
