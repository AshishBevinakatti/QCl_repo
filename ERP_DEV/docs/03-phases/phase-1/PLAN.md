# Phase 1 Plan — Requirement Discovery (assumed baseline, CORE only)

- Purpose: approved requirement baseline for ERP-02…ERP-09 + facilities/housekeeping/maintenance so Phase 2 design and Phase 3 code have one unambiguous source.
- Audience: user (approver), architects (Phase 2), developers (Phase 3+). Last verified: 2026-10-09. Owner: project team.
- Approval: requested after baseline docs are presented. No code in this phase (Rule 3 steps 1–2 are docs-only).

## Goal
`docs/01-requirements/REQUIREMENTS.md` with numbered `REQ-<module>-<nnn>` (source ref, priority, acceptance criteria) for CORE scope only; `TRACEABILITY.md` one row per REQ; `DECISIONS-FROM-CLIENT.md` register; open questions parked with marked placeholder defaults; user approves the baseline (Phase 1 exit).

## SOW / source references
- SOW §§5–12 (ERP-02…ERP-09 CORE), §18 facilities, §19 housekeeping, §20 maintenance, §20A RFID hardware (1 terminal + 100 cards), §21 folio (treatment TBD), §22 roles, §23 reports, §24–25 integrations/hosting, §28–30 testing/UAT/exclusions. Extract: `docs/01-requirements/source-extracts/sow-extract.md` (sha `2adc277b…e9ceda04`).
- User decisions 2026-10-09 (chat): team 2–4 BE + 2 FE + 1 DevOps + 1 QA; scope CORE only (ERP-10…14 excluded); hosting undecided; RFID hardware not procured.
- Prior state: Phase 0 complete, paused on `develop` (`54f4700`); Q-002…Q-007 open.

## In scope
1. REQUIREMENTS baseline: ERP-02 booking, ERP-03 front-office, ERP-04 guest/CRM, ERP-05 membership/loyalty, ERP-06 RFID, ERP-07 payment/billing + folio, ERP-08 admin/reporting + RBAC, ERP-09 OTA, plus facilities admin (lite), housekeeping, maintenance — all as configurable capabilities with `[ASSUMED]` placeholder defaults (Rule 2).
2. TRACEABILITY, DECISIONS-FROM-CLIENT, module docs `04-modules/erp-02…erp-09, facilities, housekeeping, maintenance` (business rules + sources, no design).
3. OPEN_QUESTIONS answers: Q-005 → CORE only confirmed 2026-10-09; Q-003 stays open with assumed defaults logged; new Q-008 (website location), Q-009 (gateway/OTA credentials), Q-010 (stack confirmation for Phase 2).
4. Role/permission matrix, report list, integration list (who-provides-what), data-migration datasets — all marked assumed where client answer missing.

## Out of scope (with reasons)
- ERP-01 website build (user states website is ready; location of that code is asked as Q-008 — no duplicate build).
- ERP-10…14 add-ons (user confirmed CORE only 2026-10-09; need per-module confirmation only if client later asks — then feature flags + Change Request).
- Any application source code, framework choice, DB schema, API contracts — Phase 2 ADR work. User asked to "start coding" in the same instruction; per Rule 3/Rule 4 coding starts only after this baseline is approved AND Phase 2 design baseline is approved. This conflict is flagged to the user instead of silently skipping the gate.
- Payroll/statutory HR, external accounting integration, full POS, advanced scheduling, extra RFID hardware beyond 1+100, networking/cabling (SOW §30 exclusions).

## Design (requirements-level, not technical)
- Numbering: `REQ-ERP02-001…`, `REQ-ERP03-…` etc.; cross-cutting `REQ-XCUT-…` for audit/RBAC/folio/exports.
- Every REQ: source (SOW §), priority (Must/Should), acceptance criteria testable without design.
- Assumed defaults follow engineering rules: money in paise/integer + configurable GST; UTC storage + Asia/Kolkata display; nights = checkout−checkin; soft-delete everywhere; append-only audit; idempotency keys on money-affecting writes; config-over-code for rates/tax/cancellation/tiers/templates/hours.
- States (requirements-level): reservation hold→confirmed→checked-in→checked-out/cancelled; room vacant→occupied→dirty→cleaning→ready; payment pending→captured/failed→refunded (partial/full); card unissued→active→suspended/expired→replaced; membership active→expired→renewed.

## Config vs code decisions
- All of these are CONFIG (admin-editable) with `[ASSUMED]` defaults: room types/prices/seasons/promos, cancellation/refund tiers, advance %, GST %, membership tiers/points/validity, facility hours/capacity, notification templates, OTA sync interval/retry. No business value hard-coded.

## Tests to write (in Phase 3/5, listed here for traceability)
- Concurrency: no double-booking under parallel holds (Phase 3.2, mandatory).
- Money: pricing/tax rounding, advance/partial/refund, folio totals, idempotent replay (Phase 3.4).
- Loyalty earn/redeem/adjust math (Phase 3.5); RBAC deny-by-default per role (Phase 3.0/3.7); RFID verify against server status + access log (Phase 4.2); OTA import idempotency (Phase 4.1).

## Docs to update (in this unit)
- `01-requirements/REQUIREMENTS.md`, `TRACEABILITY.md`, `DECISIONS-FROM-CLIENT.md`, `04-modules/erp-02…09, facilities, housekeeping, maintenance`, `logs/OPEN_QUESTIONS.md`, `logs/DECISIONS.md`, `logs/RISKS.md`, `logs/RESOURCES_LOG.md`, `logs/DEVLOG.md`, `logs/STATE.md`, `00-onboarding/GLOSSARY.md` (terms used by REQs).

## Risks
- R-001 (placeholders wrong → rework): mitigated by config-over-code + explicit `[ASSUMED]` tags.
- RFID hardware absent + hosting undecided → Phase 4 uses simulator/sandbox adapters; real credentials/hardware swap later without rework.
- Website-ready claim unverified (no code in repo) → Q-008; integration points (auth, room list, booking API) stay adapter-shaped until website location is known.
- User wants code now → gate conflict flagged; proceeding with docs-only baseline per Rule 3.

## Open questions
- Q-002 agreement doc, Q-003 Decision Pack timing, Q-004 branding assets (ERP-01 only), Q-006 stack decision (Phase 2), Q-007 web-fetch permission, Q-008 website code location, Q-009 gateway/OTA sandbox credentials, Q-010 confirm proposal stack or run ADR options.

## Definition of done
- [ ] Every REQ traced to SOW § or Change Request; every open question answered or parked with default.
- [ ] No invented client facts presented as real — every guess tagged `[ASSUMED]`.
- [ ] No code, no schema, no dependency added in this unit.
- [ ] User approves the baseline (logged in DEVLOG + STATE).

## Estimated slices
1. PLAN.md (this file). 2. REQUIREMENTS + TRACEABILITY + DECISIONS-FROM-CLIENT. 3. Module docs + logs/glossary. 4. Present baseline + ask approval + ask Phase-2/stack + commit question.

## Approval
- Started on user instruction 2026-10-09 ("assume and start Phase 1 baseline and start coding" — baseline part approved to start; coding part gated, flagged below).
- Baseline approval: pending (requested at presentation).
