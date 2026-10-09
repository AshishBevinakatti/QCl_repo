# ERP-04 — Guest Management / CRM

- Purpose: single guest database — profiles, history, preferences, search, returning recognition, membership/service links. Audience: architects, ERP-04 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §7 (CORE). REQs: REQ-ERP04-001…005. Phase: 3.1 (first core unit — others depend on guest). Status: baselined.

## Actors/roles
Reception (register/lookup), Manager (merge/admin), Membership desk (member link). Guests do not edit CRM directly.

## Business rules
1. Phone = identity key `[ASSUMED]`; duplicate phone warns/merges, never silent duplicates. WHY: one guest, one history.
2. Profiles: minimal data only (privacy rule); ID images encrypted + access-controlled; consent + retention documented (DPDP note — counsel confirms, we document).
3. Stay/booking history auto-attaches on reservation create (SOW §2.2 integrated principle).
4. Membership + enabled service activity linked on same profile (REQ-ERP04-004).
5. No hard deletes; merge keeps audit trail.

## Data model
`guest` (id, name, phone unique, id_type, preferences json, status, merged_into nullable) · `guest_communication` (guest_id, channel, template, sent_at, status) · links to `reservation`, `member`, `folio`.

## API endpoints
`POST /api/v1/guests` · `GET /api/v1/guests/{id}` · `PATCH /api/v1/guests/{id}` · `GET /api/v1/guests?search=` · `GET /api/v1/guests/{id}/stays` · `POST /api/v1/guests/merge`.

## Screens
Guest search, profile (history + preferences + member link + comms), registration form, merge tool (manager only).

## Permissions
Reception: view/create/edit. Manager: merge + delete-request (soft). Membership: link/unlink member. All reads/writes logged where sensitive.

## Configuration options
ID types, preference keys, duplicate-match thresholds `[ASSUMED]`, retention windows (counsel-confirmed later).

## Integrations/adapters
Booking (auto-create/update), membership (link), folio (charges view), notification history.

## Events/audit entries
`guest.created/updated/merged`, `preference.updated`, PII access where required.

## Tests
Duplicate-merge test, history-attach test, search test, RBAC test, soft-delete test.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §7 + phone-key assumption.
