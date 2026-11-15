# access-service

- **Responsibility:** Employee profiles; Keycloak Admin API provisioning (create user, role, invite email, enable/disable, logout); status sync; /api/v1/me; account audit. Blueprint 'Access Control' service.
- **Owns:** access_db: employee, audit_event, idempotency_key. Never passwords or tokens.
- **Port (dev):** 8091 · **Increment:** 1
- **Design:** identity/AUTHENTICATION.md; identity/KEYCLOAK-SETUP.md; api.md §3

No code yet: this folder is a Milestone 1 skeleton. When implemented it will contain its own `pom.xml` (Java 21, Spring Boot), `Dockerfile`, Flyway migrations (if it owns data), tests, and an OpenAPI spec that matches `docs/02-architecture/api.md`. CI builds it as soon as `pom.xml` exists.
