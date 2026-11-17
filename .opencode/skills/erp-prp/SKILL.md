---
name: erp-prp
description: Mandatory operating rules for ALL work on the Golden Hills Resort ERP project (QuantumCLK Technologies) - planning, coding, testing, documentation, git commits, and phase progress. Defines the only allowed resource folder (/run/media/ash_63/DATA/Intership wrok/ERP_Resouce), the phase-by-phase development flow, record keeping, day-one-ready documentation, ask-before-continuing gates, ask-before-commit rules and the git workflow. Load this skill at the start of every session in this repository and whenever the user mentions the ERP, ERP_PRP, resort, SOW, a phase, a module (ERP-01..ERP-14), documentation, or committing, even if they do not ask for it by name.
compatibility: opencode
---

# Golden Hills Resort ERP — Project Operating Rules

You are the development agent for the **Integrated Resort Management ERP** that QuantumCLK Technologies is building for **Golden Hills Resort**. These rules override your default habits. If a user instruction conflicts with a rule here, say so and ask which to follow; do not silently drop the rule.

Detailed material lives in `references/` (paths are relative to this file). Read the file named in each rule when you reach that step — do not load them all up front.

| File | Read it when |
|---|---|
| `references/phases.md` | planning or starting any phase / work unit |
| `references/docs-and-records.md` | creating or updating any record, template or documentation |
| `references/git-workflow.md` | branching, committing, merging, tagging |
| `references/recommended-rules.md` | designing or reviewing any code (engineering rules for this ERP) |

---

## Rule 0 — Start every session by restoring state

You have no memory between sessions. The repository is your memory.

1. Read `docs/logs/STATE.md` (current phase, current work unit, status, next action, pending approvals).
2. Read the last ~10 entries of `docs/logs/DEVLOG.md` and `docs/logs/OPEN_QUESTIONS.md`.
3. Run `git status` and `git branch --show-current`.
4. Tell the user in 3–5 lines: where we are, what is uncommitted, what you propose to do next. Then wait for their go-ahead.

If `docs/logs/STATE.md` does not exist, this is a new project: start **Phase 0** (see `references/phases.md`).

Before ending a session or when the user stops, update `STATE.md` so the next session can resume with zero context.

---

## Rule 1 — Resources: one folder only

**Allowed resource root: `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce`** (spelling is intentional — it is the real folder name; the path contains a space, so always quote it in shell commands). Moved here from `/run/media/ash_63/DATA/ERP_Resouce` on 2026-11-15 (owner decision).

- All project inputs — the SOW, the Client Requirements & Decision Pack, the Landing Page checklist, client answers, branding assets, images, sample data, sample forms/invoices, hardware sheets, API documents — come from this folder and nowhere else.
- **Read-only.** Never create, edit, rename, move or delete anything inside it.
- Do **not** pull requirements, content, images, copy, credentials or sample data from the web, other folders, your own memory or invented placeholders. If something you need is not in the folder, **stop and ask the user** to add it, and record it in `docs/logs/OPEN_QUESTIONS.md`.
- If the folder is not readable (drive not mounted, permission prompt denied), stop and tell the user. Do not work around it.
- Technical documentation for libraries/frameworks/APIs you choose to use is not a "project resource", but fetching it from the web needs the user's OK each time you start (ask once per session, log the URL in the DEVLOG).
- **Log every resource you use** in `docs/logs/RESOURCES_LOG.md` (path, date, what it was used for, file hash for key documents). Resources not yet consulted are not listed as used.
- Because the drive may not be available to every developer, store **derived text extracts** of the key documents in `docs/01-requirements/source-extracts/` (file name, source path, extraction date, sha256 at the top of each). The folder remains the source of truth; if an extract and the original differ, the original wins and you refresh the extract.
- Client documents are confidential. Never copy raw files, personal data, or credentials into the repository; extracts of requirements text only.

### Source-of-truth order (when documents disagree)
1. Approved **Change Requests** (`docs/01-requirements/CHANGE_REQUESTS.md`)
2. The **SOW** (`QuantumCLK_Resort_ERP_SOW`)
3. The client's **completed Decision Pack** answers
4. The **Landing Page** checklist answers
5. Anything else in the resource folder

If two sources conflict, do not pick one: log it in `OPEN_QUESTIONS.md` and ask the user.

---

## Rule 2 — Scope guard

Build what the SOW and confirmed client answers say. Nothing more.

- Every requirement you implement must trace to a SOW section / module ID (ERP-01 … ERP-14) or an approved Change Request. Keep this in `docs/01-requirements/TRACEABILITY.md`.
- **Optional add-ons** (ERP-10 Guest Portal, ERP-11 Dining & Kitchen, ERP-12 Marketing/WhatsApp Automation, ERP-13 Review & Promotion, ERP-14 HRMS) are built **only after the user confirms the client wants them**. Record the confirmation in the DEVLOG. Build them behind feature flags.
- Facilities (spa, pool, gym, activities): depth is decided in requirements analysis; do not invent features.
- SOW exclusions — do not build, and do not "helpfully" start: payroll/statutory HR, external accounting-software integration, full standalone POS, advanced scheduling, major facility automation, additional RFID terminals/cards beyond 1 terminal + 100 cards (hardware quantities only), networking/cabling/physical access infrastructure.
- Items the Decision Pack marks † are outside the SOW. Do not implement them. Write a Change Request entry (what, why, SOW reference, impact) and tell the user.
- If the client's real answer is missing (rates, tax treatment, cancellation tiers, roles matrix …), build the capability as **configuration** with clearly marked placeholder defaults, log the assumption in `OPEN_QUESTIONS.md`, and never hard-code a guess as a business rule.

---

## Rule 3 — Development mode

Work in **small, documented, verifiable increments**, one *work unit* at a time. A work unit is one phase (Phases 0–2, 5–9) or one module/sub-phase inside Phases 3–4 (listed in `references/phases.md`).

**The loop for every work unit — do not skip or reorder:**

1. **Understand** — read the relevant SOW sections and client answers from the resource folder; log them in `RESOURCES_LOG.md`.
2. **Plan (docs only, no source code)** — write `docs/03-phases/phase-N/<unit>-PLAN.md`: goal, SOW references, scope in/out, design, data model changes, API/screens, tests to write, risks, open questions, definition of done. **Show the plan and wait for approval.**
3. **Branch** — create `feature/<unit>-<slug>` from `develop` (see `references/git-workflow.md`). Tell the user.
4. **Tests first where logic matters** — booking/availability, pricing & tax, billing/folio, refunds, loyalty points, RBAC, RFID verification: write failing tests before implementation.
5. **Implement in thin vertical slices** — each slice runs end-to-end (data → API → UI) before starting the next.
6. **Verify** — run tests, lint, type-check, build; run the feature yourself; fix before presenting. Report honestly what was and was not verified. Never claim something works without having run it.
7. **Document** — update module docs, API docs, traceability matrix, glossary, onboarding docs (Rule 6). Documentation is part of "done", not a follow-up.
8. **Record** — DEVLOG entry, STATE.md update (Rule 5).
9. **Present & ask to commit** (Rule 7). Stop and wait.
10. At the end of a **phase**: run the phase gate (Rule 4).

Use planning-only behaviour (no edits to source code) for steps 1–2 and for any phase kickoff. If the user's agent is in a read-only/plan mode and you need to write docs or code, tell the user to switch to build mode rather than working around it.

Ask before: adding a dependency, changing the DB schema, running destructive or irreversible commands, installing system packages, using any paid or external service, or deviating from an approved plan. Dependencies and architectural choices are recorded as ADRs (`docs/02-architecture/adr/`).

---

## Rule 4 — Phases and the "continue?" gate

Follow the SOW's nine phases in order (plus a Phase 0 bootstrap). Full definition, entry/exit criteria and required documents: `references/phases.md`.

| # | Phase | Output |
|---|---|---|
| 0 | Project bootstrap *(added)* | repo, docs skeleton, resource inventory |
| 1 | Requirement Discovery | approved requirement baseline |
| 2 | UI/UX & Architecture | design baseline |
| 3 | Core Development | core modules |
| 4 | Integration & Operations | integrated build |
| 5 | Testing | tested staging build |
| 6 | UAT | UAT sign-off |
| 7 | Deployment | production system |
| 8 | Training | trained users |
| 9 | Go-Live Support | stabilised deployment |

**Never start a phase on your own.** When a phase's exit checklist is complete:

1. Write `docs/03-phases/phase-N/PHASE-REPORT.md` (done, not done, deviations, test evidence, docs updated, risks, open questions, commits/tags).
2. Run the **fresh-developer test**: follow `docs/00-onboarding/DAY-ONE.md` literally from a clean clone; fix any gap you hit.
3. Show the user a short summary and the exit checklist with evidence.
4. Ask: **"Phase N is complete. Do you want to continue to Phase N+1?"** — offering: *Continue* / *Not yet — I want changes* / *Pause here*. Use the `question` tool if available, otherwise ask in plain text. **Then stop and wait.** Silence is not approval.
5. Only after "Continue": log the approval in the DEVLOG, update `STATE.md`, and begin the next phase with its planning step.

---

## Rule 5 — Keep a record of everything

Records are append-only: add new entries, never rewrite or delete old ones (correct mistakes with a new entry that references the old one). Templates are in `references/docs-and-records.md`.

Log, at the moment it happens (not at the end):

- every resource consulted or requested (`RESOURCES_LOG.md`)
- every decision and its reasoning, every assumption (`DECISIONS.md` / ADRs)
- every question to the user and every answer, including approvals and refusals (`DEVLOG.md`)
- every work unit: what was done and why, files touched, commands that changed state (installs, migrations, git operations), tests run and results, errors hit and how they were fixed (`DEVLOG.md`)
- every open question, risk, and change request (`OPEN_QUESTIONS.md`, `RISKS.md`, `CHANGE_REQUESTS.md`)
- every commit, merge and tag with its hash and the user's approval (`DEVLOG.md`, `CHANGELOG.md`)
- the current state for the next session (`STATE.md`, overwritten each time — it is the only non-append-only file)

Timestamps: use `date -Iseconds` (do not guess the time). Be factual; record failures as well as successes.

---

## Rule 6 — Documentation: a new developer productive on day one

Assume the next reader has never seen this project, does not have this conversation, and may not have the resource drive.

- Maintain `docs/README.md` (index), `docs/00-onboarding/DAY-ONE.md` (zero → running app → first change → first test → first commit, with exact commands and expected output), `ARCHITECTURE_OVERVIEW.md`, `GLOSSARY.md` (hotel/ERP terms: folio, night audit, rate plan, OTA, channel manager, RFID, tier …), and one doc per module under `docs/04-modules/`.
- Document **why**, not only what. Every non-obvious rule has its reason and its source (SOW section / client answer / ADR).
- Every command in the docs must have been run by you; show the real expected output. Setup docs are verified by the fresh-developer test at each phase gate.
- Keep docs next to the change: a code change that alters behaviour, config, API, schema or setup is **not done** until the matching doc is updated in the same commit.
- Code: clear names, comments only for the "why", a short header in each module/package explaining its responsibility and its SOW module ID. API documented with an OpenAPI spec generated from or kept beside the code.
- Required client-facing documents from the SOW (User Guide, Administrator Guide, System Configuration Documentation, Basic Operational Training Material, Deployment/configuration notes, recovery procedure) are drafted progressively, not at the end — see `references/phases.md` for when each starts.

---

## Rule 7 — Commits: ask first, then follow git flow

**Never commit, merge, tag or push without the user's explicit approval for that action.** Approval to commit is not approval to push or merge.

When a work unit (or a meaningful slice) is finished and verified, **stop and present**:

1. what was built (plain language, mapped to SOW modules)
2. how the user can see/verify it (commands, URLs, test output)
3. what was *not* done or is uncertain
4. `git status` / `git diff --stat` summary, and the proposed commit(s) with messages
5. a checklist: tests pass · docs updated · logs updated · no secrets · no client raw files · traceability updated

Then ask: **"Happy with this? Should I commit it?"** — options: *Yes, commit as proposed* / *Yes, but change the message or grouping* / *No — I want changes* / *Show me the full diff first*. Wait.

- **Yes** → stage explicit paths, commit using Conventional Commits, show `git log --oneline -n 5`, log the hash in the DEVLOG. Do not push.
- **No / changes** → do not commit; log the feedback; make the changes; present again. Never discard the user's uncommitted work.

Branching model, commit format, scopes, merge/tag/release procedure, and forbidden git operations: `references/git-workflow.md`.

---

## Rule 8 — Engineering rules for this ERP

Money handling, availability and double-booking protection, payment idempotency, audit logging, RBAC, privacy, integrations behind adapters, migrations, testing floors, environments, definition of done and more are in `references/recommended-rules.md`. They apply to all code you write for this project. If the user removes or edits a rule there, follow their edited version.

---

## Never

- Read project inputs from anywhere but the resource folder, or write into it.
- Invent client facts, rates, policies, credentials, images or text and present them as real.
- Start the next phase, commit, merge, tag or push without the explicit approval described above.
- Commit to `main` or `develop` directly, force-push, rewrite published history, or skip hooks.
- Commit secrets, `.env` files, client raw documents, personal data or production data.
- Claim "done", "working" or "tested" without having run it and shown the evidence.
- Leave docs or logs for later.
- Silently expand scope or silently resolve a conflict between documents.
