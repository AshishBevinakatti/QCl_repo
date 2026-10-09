# Integrations — Phase 2 design (built in Phase 4, contracts fixed now)

- Purpose: one adapter per external system with identical sandbox/real behaviour, so credentials/hardware never block development. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Sources: SOW §§12/24/29 (client provides accounts/approvals/charges), REQ-ERP09/ERP06/ERP07 + REQ-XCUT-002, module docs. Rule: real credentials come from the client — never hard-coded or invented (names only below).

## Adapter pattern (every integration)
Interface + sandbox/mock implementation + real implementation; timeouts, retries with backoff, dead-letter/failure queue, admin-visible status, contract tests. Swap sandbox→real via config only (feature flag per integration). Failure modes + troubleshooting documented per adapter before Phase 4 ends.

| Adapter | Interface (methods) | Sandbox now | Real later (client provides) | Failure handling |
|---|---|---|---|---|
| Payment gateway | `initiate, confirm(webhook), refund, reconcile` | sandbox gateway (fake capture + signed webhooks) | provider keys + webhook secret + merchant config (names only) | idempotency keys; mismatch list in reconciliation view; 3× retry |
| OTA channel(s) | `pushInventory, importReservations, syncCancel, getDiffs` | mock channel (scriptable bookings/diffs) | channel API keys + rate-code mapping + approval (names only) | import idempotent; diffs + failure queue with retry action |
| RFID terminal | `verify(uid, facility, device)` | simulator (button/API, same paths) | ESP32 terminal + device keys + card stock (1 + 100 base) | offline queue, deny-safe default `[ASSUMED]`; all taps logged |
| Email / SMS / WhatsApp | `send(template, to, vars)` | log-to-console/file sandbox | SMTP/SMS/WhatsApp-Business keys + sender IDs + templates approval (names only) | retry + dead-letter; history per guest |
| Maps | read-only embed | static placeholder | Maps API key (name only) | graceful degrade if key absent |
| Object storage | `put/get` (invoices, ID images, gallery) | local filesystem stub | S3-compatible bucket + keys (names only) | retry; encrypted PII prefix |

## Webhook/callback contract (gateway + OTA)
Signed (`X-Signature` + timestamp, tolerance 5 min), idempotent handler (natural-key map: gateway_ref / channel_booking_id), 200-fast + async processing, redelivery-safe (replay tests), failures to dead-letter with alert. Secrets named in security.md, never valued here.

## RFID terminal protocol (summary; firmware detail in Phase 4.2)
`POST /api/v1/rfid/verify { uid, facility, device_id, at }` with device key → `{ decision: allow|deny, reason }`. Enrollment: member verify → assign → test tap → activate. Offline: store taps locally (cap + order), deny-safe default, sync + reconcile on reconnect; clock skew guarded by server-time check.

## Notification flows (events → templates → history)
Booking created/cancelled → confirm/cancel message; payment captured/refunded → receipt; check-in/out → welcome/thank-you; member expiry → renewal nudge. Templates are config (admin-editable); every send writes guest communication history (REQ-ERP04-005).

## What the client must supply (names only, when ready — Q-009)
Gateway merchant + keys, OTA channel approvals + keys + rate mapping, WhatsApp-Business/SMS/SMTP senders + keys, Maps key, S3 bucket, terminal delivery + card artwork. Charges/commissions are the client's (SOW §30). Until then, sandboxes carry all development and tests.
