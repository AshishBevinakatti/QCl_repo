# Risk Register (append-only)

| ID | Date | Risk | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R-001 | 2026-10-01 | Client answers missing (rates, tax, cancellation, roles) → baseline built on placeholders | Medium — rework in Phase 1/2 if defaults wrong | Placeholder-as-configuration policy (Rule 2); Q-003 | open |
| R-002 | 2026-10-01 | Workflow conflict skill-vs-playbook (Q-001) left undecided → inconsistent branching/reviews | Medium | Skill default until user decides; asked at Phase 0 review | open |
| R-003 | 2026-10-01 | Stack assumed from proposal before Phase 2 ADR → premature commitment, hiring/tooling waste | Medium | Proposal ≠ decision (Q-006); ADR in Phase 2 | open |
| R-004 | 2026-10-01 | Confidentiality: SOW marked confidential; raw client files must never enter the repo | High | Extracts-only policy (Rule 1); pre-commit secret/raw-file check | open |
| R-005 | 2026-10-01 | OTA/payment/WhatsApp/RFID integrations depend on third-party credentials, APIs, hardware availability | Medium | Sandbox/mock adapters (Phase 4); credentials are client responsibility (SOW §24/§29) | open |
| R-006 | 2026-10-01 | Double-booking / lost-update on room holds (playbook §15 top risk) | High — financial + reputational | Concurrency tests mandatory for booking/payment write paths; `@Transactional` review discipline | open, enforced from Phase 3 |
| R-007 | 2026-10-09 | Assumed defaults (rates/tax/tiers/roles) wrong → rework in Phase 2/3 | Medium | Config-over-code + `[ASSUMED]` tags; client answers swap config (D-006) | open |
| R-008 | 2026-10-09 | Website-ready claim unverified (no code in repo) → booking integration floats | Medium | Q-008; ERP-01 treated as external; adapters pending location | open |
| R-009 | 2026-10-09 | User asked to code before baseline/design approval → gate skip would break traceability | Medium | Flagged per skill conflict rule; no code until baseline + Phase 2 ADR approved | open |
| R-010 | 2026-10-20 | Module 2 restaurant scope expands into POS, inventory, HRMS or delivery and pulls effort away from the CORE baseline | Medium — schedule and focus | Plan freezes the MVP and out-of-scope list; any expansion needs a new CR; feature flag defaults to `false` | open |
| R-011 | 2026-10-20 | Billzova reference assets, fonts or code copied without provenance or licence checks | Medium — legal and IP exposure | Reference-first rebuild; no asset copied until its licence and provenance are checked; user confirmed ownership/permission on 2026-10-20 | open |
| R-012 | 2026-10-20 | Public QR menu exposes an unauthenticated ordering surface to spam, price tampering or data leakage | High — security and guest trust | Signed table tokens, server-side pricing and totals, rate limits, no PII in public responses, abuse tests before UAT | open |
