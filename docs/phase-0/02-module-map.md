# Phase 0 — Module Map & SaaS Priorities

**Source:** University LMS SaaS Master Roadmap v2.0 — Final Product Scope

| # | Module | SaaS Priority | MVP? |
|---|--------|---------------|------|
| 01 | Platform & Tenant Management (Super-Admin, Onboarding, Branding, Custom Domains, Feature Flags) | Critical | Yes |
| 02 | Authentication & Security | Critical | Yes |
| 03 | User & Role Management (RBAC + Resource permissions) | Critical | Yes |
| 04 | University / Academic Structure | Critical | Yes |
| 05 | Admissions | High | Partial / Later |
| 06 | Student Information System (SIS) | Critical | Yes |
| 07 | Faculty Management | High | Yes (core) |
| 08 | Course & Curriculum Management | Critical | Yes |
| 09 | Core LMS / Theory Learning | Critical | Yes |
| 10 | Practical & Lab Management (Code sandboxes) | Differentiator | Beta / Post-MVP |
| 11 | Assignments | Critical | Yes |
| 12 | Quiz & Assessment | Critical | Yes |
| 13 | Question Bank | High | Yes |
| 14 | Examination | High | Post-MVP |
| 15 | Attendance | High | Yes (basic) |
| 16 | Timetable | Medium | Later |
| 17 | Gradebook & Results | Critical | Yes |
| 18 | Transcript & Certificates | Medium | Later |
| 19 | Communication & Notifications | Critical | Yes |
| 20 | Discussion / Community | Medium | Later |
| 21 | Library | Medium | Later |
| 22 | Fees & Finance + SaaS Billing (Stripe/Razorpay) | Critical | Yes |
| 23 | Hostel | Later | No |
| 24 | Transport | Later | No |
| 25 | Placement | Medium | Later |
| 26 | Internship | Medium | Later |
| 27 | Research & Projects | Later | No |
| 28 | Student Support | Medium | Later |
| 29 | Analytics & Reporting | High | Basic in MVP |
| 30 | AI Learning | Later | No |
| 31 | Notifications | Critical | Yes (merged with 19) |
| 32 | Integrations (Zoom, Calendar, SIS, LTI, SSO) | High | Architecture ready |
| 33 | Audit & Compliance | Critical | Yes (core) |
| 34 | Microservices / Infrastructure | Ongoing | Continuous |
| 35 | SaaS Billing, Subscriptions, Usage Metering, Plans | Critical (new) | Yes |
| 36 | White-labeling & Custom Domains | Critical (new) | Yes |
| 37 | Super-Admin Control Plane | Critical (new) | Yes |

## Core Module Boundaries (Monolith Domains)

These will become the feature folders under `apps/api/src/modules/`:

```
auth | tenant | users | university | academic | admissions | students
faculty | courses | lms | practical | assessment | examination
attendance | results | finance | library | placement | communication
analytics | notifications | audit
```

Every document **must** carry `tenantId` (except Super-Admin scoped entities).  
Modules enforce strict domain boundaries so they can be extracted to microservices later without a rewrite.
