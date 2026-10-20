# Ops console runbook — Phase 1

- Purpose: start, verify and troubleshoot the read-only ops console safely. Audience: developers, operators. Last verified: 2026-10-20 (Fedora, Postgres 16, Java 21). Owner: project team.
- Scope: local/staging-style single instance. No production deployment pipeline exists yet; do not describe or improvise one.

## 1. Prerequisites

- Java 21 + Maven 3.9 (or the repo's `run-local.mjs`, which finds them on Fedora/Windows).
- PostgreSQL for the normal local run (`node run-local.mjs postgres --web`); H2 is test-only.
- Keycloak only if you need to sign in. Health/smoke checks work without it.
- Keycloak realm roles `OPS_VIEWER`, `OPS_DEVELOPER`, `OPS_OPERATOR`, `OPS_ADMIN`, `OPS_APPROVER` must exist (added to `infra/keycloak/realm-golden-hills.json` on 2026-10-20). Existing realms do **not** pick them up on restart: recreate the container with the clean-slate command in `05-operations/keycloak.md`, or add the roles manually.
- Assign one `OPS_*` role to the staff user in Keycloak. `SUPERADMIN` already has full access.

## 2. Configure

Local defaults are safe. Override only via environment (never commit real values):

```bash
export OPS_ENVIRONMENT=local
export OPS_PROMETHEUS_URL=       # blank = NOT_CONFIGURED
export OPS_LOKI_URL=
export OPS_TEMPO_URL=
export OPS_GRAFANA_URL=
export OPS_INTEGRATION_TIMEOUT_MS=2000
export OPS_TELEMETRY_STALE_SECONDS=120
export MANAGEMENT_PORT=9091
export MANAGEMENT_ADDRESS=127.0.0.1
export LOG_FILE=logs/erp-app.jsonl
export OTEL_TRACING_ENABLED=false
# export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces  # only with a collector
```

Telemetry URLs must be base URLs (no path); the service appends `/-/ready` (Prometheus), `/ready` (Loki/Tempo) and `/api/health` (Grafana).

## 3. Start and verify

```bash
node run-local.mjs postgres --web     # backend :8080, web :5173
# or, from ERP_DEV:
mvn -B -f services/erp-app/pom.xml spring-boot:run
```

```bash
curl -s http://127.0.0.1:9091/actuator/health        # {"status":"UP"} — no token
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/actuator/health  # 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/v1/ops/status # 401 anonymously
```

Signed-in smoke test: open the web shell, sign in with an `OPS_*` or `SUPERADMIN` user, choose **Ops Console**. The console opens on Overview; switching to Live never shows invented telemetry. Copy the `X-Request-Id` from the browser network tab (or the error text) to trace a request in the logs.

API check with a token:

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8080/api/v1/ops/status
curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8080/api/v1/ops/audit?page=0&size=25&days=7"
```

## 4. Logs and audit

- JSON log: `logs/erp-app.jsonl` relative to the backend working directory. With `mvn spring-boot:run` from `ERP_DEV` that is `services/erp-app/logs/erp-app.jsonl`; with `run-local.mjs` it is `ERP_DEV/logs/erp-app.jsonl`. Both paths are git-ignored.
- Follow: `tail -f <path> | jq .` (or `jq -c 'select(.requestId=="…")'`).
- Secrets are redacted by `LogRedactor`; if you find a leaked secret, treat it as an incident and rotate the value — do not paste it into tickets.
- Ops-console reads append `ops.status.read`, `ops.integrations.read`, `ops.flags.read` or `ops.audit.read` to `audit_event` at most once per actor/action per minute.
- Audit search is capped at 90 days and 100 rows per page; narrow by action instead of exporting bulk data.

## 5. Troubleshooting

| Symptom | Check / action |
|---|---|
| `/actuator/health` on `:9091` returns 401 | Management security chain missing or management port equals the API port. Confirm `management.server.port=9091` and that `ManagementSecurityConfig` is loaded; restart. |
| `:9091` connection refused | App not started, or management port bound to another address. Check startup logs for `Tomcat started on port 9091`. |
| Ops Console missing from sidebar | Signed-in JWT has no `OPS_*`/`SUPERADMIN` realm role. Assign a role in Keycloak and sign in again. |
| `403 FORBIDDEN` on `/api/v1/ops/audit` | Role lacks `ops.audit.read`; only `OPS_ADMIN`, `OPS_APPROVER` and `SUPERADMIN` have it. |
| `401 AUTH_REQUIRED` on ops API | No/expired bearer token, or `KEYCLOAK_ISSUER_URL` missing (see `05-operations/keycloak.md`). |
| Integrations all `NOT_CONFIGURED` | Expected with blank `OPS_*_URL`. This is not an outage. |
| Integration `UNAVAILABLE` | URL/path unreachable or wrong base URL; check timeout and the service's own health endpoint. `lastSuccessAt=null` means it never passed since startup. |
| `Failed to export spans` every few seconds | Tracing enabled without a collector. Set `OTEL_TRACING_ENABLED=false` or start the collector and set `OTEL_EXPORTER_OTLP_ENDPOINT`. |
| `stale=true` | The last successful check is older than `OPS_TELEMETRY_STALE_SECONDS`; the source is configured but currently failing. |
| Audit write warning in logs | Best-effort audit write failed. Reads still work; investigate DB/audit table immediately. |
| Port 8080/9091 already in use | Stop the previous backend (check `ps`/`lsof`) before restarting. |

## 6. Safety rules

- Keep `MANAGEMENT_ADDRESS=127.0.0.1`. Never expose `9091` through the reverse proxy or a public interface.
- Do not ship `OPS_*` roles to every staff user; least privilege is enforced server-side, but role assignment is the first control.
- Do not add production URLs/credentials to the repo or `.env.example`.
- No remote shell, command runner, file browser or deployment action exists in Phase 1. Do not simulate one.
- Preserve the `audit_event` append-only contract; never edit or delete audit rows to "clean up".

## 7. Known gaps / Phase 2 handoff

- Prometheus scraping, dashboards, log/trace search and alert routing are Phase 2.
- Job history, incidents and deployments are Phase 4; deployments stay disabled until CI/CD and rollback exist.
- Audit retention/archival is not automated yet.
- Production telemetry endpoints, Sentry DSN and infrastructure credentials are absent; they must be supplied through the deployment environment, never committed.
