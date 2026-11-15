# api-gateway

- **Responsibility:** Single API entry: routing, JWT validation (realm gh-staff, aud erp-api), rate limits (Redis), request-size limits, correlation IDs, CORS. No business logic.
- **Owns:** No database.
- **Port (dev):** 8082 · **Increment:** 1
- **Design:** ARCHITECTURE.md §2–3; AUTHENTICATION.md §5

No code yet: this folder is a Milestone 1 skeleton. When implemented it will contain its own `pom.xml` (Java 21, Spring Boot), `Dockerfile`, Flyway migrations (if it owns data), tests, and an OpenAPI spec that matches `docs/02-architecture/api.md`. CI builds it as soon as `pom.xml` exists.
