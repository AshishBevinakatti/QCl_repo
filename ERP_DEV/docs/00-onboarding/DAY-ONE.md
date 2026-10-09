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

## 5. Run the slice live (test-classpath H2 mode — no Docker needed)
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

## 6. Repo map
`ERP_Resort/`: agent config (`.opencode/`, `AGENTS.md`) + `ERP_DEV/` (the project: `pom.xml`, `services/erp-app/`,
`infra/docker-compose.local.yml`, `docs/`, `.env.example`; `web/` React lands in Phase 3).
`services/erp-app/src/main/java/com/quantumclk/erp/`: `ErpApplication`, `health/`, `common/` (error shape),
`erp02/` (room-category slice; packages per SOW module). Migrations: `src/main/resources/db/migration/V1__...sql`.
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

## 11. When stuck
Read `STATE.md` (next action), `OPEN_QUESTIONS.md` (known unknowns), `WORKING-AGREEMENT.md` (process).
Ask the user — silence is not approval for commits, merges, or phase moves.
