# ADR-001: Technical stack lock-in (modular monolith first)

Status: accepted (2026-10-09, approved by user — Q-010 "Confirm proposal stack", Phase 2 PLAN approved)
Context: Phase 1 baseline (CORE ERP-02…09, 2-month MVP, team 2–4 BE + 2 FE + 1 DevOps + 1 QA; hosting undecided; RFID hardware absent). The tech-stack proposal recommended Java 21/Spring Boot microservices + React + Postgres/Kafka/Redis/K8s/Keycloak and explicitly advised starting as a modular monolith, splitting only on proven scaling need (proposal §10). The SOW names no stack — this ADR is the decision (closes Q-006/Q-010).
Decision:
- Backend: Java 21 LTS + Spring Boot 3 / Spring Cloud (modular monolith, one deployable, strict module packages `erp02…erp09`; cross-module via interfaces). WHY: transactional safety for bookings/payments/inventory is the system's must-never-fail property; mature `@Transactional`, typing, and hiring pool lower long-term risk (proposal §§1–2).
- Frontend: React 18 + TypeScript SPA (PWA-ready). WHY: largest pool, shares types via OpenAPI-generated clients.
- Data: PostgreSQL (OLTP, single writer + read replica later) + Redis (availability/session cache) + OLAP offload deferred to read-replica views in MVP (warehouse later). WHY: ACID for money/rooms; cache for hot availability reads.
- Messaging/jobs: Kafka event backbone (booking/payment/RFID/OTA events) + job runner with retries/visibility for hold-expiry, OTA-sync, renewals, reconciliation, exports. WHY: decouples slow integrations from guest-facing latency; retries + dead-letter make failures visible.
- Identity: Keycloak (OAuth2/OIDC) + server-side RBAC deny-by-default. WHY: SSO-ready, out-of-box roles for §22 matrix.
- Deploy: Docker + Kubernetes manifests from day one, but Compose-runnable locally; cloud provider still open (hosting undecided) — no cloud-only coupling. WHY: seasonal HPA for Booking/Payments without re-architecting.
- Observability: Prometheus + Grafana + Jaeger + ELK from Phase 3.0 (not bolted on later). CI: build → tests → scan → image → Dev auto → Staging/Prod gates.
Consequences:
- Good: one deployable = fastest 2-month path; modules extractable later without rewrite; property-scoped keys from day one keep multi-property open.
- Bad/accepted: higher memory footprint + Java verbosity + senior hiring bar (proposal §10) — accepted for correctness; mitigated by monolith-first (small DevOps load) and OpenAPI codegen.
- Follow-ups: ADR-002+ only if a choice varies (export engine, PDF lib, channel SDK). Reversal: module extraction behind existing interfaces; data stays in Postgres (no re-model).
