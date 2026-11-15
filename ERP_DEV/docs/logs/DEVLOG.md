# Development Log (append-only)

History before 2026-11-15 is in `archive/hotel-draft:ERP_DEV/docs/logs/DEVLOG.md`.

## 2026-11-15 — Audit of phase1_plan.md v1.0 and fresh start
- Ashish asked for an audit of his `phase1_plan.md`. The findings (custom OTP brute-force risk, plain-text OTP, account enumeration, the hard-coded JWT fallback secret in the archived `JwtTokenService`, double-booking, IDOR on proofs, claim race, plain-text Aadhaar, revenue double count, main-branch cleanup risk) were given in chat and in the session plan file.
- Q: login choice → A (Ashish): keep custom OTP *(later reversed, see below)*. Q: old modules → A: archive on a separate branch and clean main. Q: payment check → A: keep observatory. Q: booking store → A: lead-service + DB guard.
- Ashish then decided to restart: everything archived on a unique branch, a fresh Phase 1 with new docs, the landing page unchanged, the backend rebuilt with the same portal API, the web app rebuilt, merged through a branch. Same tech stack (asked separately).
- Q: push archive? → A: yes. Q: where to commit the WIP? → A: "pull first, then fresh branch only".
- Commands: `git branch archive/hotel-draft 825f3fe`; `git tag -a archive-hotel-draft-2026-11-15`; `git fetch` (origin/main = 825f3fe); `git pull --ff-only` (already up to date); `git push origin archive/hotel-draft archive-hotel-draft-2026-11-15`; checked with `git ls-remote` (825f3fe). `git switch -c feature/phase1-fresh-start`.
- Commit `a40defe` (approved): landing view-on-map icon fix + phase1_plan.md v1.0 + .gitignore for the symlinked node_modules and LibreOffice lock files.
- Q: remove list → A: approved as listed. `git rm` of 322 files; commit `5d220ab` (approved).

## 2026-11-15 — Milestone 1 (docs + skeleton) started
- Ashish's conditions: docs and skeleton only, no app code; review the SOW and requirements first; don't delete local files or `.env`; update CI; show everything before committing or pushing; if the resource drive is missing, say what to mount and wait.
- The resource folder is not at the rule path `/run/media/ash_63/DATA/ERP_Resouce`. It was found at `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (same name, 21 files) and used read-only (Q-001).
- Read: Phase 1 Blueprint (all of it), SOW sections §3–§12, §22–§26, discovery call summary, the questionnaire (blank form), and greps of the call transcript. Extracts with matching sha256 were restored from the archive.
- Conflicts between plan v1.0 and the Blueprint were shown to Ashish (staff login, booking/payment, service shape, roles, missing lead features).
- Q: staff login → A: **Keycloak for employee authentication and account management; follow the Blueprint** (detailed onboarding/login/logout/deactivation spec given). Q: booking/payment → A: **follow the Blueprint** (none in Phase 1). Q: backend shape → A: **Blueprint microservices**. Q: extra Blueprint features → A: **"we will add new feature later"**.
- Checks run: `npm run typecheck` in landing-page → exit 0. `npm run lint` → 4 errors / 7 warnings already present (Q-004). `npm run build` → fails locally only because `landing-page/node_modules` is a symlink outside the project root (Turbopack refuses it); not reproducible in CI with `npm ci`.
- SRS reviewed after the first draft. Added: SMS excluded (Q-007), event enquiry form (Q-008), 8 h shift (Q-019), client designations for the sales role (Q-027), who manages employees (new Q-029), delete reserved for Owner/MD (AUTHENTICATION §7).
- Docs written (uncommitted, for review): see STATE.md item 2.

## 2026-11-15T11:23:40+05:30 — Resource path rule updated (answers Q-001)
- Ashish: "/run/media/ash_63/DATA/Intership wrok/ERP_Resouce: update the rule and read the resources from here, and commit it".
- Updated the path in `AGENTS.md`, `opencode.json` (permission allow-list), `.opencode/skills/erp-prp/SKILL.md`, `references/docs-and-records.md`, `references/phases.md`. The source-extract headers still show the old path, because they record where each file was read at the time; the sha256 values are unchanged.
- Ashish approved the commit of Milestone 1 docs + CI + rule update in the same message. Push not approved.
- Commit `e9841f5` docs(core): phase 1 baseline (40 files, approved by Ashish). Not pushed.

## 2026-11-15T11:27:15+05:30 — Push attempt and increment 1 decisions
- Ashish: "go ahead". `git push -u origin feature/phase1-fresh-start` was **rejected** by GitHub: the stored personal access token has no `workflow` scope, which a change to `.github/workflows/ci.yml` needs. Nothing was pushed. Ashish must update the token (classic: `workflow` scope; fine-grained: Workflows read/write).
- Q-020 → upgrade the same products; Q-029 → ADMIN only; Q-003 → Keycloak pass-through (A). See D-112…D-114.
- Increment 1 plan written: `docs/03-phases/phase-1/inc1-PLAN.md` (waiting for approval).

## 2026-11-15T11:30:28+05:30 — Increment 1 approved
- Ashish approved `inc1-PLAN.md` as written; approved checking versions on official release pages (spring.io, keycloak.org, GitHub releases, npm) for this increment; approved Q-023 dependencies (Testcontainers PostgreSQL, testcontainers-keycloak, Mailpit image, keycloak-js); approved committing the doc updates.
- Commit `eb2c8ba` docs(core): record inc 1 decisions and increment 1 plan (approved). Branch `feature/phase1-inc1-identity` created from it.

## 2026-11-15T11:32:44+05:30 — Versions checked (approved web lookups)
- URLs: https://api.spring.io/projects/spring-boot/generations, https://api.spring.io/projects/spring-cloud/generations, https://api.github.com/repos/{spring-projects/spring-boot, spring-cloud/spring-cloud-release, keycloak/keycloak, axllent/mailpit, redis/redis, testcontainers/testcontainers-java, dasniko/testcontainers-keycloak}/releases, https://registry.npmjs.org/{react,vite,typescript,vitest,keycloak-js,oxlint,@testing-library/react}/latest, https://hub.docker.com/v2/repositories/library/postgres/tags. GET requests only; no project data sent.
- Finding: every Spring Boot 3.x line lost open-source support on 2026-06-30 (3.5.x). Q to Ashish: Boot 4.1.2 or 3.5.16 → A: **4.1.2**. Q: accept the rest of the table → A: **accept all** (incl. TypeScript 7, Redis 8 licence noted). D-115.
- Corrected ADR-001: Boot 3.2 open-source support ended 2024-12-31 (it said Nov 2024).

## 2026-11-15T11:44:30+05:30 — Increment 1, slice S1 (infra + realm)
- Added `infra/docker-compose.yml` (PostgreSQL 18.7 on host port 5433, because a system PostgreSQL service already uses 5432 on this machine and was left untouched; Keycloak 26.8.2; Redis 8.10.3; Mailpit 1.33.1; all bound to 127.0.0.1; secrets required through `${VAR:?}`), `infra/postgres/init/01-service-databases.sh` (DB + least-privilege login for keycloak and access_db), `infra/keycloak/gh-staff-realm.json` (generated; placeholders only), `ERP_DEV/.env.example`, CI job `realm-check`.
- Verification ran on a throwaway compose project `erp-s1-check` with random secrets in the session scratchpad (not in git, not in `ERP_DEV/.env`). Removed afterwards with `down -v`.
- Problems found and fixed:
  1. `openssl` isn't installed → secrets generated with Python; `.env.example` hint changed.
  2. Service-account token had no `sub` (missing `basic` scope) → Admin API 401 → `basic` added.
  3. Still 401: Keycloak 26.x needs the `kc-admin-api` scope (Admin API audience) → added to access-service only.
  4. Keycloak warns "Full scope allowed" is deprecated → turned off on all clients, with explicit scope mappings.
  5. Service account can't `GET /roles/{name}` (needs view-realm) → by design; role lookup via `/users/{id}/role-mappings/realm/available` (KEYCLOAK-SETUP §5.3).
- Final live check: 15/15 PASS (discovery; password grant refused; PKCE enforced; client secret placeholder resolved; SA creates a user and maps a role; SA can't create a client or read roles; invite email "Update Your Account" received in Mailpit; token aud=erp-api, SALES_EXECUTIVE + 3 permissions, 300 s lifespan; realm security settings). Also: access_svc refused on the keycloak DB ("User does not have CONNECT privilege"); Redis without a password → NOAUTH. CI realm-check rules 14/14 locally.
- Not yet checked: brute-force lockout behaviour and following the invite link (S5, needs a browser login); CI on GitHub (push still blocked by the token scope).
- Ashish's `ERP_DEV/.env` wasn't edited. It needs the new variable names from `.env.example` before `docker compose` can run.
- Commit `8d5f9bc` feat(infra): local stack and gh-staff Keycloak realm (approved by Ashish).

## 2026-11-15T11:55:38+05:30 — Increment 1, slice S2 (access-service skeleton)
- Q: Maven isn't installed → A (Ashish): **Maven Wrapper**. Downloaded Apache Maven 3.10.0 from Maven Central into `~/.local/share/maven` (user folder, no sudo; sha512 checked), generated the wrapper 3.3.4 (only-script) in access-service, and pinned `distributionSha256Sum` after checking the zip against the official sha512. Starter names read from the official spring-boot-dependencies 4.1.2 BOM.
- Built: `pom.xml` (Boot 4.1.2, Java 21 target; local JDK is 25), `SecurityConfig` (JWKS via the realm certs URL, lazy; validators: timestamp ±60 s, issuer, aud=erp-api; ROLE_/PERM_ mapping; JSON 401/403), `CorrelationIdFilter` (accepts only [A-Za-z0-9-]{1,64}), `ErrorHandler`, `MeController`, `Employee` entity/repository, Flyway V1 (employee with CHECK constraints, append-only audit_event via trigger, idempotency_key), ECS JSON logs.
- Tests: `./mvnw verify` → **11/11 pass** (MeEndpointTest 9, AuditAppendOnlyTest 2) on Testcontainers PostgreSQL 18.7. First run: 7 errors because the test decoder didn't replace the production one (bean override order) → test decoder made `@Primary`.
- Live run against the compose stack (throwaway secrets): health UP; no token → 401 JSON with correlationId; real Keycloak service-account token (aud=realm-management) → 401; flyway_schema_history = "1 employee audit idempotency"; log has 0 lines mentioning password/secret. Not shown: whether that 401 came from the audience or the signature check (proved in S4 with a real employee token); request-time logs with correlationId (no request logging yet).
- Mistakes during the check: (1) the folder path with a space broke an unquoted variable → rerun with an array; (2) `pkill -f` matched its own shell and killed it → used a stricter pgrep + kill. No effect on files.
- CI: the service job now runs `./mvnw -B verify` in the service folder.
- AUTHENTICATION §9 updated: audit_event has `actor_label` and `reason`, and append-only is enforced by a trigger.
- Commit `bd8d799` feat(auth): access-service skeleton (approved by Ashish).

## 2026-11-15T12:04:57+05:30 — Increment 1, slice S3 (api-gateway) + S2 file-mode fix
- Found after committing S2 (`bd8d799`): `mvnw` was committed as 100644. The repo is on an NTFS (fuseblk) drive with `core.fileMode=false`, so git never sees +x and CI would fail. Fixed with `git update-index --chmod=+x` for both mvnw files and `infra/postgres/init/01-service-databases.sh`. `.gitattributes`: `*.cmd` CRLF, `*.sh` and `mvnw` LF. Included in the S3 commit.
- Gateway: Spring Cloud 2025.1.4 BOM read from Maven Central (Gateway 5.0.4; WebFlux and WebMVC server starters). Chose WebFlux for the Redis rate limiter. **Boot 4.1.2 + Spring Cloud 2025.1.4 start fine** (the D-115 open point is closed).
- Built: SecurityConfig (same token rules as access-service; validator duplicated, marked `shortcut:`), CorrelationIdWebFilter (runs before security so 401s carry the id), JSON 401/403, CORS (5173 + 3000 only), KeyResolver (employee `sub`, else peer IP), default filters RequestSize + RequestRateLimiter, route `/api/v1/me` + `/api/v1/admin/**` → access-service.
- Tests: first run 7/10. Three test-side mistakes (stub `path()` drops the leading slash; Spring now names 413 CONTENT_TOO_LARGE). After the fix: **10/10** (GatewayRoutingTest 9, RateLimitTest 1) with real Redis 8.10.3 in Testcontainers.
- Live (compose stack + both jars): gateway health UP; no token → 401 + X-Correlation-Id; real Keycloak token with the wrong audience → 401; CORS preflight 5173 → 200, evil.example → 403; 0 Redis errors with the password-protected Redis.
- Known limit noted: the rate limiter fails open when Redis is down (R-011).
