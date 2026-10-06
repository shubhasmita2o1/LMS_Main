# Phase 0 — Non-Functional Requirements

## Security

- Authentication, authorization (RBAC + resource permissions), rate limiting from day 1.
- Secure headers (Helmet), input validation (Zod), secrets management.
- Audit trails for sensitive actions.
- Tenant isolation tests mandatory.
- Threat modeling for auth, multi-tenancy, lab execution, payments.
- MFA-ready architecture.
- No untrusted student code execution inside the main API process.

## Performance & Scalability

- Pagination, filtering, sorting on all list endpoints.
- Compound indexes including `tenantId`.
- Redis caching for hot reads (later phases).
- Async processing via BullMQ for heavy jobs.
- Horizontal scaling readiness via stateless API design.

## Availability & Reliability

- Health checks (`/health`).
- Graceful shutdown.
- Staging and production environments.
- Backup and restore procedures (documented and tested before production).
- Disaster recovery plan before first paying tenant.

## Data Governance

- Tenant isolation enforced at query level.
- Soft deletion preferred.
- Audit fields on all mutable documents.
- Retention, archival, and tenant data export / deletion capabilities.
- FERPA / GDPR readiness path (privacy controls in Phase 20).

## API Quality

- Consistent REST conventions under `/api/v1`.
- Standard error format (`success`, `error.code`, `error.message`, `error.details`).
- OpenAPI documentation.
- Versioning strategy.

## Observability

- Structured logs.
- Metrics and traces (OpenTelemetry path).
- Job monitoring and alerting.
- Error tracking.

## Accessibility & UX

- Responsive design.
- Keyboard navigation.
- Clear empty / loading / error states.
- Role-specific dashboards.

## SaaS-Specific

- Feature flags per tenant / plan.
- Usage metering (active students, storage, etc.).
- Plan limit enforcement.
- White-label theming (logo, colors, custom domain).
