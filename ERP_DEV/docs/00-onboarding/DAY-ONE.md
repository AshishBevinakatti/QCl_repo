# DAY-ONE — from zero to first change (verified 2026-10-09, slice on `feature/2-slice-hello-world`)

- Purpose: get a new developer productive on day one. Audience: new developers. Owner: project team.
- Every command below was actually run on 2026-10-09 (Fedora 44, user-local toolchain). Expected outputs are real.

## 1. What this project is
Integrated Resort Management ERP for Golden Hills Resort (QuantumCLK Technologies): reservations,
front office, housekeeping, guest CRM, membership/loyalty, RFID access, billing, OTA sync, reporting
(SOW modules ERP-01…ERP-09 core, ERP-10…ERP-14 optional). Requirements live in the read-only resource
folder `/run/media/ash_63/DATA/ERP_Resouce`; derived extracts live in `docs/01-requirements/source-extracts/`.
Stack (accepted ADR-001): Java 21 + Spring Boot modular monolith, React (Phase 3), Postgres + Redis + Kafka,
Keycloak, Docker + K8s. First runnable slice: `services/erp-app` (health + room-categories).

## 2. Prerequisites
- `git --version` → any recent git. Check: `git --version`.
- Java 21 (Temurin) + Maven 3.9, user-local (no sudo needed):
  ```
  curl -sL https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse -o /tmp/jdk21.tar.gz
  mkdir -p ~/.local/java && tar -xzf /tmp/jdk21.tar.gz -C ~/.local/java
  curl -sL https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz -o /tmp/maven.tar.gz
  mkdir -p ~/.local/maven && tar -xzf /tmp/maven.tar.gz -C ~/.local/maven --strip-components=1
  export JAVA_HOME=$(echo ~/.local/java/*/ | head -1) && export PATH=$JAVA_HOME/bin:$HOME/.local/maven/bin:$PATH
  java -version   # expected: openjdk 21 (Temurin)
  mvn -version    # expected: Apache Maven 3.9.x, Java 21
  ```
- Node 22 LTS, user-local (for `ERP_DEV/web` shell):
  ```
  curl -sL https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-x64.tar.xz -o /tmp/node.tar.xz
  mkdir -p ~/.local/node && tar -xJf /tmp/node.tar.xz -C ~/.local/node --strip-components=1
  export PATH=$HOME/.local/node/bin:$PATH
  node --version  # expected: v22.x
  ```
- Docker (only for full local stack: Postgres/Redis/Kafka/Keycloak via `ERP_DEV/infra/docker-compose.local.yml`).
  Without Docker: unit tests run on H2 (Postgres-compatibility mode); runtime needs real Postgres.

## 3. Clone and look around
```
git clone <org-remote-url> && cd ERP_Resort
git checkout feature/2-slice-hello-world   # or develop for the last merged state
git status            # expected: clean tree
ls ERP_DEV            # expected: pom.xml services docs infra .env.example ...
ls ERP_DEV/docs       # expected: README.md 00-onboarding 01-requirements ... logs templates
```
Read `ERP_DEV/docs/README.md`, then `ERP_DEV/docs/logs/STATE.md` (current phase + next action).

## 4. Run the tests
```
cd ERP_DEV
export JAVA_HOME=$(echo ~/.local/java/*/ | head -1) && export PATH=$JAVA_HOME/bin:$HOME/.local/maven/bin:$PATH
mvn -B verify
# expected: Tests run: 4, Failures: 0, Errors: 0 (RoomCategoryApiTest) + BUILD SUCCESS;
# jar at services/erp-app/target/erp-app-0.1.0-SNAPSHOT.jar
```

## 5. Run the slice live
PREFERRED (Windows + Fedora): `node run-local.mjs [postgres|h2] [--web]` — one
command that always sets the DB + issuer vars (lesson 2026-10-10: hand-typed env
drops the issuer and breaks every login). Prereqs: Node 22 + Java 21 + Maven
(on PATH, or JAVA_HOME/MAVEN_HOME). `--web` also starts Vite on :5173; `--print`
shows the resolved Java/Maven paths, classpath cache and env without starting
anything. Keycloak must be up first (see §5c). Fedora convenience:
`./run-local.sh [postgres|h2]` (bash, same behaviour). Windows Docker command:
`docker compose -f ERP_DEV/infra/docker-compose.local.yml up -d keycloak`
(no `sg docker` wrapper needed there).
```
cd ERP_DEV/services/erp-app
export JAVA_HOME=$(echo ~/.local/java/*/ | head -1) && export PATH=$JAVA_HOME/bin:$PATH
mvn -B -q dependency:build-classpath -Dmdep.outputFile=/tmp/cp.txt -Dmdep.includeScope=test
CP="target/classes:$(cat /tmp/cp.txt)"
DB_URL="jdbc:h2:mem:livedb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1" DB_USER=sa DB_PASSWORD= \
  timeout 100 java -cp "$CP" com.quantumclk.erp.ErpApplication &
sleep 30
curl -s http://localhost:8080/api/v1/health
# expected: {"status":"UP","service":"erp-app"}
curl -s http://localhost:8080/api/v1/room-categories | head -c 300
# expected: {"items":[{"id":"22222222-...","name":"Deluxe",...}],"page":0,"total":3}
# UI: open http://localhost:8080/ (static slice page; React SPA replaces it in Phase 3)
# OpenAPI: http://localhost:8080/v3/api-docs (published copy: docs/02-architecture/openapi/erp-app.json)
```
With Docker: `docker compose -f ERP_DEV/infra/docker-compose.local.yml up` (Postgres etc.), then run the jar with
`DB_URL=jdbc:postgresql://localhost:5432/resort_erp DB_USER=resort_user DB_PASSWORD=... java -jar target/*.jar`.
Note: the global system Postgres already uses 5432 on this machine — start only
what you need (e.g. `up -d keycloak`), never the compose `postgres` alongside it.

## 5c. Staff login (Keycloak SSO)
```
sg docker -c "docker compose -f ERP_DEV/infra/docker-compose.local.yml up -d keycloak"
# wait ~60s, then expect 200:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/realms/resort/.well-known/openid-configuration
# backend with issuer (H2 example; use DB_URL for Postgres):
KEYCLOAK_ISSUER_URL=http://localhost:8081/realms/resort java -jar target/*.jar
# web: npm run dev → Staff log in → reception-staff / change-me-dev-only (DEV-ONLY).
# Full runbook + live proof table: docs/05-operations/keycloak.md
```

## 5b. Run the web shell
```
cd ERP_DEV/web
export PATH=$HOME/.local/node/bin:$PATH
npm install          # first time only (deps → node_modules/, git-ignored)
npm run build        # expected: ✓ built (tsc + vite)
npm run dev          # vite dev server; /api proxied to localhost:8080 (see vite.config.ts)
```

## 5d. Ops console (internal, Phase 1)
With an `OPS_*` or `SUPERADMIN` login, open **Ops Console** in the web sidebar. It is read-only: status, integrations, flags and audit. Blank `OPS_*_URL` values show `NOT_CONFIGURED` (expected locally).
```
curl -s http://127.0.0.1:9091/actuator/health    # {"status":"UP"} on loopback, no token
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/v1/ops/status  # 401 anonymously
```
JSON logs go to `logs/erp-app.jsonl` under the backend working directory; secrets are redacted. Full runbook: `docs/05-operations/ops-console.md`; signal contract: `docs/02-architecture/observability.md`.

## 6. Repo map
`ERP_Resort/`: agent config (`.opencode/`, `AGENTS.md`) + `ERP_DEV/` (the project: `pom.xml`, `services/erp-app/`,
`infra/docker-compose.local.yml`, `docs/`, `.env.example`; `web/` React lands in Phase 3).
`services/erp-app/src/main/java/com/quantumclk/erp/`: `ErpApplication`, `health/`, `common/` (error shape),
`erp02/` (room-category slice; packages per SOW module), `ops/` (read-only ops console + logging filters).
Migrations: `src/main/resources/db/migration/V1__...sql` (V9 = ops permissions/flags).
Git root is `ERP_Resort/`; skill path `docs/...` = `ERP_DEV/docs/...`.

## 7. Workflow in one page
Work unit by work unit (Rule 3 loop): understand → docs-only plan (approved) → `feature/<unit>-<slug>`
from `develop` → tests-first where logic matters → thin vertical slices → verify → document → record →
present → **ask to commit, wait**. Phase gate at each phase end: report → fresh-developer test →
"continue to Phase N+1?" → wait. Conventional Commits; never commit/merge/push without explicit approval.

## 8. First small change (worked example, code)
1. `git checkout develop && git checkout -b feature/<unit>-<slug>`
2. Change code + test in `services/erp-app`, update the matching `docs/04-modules/*.md` in the same change (Rule 6).
3. `mvn -B verify` → green; show `git status` / `git diff --stat`; ask the user to approve the commit; only then commit.
4. Update `logs/DEVLOG.md` + `logs/STATE.md` with what was done, hash, verification.

## 9. Where things are logged
Decisions: `logs/DECISIONS.md` (big ones → `02-architecture/adr/ADR-NNN-slug.md`).
Questions: `logs/OPEN_QUESTIONS.md`. Resources used: `logs/RESOURCES_LOG.md`. Risks: `logs/RISKS.md`.

## 10. Common problems
- Resource drive unreadable → stop, tell the user (never work around it or invent inputs).
- `mvn` needs Maven Central access on first run (~100MB downloads to `~/.m2`); offline builds fail before that.
- Live run without Postgres → use the H2 test-classpath command above, or start compose first.
- Flyway "newer H2 than tested" warning in tests → harmless (test scope only).
- Logged in but Live screens show only the login hint (or valid tokens get 500) → backend is missing
  `KEYCLOAK_ISSUER_URL` (lesson 2026-10-10). Run the mandatory pre-login check in
  `docs/05-operations/keycloak.md` before debugging anything else.

## 11. When stuck
Read `STATE.md` (next action), `OPEN_QUESTIONS.md` (known unknowns), `WORKING-AGREEMENT.md` (process).
Ask the user — silence is not approval for commits, merges, or phase moves.
