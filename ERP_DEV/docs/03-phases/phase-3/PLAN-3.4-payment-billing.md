# Unit 3.4 Plan — Payment & billing (real money: folio, invoices, refunds)

- Purpose: close the money loop the whole system has been stubbing — collect advances, post charges to folios, issue GST invoices, refund with approval, reconcile. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Entry: 3.3 merged green on `develop`. No code until this plan is approved (Rule 3).

## Goal
`V6__billing` (folio, folio_entry, payment, invoice, refund), gateway adapter (sandbox now, real keys later — same interface), folio engine (room + fee + service charges → one account), GST invoice engine (single tax module, `[ASSUMED]` 12%), refund flow (approval + cap + idempotent), reconciliation view endpoints, advance-collection gate wired into booking confirm (replacing the record-only behavior), folio stub `FolioBalance` retired (same API the gates already call), springdoc diagnosis for the 3.3 spec lag, shell billing screens (folio view, pay, refund, reconcile).

## SOW / REQ references
REQ-ERP07-001…006 (SOW §10), REQ-XCUT-001 (SOW §21 folio/tax); module doc `erp-07-payment-billing.md`; data-model.md (folio/payment/invoice/refund); api.md; screens.md §9.

## In scope
1. `V6__billing` migration: `folio` (guest/stay/member link, status), `folio_entry` (source_type/source_id, amount, append-only), `payment` (folio/booking, amount, currency, status, gateway_ref, idempotency_key unique), `invoice` (folio, lines, tax, total, immutable once issued), `refund` (payment, amount, reason, approver, status).
2. Gateway adapter: `initiate/confirm/refund/reconcile` interface + sandbox implementation (fake capture, signed-webhook simulation, failure injection for tests); webhook signature check on confirm; real provider behind the same interface later (keys from client, Q-009).
3. Folio engine: post room charges (from reservation quote at check-in), cancellation fees (from 3.2 records), service charges (generic entry API for spa/facility/membership later); `FolioBalance.outstandingFor` becomes real (sum entries − payments); `noteTransfer` re-links room refs.
4. Booking confirm gate: confirm now requires advance captured (or manager override + reason); advance_due computed at quote stays the amount.
5. Invoices: GST `[ASSUMED]` 12% rate-table from config, single rounding policy (half-up per LINE total, noted in module doc), immutable once issued (corrections via credit-note entry, never edit).
6. Refunds: request → approve (accounts/manager) → process (idempotent, capped at captured, duplicate blocked) → states; full audit.
7. Reconciliation endpoints: gateway-vs-internal list with mismatch flags (sandbox: simulated settlement file).
8. Tests-first: idempotent payment replay, refund cap/duplicate, invoice math + immutability, webhook-signature reject, confirm-blocked-without-advance, reconciliation mismatch surfacing, RBAC (accounts vs reception vs manager).
9. Shell: folio view (charges by source), pay button (sandbox), refund dialog (reason + approver), reconciliation list.
10. Springdoc 3.3 lag: diagnose (packages config or version bump to latest 2.x patch) so the published spec covers all paths again.

## Out of scope
Real provider keys (sandbox carries dev/tests — client supplies per SOW §29), OTA-charged payments (4.1), loyalty earn/redeem as tender (3.5 — folio entry API ready), multi-tax slabs (single GST rate until SOW §21 answer; slabs = config extension, noted).

## Design decisions (locked here, all `[ASSUMED]` → config)
- GST 12% single-rate table; invoice immutable; refunds need approver + reason; advance_pct from config (30%).
- Webhook-first confirmation: payment confirmed ONLY via signed gateway callback (or sandbox simulator), never by client claim — WHY: fake confirmations = stolen rooms.

## Config vs code
Tax table, advance %, refund thresholds, gateway selection in config; posting rules + signature checks + idempotency in code (tested).

## Tests to write (tests-first where money moves)
As §In-scope-8, plus V5→V6 migration, concurrent double-refund race (exactly one processes), folio totals reconcile across booking→stay→transfer→checkout chain.

## Docs to update
`erp-07` module as-built (incl. rounding policy + webhook rule), TRACEABILITY REQ-ERP07/XCUT-001 code/tests, openapi regen (fixed), DAY-ONE only if new commands, DEVLOG/STATE.

## Risks
- Sandbox-vs-real drift → adapter contract tests pin behavior; real keys swap via config only.
- Tax assumption (12% single) wrong → rate-table config absorbs most answers; slabs need small extension, flagged.

## Open questions
Q-009 (real gateway keys — sandbox meanwhile; no blocker).

## Definition of done
- [ ] V5→V6 clean; money tests green (incl. refund race); full suite green; web builds; live re-verified + spec fixed.
- [ ] Docs + traceability in same change; user approves commit; merge separate.

## Estimated slices
1. V6 + entities + folio engine (retire stub). 2. Gateway adapter + webhook + confirm gate. 3. Invoices + refunds + reconcile. 4. Money tests + refund race. 5. Shell screens + springdoc fix. 6. Docs + present.

## Approval
- Requested at presentation. Branch `feature/3.4-payment-billing` created only after approval.
