# Project State
Updated: 2026-11-16T13:37:00+05:30
Phase: 1 (new baseline): Guest Acquisition, Identity & Sales Lead Operations. Work unit: **increment 1 merged (`adf4417`, local); login fixed; mobile access (HTTPS) working; start screen has role cards; increment 2 not started.**
Branch: `feature/phase1-fresh-start` (local, not pushed). Archive: `archive/hotel-draft` + tag (pushed).

State:
1. Milestone 0 is done: archive pushed and verified; `a40defe` carried over Ashish's WIP; `5d220ab` removed 322 old files. Ignored local files (`ERP_DEV/.env`, `target/`, `node_modules`, `ERP_DEV/logs`) were left untouched.
2. Milestone 1 docs are committed on `feature/phase1-fresh-start` (not pushed): phase1_plan v2.0, ARCHITECTURE, api, identity/AUTHENTICATION + KEYCLOAK-SETUP, ADR-001..003, REQUIREMENTS/TRACEABILITY/CHANGE_REQUESTS, source extracts, logs, onboarding, service/web/infra READMEs, CI workflow.
3. Increment 1 (S1–S7) is merged: infra + `gh-staff` realm, `api-gateway`, `access-service`, React staff shell, employee onboarding/account management. Tests 26 + 10 + 18 and live checks recorded in `inc1-REPORT.md`.
4. 18:55 — "Restart login cookie not found" fixed: the realm attribute `frontendUrl` pointed at an ephemeral Cloudflare tunnel, so the page was served from one origin and posted to another. Attribute removed; KEYCLOAK-SETUP §1 documents the rule and the curl checks (DEVLOG 18:55).
5. 19:19 — **mobile access works**: invite links and the ERP now use one stable public HTTPS origin, `https://weaponless-bertie-hyperorganically.ngrok-free.dev` (ngrok free dev domain). Plain HTTP on a LAN IP can never work: `keycloak-js` PKCE needs `crypto.subtle`, which browsers expose only in a secure context. The dev server proxies `/realms` + `/resources` to Keycloak and `/api` to the gateway, so there is no CORS and no cross-site cookie. Details, commands and evidence: DEVLOG 19:19; KEYCLOAK-SETUP §1.1.
6. 19:53 — **start screen shows two role cards**: **Sales Admin** (ADMIN) and **Sales Executive** (SALES_EXECUTIVE). A card only starts the Keycloak sign-in; the account's roles decide what loads (Ashish's choice: account role wins, no error). Header now shows the same friendly labels. `npm test` 20/20, build + lint clean, checked through the tunnel (DEVLOG 19:53).
7. Local stack right now: compose (postgres, keycloak, redis, mailpit) up; access-service :8091, api-gateway :8082, web :5173 (`--host 0.0.0.0`); landing page :3000; `ngrok http 5173 --url=…` running (keep it alive); the old `cloudflared` quick tunnel is still running but unused.
8. Uncommitted and **not approved**: (a) the mobile/HTTPS work — `web/vite.config.ts` (proxy + allowedHosts + HMR), `application.yml` + `KeycloakAdminClient` (`erp.keycloak.admin-url`, `redirect_uri` on the setup email), `infra/docker-compose.yml` (`KC_HOSTNAME=${KC_PUBLIC_URL}`, `KEYCLOAK_BIND`), `.env.example`, `web/.env.example`, KEYCLOAK-SETUP, DEVLOG/STATE; (b) the role-card start screen — `web/src/App.tsx`, `App.test.tsx`, `api.test.ts`, `styles.css`, DEVLOG/STATE; (c) a hard-delete employee feature (`DELETE /api/v1/admin/employees/{id}`) that contradicts ARCHITECTURE §4 and AUTHENTICATION §7 ("employees are never deleted"); (d) Ashish's earlier compose hostname change (`KC_HOSTNAME_STRICT=false`, `KC_PROXY_HEADERS=xforwarded`).

Next action:
1. Ashish: open `https://weaponless-bertie-hyperorganically.ngrok-free.dev/` on the phone → "Visit Site" (once per 7 days) → pick a role card → Sign in with a real account → confirm the dashboard and Employees load (proves `/me` accepts the public issuer).
2. Then press **Resend invite** for `raj ok` (rate limit 3/hour has expired) and open the new email on the phone: the link must be `https://weaponless-…/realms/gh-staff/…`, and setting a password must land back on the ERP (`redirect_uri` = `ERP_WEB_ORIGIN`).
3. Tests: web `npm test` 20/20, `npm run build`, `npm run lint` (DEVLOG 19:53); backend `EmployeeOnboardingTest` 3/3 (DEVLOG 19:40) — run backend tests **without** a sourced `.env` (test resources supply the client secret) or `KEYCLOAK_ADMIN_URL` leaks into the harness.
4. Decide the hard-delete feature: revert, or turn it into a documented Owner/MD soft delete (tests, api.md, DEVLOG, retention Q-022). Do not commit it as-is.
5. Decide the compose hostname change: keep (`KC_HOSTNAME` pinned to `KC_PUBLIC_URL`) or revert; it is now the supported local behaviour, documented in KEYCLOAK-SETUP §1.1.
6. Then review this session's diff and propose commits (no commit yet).
7. Push still blocked: the GitHub token needs the `workflow` scope (Ashish). Then push `feature/phase1-fresh-start`; the first CI run is the last open item of increment 1.
8. Increment 2 plan (docs only, for approval): guest-service (Keycloak `gh-guests` pass-through, D-114), lead-service (frozen portal contract, outbox → Kafka, queue, atomic claim), lead screens.

Caveats:
- The ngrok hostname is stable, but the tunnel only works while the `ngrok http …` process runs on this laptop. A laptop sleep or a reboot stops it (restart the same command; the URL does not change).
- The ERP is now reachable from the public internet with development data and the dev SMTP account. Treat it as a demo, not staging.
- A LAN IP is still not usable for login (no secure context). Only HTTPS works on a phone.
