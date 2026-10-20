# Project State
Updated: 2026-10-20T19:31:49+05:30
Phase: 3 – Core Development      Work unit: 3.9 observability and secure operations console — Phase 1 implemented, awaiting commit approval
Status: Phase 1 COMMITTED at `45c8e88` (feature branch, not merged/pushed); backend 71/71 tests, web 4/4, lint/build green; live demo verified.
Branch: feature/3.9-observability-ops-console (base develop @ `a09d7c5`)      Tree: clean after records follow-up; root .vscode/ untracked (pre-existing, out of scope)
Last approved by user: 2026-10-20 — 3.9 Phase 1 plan, target repo, stack, ops roles and dependencies; 3.8/launcher/Module 2 records already merged
Standing instruction (2026-10-20): every future feature must connect to the ops/observability baseline (logs/request ID, audit, health/status, flags, permissions, tests, docs) — checklist in `02-architecture/observability.md`; decision D-009.
Phase 1 delivered: V9 ops permissions/flags; DB permission resolver; read-only ops status/integrations/flags/audit API; request-ID + JSON redacted logs; Actuator + Micrometer/OTel (tracing off by default); loopback management health; ops UI shell; Keycloak OPS_* roles; tests; docs
Verification: `mvn -B -f services/erp-app/pom.xml verify` BUILD SUCCESS (71 tests); `npm --prefix web test` 4/4; `npm --prefix web run lint` exit 0 (pre-existing warnings); `npm --prefix web run build` green (313.26 kB JS); runtime smoke on Postgres: health UP on :9091, ops/main actuator 401 anonymously, JSON logs, no exporter errors
Next action: await user decision on next work unit / Phase 2 (observability stack); do not merge/push without explicit approval
Servers: RUNNING for user demo — backend :8080, management :9091, web :5173, Keycloak :8081 (`infra-keycloak-1`). Stop on request. Launcher PID in `/tmp/opencode/erp-live.pid`; log `/tmp/opencode/erp-live.log`.
Open items: Q-002…Q-004, Q-007…Q-009, Q-012; 3.8 browser click-through; delete `fix/hide-table-scrollbar` (approval pending); production observability credentials/infra + Sentry DSN absent (documented gaps); no telemetry stack/Dockerfile/K8s/CI-CD, audit retention job pending; springdoc spec lag (pre-UAT must-fix)
