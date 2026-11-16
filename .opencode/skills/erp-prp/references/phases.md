# Phases — definition, entry/exit criteria, required documents

Phases follow SOW section 26. Phase 0 is an addition (project setup). Module IDs (ERP-01 … ERP-14) are from SOW section 3.

Every phase ends with the gate in SKILL.md Rule 4: PHASE-REPORT → fresh-developer test → summary → "continue?" → wait.

Per-phase folder: `docs/03-phases/phase-N/` containing `PLAN.md` (or `<unit>-PLAN.md`), `PHASE-REPORT.md`.

---

## Phase 0 — Project bootstrap *(added; not in the SOW)*
**Goal:** a repository and documentation skeleton any developer can open, plus a full inventory of the resource folder.
**Activities**
- Check `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` is readable; list every file (name, size, type, modified date, sha256) into `docs/logs/RESOURCES_LOG.md` and `docs/01-requirements/RESOURCE_INDEX.md` (what each file is, which phase needs it).
- Read the SOW, Decision Pack, Landing Page checklist; write extracts into `docs/01-requirements/source-extracts/`.
- `git init` (or verify), create `main` and `develop`, add `.gitignore`, `.gitattributes`, `.editorconfig`, `LICENSE`/proprietary notice, `README.md`.
- Create the docs tree and templates from `docs-and-records.md`; create `STATE.md`.
- Propose commit conventions, hooks (secret scan, lint, commit-msg) — ask before installing.
**Exit:** docs skeleton committed on `develop`; RESOURCE_INDEX lists any *missing* resources; user has approved the resource inventory.

## Phase 1 — Requirement Discovery → *Approved requirement baseline*
**Goal:** a single, unambiguous, approved description of what will be built.
**Activities**
- Convert SOW + client's completed Decision Pack into numbered requirements (`REQ-<module>-<nnn>`), each with source reference, priority, acceptance criteria. Fill `TRACEABILITY.md`.
- Build the decision register: every Decision Pack question → answer / pending / †(out of scope) → `docs/01-requirements/DECISIONS-FROM-CLIENT.md`.
- List contradictions between documents, missing answers, and out-of-scope asks → `OPEN_QUESTIONS.md`, `CHANGE_REQUESTS.md`.
- Produce: module list with confirmed add-ons, role/permission matrix (from client answers), report list, notification list, integration list with who-provides-what, data-migration datasets.
- Draft glossary and the first version of the user-roles doc.
**Exit:** every requirement traced to a source; every open question either answered or explicitly parked with a default; user approves the baseline (log approval).

## Phase 2 — UI/UX & Architecture → *Design baseline*
**Goal:** agreed screens, data model, APIs and technical choices.
**Activities**
- ADRs for: language/framework, database, hosting target, auth approach, queue/background jobs, file storage, API style, front-end approach, testing tools, CI. **Do not assume a stack — the SOW does not name one.** Present options with trade-offs and ask.
- ERD + data dictionary, state machines (reservation, room status, housekeeping task, payment, refund, membership, RFID card, maintenance request), API contract (OpenAPI), integration adapter design, RBAC design, audit-log design, config model (rates, taxes, policies as data).
- Screen flows and wireframes/mockups per role (resort-branded; use branding assets from the resource folder only).
- Security design, backup/recovery plan, environment plan (dev / staging-UAT / production), RFID terminal protocol and firmware design.
- Proposed build order for Phases 3–4 (confirm or adjust the list below).
**Exit:** design baseline approved; ADRs recorded; the project builds and a "hello world" vertical slice (UI → API → DB → test → CI) runs from a clean clone.

## Phase 3 — Core Development → *Core modules*
Work units (proposed order — confirm in Phase 2; units that depend on others come later):

| Unit | Content | SOW |
|---|---|---|
| 3.0 | Foundation: app skeleton, auth, RBAC, audit log, config/settings, base UI shell, CI, seed/fake data tooling | ERP-08 (part) |
| 3.1 | Guest management / CRM | ERP-04 |
| 3.2 | Room master, room categories, pricing/seasonal rates, availability engine, booking & reservation | ERP-02 |
| 3.3 | Front office: check-in/out, room allocation/transfer, arrivals/departures, occupancy; housekeeping & room readiness *(placed here because reception depends on room status — confirm)* | ERP-03, SOW §19 |
| 3.4 | Payment & billing: gateway (sandbox), invoices, refunds, guest folio, reconciliation | ERP-07 |
| 3.5 | Membership & loyalty (tiers, points, validity, renewals, adjustments) | ERP-05 |
| 3.6 | Resort website & CMS | ERP-01 |
| 3.7 | Administration & reporting: dashboards, reports, Excel/CSV/PDF exports, user/permission management UI | ERP-08 |

Per unit: follow the loop in SKILL.md Rule 3; write `docs/04-modules/<module>.md`; update TRACEABILITY.
**Exit (phase):** all core units done, tested, documented, merged to `develop` with user approval; core guest journey (booking → check-in → charges → checkout → invoice) works end to end on seed data.

## Phase 4 — Integration & Operations → *Integrated build*
| Unit | Content | SOW |
|---|---|---|
| 4.1 | OTA / channel management (use sandbox/mock adapter until the client supplies OTA credentials) | ERP-09 |
| 4.2 | RFID membership & access: card lifecycle, access logs, ESP32 enrollment terminal firmware + API, commissioning notes (1 terminal, 100 cards) | ERP-06, SOW §20A |
| 4.3 | Facilities (spa, pool, gym, activities) as scoped in Phase 1; maintenance & service requests | SOW §18, §20 |
| 4.4+ | Optional add-ons — **only those the user confirms**: ERP-10, ERP-11, ERP-12, ERP-13, ERP-14 — one unit each, behind feature flags | ERP-10…14 |

**Exit (phase):** integrations work against sandboxes/mocks and are ready for real credentials; folio receives charges from enabled modules; documentation for every integration includes setup, credentials needed (names only), failure modes and troubleshooting.

## Phase 5 — Testing → *Tested staging build*
- Functional, integration, regression, role/permission, reservation/availability, payment, RFID (hardware permitting), notification tests (SOW §28.1); performance smoke test; security checks (dependency audit, secret scan, OWASP basics); backup/restore drill.
- Deliver: test plan, test report, defect log (severity, status), staging deployment, known-issues list.
**Exit:** no open critical defects; staging build reproducible from docs.

## Phase 6 — UAT → *UAT sign-off*
- UAT guide per role, test scripts mapped to the guest journey (SOW §3.1), feedback log, defect triage (critical before go-live; minor may go to support — SOW §28.3), anything new is a Change Request.
**Exit:** client sign-off recorded (who, when, version/tag).

## Phase 7 — Deployment → *Production system*
- Production setup, configuration, data migration limited to agreed datasets (SOW §29.1), SSL, backups scheduled and restore-tested, monitoring, runbook, rollback plan, release tag on `main`.
**Exit:** production smoke test passed; recovery procedure documented and tested.

## Phase 8 — Training → *Trained users*
- Role-based training material and walkthrough scripts (admin, reception, membership/RFID, billing, dining/spa/facilities where enabled, HR where enabled, reporting). Finalise User Guide and Administrator Guide.

## Phase 9 — Go-Live Support → *Stabilised deployment*
- Issue log, minor refinements, hot-fixes via `hotfix/*`, handover pack (all docs, ADRs, runbooks, credentials-handover process — never in the repo), AMC onboarding notes.

---

## Client-facing documents (SOW §26.1) — when they start
| Document | Starts | Final |
|---|---|---|
| System Configuration Documentation | Phase 2 | Phase 7 |
| User Guide | Phase 3 (per module) | Phase 8 |
| Administrator Guide | Phase 3 | Phase 8 |
| Deployment/configuration notes & recovery procedure | Phase 2 | Phase 7 |
| Basic Operational Training Material | Phase 6 | Phase 8 |
