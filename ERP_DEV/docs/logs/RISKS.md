# Risk Register (append-only)

| ID | Date | Risk | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R-001 | 2026-10-01 | Client answers missing (rates, tax, cancellation, roles) → baseline built on placeholders | Medium — rework in Phase 1/2 if defaults wrong | Placeholder-as-configuration policy (Rule 2); Q-003 | open |
| R-002 | 2026-10-01 | Workflow conflict skill-vs-playbook (Q-001) left undecided → inconsistent branching/reviews | Medium | Skill default until user decides; asked at Phase 0 review | open |
| R-003 | 2026-10-01 | Stack assumed from proposal before Phase 2 ADR → premature commitment, hiring/tooling waste | Medium | Proposal ≠ decision (Q-006); ADR in Phase 2 | open |
| R-004 | 2026-10-01 | Confidentiality: SOW marked confidential; raw client files must never enter the repo | High | Extracts-only policy (Rule 1); pre-commit secret/raw-file check | open |
| R-005 | 2026-10-01 | OTA/payment/WhatsApp/RFID integrations depend on third-party credentials, APIs, hardware availability | Medium | Sandbox/mock adapters (Phase 4); credentials are client responsibility (SOW §24/§29) | open |
| R-006 | 2026-10-01 | Double-booking / lost-update on room holds (playbook §15 top risk) | High — financial + reputational | Concurrency tests mandatory for booking/payment write paths; `@Transactional` review discipline | open, enforced from Phase 3 |
