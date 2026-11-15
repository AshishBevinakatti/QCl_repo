# Golden Hills Resort ERP — Documentation

**Phase 1 (new baseline, 2026-11-15): Guest Acquisition, Identity & Sales Lead Operations.** Milestone 1 is documentation only; no application code exists yet.

Start here:
1. [00-onboarding/DAY-ONE.md](00-onboarding/DAY-ONE.md): get the repo and know what runs today
2. [03-phases/phase-1/phase1_plan.md](03-phases/phase-1/phase1_plan.md): what Phase 1 delivers and in which increments
3. [02-architecture/ARCHITECTURE.md](02-architecture/ARCHITECTURE.md): services, data ownership, layout
4. [02-architecture/identity/AUTHENTICATION.md](02-architecture/identity/AUTHENTICATION.md): employee onboarding, login, logout, RBAC (Keycloak)

| Folder | Contents |
|---|---|
| `00-onboarding/` | DAY-ONE guide, GLOSSARY |
| `01-requirements/` | REQUIREMENTS, TRACEABILITY, CHANGE_REQUESTS, `source-extracts/` (hash-stamped text from the client resource folder; the originals win) |
| `02-architecture/` | ARCHITECTURE, api.md (contracts), `identity/` (AUTHENTICATION, KEYCLOAK-SETUP), `adr/` |
| `03-phases/phase-1/` | phase1_plan.md (v2.0) |
| `logs/` | STATE (current status), DEVLOG, DECISIONS, OPEN_QUESTIONS, RISKS, RESOURCES_LOG: append-only, except STATE |

The previous ERP (hotel operations, units 3.0–3.16) and its docs are on branch `archive/hotel-draft` (tag `archive-hotel-draft-2026-11-15`). They are kept for reference and don't apply to this baseline.
