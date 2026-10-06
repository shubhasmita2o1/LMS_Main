# Phase 0 — Product Scope & Personas

**Document Version:** 1.0  
**Aligned with:** University LMS SaaS Master Roadmap v2.0

## Roadmap Objective

Build a production-ready, multi-tenant SaaS platform that universities can subscribe to. Cover theory, practicals/labs, assessments, examinations, academics, student administration, faculty, finance, library, placements, communication, analytics and AI — while prioritising a **sellable MVP early**.

## Personas

| Persona | Description | Primary Goals |
|---------|-------------|---------------|
| **Super Admin** | Platform operator (our company) | Onboard tenants, manage plans, billing, feature flags, global analytics, support |
| **Tenant Admin / University Admin** | University IT / Academic leadership | Configure branding, domains, academic structure, users, roles, billing |
| **Faculty** | Teachers, HODs, coordinators | Create content, assignments, quizzes, grade, take attendance, communicate |
| **Student** | Enrolled learners | Access courses, submit work, take assessments, view grades, attend labs |
| **Staff** | Non-teaching administrative staff | Fees, admissions support, library, placement ops |
| **Parent / Guardian** (later) | View limited student progress | Reports, fee status |
| **Guest** | Limited public / applicant access | Admissions forms, public catalog |

## MVP vs Enterprise Scope

### Sellable MVP (Target: after Phase 10–11 ≈ 4.5–5.5 months)

**Must-have:**
- Multi-tenant platform + Super-Admin control plane
- Authentication, RBAC, tenant isolation
- University / Academic structure (University → Course hierarchy)
- Student Information System (SIS) core
- Faculty management (basic)
- Curriculum & Course management
- Core LMS (content: PDF/PPT/video, progress)
- Assignments + Quizzes + Question Bank (core)
- Gradebook & basic attendance
- Communication (email + in-app notifications)
- SaaS billing (Stripe + Razorpay) + feature flags + plan limits
- White-label branding + custom domain architecture
- Audit basics

**Explicitly deferred from MVP:**
- Full practical/lab sandbox execution (Phase 11 — differentiator, can ship as beta)
- Full examination system with proctoring
- Hostel, Transport
- Advanced AI Learning
- Full Library / Placement / Internship modules
- Advanced analytics & research modules

### Enterprise (post-MVP expansion)

All remaining modules from the roadmap (Examination hardening, Labs production isolation, Timetable, Transcripts, Library, Placement, Internship, Student Support, AI, full Integrations, Compliance).

## Pricing Model (Initial Recommendation)

| Plan | Target | Limits (illustrative) | Features |
|------|--------|------------------------|----------|
| **Starter** | Small colleges / pilots | ≤ 500 active students, 1 campus | Core LMS, Assignments, Quizzes, Gradebook, basic branding |
| **Growth** | Mid-size universities | ≤ 5 000 students, multi-campus | + Custom domain, advanced RBAC, Attendance, Fees, Analytics |
| **Enterprise** | Large universities | Custom limits, SSO, dedicated support | + Labs, Examination, Placement, full white-label, SLA, SSO/SAML |

- Usage metering: active students, storage (GB), lab execution minutes (later)
- Billing: Stripe (global) + Razorpay (India)
- Feature flags driven by plan + per-tenant overrides

## Success Criteria for Phase 0 Exit

- [x] Personas defined
- [x] MVP vs Enterprise boundary agreed
- [x] Pricing model sketch documented
- [ ] Stakeholder review of this document
