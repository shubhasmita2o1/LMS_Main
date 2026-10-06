# Phase 0 — University Hierarchy Model

Canonical academic hierarchy used across the platform:

```
University
 └── Campus (optional multi-campus)
      └── School / Faculty (e.g. School of Engineering)
           └── Department (e.g. Computer Science)
                └── Program (e.g. B.Tech CSE)
                     └── Batch / Cohort (e.g. 2024-2028)
                          └── Semester / Term
                               └── Section (e.g. Section A)
                                    └── Course Offering (Course + Faculty + Section + Term)
```

## Key Entities

| Entity | Description | Key Fields (illustrative) |
|--------|-------------|---------------------------|
| University | Top-level tenant academic unit | name, code, accreditation, address |
| Campus | Physical / logical location | name, code, universityId |
| School | Academic division | name, code, campusId |
| Department | Subject department | name, code, schoolId, HOD |
| Program | Degree program | name, code, duration, credits, departmentId |
| AcademicYear | Calendar year / session | name, startDate, endDate |
| Semester / Term | Sub-division of academic year | name, academicYearId, start/end |
| Batch | Student cohort of a program | programId, startYear, endYear, intake |
| Section | Subdivision of a batch for a term | batchId, semesterId, name, capacity |
| Course | Catalog course | code, title, credits, type (core/elective), prerequisites |
| CourseOffering | Concrete delivery | courseId, sectionId, facultyIds, termId |

## Configurable Rules

- Credit systems (credit hours, CGPA scales)
- Grading schemes (letter grades, absolute, relative)
- Attendance thresholds and shortage rules
- Prerequisite enforcement policies

All entities are **tenant-scoped**. Super-Admin operates outside any tenant.
