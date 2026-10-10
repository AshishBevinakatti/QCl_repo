# Keycloak runbook — local dev SSO (Phase 3 login unit)

- Purpose: run staff login locally. Audience: developers. Last verified: 2026-10-10 (Keycloak 24.0, realm auto-import confirmed). Owner: project team.
- ALL passwords below are LOCAL-DEV-ONLY fakes (same policy as `docker-compose.local.yml`). Staging/prod use Vault-managed secrets + a separately-provisioned realm (Phase 7). Never reuse these values outside local dev.

## Start / stop
```
# Keycloak only (postgres/redis/kafka stay down — resort data lives in the
# global Postgres; Keycloak keeps its own dev-file storage in-container).
sg docker -c "docker compose -f ERP_DEV/infra/docker-compose.local.yml up -d keycloak"

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
Source of truth: `ERP_DEV/infra/keycloak/realm-golden-hills.json` (realm `resort`, 7 roles, `erp-web` public PKCE client, 6 demo users). Auto-imports from `/opt/keycloak/data/import/` on first boot. After editing the JSON, recreate the container (clean slate above) — a restart alone does NOT re-import.

## Demo staff (DEV-ONLY passwords)
| Username | Roles | Password |
|---|---|---|
| admin-staff | SUPERADMIN | change-me-dev-only |
| manager-staff | MANAGER | change-me-dev-only |
| reception-staff | RECEPTION | change-me-dev-only |
| accounts-staff | ACCOUNTS | change-me-dev-only |
| membership-staff | MEMBERSHIP | change-me-dev-only |
| housekeeping-staff | HOUSEKEEPING | change-me-dev-only |

## Backend wiring
erp-app validates JWTs against the issuer (no code change needed):
```
KEYCLOAK_ISSUER_URL=http://localhost:8081/realms/resort
```
Roles arrive via `realm_access.roles` (mapped to authorities — see JwtRolesMappingTest). Gotcha found 2026-10-10: Keycloak 24's user profile REQUIRES an email, so realm users carry `@goldenhills.local` addresses — direct-grant fails with "Account is not fully set up" without them.

## Frontend wiring
`web/src/auth.ts` (PKCE, `check-sso`), token attaches in `api.ts:apiFetch`, login state in the sidebar (`App.tsx`). Env: `VITE_KEYCLOAK_URL` (default http://localhost:8081), `VITE_KEYCLOAK_REALM=resort`, `VITE_KEYCLOAK_CLIENT_ID=erp-web`.

## Live proof (2026-10-10, recorded — rerun any time)
Reception token → `GET /room-categories` = 200 · `PATCH /config` = 403 ·
no token = 401 · forged token = 401 · SUPERADMIN token → `PATCH /config` = 200.
