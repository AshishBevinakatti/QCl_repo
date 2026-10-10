# ERP-07 — Payment & Billing

- Purpose: gateway payments, invoices, refunds, folio, reconciliation. Audience: architects, ERP-07 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §10 + §21 (tax/posting TBD). REQs: REQ-ERP07-001…006. Phase: 3.4. Status: baselined; gateway credentials pending (sandbox first).

## Actors/roles
Guest/Member (pay), Reception (collect), Accounts (invoice/refund/reconcile), Manager (approve refunds/overrides), Admin (tax config).

## Business rules
1. Hosted/tokenised gateway flow ONLY — card data never touches our servers; webhook signatures verified; gateway vs internal reconciliation surfaced (SOW §10 + security rule; WHY: PCI scope + money trust).
2. Money in paise integers; ONE tax module, ONE rounding policy `[ASSUMED: GST 12% rate-table, configurable]` — SOW §21 final treatment swaps config, not code.
3. Idempotency: payment initiation/confirmation/refund accept idempotency keys; replays never duplicate money (engineering rule).
4. Advance/partial per booking policy `[ASSUMED: 30% to confirm]`; under-payment blocks per policy; over-payment blocked.
5. Invoices immutable once issued; corrections via credit-note/refund, never edit.
6. Refunds capped at captured amount; duplicate refund blocked; approval + reason required.
7. Folio = one account per stay/member collecting room + enabled spa/facility/membership charges (SOW §2.2/§21); every charge links source → folio; totals reconcile.

## Data model
`payment` (id, booking_id/folio_id, amount_paise, currency INR, status, gateway_ref, idempotency_key unique) · `invoice` (id, folio_id, lines json, tax_paise, total_paise, status) · `refund` (id, payment_id, amount_paise, reason, approver, status) · `folio` (id, guest_id/stay_id/member_id, status) · `folio_entry` (folio_id, source_type/source_id, amount_paise; append-only).

## State machine
Payment: `pending → captured | failed`; Refund: `requested → approved → processed | rejected`; Folio: `open → settling → settled`; Invoice: `draft → issued → credited`.

## API endpoints
`POST /api/v1/payments/initiate` (idempotency-key) · `POST /api/v1/payments/confirm` (webhook) · `GET /api/v1/payments/{id}` · `POST /api/v1/refunds` · `GET /api/v1/folios/{id}` · `POST /api/v1/folios/{id}/entries` (charge post) · `POST /api/v1/invoices` · `GET /api/v1/reconciliation?from&to=`.

## Screens
Payment dashboard, folio view (charges by source), invoice view/print, refund dialog (reason + approver), reconciliation view (mismatches listed with action).

## Permissions
Reception: collect + view folio. Accounts: invoice/refund/reconcile. Manager: approve refunds/overrides. Admin: tax/gateway config. Guests: view own folio/invoices.

## Configuration options
Gateway selection, tax rate-table, rounding policy, advance %, refund approval thresholds — admin UI, audited, effective-dated.

## Integrations/adapters
Payment-gateway adapter (sandbox now, real keys later — client provides per SOW §29; never hard-code); folio posting from booking/spa/facility/membership; notification adapter (receipts/refunds); reports.

## Events/audit entries
`payment.initiated/captured/failed`, `refund.requested/approved/processed/rejected`, `folio.entry-posted/settled`, `invoice.issued/credited`, `config.tax-changed` — actor + amounts + keys.

## Tests
Idempotent-replay tests, rounding/tax matrix, advance-gate tests, refund-cap/duplicate tests, reconciliation-mismatch test, webhook-signature test, RBAC test. Floor 80% on money paths.

## Known limits
Real gateway, tax treatment, settlement rules pending client answers — sandbox + assumed GST until replaced. Gateway/OTA/WhatsApp charges are client responsibility (SOW §30).

## Troubleshooting
Double charge → check idempotency key + webhook redelivery handling. Total mismatch → check tax module version + rounding + effective dates. Webhook ignored → check signature + clock + queue.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §10/§21 + sandbox-first + assumed GST.
- 2026-10-09 (3.4, as-built): `V6__billing` (folio/folio_entry/payment/invoice/refund + gateway config); PaymentGateway interface + SandboxGateway (HMAC callbacks, failure injection); FolioService (derived balances, advance linking at check-in); PaymentService (idempotent initiate, webhook-first confirm, approve/process refunds with row lock); InvoiceService (GST 12% half-up on subtotal, immutable); confirm advance gate + walk-in desk settle; cancellation-fee folio posting; shell billing screens. Rounding policy: booking quotes round DOWN per night; invoices round HALF-UP on the subtotal (documented split: quotes favor guests, invoices follow tax convention). Code: `services/erp-app/.../erp07/`, `web/src/{App.tsx (Billing), api.ts}`.
