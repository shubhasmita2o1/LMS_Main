# Phase 0 — Role & Permission Matrix (Initial)

## System Roles

| Role | Scope | Notes |
|------|-------|-------|
| `super_admin` | Platform-wide | No tenantId. Full control plane access. |
| `tenant_admin` | Single tenant | Full control of one university tenant. |
| `university_admin` | Single tenant | Academic + administrative configuration. |
| `faculty` | Tenant | Course, assessment, grading, attendance rights. |
| `student` | Tenant | Own data + enrolled courses. |
| `staff` | Tenant | Operational modules (fees, library, etc.). |
| `parent` | Tenant | Limited read of linked student(s). |
| `guest` | Tenant / public | Admissions / public catalog only. |

Roles are expandable. Fine-grained permissions use **resource + action + optional scope**.

## Permission Model

```ts
Permission = {
  resource: ResourceType;   // e.g. 'course', 'assignment', 'student'
  action: PermissionAction; // create | read | update | delete | manage | export | import
  scope?: string;           // e.g. 'own', 'department', 'section'
}
```

## High-Level Matrix (MVP focus)

| Resource \ Role | Super Admin | Tenant Admin | Faculty | Student |
|-----------------|-------------|--------------|---------|---------|
| Tenant / Platform | manage | — | — | — |
| Users & Roles | manage | manage (tenant) | read (limited) | — |
| University Structure | — | manage | read | read |
| Students (SIS) | — | manage | read (own courses) | read (own) |
| Faculty | — | manage | read/update (own) | read |
| Courses / Curriculum | — | manage | manage (assigned) | read (enrolled) |
| LMS Content | — | manage | manage (assigned) | read (enrolled) |
| Assignments / Quizzes | — | manage | manage (assigned) | create (submit) / read |
| Grades | — | manage | manage (assigned) | read (own) |
| Attendance | — | manage | manage (assigned) | read (own) |
| Billing / SaaS Plans | manage | read (own subscription) | — | — |
| Feature Flags | manage | read | — | — |
| Audit Logs | manage | read (tenant) | — | — |

## Tenant Isolation Rules

1. Every query on tenant-scoped collections **must** filter by `tenantId`.
2. Middleware injects and enforces `tenantId` from subdomain / custom domain / header.
3. Super-Admin routes operate with `tenantId = null` and explicit override only when required.
4. Cross-tenant data access is forbidden except via Super-Admin controlled tools.
5. Soft-delete (`isDeleted`) is preferred; hard delete only after retention policy.

This matrix will be refined into concrete permission seeds during Phase 2.
