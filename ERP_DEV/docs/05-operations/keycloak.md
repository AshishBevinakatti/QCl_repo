# Keycloak runbook — local dev SSO (Phase 3 login unit)

- Purpose: run staff login locally. Audience: developers. Last verified: 2026-10-10 (Keycloak 24.0, realm auto-import confirmed). Owner: project team.
- ALL passwords below are LOCAL-DEV-ONLY fakes (same policy as `docker-compose.local.yml`). Staging/prod use Vault-managed secrets + a separately-provisioned realm (Phase 7). Never reuse these values outside local dev.

## Start / stop
```
# Keycloak only (postgres/redis/kafka stay down — resort data lives in the
# global Postgres; Keycloak keeps its own dev-file storage in-container).
sg docker -c "docker compose -f ERP_DEV/infra/docker-compose.local.yml up -d keycloak"
# Windows (Docker Desktop): drop the `sg docker -c "…"` wrapper and run
# docker compose -f ERP_DEV/infra/docker-compose.local.yml up -d keycloak

# Status / logs:
sg docker -c "docker ps"            # expect infra-keycloak-1 Up, 0.0.0.0:8081->8080
curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost:8081/realms/resort/.well-known/openid-configuration   # expect 200

# Clean slate (realm auto-import runs ONLY on first boot with empty storage):
sg docker -c "docker compose -f ERP_DEV/infra/docker-compose.local.yml rm -f keycloak"
sg docker -c "docker compose -f ERP_DEV/infra/docker-compose.local.yml up -d keycloak"

# Stop:
sg docker -c "docker compose -f ERP_DEV/infra/docker-compose.local.yml stop keycloak"
```
Keycloak listens on **8081** (8080 is erp-app's port). Admin console: http://localhost:8081/admin (admin / change-me-locally-only).

## Realm
Source of truth: `ERP_DEV/infra/keycloak/realm-golden-hills.json` (realm `resort`, 12 roles — 7 resort + 5 `OPS_*`, `erp-web` public PKCE client, 6 demo users). Auto-imports from `/opt/keycloak/data/import/` on first boot. After editing the JSON, recreate the container (clean slate above) — a restart alone does NOT re-import.

## Demo staff (DEV-ONLY passwords)
| Username | Roles | Password |
|---|---|---|
| admin-staff | SUPERADMIN | change-me-dev-only |
| manager-staff | MANAGER | change-me-dev-only |
| reception-staff | RECEPTION | change-me-dev-only |
| accounts-staff | ACCOUNTS | change-me-dev-only |
| membership-staff | MEMBERSHIP | change-me-dev-only |
| housekeeping-staff | HOUSEKEEPING | change-me-dev-only |

Ops console (3.9 Phase 1): assign `OPS_VIEWER`, `OPS_DEVELOPER`, `OPS_OPERATOR`, `OPS_ADMIN` or `OPS_APPROVER` to the staff user; `admin-staff`/`SUPERADMIN` already has access. No demo ops user is created. Existing realms need the clean-slate recreate above (or manual role creation) to receive the new roles. Runbook: `05-operations/ops-console.md`.

## Backend wiring
erp-app validates JWTs against the issuer (no code change needed):
```
KEYCLOAK_ISSUER_URL=http://localhost:8081/realms/resort
```
Roles arrive via `realm_access.roles` (mapped to authorities — see JwtRolesMappingTest). Gotcha found 2026-10-10: Keycloak 24's user profile REQUIRES an email, so realm users carry `@goldenhills.local` addresses — direct-grant fails with "Account is not fully set up" without them.

## Mandatory pre-login check (lesson 2026-10-10 — a full user session was lost to this)
A backend started WITHOUT `KEYCLOAK_ISSUER_URL` rejects every login with a server error that the UI
mislabels as "needs sign-in". Before any login test, prove the running backend has it:
```
PID=$(pgrep -f "com.quantumclk.erp.ErpApplication" | head -1)
tr '\0' '\n' < /proc/$PID/environ | grep KEYCLOAK_ISSUER_URL   # must print the realm URL
# plus one authed probe with a fresh token (expect 200, never 500):
```
If the var is missing: stop the backend and restart it WITH the issuer (see DAY-ONE §5 variants).
Do not debug the frontend until this check passes.

## Frontend wiring
`web/src/auth.ts` (PKCE, `check-sso`), token attaches in `api.ts:apiFetch`, login state in the sidebar (`App.tsx`). Env: `VITE_KEYCLOAK_URL` (default http://localhost:8081), `VITE_KEYCLOAK_REALM=resort`, `VITE_KEYCLOAK_CLIENT_ID=erp-web`.

## Live proof (2026-10-10, recorded — rerun any time)
Reception token → `GET /room-categories` = 200 · `PATCH /config` = 403 ·
no token = 401 · forged token = 401 · SUPERADMIN token → `PATCH /config` = 200.
