# Ops Console (internal) — Phase 1

- Purpose: read-only operational visibility and audit access for engineering and resort operations staff, with least privilege and no secret exposure. Audience: developers, operators, approver. Last verified: 2026-10-20 (branch `feature/3.9-observability-ops-console`). Owner: project team.
- Scope: internal tooling for unit 3.9. It is not a SOW module and does not change guest/reservation/payment behaviour. The ops console is separate from ERP-08's business audit viewer; it exposes engineering operations, not guest data.

## Actors and permissions

Permissions are resolved from `role_permission` on every request; JWT roles alone never grant access.

| Role | Phase 1 reads | Also seeded for later phases |
|---|---|---|
| `OPS_VIEWER` | `ops.read`, `ops.integrations.read`, `ops.flags.read` | metrics, alerts |
| `OPS_DEVELOPER` | viewer reads | logs, traces, jobs |
| `OPS_OPERATOR` | viewer reads | incidents, jobs, deployments |
| `OPS_ADMIN` | viewer reads + `ops.audit.read` | logs, traces, jobs, incidents, deployments |
| `OPS_APPROVER` | viewer reads + `ops.audit.read` | logs, traces, jobs, incidents, deployments |
| `SUPERADMIN` | everything (`*`) | — |

- The resort `OPS` (spa/facilities) role is **not** reused. Ops-console roles are `OPS_*`.
- Phase 1 has no write endpoints. Flag changes remain `SUPERADMIN`-only via the existing config API.
- The web sidebar shows the console for the five `OPS_*` roles and `SUPERADMIN`; the server enforces the actual permission.

## API (read-only)

| Endpoint | Permission | Returns |
|---|---|---|
| `GET /api/v1/ops/status` | `ops.read` | Overall `OK/DEGRADED/DOWN`, service/version/uptime, DB state/latency, telemetry summary, configured links |
| `GET /api/v1/ops/integrations` | `ops.integrations.read` | Prometheus, Loki, Tempo, Grafana state (`UP`, `UNAVAILABLE`, `NOT_CONFIGURED`), last success, staleness (status embeds the same summary; the dedicated call is available for Phase 2) |
| `GET /api/v1/ops/flags` | `ops.flags.read` | `feature.*` / `module.*` config with inferred type and last update; sensitive key names excluded |
| `GET /api/v1/ops/audit?page=&size=&action=&days=` | `ops.audit.read` | Bounded audit page; page ≥ 0, size 1–100, days 1–90, action `[A-Za-z0-9._-]{1,100}`; `before`/`after` redacted |

- Responses never include tokens, connection strings, IP addresses or raw request bodies.
- Status is `OK` only when the service/DB is `UP` and every **configured** telemetry source is `UP`. Unconfigured sources do not degrade status.
- Failed integrations return `UNAVAILABLE` with a generic reason; the console performs no writes.
- Batch and direct reads are audited at most once per actor/action per 60 seconds. Audit-write failure is logged and does not break the read.
- `X-Request-Id` is echoed on every API response and included in error bodies (the loopback management port is separate and does not carry it).

## UI

`web/src/ops/OpsView.tsx` (Live mode):

- **Overview** — status, service/DB, integration health (all four sources with honest `NOT_CONFIGURED` states), configured links; no fake "all green".
- **Flags** — read-only table of module/feature flags.
- **Audit** — paged, action-filterable, day-bounded read of `audit_event`.
- **Logs / Traces / Alerts** — labelled Phase 2; no placeholder data.
- **Jobs / Incidents / Deployments** — labelled Phase 4; deployments disabled until a pipeline exists.
- Preview mode shows clearly labelled demo data; Live mode never fabricates telemetry.

## Security controls

- Server-side deny-by-default; DB-backed permissions; 401 for unauthenticated, 403 for insufficient permission.
- Management port (`9091`) is loopback-only and independent of the API security chain; only `health,info` are exposed.
- Audit reads are themselves audited; the audit query is bounded to prevent bulk extraction.
- JSON logs and audit payloads pass through `LogRedactor`; request IDs are validated to block log injection.
- No remote shell, arbitrary command execution, file browsing or production credentials in Phase 1.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `OPS_ENVIRONMENT` | `local` | Display/env tag in logs and status |
| `OPS_PROMETHEUS_URL` | empty | Prometheus base URL |
| `OPS_LOKI_URL` | empty | Loki base URL |
| `OPS_TEMPO_URL` | empty | Tempo base URL |
| `OPS_GRAFANA_URL` | empty | Grafana base URL |
| `OPS_INTEGRATION_TIMEOUT_MS` | `2000` | Per-check timeout (min 250 ms) |
| `OPS_TELEMETRY_STALE_SECONDS` | `120` | Staleness threshold after last success |
| `OTEL_TRACING_ENABLED` | `false` | Enables tracing; requires a reachable OTLP endpoint |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | empty | OTLP/HTTP collector (e.g. Tempo) |

See `05-operations/ops-console.md` for run/troubleshooting steps and `02-architecture/observability.md` for the signal contract.

## Tests

`OpsApiTest` covers 401/403 by role, status/flags/audit success, request-ID echo and unsafe-ID replacement. `ManagementHealthTest` covers the loopback management port. `LogRedactorTest` covers secret masking. Full suite: 71 tests green on 2026-10-20.

## Known limits / next phases

- No metrics, logs, traces, jobs, incidents, deployments or alerts endpoints yet (Phases 2/4).
- No alert routing, on-call integration, deployment history or rollback controls.
- No production telemetry URLs or Sentry DSN in this repository; nothing is configured against production.
- Audit retention is inherited from `audit_event`; a documented retention job is still pending.
- Keycloak realm roles must be re-imported (or the realm recreated) for existing local installations to see the new `OPS_*` roles.

## Standing integration rule

Every future feature must connect to this baseline in the same work unit — logs, audit, health/status, flags, permissions, tests and docs. The mandatory checklist and the 02:00 operator review question live in `02-architecture/observability.md` → "Standing rule — connect every new feature to the ops baseline".
