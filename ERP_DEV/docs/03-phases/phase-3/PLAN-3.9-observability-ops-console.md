# Unit 3.9 Plan — Observability & Secure Developer Operations Console

- Purpose: define how the Billzova observability/secure-operations platform is adapted to the real Golden Hills Resort ERP repository, what exists, what is missing, what will be built in which phase, and the security boundaries. Audience: user (approver), developers, SRE/DevOps. Date: 2026-10-20. Owner: project team.
- Entry: Phase 3 in progress on `develop` (`bdd7252`); tree clean except the pre-existing untracked root `.vscode/`. Planning only — no code, dependency, migration, branch or commit until approval (ERP Rule 3).
- Target ambiguity (Q-013): the request names **Billzova**, but this repository is the Golden Hills Resort ERP. In this repository `billzova-web` is only a separate frontend-only reference used for the Module 2 plan (`D:\dev\billzova-web`, user-authorised, no backend). This plan targets the **ERP repository**; if you meant a separate Billzova repository, stop and provide its path.
- Tooling conflict (Q-014): the resource-folder playbook §9 says Prometheus + Grafana + **Jaeger** + **ELK**; the latest instruction says OpenTelemetry + Prometheus + Grafana + **Tempo** + **Loki**. This plan follows the latest instruction; no client-facing behaviour changes.

## 1. Goal

Give authorised developers a server-enforced, audited, read-only-first console for observing the live system (health, logs, traces, metrics, database, jobs, deployments, flags) and, only later and behind explicit approval gates, controlled operational actions. Every screen must show real telemetry with timestamps and honest `OK / DEGRADED / UNAVAILABLE / UNKNOWN` states; no fabricated metrics, statuses or integrations.

The full platform is delivered in ERP work units. **Approval of this plan authorises Phase 1 only**; later phases require their own go-ahead under ERP Rule 3.

## 2. Repository audit (read-only, 2026-10-20)

### 2.1 Actual architecture

| Component | Reality | Implication |
|---|---|---|
| Backend | One Spring Boot **modular monolith** `services/erp-app` (Java 21, Boot 3.2.5), module packages `erp02…erp07` | Ops APIs go in a new `ops` package inside the same service; no microservice split |
| Gateway | None | No service-to-service tracing/gateway work in Phase 1 |
| Auth | Keycloak 24 realm `resort`, public PKCE client `erp-web`; JWT roles → authorities; deny-by-default `SecurityConfig`; method `@PreAuthorize` | Reuse SSO; add ops roles/permissions server-side |
| RBAC data | `role_permission(role, permission)` seeded in V2, but **not used at request time** (authorities come straight from JWT role names) | Add a permission resolver against this table; do not trust client-side role checks |
| Audit | `audit_event` append-only by application code; `AuditLog` used for business/config writes; **no audit read API/viewer** | Reuse the table for ops events; add a restricted read API and later tamper-evidence |
| Config/flags | `app_config` table + `ConfigController` (read any login, write SUPERADMIN, audited); keys such as `booking.*`; no feature-flag semantics | Build feature-flag read view now; writes in Phase 4 with preview/confirmation |
| Health | Public `/api/v1/health` returns a static `{"status":"UP"}` | Add Actuator health + honest dependency states; never infer health from a single endpoint |
| Jobs | Two `@Scheduled` jobs (`HoldExpiryJob`, `MembershipExpiryJob`); no queue, run history, retry, DLQ or worker | Phase 2/3 records real job runs; no retry/replay until idempotency is proven |
| Logs | Default Spring Boot text logs; no JSON, request ID, trace ID or redaction rules | Add structured JSON, MDC correlation and redaction |
| Metrics/tracing | None exposed | Add Actuator/Micrometer Prometheus + Micrometer Tracing OTel |
| Frontend | React 19 + TS + Vite SPA in `web/`; state-switched views (`View` union), no router; Keycloak SSO; no Sentry/PWA | Add an `ops` view + API client; reuse existing UI/CSS; no second console app |
| Infra | Compose has Postgres 16, Redis 7, Kafka 3.7, Keycloak 24. Redis/Kafka have **no application code usage**; no Prometheus/Loki/Tempo/Grafana; no Dockerfile, K8s or Helm | Add a separate local observability Compose file; do not claim production deployment |
| CI/CD | GitHub Actions: Ubuntu backend build/tests, realm contract, gitleaks, dependency review. **No image build, deployment or rollback pipeline** | Deployment/rollback modules are blocked on missing CI/CD; document, do not fake |
| Tests | 58 backend tests (last verified 2026-10-20, 0 failures); no frontend test runner | Add backend security/integration tests; add Vitest for ops UI if approved |
| Tenancy | Single property (`GOLDEN_HILLS_PROPERTY_ID` constant); `property_id` columns exist | Scope ops records to the property; multi-property isolation is future work |
| Hosting | Local/demo only; hosting provider undecided (`environments.md`) | No production credentials or cluster access exist; production readiness cannot be claimed |

### 2.2 Existing vs required capabilities

| Module | Existing | Missing / decision |
|---|---|---|
| A — Overview | Static `/api/v1/health`; live dashboard business screens | Aggregate health, integrations, request/error/latency, resources, DB, jobs, alerts, deployments, telemetry freshness |
| B — Logs | Text stdout, no correlation IDs | JSON schema, request/trace IDs, Loki pipeline, bounded search, redaction |
| C — Tracing | None | OTel instrumentation, Tempo, frontend→backend context, log↔trace links |
| D — Metrics/alerts | None | Actuator/Micrometer, Prometheus, alert rules, stale-telemetry detection |
| E — Database | App pool only; no metrics | `postgres_exporter` + read-only `pg_monitor` role, bounded diagnostics |
| F — Deployments | No CI/CD deployment | Read-only history model; integration blocked until a pipeline exists |
| G — Flags | `app_config` generic | Flag semantics, validation, preview/confirm, audited writes (Phase 4) |
| H — Jobs | Two scheduled jobs | Run history, queue depth where applicable, retry only after idempotency proof |
| I — Operations | None | Deny-by-default operations API + isolated worker; read-only diagnostics first |
| J — Security | Keycloak, deny-by-default, some RBAC tests | Granular ops permissions, roles, rate limits, headers, approval separation |
| K — Audit | Append-only app writes | Ops audit actions, viewer/export/filter, retention, tamper-evidence |
| L — Developer UX | Existing design system | Ops console shell, environment/time selectors, honest loading/empty/error/stale states |

### 2.3 Constraints and missing inputs

- No production deployment target, Kubernetes cluster, CI/CD deployment pipeline, Grafana/Sentry account, or production credentials in this repository.
- No Billzova backend exists here; `billzova-web` is a separate frontend demo and is not a source under ERP Rule 1.
- Cloud data warehouse is not justified by any current requirement; it is excluded.
- Redis/Kafka are provisioned locally but unused by code; Kafka consumer-lag UI will be `not configured` until a real consumer exists.
- The app currently runs on the host (via `run-local.mjs`); local telemetry must work without containerising the app in Phase 1.

## 3. Proposed architecture (adapted, not a rewrite)

```
Browser (existing React SPA)
  ├─ Staff ERP screens (unchanged)
  ├─ Ops console (new /ops view, role-gated in UI; server enforces)
  └─ Sentry/GlitchTip SDK (only when VITE_SENTRY_DSN is set)

erp-app (Spring Boot monolith, Java 21)
  ├─ /api/v1/**            existing business APIs (unchanged)
  ├─ /api/v1/ops/**        new ops API (read-only in Phase 1)
  ├─ /actuator/**          management port 9091, loopback/private only
  ├─ JSON logs + MDC       requestId, traceId, spanId; redaction
  └─ OTLP traces ────────► otel-collector ──► Tempo
                              │
        JSON log file ───────► filelog receiver ──► Loki
  Prometheus ◄── scrape ──────┘ host:9091 /actuator/prometheus
      ▲
      └── postgres_exporter (read-only monitoring role)

Grafana (127.0.0.1:3000 local) ── datasources: Prometheus, Loki, Tempo
Ops API ── server-side, allowlisted queries ──► Prometheus / Loki / Tempo HTTP APIs
```

- Local development uses a separate `infra/docker-compose.observability.yml`; the existing local Compose file is not modified.
- Production topology (separate services, TLS, Cloudflare Access/Tailscale, secrets manager, retention) is documented but not deployed — no production environment exists here.
- The ops API never proxies arbitrary URLs, PromQL, LogQL or SQL. It accepts bounded, typed parameters and maps them to allowlisted queries.

## 4. Security model

### 4.1 Roles and permissions

Add realm roles (Keycloak JSON, local/demo only until production provisioning): `OPS_VIEWER`, `OPS_DEVELOPER`, `OPS_OPERATOR`, `OPS_ADMIN`, `OPS_APPROVER`. Existing `SUPERADMIN` keeps `*` for local bootstrap. The existing `OPS` resort role is **not** reused as a developer role.

Seed granular permissions in `role_permission` (V9):

| Permission | Viewer | Developer | Operator | Admin | Approver |
|---|---|---|---|---|---|
| `ops.read` | yes | yes | yes | yes | yes |
| `logs.read` | yes | yes | yes | yes | yes |
| `traces.read` | yes | yes | yes | yes | yes |
| `metrics.read` | yes | yes | yes | yes | yes |
| `flags.read` | yes | yes | yes | yes | yes |
| `audit.read` | — | — | — | yes | yes |
| `jobs.read` | — | yes | yes | yes | yes |
| `jobs.retry` | — | — | yes | — | yes |
| `flags.write` | — | — | — | yes | — |
| `operations.request` | — | — | yes | — | — |
| `operations.approve` | — | — | — | — | yes |

- The backend resolves permissions from `role_permission` for the authenticated JWT role(s); frontend role display is not security.
- Separation of duties: the approver must not approve their own high-risk operation (enforced when Phase 4 writes are built).
- Tests must cover every allow/deny pair used by controllers.

### 4.2 Audit

- Reuse `audit_event`: actor, role (resolved server-side), action, target, environment, reason, before/after (non-secret), IP, timestamp, request ID, operation ID, result.
- Phase 1 audits ops privilege use (status/integration/flag/audit reads and denied attempts at a bounded rate) without logging query payloads that may contain customer data.
- Later phases add a DB trigger/hash chain for tamper evidence on Postgres; application code only appends. No console API can update/delete audit rows.
- Never audit secrets, tokens, cookies, authorization headers or full request bodies.

### 4.3 Network and access

- Local: Grafana/OTLP/Prometheus publish to `127.0.0.1` only; the app management port is local-only. Never expose observability ports publicly.
- Production (documented, not built): Cloudflare Access or Tailscale in front of Grafana/ops; private network policy; TLS; secrets from Vault/K8s Secrets; no public Actuator.
- Existing Keycloak redirect URI restriction (`http://localhost:5173/*`) stays; use `localhost`, not `127.0.0.1`.

### 4.4 Data minimisation

- Structured log schema allowlist: timestamp, level, service, environment, requestId, traceId, spanId, route template, method, status, duration, error type, safe message.
- Redact `Authorization`, `Cookie`, `Set-Cookie`, `password`, `token`, `secret`, card/ID fields; no request/response bodies by default.
- Ops API responses redact internal hostnames, stack traces and infrastructure errors; error bodies use the existing `ApiError` shape with a correlation ID.
- Queries are bounded: time range ≤ 24 h (default 1 h), result limit ≤ 200, bounded page sizes.

## 5. Data model changes (planned migrations)

| Migration | Phase | Contents |
|---|---|---|
| V9 | 1 | Seed `role_permission` rows for the five ops roles; no business-table change |
| V10 | 2/3 | `ops_job_run` (job name, started/finished, state, duration, error summary, counts) — real scheduled-job history |
| V11 | 3 | `ops_deployment_event` (build/release ID, commit, environment, status, actor, timestamps, health result) — populated only by a future CI integration |
| V12 | 4 | `ops_operation` (actor, action, target, environment, reason, state, approval, idempotency key, timestamps, result) + `ops_operation_event` audit trail |
| Later | 6 | Audit tamper-evidence trigger/indexes; retention jobs |

No existing table, schema column or migration is modified. Flyway remains forward-only; tests use H2 PG mode, runtime uses Postgres.

## 6. API design (versioned, OpenAPI-annotated)

Phase 1 (implemented after approval):

| Method/path | Permission | Behaviour |
|---|---|---|
| `GET /api/v1/ops/status` | `ops.read` | Aggregate service/integration state with `generatedAt`, `observedAt`, `stale`, per-source state; no fake values |
| `GET /api/v1/ops/integrations` | `ops.read` | Configured/unconfigured/unknown per telemetry source, with last check |
| `GET /api/v1/ops/flags` | `flags.read` | Read-only flags derived from `app_config` (`feature.*`), with defaults and type |
| `GET /api/v1/ops/audit?page=&size=&action=&since=` | `audit.read` | Paged audit search; bounded page size; no secret fields |

Phase 2:

| Method/path | Permission | Behaviour |
|---|---|---|
| `GET /api/v1/ops/metrics/query?queryId=&from=&to=` | `metrics.read` | Allowlisted metric queries only; bounded range |
| `GET /api/v1/ops/logs/search?requestId=&traceId=&severity=&service=&since=&limit=` | `logs.read` | Loki proxy with typed selectors; bounded results |
| `GET /api/v1/ops/traces/{traceId}` | `traces.read` | Tempo trace by validated hex ID |
| `GET /api/v1/ops/database` | `metrics.read` | Freshness, connections, slow queries, locks, storage (read-only) |
| `GET /api/v1/ops/dashboards` | `ops.read` | Allowlisted Grafana links, never arbitrary URLs |

Phase 3: `/ops/alerts`, `/ops/deployments`, `/ops/jobs`.
Phase 4: `/ops/flags/{key}` (PATCH, preview/confirm), `/ops/jobs/{id}/retry`, `/ops/actions` (request/approve/status) — all audited and asynchronous.
Phase 5: deployment request/rollback — **blocked** until a real pipeline exists.

Common contract: `generatedAt`/`observedAt` timestamps; states `OK|DEGRADED|UNAVAILABLE|UNKNOWN`; `stale` flag; `X-Request-Id` echoed; consistent `ApiError`; no 200 with fabricated zeros when a source is down.

## 7. Frontend design

- Add `ops` to the existing `View` union and sidebar (visible only to ops roles; server still enforces).
- New `web/src/ops/` module with tabs: Overview, Logs, Traces, Metrics, Database, Deployments, Flags, Jobs, Audit, Actions.
- Phase 1 implements Overview, Flags and Audit; other tabs show an explicit "Not configured in Phase 1" state, never sample data.
- Reuse `Card`, `Badge`, `Btn`, `Stat`, `Alert`, `Soon` and existing CSS; no new UI framework, no router.
- Global controls: environment selector (local only in Phase 1), time range, request/trace search, freshness timestamp.
- Every panel has loading, empty, error and stale states. Backend unavailable shows the actual failure and last successful observation time.
- Preview mode is not used for ops; live only.
- Accessibility: labelled controls, keyboard focus, aria-live for operation results, no colour-only status.

## 8. Telemetry configuration (local, real)

- App → collector: OTLP HTTP `http://localhost:4318` (traces; batched, non-blocking; app starts if collector is down).
- Metrics: Prometheus scrapes `host.docker.internal:9091/actuator/prometheus` (Compose `extra_hosts: host-gateway`; management port local-only; documented firewall note). No unbounded labels.
- Logs: JSON file appender (`LOG_FILE`, default `logs/erp-app.jsonl`, git-ignored) → collector `filelog` receiver → Loki. Redaction happens before the encoder.
- Database: `postgres_exporter` with a dedicated `pg_monitor`-only user; no app credentials reuse.
- Grafana: provisioned datasources and starter dashboards; local admin password from `infra/.env` (fake default documented, never a real secret).
- Retention: local Prometheus/Loki/Tempo 7 days, bounded disk; production retention is a Phase 6 decision.
- Alerts (Phase 2/3): API error rate, p95 latency, service down, DB connections, stale telemetry, failed jobs; notification channels only when credentials exist, otherwise documented as unconfigured.
- Frontend errors: `@sentry/react` initialised only when `VITE_SENTRY_DSN` is set; GlitchTip is Sentry-compatible. Without a DSN, the UI reports "frontend error monitoring not configured" and does not pretend to send events.

## 9. Dependencies requiring approval (no versions upgraded)

Backend (`services/erp-app/pom.xml`, versions managed by Boot 3.2.5 unless noted):
- `spring-boot-starter-actuator`
- `micrometer-registry-prometheus`
- `micrometer-tracing-bridge-otel`
- `opentelemetry-exporter-otlp`
- `net.logstash.logback:logstash-logback-encoder` (explicit version; JSON logs)

Frontend (`web/package.json`):
- `@sentry/react` (React 19-compatible version; exact version chosen and recorded at implementation)

Testing/infra:
- Backend: existing test stack only (MockMvc, H2); no Testcontainers in Phase 1.
- Frontend: add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` for ops component tests (Phase 1) — approval requested.
- Compose images (Phase 2): pinned `otel/opentelemetry-collector-contrib`, `prom/prometheus`, `grafana/loki`, `grafana/tempo`, `grafana/grafana`, `prometheuscommunity/postgres-exporter`; no `:latest`.

No Java, Spring Boot, Spring Cloud, React, Vite or TypeScript version changes.

## 10. Phases, scope and acceptance criteria

### Phase 0 — Assessment (this document)
- [x] Repository audit, gap analysis, constraints, plan.
- [x] User approval (2026-10-20; Phase 1 only).

### Phase 1 — Foundation, access security, read-only skeleton (implemented 2026-10-20, awaiting commit approval)
Scope: V9 permission seeds; permission resolver; ops API `status`, `integrations`, `flags`, `audit`; request-ID/JSON logging/redaction; Actuator + tracing config; Ops UI shell with Overview/Flags/Audit; env templates; tests; docs.
Acceptance (as-built 2026-10-20):
- [x] Unauthenticated ops calls return 401; non-ops roles 403; each allowed permission returns 200 (tests).
- [x] `status` reports `OK/DEGRADED/DOWN` plus per-source `UP/UNAVAILABLE/NOT_CONFIGURED` with timestamps; no fabricated metrics.
- [x] Ops reads are audited; no secrets/PII in logs or responses.
- [x] App starts with telemetry endpoints unavailable; failures are logged, not fatal.
- [ ] Frontend ops view shows honest unconfigured states and is covered by build + 4 Vitest tests; manual browser/keyboard click-through still pending (no browser host).
- [x] Existing tests stay green; new tests pass; lint/build green; docs updated; no business-table change (V9 permissions/flags only). 71 backend + 4 frontend tests green.

**Phase 1 as-built (2026-10-20).** Endpoints and permissions are more granular than the approval draft: `GET /ops/status` → `ops.read`; `/ops/integrations` → `ops.integrations.read`; `/ops/flags` → `ops.flags.read`; `/ops/audit?page&size&action&days` → `ops.audit.read`. Overall states are `OK/DEGRADED/DOWN`; per-source states are `UP/UNAVAILABLE/NOT_CONFIGURED`; `DEGRADED` means a configured telemetry source is not `UP`. Audit reads are deduped (60s per actor/action) and bounded (size ≤100, days ≤90); **denied attempts are not yet audited** (deferred to Phase 2). The UI puts integration health on the Overview and exposes explicit Phase 2/4 "Soon" tabs (Logs, Traces, Alerts, Jobs, Incidents, Deployments). Implementation evidence: `DEVLOG.md` entry 2026-10-20T18:53:49+05:30.

### Phase 2 — Read-only observability
Scope: observability Compose stack, Prometheus/Loki/Tempo/Grafana provisioning, postgres-exporter, logs/metrics/traces/database endpoints and UI tabs, Sentry SDK, correlation.
Acceptance: one live request produces a correlated JSON log, trace and metric visible in the console and Grafana; an unavailable backend shows `UNAVAILABLE`, not zeros; redaction test passes; database monitoring uses a read-only role.

### Phase 3 — Incident investigation
Scope: alert rules/status, deployment history model + honest empty state, job run history, log↔trace navigation, stale-telemetry alerts.
Acceptance: investigate a seeded local error using request ID → log → trace; alerts have severity/duration/source; deployments show "not configured" until CI exists.

### Phase 4 — Controlled operations
Scope: feature-flag writes with preview/confirmation/audit; job retries only after idempotency proof; operation state machine + approval separation. Service restart/scale remain **blocked** (no supervisor/K8s) and are documented as such.
Acceptance: duplicate requests execute once; operator cannot approve own high-risk action; every operation has durable state and audit.

### Phase 5 — Deployment and recovery
Scope: CI/CD adapter, deployment requests, health verification, rollback workflow.
Status: **blocked** — the repository has no image build/deploy pipeline, cluster or rollback mechanism. Deliver a design + required integration contract only; no fake controls.

### Phase 6 — Hardening and production readiness
Scope: security tests, retention, backup/restore validation, resource limits, production deployment guide, incident/rollback runbook, final report.
Acceptance: checklist complete; limitations stated; no production claim without evidence.

## 11. Phase 1 implementation slices (after approval)

1. V9 migration + permission resolver + security tests (401/403/allow matrix).
2. Ops API: `status`, `integrations`, `flags`, `audit`; audit writer integration; bounded paging; OpenAPI annotations.
3. Request-ID filter + structured JSON logging + redaction + MDC tests.
4. Actuator/Micrometer/OTel configuration + management-port handling + env template; verify app starts with no collector.
5. Frontend ops shell + typed API client + Overview/Flags/Audit panels + honest unconfigured states + Vitest tests.
6. Docs (`02-architecture/observability.md`, `05-operations/ops-console.md`, security checklist), full `mvn -B verify`, `npm run lint/build`, present for commit approval.

Branch: `feature/3.9-observability-ops-console` from `develop`, created only after approval.

## 12. Testing strategy

- Unit: permission resolution, action-state validation (later), redaction, request-ID filter, status aggregation with unavailable sources.
- Integration: MockMvc + H2 for ops endpoints; audit rows written; flag reads; 401/403; malformed query parameters; bounded time ranges.
- Security: anonymous access, wrong role, role escalation attempt via client, audit immutability (no update/delete API), secret/cookie/header redaction, log-injection attempts, SSRF attempt against proxy endpoints (Phase 2).
- Frontend: Vitest/RTL for ops route visibility, loading/empty/error/stale states, keyboard controls.
- End-to-end (Phase 2): live request → request ID → Loki log → Tempo trace → Prometheus metric; unavailable integration → honest state.
- Not run: production load, Kubernetes, Cloudflare/Tailscale, real Sentry, real OTA/payment systems — no credentials/infrastructure.

## 13. Documentation and deliverables

- This plan; `docs/02-architecture/observability.md` (components, data flows, receivers/exporters, retention, failure behaviour).
- `docs/04-modules/ops-console.md` (capabilities, roles, limits).
- `docs/05-operations/ops-console.md` (start/stop, URLs, troubleshooting, access revocation).
- `docs/05-operations/security-checklist.md`; incident/rollback runbook (Phase 3/6).
- API documentation via springdoc; env templates with placeholders only.
- Phase reports after each unit; DEVLOG/STATE updated.

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Scope explosion (12 modules, production platform) | Delays core ERP; half-built console | Strict phase gates; Phase 1 only now |
| No production environment/credentials | Cannot claim production readiness | Local implementation + explicit limitation table |
| Ops console becomes an SSRF/arbitrary-query proxy | Data breach | Allowlisted queries, typed params, timeouts, bounded results, server-side auth |
| Logs capture PII/secrets | Privacy/security incident | Allowlist schema, redaction before storage, tests |
| Observability ports exposed publicly | Unauthorised access | Loopback bind locally; production access via Access/Tailscale + private network |
| DB exporter over-privileged | Data modification risk | `pg_monitor` read-only role, separate credentials |
| Audit table mutable by DB admin | Weak tamper evidence | App append-only now; DB trigger/hash chain Phase 6 |
| Existing Boot 3.2.5 older than current | Missing newer telemetry features | Do not upgrade without separate ADR; use supported APIs |
| Single-property assumption | Future tenant leak | Scope all ops records by `property_id`; revisit before multi-property |
| Tool conflicts (Jaeger/ELK vs Tempo/Loki) | Rework | Q-014; follow latest instruction, record decision |
| Billzova vs ERP target mismatch | Wasted implementation | Q-013; blocking confirmation |

## 15. Out of scope

Microservice split, API gateway, PWA/service worker, Kafka/Redis application features, cloud data warehouse, production deployment, Kubernetes/Helm/Dockerfile manifests (until a target exists), CI/CD deployment/rollback (blocked), arbitrary shell/SQL/infrastructure mutation, real Sentry/Cloudflare/Tailscale credentials, Billzova `billzova-web` code/assets, client data in logs, dependency upgrades.

## 16. Definition of done (Phase 1)

- [ ] Plan approved and branch created from `develop`.
- [ ] Ops API and UI foundation implemented with server-side permissions and audit.
- [ ] Structured logs, request IDs and tracing configuration verified locally.
- [ ] Tests green (existing + new), lint/build green, docs updated, no secrets.
- [ ] Honest integration states; no fabricated production data.
- [ ] Presented for commit approval; commit/merge only with explicit approval.

## 17. Approval requested

1. Confirm target: this ERP repository (Q-013), not a separate Billzova codebase.
2. Confirm observability stack: OpenTelemetry + Prometheus + Grafana + Tempo + Loki (Q-014) instead of the playbook's Jaeger/ELK.
3. Approve the dependency list in §9 and the ops role model in §4.
4. Approve Phase 1 implementation only; later phases will be presented separately.
