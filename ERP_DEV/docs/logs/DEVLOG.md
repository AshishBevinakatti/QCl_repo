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
- Commit `c44f2e5` (user-approved 2026-10-17): 3.7 on `feature/desk-confirm-flow` (7 files, +192/−18; includes PLAN-3.7). NOT merged. Tree clean except untracked `.vscode/` + PLAN-3.8. No push.

## 2026-10-17T15:04:35+05:30 — User dashboard-improvement brief → read-only audit + PLAN-3.8
- Phase/unit: 3.8 planning (no source code)        Branch: feature/desk-confirm-flow (planning only)
- What: user delivered an A–L dashboard improvement brief with a hard "do not change the existing UI design" rule (stat cards, arrivals, departures, room-status donut, alerts, recent bookings, in-house, top search, bell, Manage Rooms, sidebar, date/time + session identity). Read-only audit (explore subagent, file:line evidence): most panels already live on real data; real gaps = UTC business-date bug (frontend `toISOString` vs backend Asia/Kolkata), arrivals = confirmed-overlap window (not checkin=today), ≤50 enrichment calls per dashboard load (N+1), 8-char short-ref search silently fails, no debounce/stale guard, blank-until-loaded, redundant per-row refetch in Recent Bookings. Backend-less features (Reserved room status, notifications, service requests/maintenance) stay documented as limitations, not faked.
- Wrote `docs/03-phases/phase-3/PLAN-3.8-dashboard-completeness.md` (7 thin slices: business-date helper, arrivals semantics + tests, load/401 UX hardening, search debounce+prefix, enrichment batching, View-all prefill, docs/limitations). Awaiting user approval; implementation branch `feature/dashboard-completeness` from develop after 3.7 merges.
- Next: present 3.7 for commit + PLAN-3.8 for approval (same presentation).
- User approved PLAN-3.8 at the same presentation (2026-10-17, question tool: "Approve — start after 3.7"). Implementation starts once 3.7 lands on develop.

## 2026-10-20T13:45:07+05:30 — Cross-platform launcher `run-local.mjs` (Windows + Fedora)
- Phase/unit: developer tooling (no backend/web behaviour change)        Branch: feature/cross-platform-run (from develop @ b2a70e8)
- What: user asked for one run method that works on both Windows and Fedora without deleting the existing Fedora helpers. Added `ERP_DEV/run-local.mjs` (Node 22, stdlib only): `node run-local.mjs [postgres|h2] [--web] [--print]`.
  - Sets DB + Keycloak issuer vars every run (lesson 2026-10-10 preserved), Postgres defaults identical to `run-local.sh`; `h2` = in-memory test mode.
  - OS handling: Java via JAVA_HOME/PATH, Fedora fallback `~/.local/java/*/bin/java`; Maven via MAVEN_HOME/PATH, Fedora fallback `~/.local/maven/bin/mvn`, `mvn.cmd` on Windows; classpath cached in `os.tmpdir()/erp-local/cp.txt`; classpath separator from `path.delimiter` (`;`/`:`); Keycloak preflight warns with a per-OS start command (`docker compose` vs `sg docker`).
- Verification (Fedora): `--print` resolves JDK-21 + Maven correctly for postgres/h2/--web; live parity run `node run-local.mjs postgres --web` (old PIDs 5736/5902 killed first) → backend :8080 PID 6540 started in 8.8 s, web :5173 PID 6570, health UP, Vite proxy 200. Windows path written to spec but not executed here (no Windows host) — flagged honestly.
- Docs: DAY-ONE §5 now leads with the Node command (prereqs, flags, per-OS Docker line) and keeps `./run-local.sh` as the Fedora convenience; keycloak.md notes the Windows command without `sg docker`. `run-local.sh` unchanged.
- Commit sequence: 3.8 committed first as `90ab9a6` on `feature/dashboard-completeness` (15 files, per user approval "both, in order"); this launcher commit is separate. Module 2 records (CR-001/Q-012/R-010…R-012/plan PDF) remain uncommitted pending user approval.
- Next: present launcher commit; then pending user actions — 3.8 click-through, 3.8 merge, Module 2 plan approval/records, delete stale `fix/hide-table-scrollbar`.
