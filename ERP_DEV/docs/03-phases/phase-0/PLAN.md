# Phase 0 Plan — Project bootstrap

- Purpose: repository + documentation skeleton any developer can open, plus a full inventory of the resource folder.
- Audience: user (approver), developers joining later. Last verified: 2026-10-01. Owner: QuantumCLK Technologies team.

## Goal
A committed `develop` branch containing: repo config files, the full docs tree with templates,
text extracts of all four resource-folder documents, an inventory of what is present **and missing**,
and initial logs — so Phase 1 (Requirement Discovery) can start with zero context loss.

## SOW / source references
- SOW §26 (methodology & deliverables), SOW §3 (module map ERP-01…ERP-14) — requirements text only, no build yet.
- Skill `references/phases.md` — Phase 0 definition (entry/exit criteria).
- Resource files inventoried: SOW `.docx`, Landing Page checklist `.docx`, Engineering Playbook `.md`,
  tech-stack proposal `.pdf` (hashes in `docs/logs/RESOURCES_LOG.md`).

## In scope
1. `ERP_DEV/` project root (per user instruction 2026-10-01): `README.md`, `.gitignore`, `.gitattributes`,
   `.editorconfig`, `LICENSE` (proprietary notice), `.env.example`, full `docs/` tree from `docs-and-records.md`.
2. Source extracts in `docs/01-requirements/source-extracts/` (done 2026-10-01T09:41:03+05:30).
3. `RESOURCE_INDEX.md` listing present + missing resources.
4. Initial logs: `STATE.md`, `DEVLOG.md`, `RESOURCES_LOG.md`, `OPEN_QUESTIONS.md`, `RISKS.md`,
   `DECISIONS.md`, `CHANGELOG.md`; stubs for `REQUIREMENTS.md`, `TRACEABILITY.md`,
   `DECISIONS-FROM-CLIENT.md`, `CHANGE_REQUESTS.md`.
5. `git init` at `ERP_Resort/` root (covers agent config + `ERP_DEV/`), initial branch `main`,
   then `develop` after the first approved commit. Propose hooks (secret scan, commit-msg lint) —
   install only after user approval.
6. Day-one docs: `docs/README.md`, `DAY-ONE.md`, `WORKING-AGREEMENT.md`, `GLOSSARY.md` (seed),
   `ARCHITECTURE_OVERVIEW.md` (stub — no stack decided).

## Out of scope (with reasons)
- Any application source code or framework scaffolding — Phase 2 decides the stack via ADR; the SOW
  names no stack. Starting code now would pre-empt that decision.
- `REQUIREMENTS.md` / `TRACEABILITY.md` content — that is Phase 1 work.
- Choice between git-flow-lite (skill) vs trunk-based (playbook §4) — recorded as Q-001 for the user;
  default is the skill until the user says otherwise.
- Missing client inputs (Decision Pack answers, branding assets, catalogue files, consultancy agreement) —
  recorded as open questions, not invented.

## Design
- Monorepo layout: repo root `ERP_Resort/` holds agent config (`.opencode/`, `AGENTS.md`) + `ERP_DEV/`
  (the ERP project: `docs/`, later `services/`, `web/`, `infra/`). Git root is `ERP_Resort/` so one history
  covers both. All skill-relative paths (`docs/...`) resolve under `ERP_DEV/docs/...`.
- Docs-first: every record follows the templates in the skill's `docs-and-records.md`.

## Config vs code decisions
- None yet (no application code in Phase 0). Placeholder defaults policy for Phase 1+: unknown client
  values become configuration with marked defaults, never hard-coded rules.

## Tests to write
- None (no code). Verification for this phase: `git status` clean review, fresh-developer test —
  follow `DAY-ONE.md` from a clean checkout and confirm the docs-only repo clones and reads coherently.

## Docs to update (in this unit)
All files listed in "In scope". Matching doc updates ride in the same commit as the change (Rule 6).

## Risks
- R-001: client answers missing → Phase 1 baseline would rest on placeholder defaults.
- R-002: git-workflow conflict (skill vs playbook) unresolved → inconsistent branching later.
- R-003: tech-stack proposal treated as decided before Phase 2 ADR → premature commitment.

## Open questions
Q-001…Q-007 in `docs/logs/OPEN_QUESTIONS.md` (git flow, missing agreement, Decision Pack answers,
branding assets, add-on confirmation, stack approval status, web-fetch permission for library docs).

## Definition of done
- [ ] Docs skeleton complete under `ERP_DEV/`; extracts with hashes present.
- [ ] `RESOURCE_INDEX.md` lists every resource-folder file + missing items.
- [ ] `git init` done; `git status` reviewed; no secrets / raw client files / binaries in the tree.
- [ ] User approves the resource inventory (Phase 0 exit requirement).
- [ ] User approves the initial commit; `develop` created; hashes logged in DEVLOG.
- [ ] Fresh-developer test of `DAY-ONE.md` passes.

## Estimated slices
1. Skeleton + extracts + index + logs (this commit). 2. Commit approval + branch setup.
3. Phase-gate: PHASE-REPORT + continue-to-Phase-1 question.

## Approval
- Creation authorized by user: 2026-10-01 ("plan the phase 0 and create project file structure … inside ERP_DEV folder").
- Plan approval: requested together with the commit review (merged step — logged as a deviation in DEVLOG).
