# Observability baseline — Phase 1 (3.9)

- Purpose: what the ERP emits today for operations, where it goes, and what is deliberately not collected. Audience: developers, operators, approver. Last verified: 2026-10-20 (branch `feature/3.9-observability-ops-console`). Owner: project team.
- Scope: internal engineering/operations tooling. No SOW feature, no guest-facing behaviour, no data-model change beyond V9 permissions/flags.

## Implemented in Phase 1

| Signal | State | Notes |
|---|---|---|
| JSON application logs | **on** | Console + rolling file (`logs/erp-app.jsonl` by default), one JSON object per line. |
| Request correlation | **on** | `X-Request-Id` validated/echoed; also in MDC and error responses. |
| Log redaction | **on** | Passwords, tokens, API keys, authorization/cookie headers and JSON secret fields are masked before write. |
| Actuator health/info | **on** | Separate management port `9091`, bound to `127.0.0.1` by default; only `health,info` exposed. |
| Prometheus scrape endpoint | **wired, not exposed** | `micrometer-registry-prometheus` is on the classpath; exposure is Phase 2. |
| Distributed tracing | **wired, off by default** | `micrometer-tracing-bridge-otel` + OTLP/HTTP exporter; enable only when a collector endpoint exists (`OTEL_TRACING_ENABLED=true`). |
| Sentry (browser) | **optional** | Initialised only when `VITE_SENTRY_DSN` is set; PII/headers/bodies disabled. |
| Metrics/logs/traces UI | **Phase 2** | The ops console shows honest `NOT_CONFIGURED` states until then. |

## Log contract

Each line is JSON with at least:

```json
{"@timestamp":"2026-10-20T12:00:00.000Z","level":"INFO","logger_name":"com.quantumclk.erp...","thread_name":"http-nio-8080-exec-1","service":"erp-app","environment":"local","requestId":"...","traceId":"...","spanId":"...","message":"human-readable"}
```

- `service` and `environment` are emitted for every line, including startup and scheduled jobs.
- `requestId` is present for HTTP-originated lines; `traceId`/`spanId` appear when tracing supplies them.
- Stack traces are a separate `stack_trace` field.
- The message provider redacts before serialisation, so redaction also applies to file logs, not just the console.

## Request IDs

`RequestIdFilter` runs before the security chain:

1. Accepts `X-Request-Id` only if it matches `[A-Za-z0-9._:-]{8,64}` (prevents log injection).
2. Otherwise mints a UUID.
3. Stores it in the request attribute `erp.requestId`, response header and MDC.
4. Security error handlers and `GlobalExceptionHandler` reuse the same ID in `{code,message,requestId,details}`.

The browser client sends an ID on every API request and includes the server's ID in error text, so a screenshot or support message can be correlated to logs.

## Redaction rules

Applied by `LogRedactor` to log messages and audit payloads returned by the ops API:

- `password`, `passwd`, `pwd`, `secret`, `token`, `access_token`, `refresh_token`, `api_key`, `authorization`, `cookie`, `set-cookie`
- `Authorization: Bearer …` / `Basic …`, standalone `Bearer …`, `Cookie:`/`Set-Cookie:` header values
- JSON equivalents such as `"password":"…"`

Rules are unit-tested (`LogRedactorTest`). Code must still avoid logging headers, bodies, tokens or PII in the first place; redaction is a last line of defence, not permission to log secrets.

## Management port

```
management.server.port=${MANAGEMENT_PORT:9091}
management.server.address=${MANAGEMENT_ADDRESS:127.0.0.1}
management.endpoints.web.exposure.include=health,info
```

- A separate security filter chain permits only actuator endpoints on this port; the main API chain remains deny-by-default.
- Do not bind the management port to a public interface or expose it through the reverse proxy without an approved network control.
- Prometheus scraping and `/actuator/prometheus` are Phase 2. Until then the endpoint is intentionally not exposed.

## Failure behaviour

- Missing telemetry URLs → `NOT_CONFIGURED` (no network calls, no invented data).
- A configured endpoint that fails → `UNAVAILABLE`, with the last success time retained for staleness checks.
- OTLP collector down and tracing enabled → the app still starts and serves traffic; export failures are logged by the OTel exporter. Tracing is **off by default locally** to avoid error noise.
- Database health failure → service and database state `DOWN`; overall state `DOWN`.

## Tests / verification

- `OpsApiTest` — 401/403 matrix, status/flags/audit reads, request-ID echo, unsafe ID replacement.
- `LogRedactorTest` — secret masking.
- `ManagementHealthTest` — health is public on the loopback management port, not on the main port; only `health,info` are exposed.
- `SecurityTest` — existing RBAC/config tests still green with V9 seeds.
- Runtime smoke: Postgres migrated to V9; management health `UP`; `/api/v1/ops/status` returns 401 anonymously; JSON log file written; no span-export errors with tracing off.

## Next phases

Phase 2 adds Prometheus + Grafana + Tempo + Loki, dashboards, log/trace search and alert health. Phase 4 adds job run history and incident/alerts workflows. Phase 5 deployment/rollback remains blocked until a CI/CD pipeline and credentials exist.

## Standing rule — connect every new feature to the ops baseline

User instruction, 2026-10-20: this console and observability baseline grow with the ERP. Every future module, endpoint, job, integration or UI feature must be wired into it in the same work unit — not added as an afterthought. If a capability does not exist yet, show the honest `NOT_CONFIGURED` / "later phase" state; never fabricate telemetry.

Use this checklist in every future feature plan and definition of done:

1. **Logs** — structured JSON only; include useful business/security events, the current `requestId`, and no secrets, tokens, bodies, cookies or PII. Add a redaction test if a new field could carry sensitive data.
2. **Audit** — every privileged or business-critical write goes through `AuditLog` in the same transaction; ops-console reads stay deduped and bounded. New operations must state what is audited and why.
3. **Health/status** — new external dependencies (payment, OTA, WhatsApp, SMTP, RFID, storage, telemetry) get a bounded health check and a source in `OpsTelemetryService` / `/api/v1/ops/integrations`; blank config = `NOT_CONFIGURED`, failure = `UNAVAILABLE`.
4. **Flags** — optional modules/add-ons use `module.<name>.enabled` (or `feature.<name>`) in `app_config`, default off until approved, and appear in the ops flags tab. Never hard-code an optional feature on.
5. **Metrics/traces** — instrument new HTTP calls, jobs and integrations with Micrometer once the Phase 2 stack exists; follow the naming, labelled-cardinality and sampling rules in this document. Do not add unbounded labels.
6. **Ops UI** — expose operator-relevant status, safety controls or history in the console; keep it read-only/unavailable until the backend capability and approval exist. Do not add placeholder rows.
7. **Permissions** — new ops capabilities use explicit permissions (`ops.<domain>.<action>`) seeded in a migration and enforced server-side; UI hiding is never the control. Assign to the least-privileged `OPS_*` role.
8. **Tests** — 401/403/allow cases for new endpoints; error-shape/request-ID checks; redaction and audit assertions; honest `NOT_CONFIGURED`/failure paths.
9. **Docs/records** — update the module doc, this document (new source/checklist row), `api.md`/`security.md` when the contract or roles change, traceability, `DEVLOG.md` and `STATE.md` in the same change.

Quick review question for every pull request: **"If this feature fails at 02:00, can an operator see it in the ops console and trace it to a log/audit row?"** If the answer is no, the feature is not done.

Related: `04-modules/ops-console.md` (capabilities/roles), `05-operations/ops-console.md` (runbook), `03-phases/phase-3/PLAN-3.9-observability-ops-console.md` (phased roadmap).
