# guest-service

- **Responsibility:** Guest profile linked to the Keycloak guest identity; backs the frozen /api/v1/portal/auth/** contract.
- **Owns:** guest_db: guest profile, consent. Never passwords.
- **Port (dev):** 8092 · **Increment:** 2
- **Design:** api.md §2; OPEN_QUESTIONS Q-003

No code yet: this folder is a Milestone 1 skeleton. When implemented it will contain its own `pom.xml` (Java 21, Spring Boot), `Dockerfile`, Flyway migrations (if it owns data), tests, and an OpenAPI spec that matches `docs/02-architecture/api.md`. CI builds it as soon as `pom.xml` exists.
