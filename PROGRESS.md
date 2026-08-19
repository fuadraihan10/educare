# Progress

## Status header

- Current phase: Phase 2 — Build (complete)
- Current module: M14 — Settings (all modules M0–M14 done)
- Last verification: e2e 11/11 new module tests pass; tsc clean
- Current blocker: none
- Next action: Full e2e regression, lint, build verification

## Environment notes

- Node v24.13.0, npm 11.6.2, PostgreSQL 18.6 (project-local cluster on port 5433).
- Host machine has **HVCI/Memory Integrity enabled**, which breaks Postgres child
  process shared-memory reservation (error 487) with default `shared_buffers`.
  Dev cluster is tuned to `shared_buffers=16MB`, `max_connections=20` via
  `scripts/db/init.mjs` — do not raise these on this machine.
- This Next.js version renamed `middleware.ts` → `proxy.ts`; route guard lives
  in `src/proxy.ts`.

## Module checklist

| Module | Status | Definition of Done |
| --- | --- | --- |
| M0 Scaffold & infrastructure | **Done** | Fresh Next.js 16 + TS strict + ESLint + Tailwind 4 + shadcn/ui; Prisma 7 with driver adapter; migrations + deterministic seed; db scripts; docs (ARCHITECTURE/PROGRESS/DECISIONS); auth skeleton; proxy guard; base libs (db, auth, permissions, audit, email, storage, rate-limit); typecheck/lint/build pass; committed. |
| M1 Auth & role-based dashboards | **Done** | Email/password login works for all 5 roles; bcrypt hashing; login rate-limited; wrong password rejected; each role lands on its own dashboard; direct URL access to another role's area redirects; logout works; full login/logout cycle persists; verification passes. |
| M2 Student Information Management | **Done** | Admin CRUD students (personal + guardian info), upload/validate photos & documents, generate a unique admission number and an ID card; lists paginated and searchable; data persists and edits are audited; verification passes. |
| M3 Staff/Teacher Management | **Done** | Admin CRUD for teachers with employee IDs and linked login accounts; teacher sees own profile only; verification passes. |
| M4 Class & Section Management | **Done** | Admin CRUD classes/sections bound to an academic year; unique class code; assign a class teacher; verification passes. |
| M5 Subject/Course Management | **Done** | Admin CRUD subjects; assign teachers to class+subject (teacher's teaching boundary); verification passes. |
| M6 Admission/Enrollment workflow | **Done** | Application can be submitted; admin approves (creates Student + Enrollment in one transaction with P2002 retry) or rejects; audit logged; e2e 4/4 passing. |
| M7 Attendance | **Done** | Teacher marks present/absent/late for a full roster in one view; persists via upsert; student/parent see history and stats; admin view with class/date selector; e2e 3/3 passing. |
| M8 Exams & Grading | **Done** | Admin CRUD assessments, enters marks, system auto-calculates grade from GradeScale; student sees published results; publish/unpublish workflow; e2e 4/4 passing. |
| M9 Timetable | **Done** | Admin CRUD weekly timetable per class/term; teacher sees own schedule; student/parent see class schedule; e2e 2/2 passing. |
| M10 Fee Management | **Done** | Admin generates invoices from fee structures, confirms/rejects payments; parent/student views invoices; payment status workflow (PENDING→CONFIRMED/REJECTED); overdue tracking; e2e 3/3 passing. |
| M11 Announcements | **Done** | Admin/teachers create announcements targeting ALL or specific audiences+classes; users see announcements filtered by role; email notification flag; e2e 3/3 passing. |
| M12 Parent Portal | **Done** | Parent dashboard shows linked children with attendance %, avg marks, recent invoice, absent count, and links to all sub-pages (attendance, grades, fees, timetable, announcements). |
| M13 Admin Analytics Dashboard | **Done** | Real-time stats: student/teacher counts, attendance rate, fee collection rate, overdue amounts, pending payments, top performers, recent enrollments, attendance bar chart; e2e 1/1 passing. |
| M14 Settings | **Done** | School profile CRUD; academic year management (create, activate); term management per active year; grade scale CRUD with ordering; e2e 2/2 passing. |
| Phase 2 | Not Started | Library management, transport management, exam seat allocation — explicitly out of scope for this build. |
