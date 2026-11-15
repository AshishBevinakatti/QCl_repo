# Keycloak Configuration & SMTP Requirements (staff realm)

- Status: **Proposed. Waiting for Ashish's review** (Milestone 1). The values below go into `ERP_DEV/infra/keycloak/gh-staff-realm.json` in Sprint 1. That file is imported at startup and contains **no secrets**; secrets come from `${ENV}` placeholders.
- Why each setting exists: [AUTHENTICATION.md](AUTHENTICATION.md). Decision: [ADR-002](../adr/ADR-002-keycloak-employee-identity.md).
- Keycloak version: **26.8.2** (D-115). Built and checked in increment 1 slice S1 (DEVLOG 2026-11-15): 15 live checks passed.

## 1. Deployment

| Setting | Local dev | Staging / production |
|---|---|---|
| Image | `quay.io/keycloak/keycloak:26.8.2` | same tag, pinned by digest |
| Command | `start-dev --import-realm` | `start --optimized --import-realm` (on first deploy only; later changes go through the Admin API/runbook) |
| Database | `KC_DB=postgres`, own database `keycloak`, own DB user | same, on the managed cluster, backed up |
| Hostname | `http://localhost:8081` | `KC_HOSTNAME=https://id.<client-domain>` (Q-025), `KC_PROXY_HEADERS=xforwarded`, TLS at the load balancer |
| Master admin | `KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` from `ERP_DEV/.env` | from the secrets manager; used only for break-glass, never by applications |
| Health | `KC_HEALTH_ENABLED=true` → `/health/ready` | same |

The master realm is only for administering Keycloak. All employees live in realm **`gh-staff`**. Guests will get a separate realm, `gh-guests` (Q-003).

## 2. Realm `gh-staff` — login settings

| Setting | Value | Why |
|---|---|---|
| User registration | **Off** | Only an admin creates employees (Workflow 1) |
| Login with email | On | Employees may sign in with their email or username |
| Duplicate emails | Off | One account per email |
| Edit username | Off | Username is a stable identifier |
| Verify email | **On** | Blueprint §9: verified contact method |
| Forgot password | **On** | Self-service reset through Keycloak only |
| Remember me | Off | Shared front-desk PCs are likely |
| SSL required | `external` (dev) / `all` (prod) | HTTPS outside local dev |
| Password policy | `length(12) and maxLength(128) and notUsername and notEmail and passwordHistory(3)` | NIST-style length over complexity; the client may change it (Q-026) |
| Required actions enabled | `VERIFY_EMAIL`, `UPDATE_PASSWORD`, `CONFIGURE_TOTP` | TOTP only if MFA for admins is approved (Q-021) |

## 3. Brute-force detection

| Setting | Value |
|---|---|
| Enabled | On |
| Permanent lockout | Off (temporary lockout) |
| Max login failures | 5 |
| Wait increment | 60 s |
| Max wait | 15 min |
| Failure reset time | 12 h |
| Quick login check / min quick wait | 1000 ms / 60 s |

## 4. Sessions and tokens

| Setting | Value | Why |
|---|---|---|
| Access token lifespan | **5 min** | Limits how long a deactivated user can keep working (R-004) |
| SSO session idle | 30 min | Idle staff PC logs out (confirm, Q-019) |
| SSO session max | 10 h | About one shift (confirm, Q-019) |
| Revoke refresh token | **On**, max reuse 0 | Rotation: a replayed refresh token is rejected and kills the session |
| Client session idle/max | inherit realm | |
| Admin-initiated action lifespan | 24 h (`lifespan=86400` on `execute-actions-email`) | How long the invite link works |
| User-initiated action lifespan | 5 min default (password-reset link) | Keycloak default |
| Signing algorithm | RS256 (realm default keys) | Services check it with JWKS |

## 5. Clients

### 5.1 `erp-web` — the React staff app (public client)
- Client authentication: **off** (public SPA); Standard flow: **on**; **PKCE: `S256` required** (advanced setting `pkce.code.challenge.method=S256`).
- Direct access grants: **off**. Implicit flow: **off**. Service accounts: off.
- Valid redirect URIs (exact): `http://localhost:5173/*` (dev), `https://erp.<client-domain>/*` (prod).
- Valid post-logout redirect URIs: same origins. Web origins: same origins (no `*`).
- Front-channel logout: on.
- **Audience mapper:** type "Audience", included client audience = `erp-api`, added to the access token. Services reject tokens without `aud=erp-api`.
- Default client scopes: `basic` (carries `sub`), `web-origins`, `acr`, `profile`, `roles`, `email`. No optional scopes: no `offline_access` (no offline tokens for a browser app).
- **Full scope allowed: off** (Keycloak 26 marks the switch deprecated). Only the job roles `ADMIN`/`MANAGER`/`SALES_EXECUTIVE` and the `erp-api` permission roles are mapped into its tokens (`scopeMappings` / `clientScopeMappings` in the realm file).

### 5.2 `erp-api` — the API audience and permission holder
- Client authentication: on, with **all flows off**. Nobody logs in with it. It exists to define the `aud` value and to hold the **permission client roles** (AUTHENTICATION §3).
- Client roles: `employees.read`, `employees.manage`, `roles.assign`, `leads.read_queue`, `leads.read_assigned`, `leads.read_team`, `leads.claim`, `leads.assign`, `leads.reassign`, `audit.read`.

### 5.3 `access-service` — Keycloak Admin API caller (confidential client)
- Client authentication: **on** (secret from `KC_ACCESS_SERVICE_CLIENT_SECRET`; production can use signed JWT client auth). Standard flow off, direct access off, **service accounts on**.
- Service-account roles: `realm-management` → **`manage-users`, `view-users`, `query-users` only**. **Not** `realm-admin`, `manage-clients` or `manage-realm`.
- Default client scopes: `basic` (gives the `sub` claim) + `roles` + **`kc-admin-api`**. Keycloak 26.x rejects Admin API calls with **401** unless the token carries the Admin API audience that this scope adds (found in S1). Full scope off; only the three `realm-management` roles are mapped into its token.
- Used only by `access-service` for: create user, map realm roles, `execute-actions-email`, enable/disable, logout, read status.
- **Looking up a role to assign:** use `GET /users/{id}/role-mappings/realm/available` and pick the role by name. `GET /roles/{name}` needs `view-realm`, which we deliberately don't grant (S1 check 5x: 403).
- Rotate the secret every 90 days, or at once if it might have leaked (F13).

## 6. Roles

- **Realm roles** (job roles): `ADMIN`, `MANAGER`, `SALES_EXECUTIVE`. Each is a **composite** of `erp-api` client roles, using the default grants in AUTHENTICATION §3.
- Default realm role (`default-roles-gh-staff`): give it **no** `erp-api` permissions, so a new user has no access until a job role is assigned.
- Never put role IDs in code: services check role *names*.

## 7. Events and audit

| Setting | Value |
|---|---|
| Save user events | On; types `LOGIN`, `LOGIN_ERROR`, `LOGOUT`, `LOGOUT_ERROR`, `CODE_TO_TOKEN_ERROR`, `REFRESH_TOKEN_ERROR`, `UPDATE_PASSWORD`, `VERIFY_EMAIL`, `EXECUTE_ACTIONS`, `RESET_PASSWORD`, `SEND_RESET_PASSWORD`, `USER_DISABLED_BY_TEMPORARY_LOCKOUT` |
| User events expiration | 90 days (client may want longer, Q-022) |
| Admin events | On, **include representation**: off (it would copy user PII into the event store) |

ERP-side audit (`access_db.audit_event`) records business actions: who created or deactivated whom, and why. Keycloak events record authentication. Together they cover engineering rule 6 ("login/logout/failed login, role changes").

## 8. SMTP (email) configuration

Keycloak sends every employee email: invite / set password, verify email, reset password. The ERP services don't send these.

### 8.1 Settings (Realm → Email)
| Field | Value |
|---|---|
| From | `no-reply@<client-domain>` (Q-024) |
| From display name | `Golden Hills Resort ERP` |
| Reply-to | resort IT/admin mailbox (Q-024) |
| Envelope from | same domain as From (keeps SPF aligned) |
| Host / port | provider SMTP host, **587** |
| Encryption | **StartTLS on** (SSL off); production must use TLS |
| Authentication | on; user `${SMTP_USER}`, password `${SMTP_PASSWORD}` (from env/secrets manager, never in the realm file) |

### 8.2 What the client or ops must provide (Q-024)
1. An SMTP provider and account, e.g. their Google Workspace/Zoho mailbox, Amazon SES or SendGrid. SOW §24: email provider charges are the client's.
2. The sending domain, with **SPF**, **DKIM** and **DMARC** DNS records, so invites don't land in spam.
3. A sending limit large enough for the staff count.
4. A test mailbox for UAT.

### 8.3 Local development
- **Mailpit** container: SMTP `mailpit:1025` (no auth, no TLS), web UI `http://localhost:8025`. All emails are caught locally and nothing reaches real people. Adding it to Compose needs approval (Q-023).
- Check: after "Add employee", the invite shows up in the Mailpit UI, and its link opens the Keycloak "Update password" page.

### 8.4 Email content
- Keycloak's default `executeActions` / `email-verification` / `password-reset` templates come first.
- A branded email theme (logo, wording) is optional, uses only client-approved brand assets, and is tracked as Q-018.

## 9. Environment variables (names only; values live in `.env`/secrets, never in git)

| Variable | Used by |
|---|---|
| `KC_BOOTSTRAP_ADMIN_USERNAME`, `KC_BOOTSTRAP_ADMIN_PASSWORD` | Keycloak container (break-glass master admin) |
| `KC_DB_PASSWORD`, `ACCESS_DB_PASSWORD`, `POSTGRES_PASSWORD`, `POSTGRES_HOST_PORT` (default 5433) | PostgreSQL container and its init script |
| `REDIS_PASSWORD` | Redis container, api-gateway |
| `ERP_WEB_ORIGIN` | realm import: erp-web redirect/origin (default `http://localhost:5173`) |
| `KEYCLOAK_URL` | gateway, services, web (`VITE_KEYCLOAK_URL`) |
| `KEYCLOAK_REALM=gh-staff` | gateway, services, web (`VITE_KEYCLOAK_REALM`) |
| `KC_ACCESS_SERVICE_CLIENT_SECRET` | access-service and the realm import (client id is fixed: `access-service`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_REPLY_TO`, `SMTP_AUTH`, `SMTP_STARTTLS`, `SMTP_USER`, `SMTP_PASSWORD` | Keycloak realm import placeholders (defaults point at Mailpit) |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_FIRST_NAME`, `BOOTSTRAP_ADMIN_LAST_NAME`, `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_MOBILE` | access-service, first start only (§10) |

`ERP_DEV/.env.example` lists these names with empty values. Copy the ones you need into your own `ERP_DEV/.env`; the agent never edits that file.

## 10. Bootstrapping the first ADMIN

- At startup, if `access_db` has **no** active or invited ADMIN and `BOOTSTRAP_ADMIN_EMAIL` is set, `access-service` runs Workflow 1 for that person with role `ADMIN`.
- That person gets the normal invite email and sets their own password. **No password is ever put in env, scripts or the realm file.**
- It is logged in the audit as actor `SYSTEM_BOOTSTRAP`. Once an ADMIN exists, the variables are ignored.

## 11. Checklist for Sprint 1 (to prove the configuration)

Checked in S1 on 2026-11-15 against Keycloak 26.8.2 (throwaway stack, script output in DEVLOG); ✅ = passed live.

- [x] ✅ Realm imports cleanly; `GET /realms/gh-staff/.well-known/openid-configuration` returns 200.
- [x] ✅ `erp-web` refuses a request without PKCE and refuses the password grant.
- [x] ✅ Access token has `aud` containing `erp-api`, `realm_access.roles` and `resource_access.erp-api.roles` (checked with Keycloak's generated example token); lifespan 300 s.
- [x] ✅ The `access-service` service account **can** create a user and map a realm role, and **cannot** create a client (403) or read realm roles directly (403).
- [x] ✅ After 5 wrong passwords even the right password is refused (S5 live check 10).
- [x] ✅ Invite email ("Update Your Account") arrives in Mailpit. Following the link opens Keycloak's set-password page, the 12-character policy is enforced, and the password is set (S5 live checks 1–3).
- [ ] A disabled user can't log in, and refreshing their token fails (S6).
- [x] ✅ CI job `realm-check` validates the realm file (14 rules, passed locally): it must contain `registrationAllowed=false`, `verifyEmail=true`, brute-force on, PKCE on `erp-web`, direct grants off, and no `secret` values in plain text.
