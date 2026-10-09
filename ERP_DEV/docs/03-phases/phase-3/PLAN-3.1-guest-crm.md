# Unit 3.1 Plan — Guest management / CRM (first feature unit)

- Purpose: single guest database everything later links to (booking, folio, member, RFID all carry guest_id). Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Entry: 3.0 merged green on `develop`. No code until this plan is approved (Rule 3).

## Goal
Guest CRUD + phone-key dedupe + search + manager merge + communication-history hook, behind the 3.0 RBAC/audit machinery, tested and documented, with a shell screen wired to the same endpoints.

## SOW / REQ references
REQ-ERP04-001…005 (SOW §7); module doc `04-modules/erp-04-guest-crm.md`; data-model.md (`guest`, `guest_communication`); api.md (guest endpoints); screens.md §6.

## In scope
1. `V3__guest_crm` migration: `guest` (id, property_id, name, phone, id_type, preferences TEXT, status, merged_into nullable; partial unique (property_id, phone) where merged; index on lower(name)) + `guest_communication` (guest_id, channel, template, sent_at, status) + 3 clearly-marked demo guests.
2. Entity + repository: search (`LOWER(name) LIKE` or phone fragment, paginated), duplicate lookup by phone, merge operation (duplicate → merged status + merged_into, never hard delete).
3. Controller: `POST /guests` (validation: name + phone required, phone format check), `GET /guests/{id}`, `PATCH /guests/{id}`, `GET /guests?search=&page=`, `GET /guests/{id}/stays` (empty list until 3.2 reservations exist — contract stable), `POST /guests/merge` (manager-only), every write audited via `AuditLog`.
4. RBAC: reception create/edit + view; manager merge; membership link endpoints stubbed (real link in 3.5, column/contract ready now).
5. Shell: Guests screen (search box + list + profile view + create form) calling the same endpoints; nav item activates.
6. Tests-first: duplicate-phone rejected-or-merge behaves per rule; search finds by name/phone fragment; merge moves record + audits both sides; validation rejects bad phone; RBAC (reception blocked from merge → 403); soft-delete only (no DELETE endpoint at all).

## Out of scope
Stay-history population (needs 3.2 reservations — endpoint returns `[]` until then), member↔guest link logic (3.5), notification sending (Phase 4 adapters; history table only), ID-image upload/counsel-confirmed retention (deferred with note, privacy rule cited).

## Design (recap from baseline — no new decisions)
- Phone = identity key `[ASSUMED]`; duplicate phone on create → 409 with existing guest id (reception then merges or corrects) — WHY: silent duplicates corrupt history and loyalty.
- Merge keeps full audit trail (both ids logged, reason required).
- PII minimum: name/phone/id_type/preferences only in MVP; no image storage yet.

## Config vs code
ID types + preference keys + duplicate-match note as `app_config` rows (seeded `[ASSUMED]`, admin-editable); matching rule itself is code (reviewed, tested).

## Tests to write
As §In-scope-6, plus migration V2→V3 on seed, pagination, contract error shapes. Coverage floor 80% on guest paths.

## Docs to update
`04-modules/erp-04-guest-crm.md` (as-built), TRACEABILITY Code/Tests for REQ-ERP04-*, `screens.md` build order unchanged, DAY-ONE only if new commands (none expected), DEVLOG/STATE.

## Risks
- Phone-unique assumption wrong for the resort (shared family numbers?) → merge flow + manager override covers it; client answer swaps rule via Change Request, flagged in module doc.
- Search performance later → trigram index is a Phase-5 optimization, noted; LOWER-LIKE paginated is fine for MVP volumes.

## Open questions
None new (Q-008 website guest handoff stays adapter-shaped; website integration when location known).

## Definition of done
- [ ] V2→V3 migrates clean; all new + existing tests green (`mvn verify`); web build green.
- [ ] Docs + traceability in same change; live boot re-verified (health UP, anon guest endpoints 401).
- [ ] User approves commit; merge to develop only with separate approval.

## Estimated slices
1. Migration + entity + repo + search. 2. Controller + validation + merge + audit. 3. Tests (incl. RBAC). 4. Shell Guests screen. 5. Docs + present.

## Approval
- Requested at presentation. Branch `feature/3.1-guest-crm` created only after approval.
