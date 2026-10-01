# Engineering rules for this ERP (recommended by the project author; user may edit/remove any)

These apply to all code, config and docs. When a rule conflicts with a client requirement, raise it, log it, and ask.

## Data correctness
1. **Money**: never floats. Store integer minor units (paise) or fixed-point decimal with an explicit currency (INR). One rounding policy, documented, in one module. Tax (GST) calculation lives in one place and is configurable — the client's tax treatment is not decided yet (SOW §21).
2. **Time**: store UTC; display `Asia/Kolkata`. Stays are modelled by check-in/check-out date + times and counted in nights; test boundary cases (late checkout, midnight, DST-free but timezone-aware code anyway).
3. **No double booking**: availability changes happen in a database transaction with constraints or locking; write concurrency tests for the booking path.
4. **Idempotency**: booking creation, payment initiation/confirmation, refunds, OTA imports and webhooks accept an idempotency key or are naturally idempotent; replays must not duplicate money or reservations.
5. **No hard deletes** for guests, bookings, payments, folios, members, RFID cards: soft-delete/status change with reason. Retention rules documented.
6. **Append-only audit log** for: booking create/modify/cancel, price/rate changes, refunds and adjustments, loyalty manual adjustments, role/permission changes, RFID card issue/activate/deactivate/replace, login/logout/failed login, config changes. Each entry: who, when, what, before/after, source IP/device.
7. **Migrations**: forward-only, versioned, never edit an applied migration, take a backup before applying to staging/production, seed data separate from migrations.

## Security & privacy
8. **RBAC deny-by-default**, enforced server-side (never only in the UI). The permission matrix comes from the client's answers (Decision Pack §13); every role/permission has a test.
9. **Secrets**: only in environment/secret store; `.env.example` lists names with fake values; scan for secrets before every commit; never log secrets or full card/ID numbers.
10. **Payments**: use the gateway's hosted/tokenised flow so card data never touches our servers; verify webhook signatures; reconcile gateway vs. internal records.
11. **Personal data**: collect only what a requirement needs; mask in logs; ID-proof images/files stored encrypted and access-controlled; document consent and retention (India's DPDP Act applies — have the client's counsel confirm obligations; do not give legal conclusions yourself).
12. **Baseline hardening**: HTTPS, secure cookies/headers, rate limiting on login/booking/OTP endpoints, input validation at the boundary, dependency vulnerability scan in CI, least-privilege DB user.
13. **RFID**: treat a card UID as an identifier, not a secret; verify against the server record and status (active/expired/deactivated); log every access decision; firmware and terminal API authenticated; document the terminal's offline behaviour.

## Architecture
14. **Config over code**: rates, seasons, tax, cancellation tiers, membership tiers, loyalty rules, notification templates, facility hours and capacities are data editable by authorised admins, with sensible placeholders until the client answers.
15. **Feature flags** for optional modules ERP-10 … ERP-14 and for each external integration.
16. **Integrations behind adapters** (payment gateway, WhatsApp, SMS, email, OTA/channel manager, maps, RFID terminal, attendance hardware): a clear interface, a sandbox/mock implementation for development and tests, contract tests, timeouts, retries with backoff, a dead-letter/failure queue, and visible failure status in the admin UI. Real credentials come from the client (SOW §29) — never hard-code or invent them.
17. **Modular monolith first**: modules map to SOW module IDs with explicit boundaries; cross-module calls go through defined interfaces so a module can be disabled.
18. **API**: versioned, OpenAPI documented, consistent error format, pagination and filtering conventions, request IDs.
19. **Background work** (reminders, OTA sync, reconciliation, reports, night-audit style jobs) is run by a job runner with retries and visibility, not ad-hoc scripts.

## Quality
20. **Testing pyramid**: unit tests for rules; integration tests for modules and adapters; end-to-end tests for the guest journey (SOW §3.1). Minimum coverage floor for booking/availability, pricing/tax, billing/folio/refunds, loyalty, RBAC: 80% — agree the exact numbers in an ADR.
21. **CI** runs on every branch: format, lint, type-check, tests, build, dependency and secret scan. Do not merge red builds.
22. **Definition of Done** (per work unit): requirements traced · tests written and passing · lint/type/build clean · security checks done · migrations reversible or backed up · docs and module doc updated · DAY-ONE still works · logs/STATE updated · demo steps written · user approved commit.
23. **Seed/fake data only** in dev and staging; production data never copied down; fake data generators for guests, rooms, bookings.
24. **Accessibility & responsiveness**: responsive layouts (SOW §25.1), keyboard navigable forms, sufficient contrast, labelled inputs.
25. **Observability**: structured logs with correlation IDs, health/readiness endpoints, error tracking, basic uptime checks (SOW §31.2).
26. **Performance basics**: pagination everywhere, indexes for availability/search queries, no N+1 queries in list screens; measure before optimising.

## Process
27. **Traceability**: no code without a requirement; no requirement without a source; keep `TRACEABILITY.md` current.
28. **Change control**: any new or changed request → `CHANGE_REQUESTS.md` entry before work; follow SOW §30.1.
29. **Dependencies**: pin versions, check licences, prefer few and mainstream; every new dependency gets an ADR line (why, alternatives, licence).
30. **Environments**: dev / staging (UAT) / production with separate credentials; staging mirrors production configuration; deployment is scripted and documented, not manual folklore.
31. **Backups & recovery**: automated backups, restore tested at least once before go-live and recorded; recovery procedure in `docs/05-operations/backup-restore.md`.
32. **Releases**: semver, release notes, rollback plan written before deployment.
33. **Honest reporting**: say what is verified, what is assumed, what is unknown. A failing test or an unmet requirement is reported, not hidden.
34. **Ask when unsure** about client business rules instead of guessing; park the question with a default and keep moving on unblocked work.
