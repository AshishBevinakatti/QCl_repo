# ERP_DEV — Golden Hills Resort ERP (staff side)

Backend services, staff web app and infrastructure for the Golden Hills Resort ERP. The public website is `../landing-page/`.

**Status:** Phase 1 Milestone 1: documentation and skeleton only; no application code yet. Start with [docs/README.md](docs/README.md).

| Path | What | Built in |
|---|---|---|
| `services/api-gateway/` | Spring Cloud Gateway, :8082 | Increment 1 |
| `services/access-service/` | Employees + Keycloak account management, :8091 | Increment 1 |
| `services/guest-service/` | Guest profile, :8092 | Increment 2 |
| `services/lead-service/` | Inquiries, leads, claim, outbox, :8093 | Increment 2 |
| `web/` | Staff ERP, React + TypeScript + Vite, :5173 | Increment 1 |
| `infra/` | Docker Compose, Keycloak realm, DB init | Increment 1 |
| `docs/` | All documentation and project logs | Now |

Local secrets go in `ERP_DEV/.env`, which is git-ignored and must never be committed.
