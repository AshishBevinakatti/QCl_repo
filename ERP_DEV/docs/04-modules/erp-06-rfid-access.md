# ERP-06 — RFID Membership & Access

- Purpose: card lifecycle, member↔card mapping, tap verification, access logs, ESP32 terminal integration. Audience: architects, ERP-06 builders + firmware. Last verified: 2026-10-09. Owner: project team.
- SOW: §9 + §20A (CORE; 1 terminal + 100 cards base). REQs: REQ-ERP06-001…005. Phase: 4.2. Status: baselined; hardware NOT procured (simulator first).

## Actors/roles
Membership desk (issue/activate/replace), Member (tap), Reception (verify), Admin (terminal config). Facility staff see allow/deny + reason.

## Business rules
1. Card UID = identifier, NOT secret (engineering rule). Every tap verified server-side against member active + card active + facility eligibility (SOW §9; WHY: cloned cards must not open doors).
2. One active card per member enforced unless multi-card config explicitly enabled.
3. Lifecycle: `unissued → active → suspended/expired → replaced`; replacement links old→new + audit (SOW §9 issuance/activation/deactivation/replacement).
4. Every tap logged (allow AND deny: who/when/where/device/decision/reason).
5. Terminal API authenticated; offline behaviour documented in Phase 2/4 (deny-safe default proposed; client confirms).
6. Commercial scope: base = 1 terminal + 100 cards; extras = add-on (SOW §20A/§30).

## Data model
`rfid_card` (id, uid unique, member_id, status, issued_at, expires_at, replaced_by nullable) · `access_log` (id, card_id, member_id, facility, device_id, decision, reason, tapped_at; append-only).

## State machine
Card states above; enrollment workflow: member verify → card assign → test tap → activate.

## API endpoints
`POST /api/v1/rfid/cards` (issue) · `POST /api/v1/rfid/cards/{id}/activate| suspend|replace` · `POST /api/v1/rfid/verify` (uid, facility, device_id → allow/deny + reason) · `GET /api/v1/rfid/logs?member=&facility=&from=&to=`.

## Screens
Enrollment workflow, card management (status/mapping), access-log viewer + reports, terminal status page.

## Permissions
Membership desk: issue/activate/replace. Manager: suspend/override. Terminal service account: verify only (least privilege).

## Configuration options
Card validity, facilities requiring tap, capacity/session rules link (facilities), offline policy — config, audited.

## Integrations/adapters
ESP32 terminal adapter: identical interface for simulator (now) and real terminal (later); authenticated; timeouts/retries/queued taps; firmware + secure enrollment logic per §20A. Facility eligibility feed; member status feed.

## Events/audit entries
`card.issued/activated/suspended/expired/replaced`, `access.allowed/denied` — all with device + actor + reason.

## Tests
Verify-against-status matrix (expired/deactivated/forged → deny), replacement-chain test, log-completeness test, terminal-auth test; hardware test when terminal arrives (SOW §28.1 RFID testing where hardware available).

## Known limits
Hardware absent → simulator only until procurement (Q-009/hardware). Card design/branding pending client assets.

## Troubleshooting
Tap denied unexpectedly → check member status → card status → facility hours → device clock/auth. Missing logs → check adapter queue + clock skew.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §9/§20A; simulator-first decided (hardware not procured).
