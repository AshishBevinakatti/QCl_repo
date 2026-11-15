# web — Staff ERP (React + TypeScript + Vite)

- **Responsibility:** employee sign-in (redirect to Keycloak, code flow + PKCE via `keycloak-js`), session handling (tokens in memory, refresh, logout), dashboard, Employees admin screens (increment 1), lead queue and claim (increment 2). Role-based menus are cosmetic only; the backend enforces access.
- **Port (dev):** 5173 · **Increment:** 1
- **Design:** `docs/02-architecture/identity/AUTHENTICATION.md` §5–8; `api.md` §3–4.
- **Stack:** React 19, TypeScript ~6.0, Vite 8, Vitest 5 + Testing Library, oxlint (ADR-001).

No code yet (Milestone 1 skeleton). CI builds it as soon as `package.json` exists.
