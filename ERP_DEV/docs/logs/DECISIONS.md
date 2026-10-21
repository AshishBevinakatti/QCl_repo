# Decisions (small decisions & assumptions; big architectural ones → ADR in Phase 2)

- D-001 (2026-10-01): project root is `ERP_DEV/` inside `ERP_Resort/` (per user instruction); git root is
  `ERP_Resort/` so one history covers agent config + project. Skill-relative path `docs/...` resolves to
  `ERP_DEV/docs/...`. Reason: user explicitly asked for the structure inside `ERP_DEV`.
- D-002 (2026-10-01): where the playbook and skill conflict on process (git workflow, phases), the skill
  wins by default (project operating rules override habits) — pending user answer on Q-001.
- D-003 (2026-10-01): tech-stack proposal recorded as input, not a decision (Q-006). No stack assumed (Rule: Phase 2 ADR).
- D-004 (2026-10-01): extracts store full derived text with hash headers (Rule 1); no raw `.docx`/`.pdf`
  binaries, no personal data, no credentials in the repo.
- D-005 (2026-10-09): Phase 1 baseline uses CORE only (ERP-02…09 + lite facilities/housekeeping/maintenance); ERP-10…14 excluded per user 2026-10-09 (answers Q-005 scope part). Reason: 2-month MVP; add-ons need later confirmation + flags + CR.
- D-006 (2026-10-09): all missing client values become `[ASSUMED]` placeholder defaults as configuration (Rule 2): rooms/pricing/hold/advance/cancellation/promo/tax/tiers/RBAC/OTA-sync/facility-hours (see DECISIONS-FROM-CLIENT D-101…D-114). Reason: user authorised assumptions; client answers swap config without code change.
- D-007 (2026-10-09): RFID terminal + gateway/OTA credentials use simulator/sandbox adapters until hardware/keys arrive (user: hardware not procured, hosting undecided). Reason: SOW §24/§29 make these client-provided; adapters avoid blocking Phase 3/4.
- D-008 (2026-10-09): "start coding" instruction conflicts with Rule 3 (plan-then-approve) + Rule 4 (phases in order) + Phase 2 stack ADR: baseline approval and design baseline come before code. Flagged to user instead of silently skipping the gate. No code/branch/schema/dependency in Phase 1.

- D-009 (2026-10-20): the observability/ops console baseline becomes a standing project requirement: every future module, endpoint, job, integration and UI feature must connect to it (structured logs/request IDs, audit, health/status, flags, permissions, tests, docs) in the same work unit. Reason: user instruction 2026-10-20 — "we will develop this along the project … remember to connect it to this". Checklist: `docs/02-architecture/observability.md` → "Standing rule — connect every new feature to the ops baseline". Honest `NOT_CONFIGURED`/later-phase states only; no fabricated telemetry.
- D-010 (2026-10-21): narrow exception to the 2026-10-10 "no guest seed data" rule for **local development/demo only**: fabricated `Demo ` guests with reserved-looking `+91-90000001xx` phones may be loaded by an explicit `scripts/dev/reception-demo.sh` fixture. Not a Flyway migration, never auto-loaded, never in production/UAT; reset removes only fixed fixture IDs. Existing local rows and `DEL-101` are preserved. Reason: user asked for reception demo data and approved the plan (Unit 3.10) on 2026-10-21. Details: `docs/05-operations/local-demo-data.md`; results: `docs/03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md`.
