# Decisions (small decisions & assumptions; big architectural ones → ADR in Phase 2)

- D-001 (2026-10-01): project root is `ERP_DEV/` inside `ERP_Resort/` (per user instruction); git root is
  `ERP_Resort/` so one history covers agent config + project. Skill-relative path `docs/...` resolves to
  `ERP_DEV/docs/...`. Reason: user explicitly asked for the structure inside `ERP_DEV`.
- D-002 (2026-10-01): where the playbook and skill conflict on process (git workflow, phases), the skill
  wins by default (project operating rules override habits) — pending user answer on Q-001.
- D-003 (2026-10-01): tech-stack proposal recorded as input, not a decision (Q-006). No stack assumed (Rule: Phase 2 ADR).
- D-004 (2026-10-01): extracts store full derived text with hash headers (Rule 1); no raw `.docx`/`.pdf`
  binaries, no personal data, no credentials in the repo.
