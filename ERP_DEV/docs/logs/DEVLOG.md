# Development Log (append-only — add new entries, never rewrite old ones)

## 2026-10-01T09:41:03+05:30 — Session start, state restore (new project)
- Phase/unit: 0 – bootstrap        Branch: none (no git repo)
- What: loaded `erp-prp` skill; checked `docs/logs/STATE.md` (absent), `DEVLOG.md` (absent),
  `OPEN_QUESTIONS.md` (absent); ran `git status` (not a repo); listed resource folder (read-only).
- Why: Rule 0 — restore state at session start.
- Resources used: `/run/media/ash_63/DATA/ERP_Resouce` (directory listing only)
- Files changed: none
- Commands that changed state: none (read-only checks)
- Verification: confirmed new project — no STATE.md, no git repo, workspace holds only `AGENTS.md`, `opencode.json`, `.opencode/`
- Problems & fixes: none
- User interaction: reported new-project state; user replied "ok plan the phase 0 and create project file structure from resource" + "inside ERP_DEV folder"
- Next: Phase 0 understand step (inventory + extracts)

## 2026-10-01T09:41:03+05:30 — Resource inventory + extracts
- Phase/unit: 0 – bootstrap        Branch: none
- What: hashed all 4 resource-folder files (sha256); extracted SOW + landing checklist via
  python-docx, tech-stack PDF via pdftotext; copied playbook text; wrote extracts with header
  (source path, date, hash) to `ERP_DEV/docs/01-requirements/source-extracts/`; read all four documents.
- Why: Phase 0 activities — inventory + derived extracts (Rule 1); SOW/REQ understanding (Rule 3 loop step 1).
- Resources used: all four files under `/run/media/ash_63/DATA/ERP_Resouce` (read-only; nothing written there)
- Files changed: `ERP_DEV/docs/01-requirements/source-extracts/*.md` (4 files)
- Commands that changed state: `mkdir -p ERP_DEV/docs/...` (new dirs only)
- Verification: `sha256sum` output captured; extract sizes checked (sow 23530 B, landing 10230 B,
  tech-stack 20398 B, playbook 23861 B). Content spot-checked against sources. No raw binaries copied.
- Problems & fixes: no pandoc/libreoffice — used installed python-docx + pdftotext; no new dependencies installed.
- User interaction: none in this step (authorised in advance)
- Next: write PLAN.md, skeleton, logs; present for commit approval
- Deviation note: Rule 3 step 2 says show the plan and wait before building; the user authorised
  planning + skeleton creation together, so both are presented jointly for approval at commit review.

## 2026-10-01T09:46:34+05:30 — User answers: inventory approved, git-flow-lite confirmed, report-first
- Phase/unit: 0 – bootstrap        Branch: main (uncommitted)
- What: presented Phase 0 work + asked 3 questions. User: (1) commit question → "first give the report
  what you did and then ask re this" (full report requested before any commit); (2) resource inventory
  → approved (Phase 0 inventory exit item met); (3) Q-001 → git-flow-lite (skill default confirmed).
- Why: Phase 0 exit needs inventory approval; branching model needed before creating `develop`.
- Resources used: none
- Files changed: `RESOURCE_INDEX.md` (approval recorded), `OPEN_QUESTIONS.md` (Q-001 answered),
  `STATE.md` (updated)
- Commands that changed state: none
- Verification: Q-001 row checked after edit; R-002 closed.
- Problems & fixes: my first Q-001 edit matched the table header instead of the Q-001 row and mangled
  lines 3–5; repaired immediately with a corrective edit (file uncommitted, no history rewritten) and
  verified by re-reading. Lesson: anchor table edits on the row ID, not the header tail.
- User interaction: answers as above; commit still NOT approved — report first, then re-ask.
- Next: deliver full Phase 0 work report, then re-ask the commit question.

## 2026-10-01T09:46:34+05:30 — Initial commit + develop + fresh-developer test
- Phase/unit: 0 – bootstrap        Branch: main → develop
- What: user approved commit ("Yes, commit as proposed"). Pre-commit: read `opencode.json` (no secrets);
  found `.opencode/node_modules/` — excluded via its nested `.gitignore` (only `skills/` staged).
  Staged explicit paths (`ERP_DEV`, `AGENTS.md`, `opencode.json`, `.opencode`); fixed malformed
  `.gitattributes` line 3 (multi-pattern line rejected by git) and re-staged. Committed, created
  `develop`, switched to it. Fresh-developer test: clean local clone of `develop` — full docs tree,
  clean status. Wrote `phase-0/PHASE-REPORT.md` (uncommitted).
- Why: Phase 0 exit — skeleton committed on `develop`, inventory approved, clone-verified.
- Resources used: none
- Files changed: 67 files, +2859 (see commit); plus uncommitted `PHASE-REPORT.md`
- Commands that changed state: `git init -b main`, `git add <explicit paths>`, `git commit`, `git branch develop`, `git checkout develop`, `git clone -b develop . /tmp/opencode/freshclone` (test only)
- Verification: `git log --oneline -n 5` → `fec27bb docs(core): phase 0 bootstrap — skeleton, inventory, extracts`;
  `git status` clean on both worktree and clone; forbidden-file scan 0; `git check-attr` clean.
  NOT verified: clone from a remote (no remote configured — nothing pushed, per rule).
- Problems & fixes: `.gitattributes` multi-pattern line invalid — split to one pattern per line.
- User interaction: commit approved as proposed; PHASE-REPORT + continue-to-Phase-1 still to be approved.
- Next: present commit + report; ask to commit PHASE-REPORT and whether to continue to Phase 1.

## 2026-10-01T09:46:34+05:30 — Report committed (54f4700); Phase 0 gate: PAUSE
- Phase/unit: 0 – gate        Branch: develop
- What: user approved report commit and chose "Pause here" at the Phase 0 gate. Committed
  `54f4700` `docs(core): phase 0 report, gate decision, pause` on `develop` (3 files, +72/−6).
  Tree clean. This entry + STATE update ride with the next approved commit.
- Commits this session: `fec27bb` (main, skeleton) + `54f4700` (develop, report) — both user-approved; no merges/tags/pushes.
- Next: on resume, read STATE.md and await user instruction.

## 2026-10-09T19:18:14+05:30 — Phase 1 baseline drafted (CORE, assumed defaults; coding gated)
- Phase/unit: 1 – Requirement Discovery (baseline)        Branch: develop (no feature branch — docs on develop working tree until plan approved)
- What: wrote `03-phases/phase-1/PLAN.md`; baselined `01-requirements/REQUIREMENTS.md` (REQ-ERP02…09 + FAC/HSK/XCUT, all `[ASSUMED]` defaults tagged); rebuilt `TRACEABILITY.md` (61 rows, design/code/tests TBD P2/3); rewrote `DECISIONS-FROM-CLIENT.md` (confirmed CORE-only + D-101…D-114 pending); expanded 11 module docs (`04-modules/erp-02…09, facilities, housekeeping, maintenance`) with rules/sources/states/APIs/tests; updated `OPEN_QUESTIONS.md` (Q-005 answered CORE-only; added Q-008 website location, Q-009 creds/hardware, Q-010 stack confirm), `DECISIONS.md` (D-005…D-008), `RISKS.md` (R-007…R-009), `RESOURCES_LOG.md`, `GLOSSARY.md`, `STATE.md`.
- Why: user 2026-10-09 "assume and start Phase 1 baseline and start coding" + prior answers (team 2–4BE/2FE/1DevOps/1QA; CORE only; hosting undecided; RFID not procured). REQ sources: SOW §§5–12, 18–25, 28–30 via `source-extracts/sow-extract.md`.
- Resources used: `/run/media/ash_63/DATA/ERP_Resouce/QuantumCLK_Resort_ERP_SOW.docx` (read-only; derived baseline only)
- Files changed: `docs/03-phases/phase-1/PLAN.md` (new), `docs/01-requirements/REQUIREMENTS.md`, `TRACEABILITY.md`, `DECISIONS-FROM-CLIENT.md`, `docs/04-modules/{erp-02…09,facilities,housekeeping,maintenance}.md`, `docs/logs/{OPEN_QUESTIONS,DECISIONS,RISKS,RESOURCES_LOG,STATE}.md`, `docs/00-onboarding/GLOSSARY.md`
- Commands that changed state: none destructive; `git status` / `git branch --show-current` / `date -Iseconds` (read-only checks)
- Verification: re-read PLAN + REQUIREMENTS + TRACEABILITY row count; `git status` shows docs-only modifications on `develop`; no code/schema/dependency added; every guess tagged `[ASSUMED]`; no secrets/raw client files. NOT verified: user approval of baseline (pending); fresh-developer test runs at phase gate, not now.
- Problems & fixes: user asked to code in the same instruction as baseline — conflicts with Rule 3 (plan→approve before code) + Rule 4 (phases in order) + Phase 2 stack ADR (Q-006/Q-010). Flagged to user per conflict rule; no code/branch started. Website-ready claim unverified → Q-008.
- User interaction: approval requested for baseline + Q-008/Q-009/Q-010 + commit question; "continue to Phase 2?" comes only after baseline approval.
- Next: present baseline + gate conflict + ask approvals; on approval, commit docs, then start Phase 2 (stack ADR + design).
- Commit `e68cee5` on `develop` (user-approved 2026-10-09 via question tool: baseline approved, commit as proposed, proposal stack confirmed for Phase 2, simulators for website/keys). `git log --oneline -n 5` → `e68cee5` on top of `54f4700`. No merges/tags/pushes. Fresh-developer test: clean clone of `develop` to `/tmp/opencode/freshclone-p1` — phase-1 + requirements trees present, status clean → pass. Wrote `03-phases/phase-1/PHASE-REPORT.md` (uncommitted — rides with next approved commit).
- Phase-gate answer 2026-10-09: user chose "Continue to Phase 2" (via question tool). Phase 1 closed; beginning Phase 2 planning.
- Commit `438fa74` on `develop` (user-approved: Phase 2 PLAN + Phase 1 report commit). Includes `PHASE-REPORT.md` (P1), `phase-2/PLAN.md`, DEVLOG, STATE. `git log` → `438fa74` atop `e68cee5`. No merges/tags/pushes.
- Phase 2 approved: user approved Phase 2 PLAN via question tool (2026-10-09). Wrote `02-architecture/adr/ADR-001-stack.md` (accepted — proposal stack locked, monolith-first; closes Q-006/Q-010 decision, answers to be recorded in OPEN_QUESTIONS at next commit). Next: data-model + api + security/integrations/environments + screens, then hello-world slice.
- Design baseline drafted 2026-10-09 (uncommitted): `02-architecture/data-model.md` (ERD + dictionary + states + property-scoped keys), `api.md` (conventions + per-module endpoints + website/terminal/channel integration), `security.md` (RBAC matrix + secrets + money/PII/RFID + audit), `integrations.md` (adapter pattern + sandbox-now/real-later + terminal protocol), `environments.md` (local/dev/staging/prod + pipeline + backup), `screens.md` (14 flows + build order); TRACEABILITY Design column filled per REQ group; README index + Q-006/Q-010 answers recorded. No code yet — hello-world slice comes after design commit + approval.
- Commit `4e999f6` on `develop` (user-approved 2026-10-09: design baseline docs). 12 files, +339/−82. Secret scan clean (names only, no values). No merges/tags/pushes. Tree clean. Next: hello-world vertical slice on a feature branch (per approved Phase 2 PLAN) — needs Java/Maven + Node availability check first.

## 2026-10-09T20:31:00+05:30 — Hello-world slice built + verified (UI → API → DB → test)
- Phase/unit: 2 – slice        Branch: feature/2-slice-hello-world (from develop)
- What: user-local toolchain (JDK Temurin 21.0.12.1 + Maven 3.9.9, user-approved); monorepo skeleton (`ERP_DEV/pom.xml`, `services/erp-app`, `infra/docker-compose.local.yml`, `.github/workflows/ci.yml`); Spring Boot slice — `GET /api/v1/health`, `GET /api/v1/room-categories` (paginated envelope) + `GET /{id}` (404 contract shape), Flyway V1 (`property` + `room_category` + seed: 1 property + Deluxe/Suite/Villa), static `index.html` slice UI (React replaces in Phase 3), JUnit contract tests, OpenAPI via springdoc (published copy `docs/02-architecture/openapi/erp-app.json`); DAY-ONE rewritten with verified commands; api.md slice-proof line.
- Why: Phase 2 exit needs a running UI→API→DB→test→CI slice from a clean clone (phases.md). Stack-implied deps only (no new stack): spring-boot starters (web/validation/data-jpa/test), flyway-core, postgresql (runtime), springdoc-openapi 2.5.0, H2 (test scope only).
- Resources used: none from resource folder in this unit (stack docs already extracted in Phase 0)
- Files changed: `ERP_DEV/pom.xml` (new), `services/erp-app/**` (pom, 6 java files, 1 test, V1 SQL, properties ×2, index.html), `infra/docker-compose.local.yml` (new), `.github/workflows/ci.yml` (new), `docs/02-architecture/openapi/erp-app.json` (new), `docs/00-onboarding/DAY-ONE.md`, `docs/02-architecture/api.md`, logs/STATE
- Commands that changed state: user-local installs (JDK + Maven tarballs → ~/.local, /tmp downloads); `git checkout -b feature/2-slice-hello-world develop`; `mvn -B verify` (first run pulled deps from Maven Central → ~/.m2); live-run via test-classpath + H2 (see DAY-ONE §5)
- Verification: `mvn -B verify` → Tests run: 4, Failures: 0, Errors: 0 + jar built; live boot → `GET /health` = UP, `GET /room-categories?size=2` = seeded Deluxe+Suite envelope (total 3), `/` = 200, `/v3/api-docs` = 200 (3 paths). NOT verified: real-browser click-through, Postgres-runtime run (no Docker here), compose boot, GitHub CI run — all documented in DAY-ONE as pending a Docker host.
- Problems & fixes: no java/mvn/node/docker on machine → user approved user-local install; truncated first downloads (short curl timeout) → re-downloaded fully; `mvn` URL 404 → used archive.apache.org 3.9.9; shell tool waits on background procs → live-run wrapped with `timeout + kill + wait` so the shell exits.
- User interaction: toolchain install approved; branch created (told user); commit + merge approval requested at presentation.
- Next: commit slice on feature branch → merge to develop (separate approval) → Phase 2 gate (PHASE-REPORT + fresh-dev test + continue to Phase 3?).
- Fix `41407de` (user-approved): V1 migration was silently blocked by `.gitignore` `*.sql` → added `!**/src/main/resources/db/migration/*.sql` exception and committed V1. Lesson: `*.sql` ignores migrations too — exception recorded in gitignore.
- Fresh-slice test 2026-10-09: clean clone of `feature/2-slice-hello-world` to `/tmp/opencode/freshclone-slice` → `mvn -B verify` → BUILD SUCCESS, Tests run: 4, Failures: 0, Errors: 0. Proves the committed tree (incl. V1 fix) builds green with no local leftovers.
- Merge `de4544c` (user-approved 2026-10-09): `feature/2-slice-hello-world` → `develop` (`--no-ff`; includes `2080131` slice + `41407de` V1 fix + `d2074c8` logs). Post-merge `mvn -B verify` on `develop` → BUILD SUCCESS, 4/0/0. Wrote `03-phases/phase-2/PHASE-REPORT.md` (uncommitted — rides with next approved commit). No tags/pushes.
- Phase-gate answer 2026-10-09: user chose "Continue to Phase 3". Phase 2 closed; beginning Phase 3.0 (foundation) planning.

## 2026-10-09T21:05:00+05:30 — Unit 3.0 foundation built + verified (auth, RBAC, audit, config)
- Phase/unit: 3.0 – foundation        Branch: feature/3.0-foundation (from develop, plan-approved)
- Phase/unit: 3.0 – foundation        Branch: feature/3.0-foundation (from develop, plan-approved)
- What: deps (spring-security, oauth2-resource-server, security-test — stack-implied, ADR-001); V2 migration (`app_user`, `role_permission` seeded matrix, `app_config` 14 assumed defaults, `audit_event`); entities + repos; `AuditLog` same-txn writer; Keycloak JWT resource server + deny-by-default + contract 401/403 + claims→authority mapping; `ConfigController` (reads any login, PATCH SUPERADMIN + audited); tests (RBAC matrix, claims mapping ×2, audit-on-write; updated slice tests to stub users); CI +gitleaks/dependency-review; module doc + traceability code/test columns.
- Files changed: `services/erp-app/pom.xml`, `src/main/.../{auth,audit,config}/` (9 files), V2 SQL, `application.properties`, `src/test/...` (SecurityTest, JwtRolesMappingTest, updated RoomCategoryApiTest, test props), `.github/workflows/ci.yml`, `docs/04-modules/erp-08-admin-reporting.md`, `TRACEABILITY.md`
- Commands that changed state: `git checkout -b feature/3.0-foundation develop`; `mvn -B verify` iterations
- Verification: `mvn -B verify` → Tests run: 10, Failures: 0, Errors: 0, BUILD SUCCESS; live boot → `/health` UP public, anon `/room-categories` + `/config` → 401. NOT verified: real Keycloak realm run (no Docker here — stub-free runtime path documented in DAY-ONE as pending a Docker host); UI shell (needs Node — asked user, pending).
- Problems & fixes: (1) generics invariance in converter lambda → explicit cast; (2) package-visible constant across packages → public; (3) `TIMESTAMPTZ` unknown to H2 → `TIMESTAMP WITH TIME ZONE` (both DBs); (4) test JwtDecoder stub never took effect (anonymous-safe 401s) → replaced stub-token mechanics with standard `@WithMockUser` + dedicated claims-mapping unit tests (lesson: test authorization with framework support; token verification belongs to Keycloak runtime); (5) missing spring-security-test dep → added.
- User interaction: 3.0 PLAN approved; commit + Node-shell questions requested at presentation.
- Next: commit 3.0 backend → UI shell decision (Node install vs defer to 3.7) → merge to develop (separate approval) → 3.1 Guest/CRM.
- Commit `52024bf` (user-approved): 3.0 backend on `feature/3.0-foundation` (22 files, +763/−13). Node v22.12.0 + npm 10.9.0 installed user-local (`~/.local/node`, user-approved) for the UI shell.
- UI shell 2026-10-09 (uncommitted): Vite React-TS scaffold in `ERP_DEV/web` (private, React 19); `src/api.ts` typed client (health + categories envelope + rupees); `src/App.tsx` 3.0 shell (nav skeleton + live status + category list); `vite.config.ts` dev proxy `/api → localhost:8080`; `web/.env.example` (VITE_API_URL blank = same origin); `index.html` title set. Verified: `npm install` + `npm run build` green; `vite preview` serves shell (200); backend live at same time (`/health` UP, anon `/room-categories` 401 — shell calls public endpoints until Keycloak login lands). NOT verified: browser click-through (no browser here); Keycloak login flow (realm pending).
- Commit `fc7b3ed` (user-approved): UI shell on `feature/3.0-foundation` (22 files, +1725/−2). Tree clean (node_modules/dist ignored).
- Merge `1a7af15` (user-approved 2026-10-09): `feature/3.0-foundation` → `develop` (`--no-ff`). Post-merge verify on `develop`: backend `mvn verify` 10/0/0 BUILD SUCCESS; web `npm run build` green. Unit 3.0 complete. No tags/pushes.

## 2026-10-09T21:30:00+05:30 — Unit 3.1 Guest/CRM built + verified (CRUD, dedupe, search, merge)
- Phase/unit: 3.1 – Guest/CRM        Branch: feature/3.1-guest-crm (from develop, plan-approved)
- What: V3 migration (`guest` + full `UNIQUE(property_id, phone)` + `guest_communication` + 3 demo guests); entities + search repo; `GuestController` (create 201 / duplicate 409 / validation 400 / search / update + clash 409 / stays-hook `[]` / manager-only merge + audit); validation handler → contract 400 shape; 9 GuestApiTest; shell Guests screen (search + create); module doc as-built + TRACEABILITY REQ-ERP04 code/tests + data-model unique note.
- Files changed: V3 SQL, `erp04/` (4 main files), `GlobalExceptionHandler` (+validation), `Guest.java` unique, `GuestApiTest`, `web/src/{App.tsx, api.ts}`, docs (erp-04, data-model, TRACEABILITY)
- Commands that changed state: `git checkout -b feature/3.1-guest-crm develop`; `mvn -B verify` iterations; `npm run build`
- Verification: `mvn -B verify` → Tests run: 19, Failures: 0, Errors: 0, BUILD SUCCESS; `npm run build` green; live boot → V1→V3 migrate clean, `/health` UP, anon `/guests` + `/stays` → 401. NOT verified: authed live guest calls (no Keycloak here — covered by MockMvc tests); browser click-through; member-link + history population (units 3.5/3.2).
- Problems & fixes: (1) H2 rejects partial (WHERE) indexes → full unique constraint (same-phone re-registration 409s by design; merge covers same-person-different-phone); lesson: keep DDL identical on both DBs; (2) 4-arg ResponseStatusException ctor doesn't exist in Spring 6.1 → id in reason string.
- User interaction: 3.1 PLAN approved; commit requested at presentation.
- Next: commit 3.1 → merge to develop (separate approval) → 3.2 Booking engine (PLAN first).
- Commit `b033e35` (user-approved): 3.1 on `feature/3.1-guest-crm` (15 files, +760/−16). Tree clean.
- Merge `0e34622` (user-approved 2026-10-09): `feature/3.1-guest-crm` → `develop` (`--no-ff`). Post-merge `mvn verify` on `develop` → 19/0/0 BUILD SUCCESS. Unit 3.1 complete. No tags/pushes.

## 2026-10-09T22:00:00+05:30 — Unit 3.2 Booking engine built + verified (availability, holds, pricing, race-proof)
- Phase/unit: 3.2 – Booking engine        Branch: feature/3.2-booking-engine (from develop, plan-approved)
- What: V4 migration (room/rate_plan/promo/reservation/reservation_hold + 30 rooms + weekend plans + WELCOME10 + max_nights) — seed rewritten portable after catching Postgres-only funcs; entities + overlap query + category lock; PricingService (per-night round-DOWN, plan-then-config, strict promos, price-lock, advance recorded); BookingService (idempotent book, hold 15m + 60s sweeper, confirm/modify/cancel + tiers, folio TODOs for 3.4); ReservationController (availability/dashboard endpoints); 12 new tests incl. parallel last-room race (exactly-one-winner) + expiry; shell booking screen; module doc + traceability + regenerated openapi (14 paths).
- Files changed: V4 SQL, `erp02/` (10 main files), `ErpApplication` (+scheduling), `RoomCategoryRepository` (+lock), `Configs` helper, `BookingApiTest` + `BookingRaceTest`, `web/src/{App.tsx, api.ts}`, docs (erp-02, TRACEABILITY, openapi)
- Commands that changed state: `git checkout -b feature/3.2-booking-engine develop`; `mvn -B verify` iterations; `npm run build`
- Verification: `mvn -B verify` → Tests run: 31, Failures: 0, Errors: 0, BUILD SUCCESS; `npm run build` green; live boot → V1→V4 clean, `/health` UP, anon POST /reservations → 401, openapi 14 paths saved. NOT verified: authed live booking (no Keycloak — MockMvc covers); browser click-through; Postgres-cluster race (H2 + Postgres share the pessimistic design; Phase 5 load test confirms).
- Problems & fixes: (1) Postgres-only seed funcs → explicit UUID rows (lesson: seeds must be portable from line one); (2) 4-arg ResponseStatusException ctor absent → id in reason; (3) H2 partial indexes (again) → full unique; (4) two of my own test bugs (mock-user leak into anonymous test → @WithAnonymousUser; config count 14→15 after V4).
- User interaction: 3.2 PLAN approved; commit requested at presentation.
- Next: commit 3.2 → merge to develop (separate approval) → 3.3 Front-office + housekeeping (PLAN first).
- Commit `d4874af` (user-approved): 3.2 on `feature/3.2-booking-engine` (29 files, +2509/−26). Tree clean.
- Merge 3.2 → develop (user-approved 2026-10-09, `--no-ff`). Post-merge `mvn verify` on `develop` → 31/0/0 BUILD SUCCESS. Unit 3.2 complete. No tags/pushes.

## 2026-10-10T00:00:00+05:30 — Unit 3.4 Payment & billing built + verified (folio, gateway, refunds)
- Phase/unit: 3.4 – Payment & billing        Branch: feature/3.4-payment-billing (from develop, plan-approved)
- What: V6 migration (folio/folio_entry/payment/invoice/refund + gateway config); PaymentGateway interface + SandboxGateway (HMAC callbacks, failure injection); FolioService (derived balances, advance linking at check-in — caught the unlinked-advance gap while testing); PaymentService (idempotent initiate, webhook-first confirm, approve/process refunds with row lock, reconcile); InvoiceService (GST 12% half-up on subtotal, immutable); confirm advance gate + walk-in desk settle; cancel-fee folio posting; FolioBalance retired to a facade; shell billing screens (folio/pay/refund); module doc + traceability ERP07/XCUT-001.
- Files changed: V6 SQL, `erp07/` (11 main files), `BookingService` (gate + folio fee), `StayService` (walk-in settle + folio link), `ReservationController` (override), `FolioBalance` (facade), `SecurityConfig` (webhook permit), 5 updated test files, `BillingApiTest` + `RefundRaceTest`, `web/src/{App.tsx, api.ts}`, docs (erp-07, TRACEABILITY, api.md gap note)
- Commands that changed state: `git checkout -b feature/3.4-payment-billing develop`; `mvn -B verify` iterations; `npm run build`
- Verification: `mvn -B verify` → Tests run: 44, Failures: 0, Errors: 0, BUILD SUCCESS; `npm run build` green; live boot → V1→V6 clean, `/health` UP, anon initiate/recon → 401. Springdoc lag NOT fixed (packages-to-scan + DEBUG tried, reverted; recorded, pre-UAT must-fix). NOT verified: real provider (sandbox only); browser click-through.
- Problems & fixes: (1) CHAR(3) vs VARCHAR validation → VARCHAR; (2) AuditLog 8-vs-9-arg calls → added objectType; (3) package-visible orOwned → public; (4) old-test fallout from the new gate (config count, checkout-with-balance → settle-first, confirms need payment) — all updated faithfully, none weakened; (5) advance-folio link gap (folio ignored paid advances) → linkBookingPayments at check-in + invoice test proving 700000 outstanding / 820000 total.
- User interaction: 3.4 PLAN approved; commit requested at presentation.
- Next: commit 3.4 → merge to develop (separate approval) → 3.5 Membership & loyalty (PLAN first).
- Commit `edded7b` (user-approved): 3.4 on `feature/3.4-payment-billing` (37 files, +2008/−46). Tree clean.
- Merge 3.4 → develop (user-approved 2026-10-10, `--no-ff`). Post-merge `mvn verify` on `develop` → 44/0/0 BUILD SUCCESS. Unit 3.4 complete. No tags/pushes.

## 2026-10-10T01:00:00+05:30 — Unit 3.5 Membership & loyalty built + verified
- Phase/unit: 3.5 – Membership & loyalty        Branch: feature/3.5-membership (from develop, plan-approved)
- What: V7 migration (member/ledger/tier_rule + tier seed); LoyaltyService (enroll, earn hook on capture, redeem with 50% cap, adjustments, renew, expiry job, spend upgrades); earn race FIXED for real (payment-row lock in confirmByRef + violation-as-replay in earn — concurrent callbacks post exactly once); MemberController (enroll/dashboard/ledger/redeem/adjust/renew); member chip on guest profiles (REQ-ERP04-004); shell Members screens; module doc + traceability ERP05.
- Files changed: V7 SQL, `erp05/` (8 main files), `PaymentService` (earn hook + confirm lock), `GuestController` (member chip), `LoyaltyLedger` (+ref getters), `Payment` (+linkFolio), `PaymentRepository` (+lock + findByBooking), `MemberApiTest` + `EarnRaceTest`, `web/src/{App.tsx, api.ts}`, docs (erp-05, TRACEABILITY)
- Commands that changed state: `git checkout -b feature/3.5-membership develop`; `mvn -B verify` iterations; `npm run build`
- Verification: `mvn -B verify` → Tests run: 50, Failures: 0, Errors: 0, BUILD SUCCESS; `npm run build` green; live boot → V1→V7 clean, `/health` UP, anon member read → 401. NOT verified: browser click-through; finance sign-off on points-expiry-with-status (flagged for UAT); RFID card link (4.2).
- Problems & fixes: (1) concurrent captures double-posted folio entries + earn rows → payment-row lock (serializes callbacks) + violation-as-replay (defense in depth) — the race test earned its keep; (2) my test math assumed weekday rates on calendar-picked dates → parse responses dynamically; (3) expiring-member test depended on other tests' data → self-enrolling.
- User interaction: 3.5 PLAN approved; commit requested at presentation.
- Next: commit 3.5 → merge to develop (separate approval) → 3.6 Website CMS (PLAN first) — or 3.7 admin/reporting; website integration pending Q-008.
- Commit `0ad2a26` (user-approved): 3.5 on `feature/3.5-membership` (22 files, +1275/−15). Tree clean.
- Merge 3.5 → develop (user-approved 2026-10-10, `--no-ff`). Post-merge `mvn verify` on `develop` → 50/0/0 BUILD SUCCESS. Unit 3.5 complete. No tags/pushes.

## 2026-10-10T02:00:00+05:30 — UI friendly workspace (sidebar, dashboard, preview mode)
- Phase/unit: 3.x – UI polish (user asked before moving on)        Branch: feature/ui-friendly-erp
- What: resort-themed workspace (`index.css` brand theme + responsive sidebar); shared `ui.tsx` (Card/Stat/Badge/Alert/Field/Btn); 7 views (Dashboard with stat cards + room table, booking, front-office, guests, members, billing, housekeeping); Live/Preview toggle + `demo.ts` labeled sample data (local only, server untouched); login-hint panel (SSO wiring pending); fixed frontend GuestDto (memberId was missing); `vite preview` serves 200.
- Verification: `npm run build` green (tsc + vite); `npm run lint` warnings only (data-load effects, fast-refresh note — non-blocking); preview serves the branded shell. Backend untouched (50/50 suite stands). NOT verified: real-browser click-through (no browser here — user reviews); Keycloak login (realm pending).
- User rule 2026-10-10: NO customer/guest seed data anywhere. Applied on this branch: `V8__remove_demo_guests.sql` deletes the 3 V3 demo guests (forward-only — V3 untouched); all GuestApiTest cases rewritten to create their own data; preview sample guests removed from `web/src/demo.ts` (empty state shown). Verified: `mvn verify` 50/0/0 + `npm run build` green after removal. Kept (not customer data): room catalogue (30 rooms), rate/promo/tier/config reference rows, demo staff users, one preview-only member card clearly labeled as sample.
- Commit `79c9a9b` (user-approved): UI workspace + seed removal (10 files, +652/−430). Local Postgres installed globally (system service) + `resort_erp` migrated V1→V8 for the user's pgAdmin review (25 tables, 30 rooms, 0 guests).
- Merge `15cf66e` (user-approved 2026-10-10): `feature/ui-friendly-erp` → `develop` (`--no-ff`). Post-merge: backend 50/0/0 + web build green. No tags/pushes.

## 2026-10-10T11:00:00+05:30 — Staff login via Keycloak SSO (self-hosted, live-proven)
- Phase/unit: 3.x – auth (user chose self-hosted Keycloak, plan-approved)        Branch: feature/auth-keycloak-sso
- What: realm-as-code (`infra/keycloak/realm-golden-hills.json`: realm `resort`, 7 roles, PKCE public client `erp-web`, 6 DEV-ONLY demo users); compose Keycloak on host 8081 (8080 is erp-app's) with auto-import; frontend `auth.ts` (init/login/logout/token/roles) + `apiFetch` token attach (all 17 calls rewired) + sidebar login state + login-hint refresh; backend needed NO code change (issuer already env-driven); CI realm-contract job; runbook `05-operations/keycloak.md`; DAY-ONE §5c; security.md as-built; TRACEABILITY REQ-ERP08-002.
- Verification: realm JSON valid; `npm run build` green; `mvn verify` 50/0/0; LIVE against real Keycloak tokens — reception `GET /room-categories` 200, reception `PATCH /config` 403, anon 401, forged 401, SUPERADMIN patch 200. Browser click-through left to user (checklist in runbook).
- Problems & fixes: (1) compose keycloak port clashed with erp-app 8080 → host 8081; (2) direct-grant "Account is not fully set up" → Keycloak 24 user profile requires email — added `@goldenhills.local` via Admin API + realm file (lesson logged in runbook); (3) `sg docker` needed (shell predates docker-group membership); (4) stale erp-app squatting on 8080 from an old timed-out shell → pkill + verify before live runs (lesson: always ps-check port 8080 first).
- Backend deps: +keycloak-js@24.0.1 (plan-named, pinned).
- Commit `fc51e1a` (user-approved 2026-10-10): auth on `feature/auth-keycloak-sso` (17 files, +485/−45). NOT merged (explicit user instruction — awaiting click-through + separate approval).

## 2026-10-10T17:45:00+05:30 — Review fixes: friendly duplicate + visible booking ids
- What (on `feature/auth-keycloak-sso`, uncommitted): `common/ApiException` (stable code + details map)
  + handler branch; guest duplicate → `GUEST_EXISTS` with human text, id travels in
  `details.existingGuestId`; frontend HttpError carries code/details; Guests screen shows "already
  registered" + Show-existing button; Front office gains a bookings-on-date table (short ref, status,
  Use fills check-in + copies full id); check-in success auto-fills the stay field; GUEST_EXISTS test.
- Verification: `mvn verify` 50/0/0; `npm run build` green. NOT verified: user click-through (pending).
- Next: commit fixes (on approval) → user re-verifies → merge only on approval.
- Commit `c66e8e6` (user-approved): review fixes on `feature/auth-keycloak-sso` (7 files, +223/−16). NOT merged. Still uncommitted: DAY-ONE/runbook login-lesson docs + `run-local.sh` (held from the earlier verify pause — will ride with the next approved commit).

## 2026-10-10T17:30:00+05:30 — Login-lesson fixes: status-aware errors + run-local.sh
- What: `api.ts` HttpError (401 vs 5xx split) + Dashboard/Housekeeping branch LoginHint vs server Alert;
  `ERP_DEV/run-local.sh` (postgres|h2, always sets issuer, fail-fast Keycloak check); DAY-ONE points at it.
- Verification: `npm run build` green; script booted backend → health UP, no issuer warning, real-token
  categories 200. Full suite untouched by these files (web-only + script); backend suite stands at 50/50.
- Next: commit fixes → user re-tests Live booking → merge (only on approval).

## 2026-10-10T17:15:00+05:30 — Lesson: backend without issuer rejects logins (user caught it)
- What happened: user logged in fine (sidebar showed reception-staff) but Live screens showed only the
  login hint — booking impossible. Read-only diagnosis: the running backend (PID 93398) had NO
  `KEYCLOAK_ISSUER_URL` in its environment (verified via /proc environ + a valid-token probe returning
  500 instead of data). Without the issuer, the JWT decoder rejects every authenticated call.
- Why it happened (our fault, two layers): (1) start instructions offered several backend variants and
  the issuer var was easy to drop — nothing forced it; (2) the UI shows "needs sign-in" for ANY fetch
  failure, so a server 500 looked exactly like "not logged in" and sent the user down the wrong path.
- Fixes to prevent recurrence (user-ordered documentation of the mistake itself is this entry):
  1. UI must distinguish 401 (show login hint) from 5xx/network (show "server error — likely missing
     issuer config, see runbook") — planned code fix, not yet implemented.
  2. A single `run-local.sh` that always sets issuer + DB vars (no hand-typed env) — planned, not yet
     implemented. Until then: runbook prerequisite check below is MANDATORY before any login test.
- Standing rule added: before presenting any login-dependent test, verify the backend environment
  (`/proc/<pid>/environ` or startup log) contains KEYCLOAK_ISSUER_URL, and probe one authed endpoint
  with a fresh token. Never assume the running backend matches the docs.
- User interaction: hosting choice (a) + plan approved; commit requested at presentation. EXPLICIT: no merge without separate approval.
- Next: commit auth → user click-through (login as demo staff, all views live) → then merge (on approval) → 3.7 or 3.6.

## 2026-10-09T23:15:00+05:30 — Unit 3.3 Front-office + housekeeping built + verified
- Phase/unit: 3.3 – Front-office + Housekeeping        Branch: feature/3.3-front-office (from develop, plan-approved)
- What: V5 migration (stay/room_transfer/housekeeping_task); StayService (gated check-in + auto-assign, settlement-gated check-out + auto task, transfer with folio stub, walk-in chain); room-level overlap guard + pessimistic lock + race test; HousekeepingService (forward-only advance, done→ready) + role-gated controller; dashboard/arrivals/occupancy; FolioBalance stub (3.4 fills, no API change); shell reception + board + walk-in screens; module docs + traceability ERP03/HSK-001.
- Files changed: V5 SQL, `erp03/` (StayService, StayController, Stay, repos, FolioBalance), `hsk/` (entity, service, controller), `Room`/`Reservation` guards, `BookingService.ZONE` public, `FrontOfficeApiTest` + `StayRaceTest`, `web/src/{App.tsx, api.ts}`, docs (erp-03, housekeeping, data-model, TRACEABILITY, api.md gap note)
- Commands that changed state: `git checkout -b feature/3.3-front-office develop`; `mvn -B verify` iterations; `npm run build`
- Verification: `mvn -B verify` → Tests run: 40, Failures: 0, Errors: 0, BUILD SUCCESS; `npm run build` green; live boot → V1→V5 clean, `/health` UP, anon stay/board → 401. OpenAPI artifact LAGS (14 paths; new endpoints proven via MockMvc 200/409/422, never 404) — recorded in api.md + module docs, revisit 3.4. NOT verified: authed live flows (no Keycloak); browser click-through; real folio balances (stub returns 0 by design).
- Problems & fixes: (1) guard-order bug (double check-in gave 422 not 409) → duplicate-stay check first; (2) shared-H2 cross-test interference → unique dates/rooms per test + containment assertions (lesson: never assert global counts in shared DB); (3) repeated near-miss deleting a DEVLOG header with a careless edit — restored immediately, verified via grep (lesson: anchor log edits on unique full lines, re-verify structure after every log edit).
- User interaction: 3.3 PLAN approved; commit requested at presentation.
- Next: commit 3.3 → merge to develop (separate approval) → 3.4 Payment & billing (PLAN first).
- Commit `399b305` (user-approved): 3.3 on `feature/3.3-front-office` (27 files, +1451/−12). Tree clean.
- Merge `ba51425` (user-approved 2026-10-09): `feature/3.3-front-office` → `develop` (`--no-ff`). Post-merge `mvn verify` on `develop` → 40/0/0 BUILD SUCCESS. Unit 3.3 complete. No tags/pushes.

## 2026-10-10T18:27:16+05:30 — Auth leftovers committed; UI-dashboard PLAN approved
- Phase/unit: auth + UI-dashboard planning        Branch: feature/auth-keycloak-sso
- What: committed `cb512e8` `docs(auth): local run script, keycloak runbook, day-one login notes` (DAY-ONE +6, keycloak.md +11, DEVLOG +1, new `run-local.sh`; user-approved via question tool 2026-10-10). Wrote `docs/03-phases/phase-3/PLAN-ui-reception-dashboard.md` (UI-only, coming-soon cards, SF Pro stack + Google icons, gradient banner until photo lands) — user approved + "start coding".
- Resources: `pexels-vince-32808733.jpg` supplied by user in resource folder (read-only; sha256 `5c7ac65d…41fe0cf78`, resort pool photo for dashboard banner; RESOURCES_LOG update rides with UI commit). No web fetching; Google Fonts icon CDN approved 2026-10-10.
- User interaction: approved "merge auth, then UI" order (commit + merge approved).
- Next: merge auth → develop (`--no-ff`), branch `feature/ui-reception-dashboard`, implement.

## 2026-10-10T18:40:00+05:30 — UI reception dashboard built + verified (web only)
- Phase/unit: 3.x UI-dashboard (PLAN-approved)        Branch: feature/ui-reception-dashboard (from develop @ b12e6bf)
- What: reference-image dashboard — `dashboard.tsx` (Sidebar/Topbar/DashboardView/RoomsView), App shell rewrite (image nav; Members stacked under Guests since the image has no Members entry), `api.ts` enrichment (`reservationById`, `enrichReservations`, per-row "—" degradation), `ui.tsx` (Icon/Soon/Kpi/Donut), SF Pro stack + Material Symbols CDN in `index.html`, banner photo asset, demo rooms extended (no guest names per standing rule), `erp-03` doc as-built + departures-endpoint correction, RESOURCES_LOG + Q-011.
- Files changed: `web/{index.html,src/{App.tsx,dashboard.tsx(new),api.ts,ui.tsx,demo.ts,index.css,assets/banner.jpg}}`, docs (PLAN-ui, erp-03, RESOURCES_LOG, OPEN_QUESTIONS, DEVLOG, STATE)
- Commands that changed state: `git checkout -b feature/ui-reception-dashboard develop`; `npm run build` iterations; `vite preview` (temp :4173, stopped)
- Verification: `npm run build` green (tsc + vite; banner bundled 1.7MB); preview curl `/` 200 + banner asset 200 + Material link + new title in served HTML; backend suite untouched (no backend change — 50/0/0 carried from develop). NOT verified: browser visual click-through (no browser here — user reviews); live-data rows need Keycloak sign-in (running).
- Problems & fixes: (1) `tsc noUnusedLocals` on unused cats state → removed; (2) no guest-name seeds allowed in Preview (standing rule) → preview tables show structure/empty states, never invented names; (3) `GET /departures` assumed by old module doc — does not exist, corrected in doc + coming-soon cards.
- User interaction: PLAN approved + start coding; banner photo supplied; Google icons CDN approved.
- Next: present + ask to commit (merge separate).
- Commit `3a720eb` (user-approved): UI dashboard on `feature/ui-reception-dashboard` (14 files, +855/−149). Tree clean except untracked `.vscode/` (never committed). No merge/push.

## 2026-10-10T19:05:00+05:30 — Unit 3.6 front-office lists built + verified
- Phase/unit: 3.6 (PLAN-approved)        Branch: feature/frontoffice-lists (from develop @ 31c675e)
- What: `GET /departures` (folio-driven Ready/Pending Payment), `GET /in-house`, `GET /alerts` (open tasks + pending payments with ages + overstays); `Payment.getCreatedAt` (no migration); `FrontOfficeListsApiTest` tests-first (6 tests); dashboard Departures/In-house/Alerts cards + Departures KPI + Billing folio-jump wired (`api.ts`, `dashboard.tsx`, `App.tsx`); docs (PLAN-3.6, erp-03, TRACEABILITY REQ-ERP03-001/006).
- Files changed: `erp03/StayController` (+3 endpoints + DTOs), `erp07/Payment` (+getter), `FrontOfficeListsApiTest` (new), `web/src/{api.ts,dashboard.tsx,App.tsx}`, docs + logs
- Commands that changed state: `git checkout -b feature/frontoffice-lists develop`; `mvn -B verify` iterations; `./run-local.sh postgres` restart (PID 145220)
- Verification: new tests RED first (5×404) then 6/6 green; full suite 56/0/0 BUILD SUCCESS; `npm run build` green; live boot → UP, 3 endpoints 401-anon + present in `/v3/api-docs`. NOT verified: authed live rows (Keycloak token — MockMvc covers); browser visual (no browser here).
- Problems & fixes: (1) my first phones (0501/0502) collided with StayRaceTest → switched to free 09xx; (2) my Deluxe check-ins exhausted the global ready pool → BillingApiTest 409 → switched to untouched Suite pool. Lesson recorded in module doc: shared-H2 footprint = unique phones + virgin category pool.
- User interaction: PLAN-3.6 approved; Slice B declined; merge-UI-then-branch order approved.
- Next: present + ask to commit (merge separate).
- Commit `bb5968f` (user-approved): 3.6 on `feature/frontoffice-lists` (11 files, +555/−25). Tree clean except untracked `.vscode/`. No merge/push.
- Merge `5eab9de` (user-approved 2026-10-10, EOD instruction): `feature/frontoffice-lists` → `develop` (`--no-ff`). Post-merge on `develop`: `mvn verify` 56/0/0 BUILD SUCCESS; `npm run build` green. Unit 3.6 complete. No tags/pushes.
- EOD audit: `git ls-files` shows no tracked artefacts/secrets/env (dist/target/node_modules ignored); `banner.jpg` is the only binary, user-supplied + hash-logged. Root `.vscode/` untracked (only `ERP_DEV/.vscode` is gitignored — left alone, never staged).
- Servers left running: backend PID 145797 (`run-local.sh postgres`, 3.6 code), web dev on :5173 (3.6 code) — host may reap idle processes; restart via DAY-ONE §5 / run-local.sh. User's pending item: browser review of live Departures/In-house/Alerts cards (fresh tab, Live + login).

## 2026-10-11T09:35:00+05:30 — Fix: table overflow into neighbouring panels
- Phase/unit: fix (user-reported, screenshot)        Branch: fix/dashboard-table-overflow (from develop @ ca6f4df)
- What: Recent Bookings STATUS badge clipped under the In-House panel — grid children + nowrap tables bled across panels. Fix everywhere, not just the spot: `.panel`/`.card` get `overflow: hidden`, new `.tbl-wrap` scrolls wide tables inside their own card; wrapped all 8 tables (dashboard arrivals/departures/bookings/in-house + front bookings/guests/folio/housekeeping). No backend change.
- Files changed: `web/src/{index.css, dashboard.tsx, App.tsx}`
- Commands that changed state: `git checkout -b fix/dashboard-table-overflow develop`
- Verification: `npm run build` green. NOT verified: browser visual (no browser here — user confirms).
- Next: present + ask to commit (merge separate).
- Commit `ca47186` (user-approved): fix on `fix/dashboard-table-overflow` (5 files). Tree clean except untracked `.vscode/`. No merge/push.

## 2026-10-12T08:55:00+05:30 — Fix: weekend-test calendar bomb
- Phase/unit: fix (post-merge gate red)        Branch: fix/weekend-test-dates (from develop)
- What: `BookingApiTest.bookWeekendPricing` 400 — fixed 2026-10-10 Saturday check-in is now in the past ("checkin cannot be in the past"). Pre-existing bomb, unrelated to the overflow merge. Fix: WEEKDAY/WEEKEND windows roll to next Mon/Sat dynamically.
- Files changed: `services/erp-app/src/test/.../BookingApiTest.java` (test only)
- Verification: full `mvn verify` 56/0/0 BUILD SUCCESS.
- Next: commit + merge (EOD-style fast track, user present).
- Commit `cfb72a5` + merge `e21222c` (user-approved flow): suite green on merged `develop`.
- Merge `42f95e2` (user-approved "do 1 first"): `fix/dashboard-table-overflow` → `develop`; post-merge gate caught a pre-existing calendar bomb (fixed above). Overflow fix complete.

## Key facts learned (for Phase 1)
- SOW: 9 CORE modules ERP-01…ERP-09 + 5 optional add-ons ERP-10…ERP-14 (need client confirmation);
  facilities depth TBD in requirements analysis; tax/posting treatment TBD; RFID 1 terminal + 100 cards;
  9 implementation phases; exclusions list (§30).
- Landing checklist: every item unanswered; catalogue + logo "received" but no copy in the folder.
- Tech-stack proposal (Java 21/Spring Boot, React+TS, Postgres, Kafka, Redis, K8s, Keycloak) is a
  *proposal* — stack is decided by ADR in Phase 2, not assumed now.
- Playbook §4 (trunk-based, no `develop`) conflicts with skill git-flow-lite (`main` + `develop`).
  Per source-of-truth order the SOW wins on scope; on process the skill wins unless the user says
  otherwise → logged as Q-001.
- Playbook cites `QuantumClk_Freelance_Consultancy_Agreement` — not in the folder → Q-002.

## 2026-10-12T18:13:19+05:30 — Session: run the server (user request)
- Phase/unit: Phase 3 Core Development (branch feature/desk-confirm-flow)        Branch: feature/desk-confirm-flow
- What: user asked "run the server". Started full local stack: Keycloak container (infra-keycloak-1, :8081, image quay.io/keycloak/keycloak:24.0), backend via ./run-local.sh postgres (:8080), web via npm run dev (:5173).
- Commands that changed state: sg docker -c "docker compose -f infra/docker-compose.local.yml up -d keycloak"; nohup ./run-local.sh postgres > /tmp/opencode/backend.log 2>&1 &; (web) nohup npm run dev -- --host 127.0.0.1 --port 5173 > /tmp/opencode/web.log 2>&1 &
- Verification: curl Keycloak openid-configuration → 200; curl localhost:8080/api/v1/health → {"status":"UP","service":"erp-app"}; curl 127.0.0.1:5173/ → 200. Backend log: Started ErpApplication, Flyway schema v8 up to date, Tomcat on :8080. System Postgres on 5432 used (compose postgres NOT started, per DAY-ONE note).
- Uncommitted work left untouched: ERP_DEV/web/src/dashboard.tsx, ERP_DEV/web/src/index.css (modified); ERP_DEV/docs/03-phases/phase-3/PLAN-3.7-desk-confirm-flow.md + .vscode/ (untracked). No commit (needs explicit approval per Rule 7).
- Next: user verifies in browser (fresh tab, Live + login); then next unit TBD.

## 2026-10-12T18:13:19+05:30 — Fix diagnosis: "Invalid parameter: redirect_uri" on staff login
- What: user hit Keycloak "Invalid parameter: redirect_uri" at login. Cause: realm client `erp-web` allows only `http://localhost:5173/*` (infra/keycloak/realm-golden-hills.json lines 50-55), but the previous turn started vite with `--host 127.0.0.1` and pointed the user at `http://127.0.0.1:5173/` — that origin's redirect_uri is rejected by Keycloak.
- Verification: curl both http://localhost:5173/ and http://127.0.0.1:5173/ → 200 (same vite server); realm JSON confirms only localhost:5173 in redirectUris/webOrigins. No code change made.
- Resolution given: open http://localhost:5173/ instead. Offered durable fix (add 127.0.0.1 URIs to realm JSON + live client) pending user approval.

## 2026-10-17T15:04:35+05:30 — Unit 3.7 desk confirm flow built + live-proven
- Phase/unit: 3.7 (PLAN-3.7 approved 2026-10-17 via question tool: "Approve — implement now")        Branch: feature/desk-confirm-flow (from develop @ ad0dc72; no commits yet)
- What: Recent Bookings rows now act — `hold` rows: "Collect advance ₹X" (sandbox initiate+confirm with stable idempotency key `advance-{reservationId}` → double-click/reload replays, never double-charges) → "✓ Advance captured" + Confirm → Confirm (backend advance gate; 422 text shown verbatim). `expired` rows: terminal muted "expired — rebook" link to Reservations (no rebook automation). `api.ts`: `confirmReservation()`, `initiatePayment` gains `idempotencyKey`, `confirmPayment` returns captured payment, `EnrichedReservation.advanceDuePaise`. Table fit (guest-name ellipsis + highlighted headers, carried over from the paused fix/highlight-table-headers changes) rides in the same commit. The plan's cell-padding tweak was consciously SKIPPED to honour the user's same-day "do not change the UI" brief.
- Files touched (uncommitted): `web/src/{api.ts,dashboard.tsx}` + `web/src/index.css` (table fit); `docs/04-modules/erp-02-booking-reservation.md` (3.7 change-history entry).
- Commands that changed state: `npm run build` (green); live Postgres smoke `/tmp/opencode/smoke-37.sh` against the running stack (backend :8080, Keycloak :8081).
- Verification: `npm run build` green; backend untouched (suite stands 56/0/0 from develop). LIVE smoke: hold `ad0378b8-81c3-4ed5-a5a4-22171f6b248e` (2 nights Deluxe, advance ₹1,500 = 150000 paise) → initiate key `advance-ad0378b8…` → replay `{replayed:true, sameRef:true}` → payment captured → reservation `confirmed`; negative: confirm before advance → 422 "advance not collected: due 150000, captured 0" (the exact string the UI surfaces); cancel path OK. Smoke rows deleted after; DB back to baseline (1 guest, 2 expired reservations = user's; audit rows remain by design — append-only).
- NOT verified: user browser click-through of the new buttons — pending.
- Next: present + ask to commit (merge separate).
- Commit `c44f2e5` (user-approved 2026-10-17): 3.7 on `feature/desk-confirm-flow` (7 files, +192/−18; includes PLAN-3.7). Tree clean except untracked `.vscode/` + PLAN-3.8. No push.
- Log record `cc6a166` (2026-10-17): DEVLOG + STATE updates for the 3.7 commit, committed on the feature branch (checkout to develop was blocked by uncommitted log edits).
- Merge `b2a70e8` (user-approved 2026-10-17): `feature/desk-confirm-flow` → `develop` (`--no-ff`). Post-merge on develop: `mvn -B verify` 56/0/0 BUILD SUCCESS; `npm run build` green. Unit 3.7 complete. No tags/pushes.
- Stale branch: user chose "Drop" for `fix/hide-table-scrollbar` (8ab2e26+77e9a0b — scrollbar-hide CSS superseded by 3.7 table fit). Branch left in place; deletion still needs explicit approval (will ask again).

## 2026-10-17T15:04:35+05:30 — User dashboard-improvement brief → read-only audit + PLAN-3.8
- Phase/unit: 3.8 planning (no source code)        Branch: feature/desk-confirm-flow (planning only)
- What: user delivered an A–L dashboard improvement brief with a hard "do not change the existing UI design" rule (stat cards, arrivals, departures, room-status donut, alerts, recent bookings, in-house, top search, bell, Manage Rooms, sidebar, date/time + session identity). Read-only audit (explore subagent, file:line evidence): most panels already live on real data; real gaps = UTC business-date bug (frontend `toISOString` vs backend Asia/Kolkata), arrivals = confirmed-overlap window (not checkin=today), ≤50 enrichment calls per dashboard load (N+1), 8-char short-ref search silently fails, no debounce/stale guard, blank-until-loaded, redundant per-row refetch in Recent Bookings. Backend-less features (Reserved room status, notifications, service requests/maintenance) stay documented as limitations, not faked.
- Wrote `docs/03-phases/phase-3/PLAN-3.8-dashboard-completeness.md` (7 thin slices: business-date helper, arrivals semantics + tests, load/401 UX hardening, search debounce+prefix, enrichment batching, View-all prefill, docs/limitations). Awaiting user approval; implementation branch `feature/dashboard-completeness` from develop after 3.7 merges.
- Next: present 3.7 for commit + PLAN-3.8 for approval (same presentation).
- User approved PLAN-3.8 at the same presentation (2026-10-17, question tool: "Approve — start after 3.7"). Implementation starts once 3.7 lands on develop.

## 2026-10-17T15:17:11+05:30 — Unit 3.8 dashboard completeness — slices 1–3 done (in progress)
- Phase/unit: 3.8 (PLAN approved 2026-10-17)        Branch: feature/dashboard-completeness (from develop @ b2a70e8)
- Slice 1: `businessToday()` in api.ts (en-CA format, Asia/Kolkata — the zone the backend gates on); replaces all 4 `toISOString().slice(0,10)` business dates (dashboard.tsx ×3, App.tsx ×1). Edge check: 2026-10-16T20:00Z → 2026-10-17 (IST).
- Slice 2: arrivals semantics — new `ReservationRepository.arrivingOn` (confirmed AND checkin_date = date); used by `/front-office/dashboard` arrivals + `/arrivals`; overlap query retained for GET /reservations (bookings-on-date). Tests-first: `FrontOfficeApiTest.arrivalsExcludeOverlappingNotArrivingToday` RED (old code listed the mid-stay booking as an arrival — assertion log kept) → GREEN, FrontOfficeApiTest 9/9.
- Slice 3: dashboard load/401 UX — explicit `loading` state + "Loading dashboard…" panel (no blank screen); 401 via `isAuthError()` (message-regex removed); failure path shows the real error panel, never zero metrics.
- Verification: `npm run build` green (slices 1+3); single-class backend test green (slice 2). Full suite on the branch runs at slice 7 before presentation.
- Incident: first RED run hit an external-drive I/O error while compiling tests (target/ partially wiped, sources intact); re-ran after `sync` — success, no data loss. Drive reliability worth watching.
- Next: slices 4 (search debounce + short-ref prefix + tests), 5 (server-side arrivals enrichment), 6 (View-all prefill), 7 (docs + full `mvn -B verify` + web build + present).

## 2026-10-18T20:33:53+05:30 — Discovery: 3.8 slices 4–6 arrived from a later session; verified + records synced
- Context: session resumed 2026-10-18. Working tree (branch `feature/dashboard-completeness`) contains uncommitted work made 2026-10-18 20:16–20:26 by a later session: PLAN-3.8 slices 4–6 — short-ref search (`GET /reservations/search?ref=`, sanitized prefix, portable `LOWER(CAST(id AS String)) LIKE`, junk → empty page), arrivals batch enrichment (`ArrivalDto` in the dashboard DTO, one guest query; per-row `enrichReservations` tail removed), search debounce (300 ms + seq stale guard + Enter-immediate + honest sign-out message), View-all prefill (`Jump.bookingStatus` → check desk filtered today list), recent-bookings reuse of list DTOs; erp-02/erp-03 docs + TRACEABILITY updated. That session did NOT update DEVLOG/STATE and did NOT commit; it restarted the backend (PID 17815, 20:24) with the new code.
- Verification (this session): `mvn -B verify` → 58/0/0 BUILD SUCCESS; `npm run build` green (540 ms); live auth smoke — `GET /api/v1/reservations/search?ref=a611c4bc` → total 1 (the correct booking), `ref=!!` → total 0; `/front-office/dashboard` arrivals now enriched objects (empty today — consistent with the guestless baseline); `/v3/api-docs` lists `reservations/search`. Docs' "58/0/0 + live smoke" claims confirmed. No source edits made by me in this pass.
- Records: DEVLOG + STATE synced to reality in this entry. PLAN-3.8 still untracked. Nothing committed.
- Record hygiene found during the doc scan (to correct with new lines, not edits): CHANGELOG still reads "Phase 0 bootstrap in progress" (never advanced past bootstrap); RISKS statuses stale (R-002/R-003 answered, R-009 gate honored — all still "open"); erp-03 header still says departures/alerts endpoints missing (superseded by its own 3.6 update line).
- Next: present 3.8 for commit (all 14 files + PLAN-3.8), then hygiene corrections, then next unit on approval.

## 2026-10-18T21:17:43+05:30 — Brief item I closed: honest bell tooltip; stack restarted; still awaiting commit approval
- Phase/unit: 3.8 slice 7 tail        Branch: feature/dashboard-completeness @ b2a70e8 (uncommitted)
- What: bell tooltip claimed "no alerts API yet" — false since 3.6 (`/alerts` is live and rendered in the Alerts card). Fixed to the honest text: "no notification system yet; live alerts are on the dashboard" (brief item I: document, never fabricate). `dashboard.tsx` tooltip only.
- Verification: `npm run build` green; dev server serves the new string. Full-stack restarted (this host kills background processes between turns): Postgres :5432, Keycloak :8081, backend :8080 PID 20321 (3.8 code), web :5173 PID 20612 — all verified UP.
- Records: DEVLOG + STATE updated (this entry).
- Next: present 3.8 for commit (15 files + PLAN-3.8), then hygiene corrections on approval, then next unit.

## 2026-10-20T12:16:00+05:30 - Module 2 Restaurant ERP plan produced for approval (no code)
- Phase/unit: Module 2 planning (pre-work; Phase 3 3.8 remains uncommitted)        Branch: feature/dashboard-completeness
- What: user confirmed the hierarchy - Module 1 = resort ERP, Module 2 = Restaurant ERP, R-01 to R-08 = its submodules - and confirmed billzova-web is owned/internal with permission. Wrote `docs/03-phases/phase-4/MODULE-2-RESTAURANT-ERP-PLAN.md` (reuse assessment, scope, architecture, submodule plan, integration, roadmap, tests, risks, governance, approval) and generated the 30-page PDF via make-pdf. Recorded CR-001 (proposed), Q-012 (client confirmation), R-010 to R-012, README link and STATE.
- Why: user asked "what should we build next" and then requested the best plan in a beautiful PDF for approval before any build. Module 2 implements SOW ERP-11 as a separately flaggable add-on; it does not rename CORE ERP-02 Booking or displace any CORE module.
- Resources used: `D:\dev\billzova-web` (user-authorised internal technical reference, read-only; no LICENSE file found, so asset-level provenance checks remain required); `docs/01-requirements/source-extracts/sow-extract.md` (ERP-11 scope authority). Nothing from the resource folder was modified.
- Files changed: `docs/03-phases/phase-4/MODULE-2-RESTAURANT-ERP-PLAN.md` (new), `.pdf` (new), `docs/01-requirements/CHANGE_REQUESTS.md`, `docs/logs/OPEN_QUESTIONS.md`, `docs/logs/RISKS.md`, `docs/logs/DEVLOG.md`, `docs/logs/STATE.md`, `docs/README.md`. No application code, schema, config, dependency or commit.
- Commands that changed state: make-pdf generate (three passes; additions, re-pagination and the arithmetic fix). Verification only: pypdf page/text checks, PyMuPDF page renders, browse screenshots of the intermediate HTML.
- Verification: PDF 30 pages - 4,514 words - 742 KB - title metadata correct - 1 mermaid state diagram rendered - visual spot-checks of cover, TOC, hierarchy, state machine, roadmap and approval pages. Existing 3.8 work untouched; `git status` still shows the 3.8 changes plus the new phase-4 docs.
- Problems & fixes: first PDF ended with a near-empty page 30 (approval note only); added an "On approval" action list and document history, regenerated; final page is substantive. Arithmetic checks caught an MVP total that did not match the work-package table (24-34; corrected to 28-40 after including the minimum R-08 settings); corrected the plan, CR-001, Q-012 and STATE and regenerated the PDF. Intermediate HTML is generated by the tool and was removed after verification so only the source `.md` and `.pdf` are delivered.
- User interaction: presented the plan/PDF for approval; asked for approval of the plan + CR-001 + Q-012. No commit requested or made.
- Next: on approval - record CR-001/Q-012, schedule Gate 1 design package, keep Module 2 behind `module.restaurant.enabled=false`; on 3.8 approval - commit the existing 3.8 work separately. Module 2 build remains gated after Phase 3 exit.
## 2026-10-20T13:45:07+05:30 — Cross-platform launcher `run-local.mjs` (Windows + Fedora)
- Phase/unit: developer tooling (no backend/web behaviour change)        Branch: feature/cross-platform-run (from develop @ b2a70e8)
- What: user asked for one run method that works on both Windows and Fedora without deleting the existing Fedora helpers. Added `ERP_DEV/run-local.mjs` (Node 22, stdlib only): `node run-local.mjs [postgres|h2] [--web] [--print]`.
  - Sets DB + Keycloak issuer vars every run (lesson 2026-10-10 preserved), Postgres defaults identical to `run-local.sh`; `h2` = in-memory test mode.
  - OS handling: Java via JAVA_HOME/PATH, Fedora fallback `~/.local/java/*/bin/java`; Maven via MAVEN_HOME/PATH, Fedora fallback `~/.local/maven/bin/mvn`, `mvn.cmd` on Windows; classpath cached in `os.tmpdir()/erp-local/cp.txt`; classpath separator from `path.delimiter` (`;`/`:`); Keycloak preflight warns with a per-OS start command (`docker compose` vs `sg docker`).
- Verification (Fedora): `--print` resolves JDK-21 + Maven correctly for postgres/h2/--web; live parity run `node run-local.mjs postgres --web` (old PIDs 5736/5902 killed first) → backend :8080 PID 6540 started in 8.8 s, web :5173 PID 6570, health UP, Vite proxy 200. Windows path written to spec but not executed here (no Windows host) — flagged honestly.
- Docs: DAY-ONE §5 now leads with the Node command (prereqs, flags, per-OS Docker line) and keeps `./run-local.sh` as the Fedora convenience; keycloak.md notes the Windows command without `sg docker`. `run-local.sh` unchanged.
- Commit sequence: 3.8 committed first as `90ab9a6` on `feature/dashboard-completeness` (15 files, per user approval "both, in order"); this launcher commit is separate. Module 2 records (CR-001/Q-012/R-010…R-012/plan PDF) remain uncommitted pending user approval.
- Next: present launcher commit; then pending user actions — 3.8 click-through, 3.8 merge, Module 2 plan approval/records, delete stale `fix/hide-table-scrollbar`.

## 2026-10-20T13:50:54+05:30 — Unit 3.8 merged to develop; Module 2 records committed; suite green on merged result
- Merge `f121009` (user-approved 2026-10-20): `feature/dashboard-completeness` → `develop` (`--no-ff`), bringing 3.8 (`90ab9a6`, 15 files) + Module 2 records (`915716f`, 5 docs).
- Module 2 PDF: stays untracked per repo policy (`*.pdf` in ERP_DEV/.gitignore; no PDFs are tracked). The plan source `.md` is committed; regenerate the PDF locally via the make-pdf flow when needed.
- Post-merge verification on develop: `mvn -B verify` BUILD SUCCESS — 58 tests, 0 failures, 0 errors (27.3 s); `npm run build` green (278 ms, 302 kB JS / 90.9 kB gzip).
- Records synced: this branch now carries develop (merge commit on `feature/cross-platform-run`), DEVLOG merged chronologically, STATE rewritten. Feature branches left in place (`feature/dashboard-completeness`, `feature/cross-platform-run`); `fix/hide-table-scrollbar` deletion still pending explicit approval.
- Next: ask approval to merge `feature/cross-platform-run` (launcher) → develop; 3.8 browser click-through still owed; Module 2 build stays gated after Phase 3 exit.

## 2026-10-20T13:53:37+05:30 — Launcher merged to develop; develop tip verified (58/0/0)
- Merge `bdd7252` (user-approved 2026-10-20): `feature/cross-platform-run` → `develop` (`--no-ff`) — launcher `run-local.mjs`, DAY-ONE §5, keycloak.md Windows line; the branch already carried the develop sync (`b552828`), so 3.8 + Module 2 records were reconciled before the merge.
- Verification on the merged develop tip: `mvn -B verify` BUILD SUCCESS — 58 tests, 0 failures, 0 errors; `npm run build` green (322 ms).
- These log records ride a follow-up docs commit on this branch (second, trivial merge) to keep develop's DEVLOG/STATE truthful without a direct-to-develop commit.
- Remaining user actions: 3.8 browser click-through; Module 2 plan approval (CR-001/Q-012); delete `fix/hide-table-scrollbar`; pick the next unit.

## 2026-10-20T18:19:14+05:30 — Unit 3.9 observability/ops console: audit + plan (no code)
- Phase/unit: 3.9 planning (internal developer tooling; no SOW feature)        Branch: develop (planning only; no branch created)
- What: user requested the Billzova production observability and secure remote operations platform, adapted to this repository under the ERP rules, with a plan and approval before implementation. Read-only audit confirmed: single Spring Boot 3.2.5 modular monolith (`services/erp-app`), Keycloak SSO + deny-by-default JWT roles, append-only `audit_event` with no read API, generic `app_config`, two `@Scheduled` jobs with no run history, plain-text logs with no request/trace IDs, no Actuator/Micrometer/OTel, React 19 SPA with no Sentry/router, Compose only for Postgres/Redis/Kafka/Keycloak, no observability stack, no Dockerfile/K8s, and no CI/CD deployment pipeline. Billzova exists only as the separate `billzova-web` frontend reference (Q-013); playbook §9 names Jaeger/ELK while the instruction names Tempo/Loki (Q-014).
- Plan: `docs/03-phases/phase-3/PLAN-3.9-observability-ops-console.md` — full module A–L gap analysis, adapted architecture, roles/permissions, audit model, migrations V9+, API phases, frontend ops shell, telemetry pipeline, dependencies, risks, and phase acceptance. Approval covers Phase 1 only (foundation, access security, read-only status/flags/audit skeleton).
- Files changed: plan (new), `docs/logs/OPEN_QUESTIONS.md` (Q-013/Q-014 appended), this DEVLOG entry, STATE. No application code, dependency, schema, branch or commit.
- Next: present audit + plan; wait for explicit approval (target repo, observability stack, dependencies, Phase 1).

## 2026-10-20T18:24:00+05:30 — Unit 3.9 Phase 1 approved; implementation started
- Phase/unit: 3.9 observability/ops console — Phase 1 foundation        Branch: feature/3.9-observability-ops-console (from develop @ `bdd7252`)
- Approval: user approved the Phase 1 plan and answered Q-013/Q-014 via the approval prompt — target = this ERP repository; baseline = OpenTelemetry + Prometheus + Grafana + Tempo + Loki; ops roles/permissions + listed dependencies approved; **Phase 1 only** (later phases need separate gates).
- Scope: V9 ops permissions/flags; DB-backed permission resolver; read-only ops status/integrations/flags/audit API + bounded audit; request-ID filter and JSON/redacted logs; Actuator + Micrometer/OTel config; ops UI shell (Overview/Flags/Audit); tests; run/ops docs.
- Guardrails: no production credentials/K8s/deployment pipeline exist, so those remain documented gaps; no version upgrades; no commit until user approval.
- Next: backend foundation (pom, V9, security), tests, then UI/docs, full verify.

## 2026-10-20T18:53:49+05:30 — Unit 3.9 Phase 1 implemented and verified (uncommitted)
- Phase/unit: 3.9 observability/ops console — Phase 1        Branch: feature/3.9-observability-ops-console (base develop @ `a09d7c5` = bdd7252 + records commits); no commit on the branch yet.
- Backend: added Actuator/Prometheus/Micrometer-OTel/OTLP + `logstash-logback-encoder` deps; `V9__ops_permissions_and_flags.sql` (5 `OPS_*` roles, read permissions, three module flags off); DB-backed `@opsAuth` resolver; read-only `/api/v1/ops/{status,integrations,flags,audit}` with bounded/redacted audit reads and 60s dedupe; request-ID filter; JSON console/file logging with redaction; loopback management port `9091` exposing only `health,info`. Request IDs are validated `[A-Za-z0-9._:-]{8,64}`, echoed in headers and error bodies.
- Management fix: health on `:9091` initially returned 401 because the API security chain covered actuator. Added `ManagementSecurityConfig` (`@Order(HIGHEST_PRECEDENCE)`, `EndpointRequest.toAnyEndpoint()`, permitAll, only when management port differs); `ManagementHealthTest` locks it in. Main `:8080/actuator/health` remains 401 and `/api/v1/ops/status` remains 401 anonymously.
- Frontend: typed ops client (`X-Request-Id`, `HttpError.requestId`), OpsView with Overview (incl. integration health)/Flags/Audit and honest Phase 2/4 tabs, sidebar gating for `OPS_*`/`SUPERADMIN`, optional Sentry init (11.x `dataCollection`, no DSN = no-op), Vitest/RTL setup.
- Keycloak: added `OPS_VIEWER`, `OPS_DEVELOPER`, `OPS_OPERATOR`, `OPS_ADMIN`, `OPS_APPROVER` to realm JSON (12 roles total); existing realms need clean-slate recreate/manual roles. No demo ops user.
- Verification: `mvn -B -f services/erp-app/pom.xml verify` → BUILD SUCCESS, **71 tests, 0 failures/errors**; `npm --prefix web test` → 4/4; `npm --prefix web run lint` → exit 0 (pre-existing warnings only); `npm --prefix web run build` → green, 313.26 kB JS / 93.96 kB gzip. Runtime smoke on local Postgres: V9 applied, management health `UP`, main health/ops 401 anonymously, JSON log written, zero span-export errors with tracing off. Logs ignored via `/logs/` and `/services/erp-app/logs/`.
- Fix during verification: Vitest 5 + jsdom 30 needed Node ≥22.22.2 (host 22.12.0) and failed in undici/zstd; pinned `jsdom@^27.4.0` (Node ^22.12) — no app-code change.
- Docs: `02-architecture/observability.md`, `04-modules/ops-console.md`, `05-operations/ops-console.md`; updated `docs/README.md`, `02-architecture/security.md`, `02-architecture/api.md`, `05-operations/keycloak.md`, `00-onboarding/DAY-ONE.md`.
- Honest gaps: no Prometheus/Loki/Tempo/Grafana stack, production URLs/credentials, Sentry DSN, Dockerfile/K8s/CI-CD pipeline, audit retention job; no browser/Windows click-through. Later phases remain gated.
- Next: present Phase 1 for commit approval; do not commit/merge until user approves.

## 2026-10-20T19:09:38+05:30 — Phase 1 live test run (user demo, before commit)
- User asked for a live test before commit. Started Keycloak (existing `infra-keycloak-1` container/realm), then `node run-local.mjs postgres --web`: backend :8080, management :9091, Vite web :5173.
- Live checks with a real Keycloak token (`admin-staff`, SUPERADMIN): `/api/v1/ops/status` 200 (`state=OK`, DB UP, telemetry `NOT_CONFIGURED`), `/ops/flags` 200, `/ops/audit` 200 and audit rows written; anonymous 401; `reception-staff` 403; management health 200 `{"status":"UP"}`; Vite `/api` proxy 200. Existing realm has no `OPS_*` roles (not re-imported), so demo uses `admin-staff`/SUPERADMIN.
- Fix found during demo: ops audit `actor` showed the Keycloak UUID because `Authentication.getName()` returns `sub`. `OpsAuditService` now prefers `preferred_username` for JWT principals, falling back to `sub` then `getName()`; recompiled and restarted. New audit rows show `admin-staff`; older rows keep the UUID (append-only, not rewritten).
- Servers left running for the user at `http://localhost:5173` (login `admin-staff` / `change-me-dev-only`). No commit.
- Next: user live review; then commit approval. Stop servers on request.

## 2026-10-20T19:30:10+05:30 — User accepted live demo; standing ops-integration rule documented; Phase 1 commit approved
- User live review: "ok good … we will develop this along the project and so when you implement anything remember to connect it to this and make a document of this … and commit it."
- Documented a standing rule: every future module/endpoint/job/integration/UI feature must connect to the observability/ops baseline in the same work unit (logs + request ID, audit, health/status, flags, permissions, tests, docs; honest `NOT_CONFIGURED` only). Checklist: `02-architecture/observability.md` → "Standing rule — connect every new feature to the ops baseline"; cross-linked from `04-modules/ops-console.md`, `docs/README.md`; recorded as D-009.
- Commit approval: user explicitly approved committing the Phase 1 work and this document update. Pre-commit verification: backend `71/71` tests, BUILD SUCCESS; `git diff --check` clean.
- Next: commit (feature + docs), record the hash, leave servers running for continued review; no push/merge.

## 2026-10-20T19:31:49+05:30 — Phase 1 committed as `45c8e88`
- Commit `45c8e88` on `feature/3.9-observability-ops-console`: `feat(ops): add Phase 1 observability and secure ops console` — 57 files, 4,093 insertions / 35 deletions (code, tests, V9, Keycloak roles, env templates, docs, standing rule).
- Pre-commit verification: backend 71/71 tests, BUILD SUCCESS; frontend 4/4, lint/build green (recorded above); live demo with real Keycloak token: status/flags/audit 200, anon 401, reception 403, management health UP.
- No push/merge. Servers remain running for the user (`:8080`, `:9091`, `:5173`, Keycloak `:8081`). Root `.vscode/` remains untracked and out of scope.
- Next: keep the standing integration rule in every future work unit; await the next unit/Phase 2 planning decision. This record will be committed as a docs follow-up.

## 2026-10-21T14:47:16+05:30 — Unit 3.10 reception demo fixture + live E2E run
- User asked to test with data input, verify storage/dashboard processing for reception, prepare a testing plan and add demo data. Plan drafted at `03-phases/phase-3/PLAN-3.10-reception-e2e-demo-data.md` and approved; user chose to preserve existing `ashish`, two expired reservations and `DEL-101`.
- Backed up local Postgres to `/tmp/opencode/resort_erp_pre_reception_demo_20261021.dump`. Added local-only `scripts/dev/reception-demo.sh` + load/reset/verify SQL (fixed UUIDs; `ALLOW_DEMO_SEED=1`; loopback DB guard; no Flyway/auto-seed). Decision D-010 records the narrow exception to the 2026-10-10 no-guest-seed rule.
- Reproducibility fix before commit: `.gitignore` now allows `scripts/dev/*.sql` (all other SQL stays ignored), so the approved fixture SQL is committed with its wrapper; no secrets or non-fixture data are involved.
- Loaded fixture: 6 `Demo` guests, 6 reservations (3 in-house, 1 arrival, 1 hold, 1 future confirmed), 3 stays/folios, 4 captured payments, 3 dirty rooms/open tasks. Baseline API: 1 arrival, 2 departures (Ready + Pending Payment), 3 in-house, 3 alerts.
- Executed live API E2E with real Keycloak tokens: **17/17 PASS** — search/create duplicate guard, booking idempotency replay, confirm-without-advance 422, sandbox capture, check-in with folio linkage, transfer SUI-201→SUI-202, checkout guard/pay/checkout, settled checkout, walk-in, ref search, hsk board/admin transitions, reception 403s, alerts, ops audit. Evidence: `03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md`.
- Storage proof: `reservation`/`reservation_hold`/`stay`/`room`/`folio`/`folio_entry`/`payment`/`housekeeping_task`/`audit_event` all reflected each action; post-run 10 guests/10 res/5 stays/5 folios/11 entries/8 payments/7 tasks/67 audit. Test rows removed, fixture reset+reloaded; final 7 guests/8 res/3 stays/3 folios/4 payments/3 tasks.
- Findings: P1 business audit actor still Keycloak UUID (3.9 fixed ops reads only); P2 refund card visible to reception but 403, guest stay history empty, no hsk transition UI; P3 hard-coded walk-in UI, `DEL-101` occupied without stay. No source code changed. Commit approval pending.

## 2026-10-21T16:20:00+05:30 — Reception dashboard column rebalance + Recent Bookings width correction (uncommitted)
- Phase/unit: reception dashboard UI correction (no backend/SOW change)        Branch: feature/3.9-observability-ops-console
- What: the dashboard had a large empty band below the two columns and Recent Bookings sat above the right rail content. Regrouped into left = Today's Arrivals → Today's Departures → Recent Bookings → In-House Guests; right = Room Status → Alerts → Manage Rooms promo. Removed the now-unused `.dash-grid--bottom`; responsive `display:contents` ordering keeps the same sequence at `≤1350px`.
- Fix found during final inspection: the `checked-in` status badge wrapped at the hyphen because its 78px content did not fit a 77.6px cell. Recent columns changed from `18/13/14.5/14.5/13/27%` to `17.5/13/14.25/14.25/14/27%`. At 1366: 99px status cell, 83px badge, height 20px, one client rect; rows 59–60px.
- Verification: 1366 dashboard page height 1345px (was 1598px), table 710px, no horizontal overflow; 1440/1024/390 no page/table horizontal overflow (earlier pass). Frontend 4/4, lint pre-existing warnings only, build green before 3.11. Files: `web/src/dashboard.tsx`, `web/src/index.css`; no API call or model changed. User reviewed the result and moved on to the Guests redesign; no commit approved.
- Next: include this correction in the pending commit review; do not commit separately without approval.

## 2026-10-21T16:38:00+05:30 — Unit 3.11 Guests reception workspace implemented and verified (uncommitted)
- Phase/unit: 3.11 Guests redesigned reception workspace (ERP-04 + membership actions from ERP-05)        Branch: feature/3.9-observability-ops-console
- Approval/plan: user supplied the redesign brief and approved “Approve — implement now”; plan at `03-phases/phase-3/PLAN-3.11-guests-reception-workspace.md`. Scope kept UI-only: no backend, schema, auth, API contract, dependency or router changes.
- What: new `web/src/guests.tsx` — search-first master/detail screen (300ms debounce, Enter, clear, 20-row pages, stale-response guard); selectable rows with name/phone/status/member chip; profile with real identity/preferences and membership; enrolment via `selected.id`; retained redemption behind a disclosure; role messaging; Add New Guest modal with validation, duplicate `GUEST_EXISTS` recovery, created-guest auto-open; global-search single-match auto-open; honest preview/no-auth/empty/error states. `App.tsx` removed the old three-card Guests view and `MembersView`; `api.ts` passes `page/size` to `searchGuests`; Guests CSS appended to `index.css`.
- Data limits kept honest: guest DTO has no email/address; `GET /guests/{id}/stays` still returns an empty hook; reservations have no guest filter. No history or invented figures were added.
- Verification: `npm test -- --run` → **12/12** (8 Guests tests incl. create/global jump, 4 existing); `npm run lint` → exit 0 with pre-existing warnings only; `npm run build` → 308 modules, green (325.38kB JS / 23.26kB CSS); `git diff --check` clean.
- Live (real Keycloak/Postgres): initial 7 guest rows; selected `Demo Diya Shah`; duplicate phone `+91-9000000102` showed the existing-guest recovery and opened the profile; enrolment returned Silver `GHM-2026-A9C790` and refreshed the profile; successful create POST 201 for `QA Workspace Guest` (+91-9000000199) auto-opened the profile; topbar “Demo Diya Shah” jump auto-opened one match. No browser console errors. Screenshots at 1366/1024/390; 390 modal is a bottom sheet (8px inset), no horizontal overflow at any tested size; Escape closes the modal.
- Cleanup: Demo Diya Shah’s test membership was removed by `reception-demo.sh load` (fixture verification passed: 6 Demo guests, 6 reservations, 3 open tasks). The locally created `QA Workspace Guest` row remains from the successful-create test (no membership/reservations); deletion awaits user approval.
- Docs: ERP-03/04/05 change histories, this log, STATE, and the 3.11 plan. On 2026-10-21 the user approved a three-commit sequence (3.10 fixture, dashboard correction, 3.11 Guests); this is the 3.11 commit. No merge or push. Next: user click-through; the local `QA Workspace Guest` stays until the user asks for removal.

## 2026-10-21T16:50:21+05:30 — Three approved commits created; GitHub remote added
- User approved the recommended three-commit sequence (3.10 fixture/docs, dashboard correction, 3.11 Guests) and separately instructed: “https://github.com/AshishBevinakatti/QCl_repo.git add this to this repo now”. Added it as `origin` (fetch + push); no push, fetch, merge or tag performed.
- Commits on `feature/3.9-observability-ops-console`: `9285648` `test(erp-03): add local reception demo fixture and E2E evidence`; `6555387` `fix(erp-03): rebalance reception dashboard layout`; `f8f719c` `feat(erp-04): add search-first guests reception workspace`.
- Fixture fix included in `9285648`: `.gitignore` now permits `scripts/dev/*.sql`, so the three fixture SQL files are tracked with the wrapper; all other SQL stays ignored. No secrets or non-fixture data added.
- Pre-commit verification: web tests 12/12, lint exit 0 with pre-existing warnings, build 308 modules green, `git diff --check` clean. Demo fixture reset after the enrolment test; `QA Workspace Guest` kept because the user said they will say when to remove it.
- No merge/push. This log/STATE record is the approved docs follow-up commit; root `.vscode/` remains untracked and excluded.
- Next: user click-through; decide QA-guest removal; push only on explicit instruction naming the remote/branch.

## 2026-10-21T18:07:45+05:30 — Unit 3.12 UI/UX design system implemented and verified (uncommitted)
- Phase/unit: 3.12 Billzova-aligned UI/UX design system        Branch: `feature/3.12-ui-design-system` (stacked on `feature/3.9-observability-ops-console`; 3.11 committed but unmerged)
- Approval/plan: user approved `03-phases/phase-3/PLAN-3.12-ui-design-system.md` on 2026-10-21 with dark-green collapsible sidebar, Inter + Lucide (no Tailwind), retained/restyled dashboard photos, all screens and light/dark themes. ADR: `02-architecture/adr/ADR-002-ui-design-system.md`. Reference: user-supplied `/run/media/ash_63/DATA/dev/billzova-web` (visual structure only; no Billzova content/logo/purple palette).
- Foundation: added `@fontsource-variable/inter` + `lucide-react`; replaced the Material Symbols CDN with a local Lucide mapping behind `Icon`; added `theme.ts` and a pre-render `gh-theme` boot script; split CSS into `tokens/base/layout/components/screens` imported by `index.css`; added `PageHeader`, `EmptyState`, Kpi tone API and tokenised `Donut`.
- Shell/screens: dark-green 264/76px collapsible sidebar with persistent state, mobile drawer (Escape, backdrop, focus to close and back to trigger), static "Resort operations" header, Ctrl/Cmd+K search, API pill, theme toggle and notification placeholder. All views now have consistent `PageHeader`s; dashboard, Reservations, Guests, Rooms, Front office, Billing, Housekeeping, Ops and the three honest placeholders use shared cards, tables, forms, badges, alerts, empty states and responsive grids. Guest modal becomes a 560px bottom sheet. Hardcoded JSX presentation colours replaced with chart/status tokens.
- Functionality safety: no backend, schema, API, auth, route, handler, debounce/stale-guard or preview-honesty changes. Fix found during live verification: switching Preview → Live kept the previous view state, so signed-out Live could show stale demo counts; `page-stack` is now keyed by mode, so views remount and the existing login hints appear. This restores the 3.6/3.8 acceptance criteria.
- Verification: `npm run build` green (2,227 modules; 345.89kB JS / 104.42kB gzip; CSS 38.87kB / 8.12kB); `npm test` **18/18** (12 existing + 3 theme + 3 design primitives); `npm run lint` exit 0 with pre-existing warnings only; `git diff --check` pending. Browser/CDP verification in light and dark at 1440/1366/1024/768/390: every nav view, drawer open/close/focus, sidebar collapse + reload persistence, theme persistence, guest modal, no horizontal overflow (`scrollWidth <= clientWidth`), no uncaught console errors. Live signed-out correctly shows login hints; API 401s are expected.
- Docs: new `02-architecture/ui-design-system.md`; README index; ERP-03/04/05 change histories; `screens.md` pointer; RESOURCES_LOG + DECISIONS D-011 from the plan slice. No screenshots committed (temporary evidence in `/tmp/opencode`).
- Limits: no full drawer focus trap; theme follows stored preference (no OS/cross-tab sync); external Keycloak pages unstyled; backend guest-history/email gaps remain. QA Workspace Guest remains until the user asks for removal.
- Next: user click-through in both themes; commit approval. No merge/push; 3.11 remains unmerged beneath this branch.

## 2026-10-21T18:18:49+05:30 — 3.12 verification close-out (correction to 18:07 entry)
- `git diff --check` re-run after the final docs edits: clean. Build CSS is 38.88kB (the earlier 38.87kB was a typo).
- `STATE.md` overwritten with the final 3.12 state; browser localStorage reset to light theme with the sidebar expanded for handoff. No source changes after the green build/test/lint run.
- Still pending: user click-through in both themes and explicit commit approval. No commit/merge/push performed.

## 2026-10-21T18:24:05+05:30 — Unit 3.12 committed
- Commit: `fb286e9` — `feat(ui): apply Golden Hills design system` on `feature/3.12-ui-design-system` (30 files, +3816/−713).
- Approved by the user in the commit-approval question on 2026-10-21. Staged explicit 3.12 code/test/doc paths only; root `.vscode/` remains untracked.
- No push, merge or tag. 3.11 remains unmerged beneath this branch; merge approval is separate.

## 2026-10-22T19:15:47+05:30 — Unit 3.13 Guest 360 profile implemented and verified (uncommitted)
- Phase/unit: 3.13 Guest 360 profile (ERP-04 + read-only reuse of ERP-02/03/05/07)        Branch: `feature/3.13-guest-360-profile` (stacked on `feature/3.12-ui-design-system` at `59c2f35`; 3.11/3.12 remain unmerged). Plan: `03-phases/phase-3/PLAN-3.13-guest-360-profile.md`.
- Approval/scope: user supplied the Guest 360 implementation brief on 2026-10-22 and instructed implementation after inspection. No new booking/payment/refund/check-in logic; profile actions deep-link to existing Front Office/Billing workflows. No new table for UI convenience.
- Backend schema: `V10__guest_email.sql` adds nullable `guest.email VARCHAR(320)` and a non-unique `(property_id, email)` lookup index. Forward-only, no backfill, no destructive change, no reset. Flyway validated/applied version 10 on H2 and the existing Postgres database; all 8 live guest rows were preserved.
- Backend API/service: bounded `GET /api/v1/guests/{id}/profile` via `GuestProfileDto`/`GuestProfileService`; latest-20 history; active stay and next `hold`/`confirmed` reservation; batched category/room reads; membership + points; canonical `FolioService.outstanding`; invoice; bounded pending/failed payment indicators; derived alerts/state; parsed/labelled preferences. `Guest` email support + validation; `/guests/{id}/stays` left as a compatibility stub. Added minimal getters (`Stay.checkinAt/checkoutAt`, `Member.validFrom`, `Invoice.issuedAt`, `Folio.createdAt`) and bounded repository queries.
- Security: guest create/update restricted server-side to `RECEPTION`/`MANAGER`/`SUPERADMIN` (membership merge remains manager-only); all authenticated reads follow the existing guest-read scope. Email edit/clear is audited. `null` PATCH means unchanged; empty string clears the optional field.
- Frontend: `web/src/guests.tsx` now renders identity header, operational summary and four tabs (Overview, Reservations & stays, Billing & payments, Requests & notes); optional email in create/edit; membership enrol/redeem retained; role-gated edit/create; profile load/refresh/error/empty states; alerts; honest unsupported notes/service-request/verification states; Front Office/Billing navigation. `App.tsx` wires the existing workflows. 3.12 tokens, Inter/Lucide, rupee/date formatting and responsive rules preserved; no horizontal page scroll.
- Verification: backend full suite **78/78 tests, 0 failures/errors, 17 classes** (`GuestApiTest` 11 + new `GuestProfileApiTest` 5); `npm test` **26/26** (16 Guests tests + 10 existing); `npm run build` green (2,227 modules; 374.31 kB JS / 110.55 kB gzip; 50.90 kB CSS / 9.74 kB gzip); `npm run lint` exit 0 with only pre-existing warnings in unrelated shell files; `git diff --check` clean.
- Live verification (real Keycloak/Postgres, reception token unless noted): in-house `Demo Aarav Mehta` (room DEL-106/Deluxe, canonical charges 5,000 / payments 1,500 / outstanding 3,500, high departure-balance alert), upcoming `Demo Ananya Verma` (advance due/paid 9,000), member/no-active-stay `Demo Rohan Iyer` (Silver, 0 points), departed `Demo Meera Nair` and a no-booking guest. Billing tab/folio link/history/tabs rendered. Email set to `meera.qa@example.com` then cleared through the UI; final API value `null`; audit rows recorded. Membership token: profile 200, guest PATCH/POST 403. Unknown profile 404. The profile endpoint is present in runtime OpenAPI (49 paths).
- Responsive/browser: CDP/Brave at 1440/1366/1024/768/390; `documentElement.scrollWidth <= innerWidth` at every checked size; no uncaught console errors; screenshots in `/tmp/opencode/guest-*.png` (temporary evidence, not committed).
- Data state/cleanup: 8 guests remain; no reset. `QA Workspace Guest` remains from the approved 3.11 create test until the user asks for removal. `Demo Meera Nair` email was restored to `null`; no memberships/reservations were fabricated. Three guest audit rows for the test edit/no-op are append-only.
- Docs: 3.13 plan, ERP-04 module doc, api/data-model/screens/security, traceability, D-012 and Q-015; this DEVLOG + STATE. `RESOURCES_LOG` unchanged because no new resource-folder input was read for this unit.
- Open gaps: no address/DOB/nationality/ID-number/verification model; no notes/service-request persistence or UI; no communication-history reader; no merge UI; published OpenAPI snapshot still 14 paths; all profile reads remain authenticated-staff scope (Q-015). No screenshots committed.
- Next: present the unit for review and ask explicit commit approval. No commit/merge/push has been performed.

## 2026-10-28T10:50:51+05:30 — Session: run the local stack (user request)
- Phase/unit: Phase 3 Core Development, branch `feature/3.13-guest-360-profile` (uncommitted 3.13 work left untouched; no source changes made). A stack started ~10:39 by an earlier orchestration was already partly up; it was restarted cleanly.
- What: user asked "run the server". Verified/restarted backend + web and resolved a `:5173` port collision.
- Problem found: `127.0.0.1:5173` was held by an unrelated `billzova-web` dev server (pid 9451, started 10:44), while the ERP Vite bound only `[::1]:5173` — so `http://localhost:5173` could open the wrong app, and Keycloak accepts only `http://localhost:5173/*`. User approved stopping billzova (2026-10-28, this session).
- Commands that changed state: `kill 9451 7558 9553` (billzova Vite + two ERP Vite instances; the 10:39 backend was a child of that orchestrator and shut down with it); `setsid nohup ./run-local.sh postgres >> /tmp/opencode/app-local.log 2>&1 &`; `setsid nohup npm run dev -- --host :: --port 5173 --strictPort > /tmp/opencode/erp-web.log 2>&1 &`. Keycloak container `infra-keycloak-1` was already up since 10:39 — no docker command needed.
- Verification: backend `GET :8080/api/v1/health` → `{"service":"erp-app","status":"UP"}`; DB `jdbc:postgresql://localhost:5432/resort_erp` (PostgreSQL 18.6), Flyway version 10 "Schema public is up to date"; Vite serves title "Golden Hills Resort ERP" on both `127.0.0.1:5173` and `[::1]:5173`; proxied `http://localhost:5173/api/v1/health` → UP; Keycloak discovery → 200. PIDs: backend 10323, Vite 10265, Keycloak 6713.
- Note: `billzova-web` (separate project at `/run/media/ash_63/DATA/dev/billzova-web`) is stopped; restart it in its own directory when needed. No repo code/test/doc changes besides this DEVLOG entry and the STATE servers line. 3.13 remains uncommitted — no commit/merge/push.

## 2026-10-29T18:54:33+05:30 — Discovery-call gap-analysis report (PDF + Markdown) produced
- Phase/unit: Phase 1 re-baseline input / documentation        Branch: `feature/3.13-guest-360-profile` (3.13 code/tests remain uncommitted; no source changes made for this report).
- Approval/scope: user asked for "a clean simple to understand pdf report" of the consolidated discovery-call gap analysis. Work was limited to reading resource-folder inputs, writing derived docs/extracts and generating a PDF; no client facts were invented, no commit/merge/push.
- Resources used (all read-only under `/run/media/ash_63/DATA/ERP_Resouce`): `Golden_Hills_Discovery_Call_Summary_2026-10-28.md` (sha256 `733068bc…66b49a9`), `WhatsApp Audio 2026-10-28 at 6.17.06 PM - transcript.txt` (`34c653a0…e864481`), `transcript_segments.jsonl` (`9472ec4e…28069efe`), `transcribe_progress.log` (`e2b979cd…e35652d`), `WhatsApp Audio 2026-10-28 at 6.17.06 PM.mp4` (`cfee57ed…2e57068`), and the newly found derived `Resort_ERP_Software_Requirements_Specification.pdf` (`a5600e41…1015d3`). The SOW, landing checklist and current build docs were reused from the earlier baseline.
- What: produced a 9-page A4 PDF, `docs/01-requirements/reports/Golden_Hills_ERP_Gap_Analysis_2026-10-29.pdf` (91,359 bytes), plus an editable Markdown companion (300 lines). Sections: executive summary; client facts with confidence; SOW coverage; six gaps; P0 questions; P1/P2/P3 inputs; conflicts; impact/path; internal decisions; document control and sources. Added a topic-indexed `docs/01-requirements/source-extracts/discovery-call-extract.md` (158 lines) with timestamps, confidence and a 16-row contradiction register.
- SRS handling: the 13-page SRS was not part of the earlier analysis. It claims 100% grounding in the same audio and proposes GST 12/5/0, cancellation >48h/24–48h/<24h, January go-live, Ozone RFID and no Tally/Zoho. It is not client-signed and conflicts with the transcript on go-live and other specifics. The report labels it a draft interpretation, adds it to the sources/conflicts tables, and logs Q-016 for the user/client to confirm its status. It was not used to upgrade any low-confidence transcript fact.
- Verification: `pdfinfo` → 9 pages, A4 595.276 × 841.89 pts, 91,351 bytes; all 9 pages rendered at 95 dpi with `pdftoppm` and visually inspected. Fixed three layout defects found during review (orphaned table header, a one-bullet orphan page, a closing-quote orphan page) and corrected two factual slips (module count now 5 core + ERP-08 partial + 8 unbuilt; “promotion courts” normalised to “promotion codes”). `pdftotext` spot-checks confirm the corrected text; visible text uses embedded Liberation Sans (ReportLab also leaves an unused Helvetica resource). No tables split without headers; no overflow or orphan headings remain.
- Files changed: `docs/01-requirements/reports/Golden_Hills_ERP_Gap_Analysis_2026-10-29.pdf`, `docs/01-requirements/reports/Golden_Hills_ERP_Gap_Analysis_2026-10-29.md`, `docs/01-requirements/source-extracts/discovery-call-extract.md`, `docs/README.md` (reports index row), `docs/logs/RESOURCES_LOG.md` (6 new rows), `docs/logs/OPEN_QUESTIONS.md` (Q-016), `docs/logs/DEVLOG.md`, `docs/logs/STATE.md`. Generator kept outside the repo at `/tmp/opencode/make_gap_report.py` (temporary; not committed).
- Report hashes: PDF `0383ffe8e198573bf2a5d4bd00bc9d395dc9f981df8bf5b689b7aa844bacfad0`; Markdown `18cab52c86fc658b0e14f9eeacdc355de2a341ce230ed1f9194bbcbbd0748c55`; extract `3a44d006665cba998d11bf790cdbe2f1f6d0381fe1718c56bcc16b95e8853835`.
- Commands that changed state: `python3 /tmp/opencode/make_gap_report.py` (wrote the PDF), `pdftoppm`/`pdftotext` (read-only render/text checks). No migrations, installs, resets or git operations.
- Problems & fixes: the first render was 12 pages with an orphaned confidence-table header on p2, a one-bullet p6 and a quote-only p12. Reworked section flow, tightened the P0/P1 tables, moved the summary callout before the confidence table, and added continuation labels; final is 9 pages. The new SRS was discovered during the final resource check, so the report was revised to flag it rather than silently ignore it.
- User interaction: user requested the PDF; no commit approval was requested or given. 3.13 remains uncommitted.
- Next: present the PDF and ask whether to (a) commit the report/docs, (b) produce a client-facing P0 questionnaire, and (c) proceed with the v2 re-baseline docs; 3.13 commit approval remains a separate decision.

## 2026-11-03T11:07:40+05:30 — Session: local stack started again (user request)
- Phase/unit: Phase 3 Core Development, branch `feature/3.13-guest-360-profile` (3.13 code/tests/docs remain uncommitted; no source changes made).
- What: user asked "run the server". Found the whole stack down (backend :8080, web :5173, Keycloak :8081 unreachable); native PostgreSQL was already up and `infra-keycloak-1` was stopped (`Exited (143)`, 6 days ago).
- Commands that changed state: `docker start infra-keycloak-1`; `setsid nohup ./run-local.sh postgres >> /tmp/opencode/app-local.log 2>&1 &` from `ERP_DEV/`; `setsid nohup npm run dev -- --host :: --port 5173 --strictPort > /tmp/opencode/erp-web.log 2>&1 &` from `web/`. No migrations, installs, resets or git operations.
- Verification: backend `GET :8080/api/v1/health` → `{"status":"UP","service":"erp-app"}` (PID 24715); management `:9091/actuator/health` → `{"status":"UP"}`; Vite serves :5173 → 200; Vite proxy `/api/v1/health` → UP; Keycloak realm discovery → 200. Flyway version 10 validated, schema up to date, PostgreSQL 18.6.
- Note: no commit/merge/push. 3.13 commit approval and the gap-report commits remain pending decisions.

## 2026-11-12T14:30:21+05:30 — Commit approval for 3.13 and Blueprint consultation
- Phase/unit: Phase 3 Core Development, branch `feature/3.13-guest-360-profile`.
- What: user approved committing work unit 3.13 ("yes commit it"). Ran full verification: backend `GuestApiTest` + `GuestProfileApiTest` (16/16 pass, 0 failures/errors, build SUCCESS); web test suite (`vitest run`, 26/26 tests pass in 4 test files); `git diff --check` clean.
- Blueprint review: per user instruction ("read the two md file also in /home/ash_63/Downloads"), consulted `QuantumCLK_Resort_ERP_Architecture_and_Phase_1_Blueprint.md` (and identical copy with `(1)`), sha256 `314f7c8e93a25b64a123ae399f1a49420e90f732ab9c51ea87bdf053ca02c6ca`. Document specifies single-resort deployment, domain-driven microservices, guest portal/auth via Keycloak, inquiry intake, lead management with atomic claim, 5-minute SLA escalation, Sales Executive role inside the existing ERP, and notification adapters. Logged in `RESOURCES_LOG.md`.
- Next architecture answers confirmed by user: true microservice architecture, mock notification adapters for dev before provider onboarding, landing page guest auth + inquiry form, same ERP webapp for Sales Executive.
- Next: execute atomic commits for 3.13 and documentation, then prepare work unit branch for the lead microservice.

