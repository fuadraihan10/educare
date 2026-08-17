# Progress

## Status header

- Current phase: Phase 2 — Build
- Current module: M3 — Staff/Teacher Management
- Last verification: e2e 18/18 (auth 8 + students 5 + staff 5), unit 9/9, tsc + lint + build pass
- Current blocker: none
- Next action: M4 — Class & Section Management

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
| M2 Student Information Management | **Done** | Admin can CRUD students (personal + guardian info), upload/validate photos & documents, generate a unique admission number and an ID card; lists are paginated and searchable; data persists and edits are audited; verification passes. |
| M3 Staff/Teacher Management | **Done** | Admin CRUD for teachers with employee IDs and linked login accounts; teacher sees own profile only; verification passes. |
| M4 Class & Section Management | Not Started | Admin CRUD classes/sections bound to an academic year; unique class code; assign a class teacher; verification passes. |
| M5 Subject/Course Management | Not Started | Admin CRUD subjects; assign teachers to class+subject (teacher's teaching boundary); verification passes. |
| M6 Admission/Enrollment workflow | Not Started | Application can be submitted; admin approves (creates Student + Enrollment in one transaction) or rejects; no double enrollment in an active class; audit logged; verification passes. |
| M7 Attendance | Not Started | Teacher marks present/absent/late for a full roster in one view; persists and is editable same-day; student/parent see history and %; admin pulls absence report by date range + class; verification passes. |
| M8 Exams & Grading | Not Started | Teacher creates assessments, enters marks, system auto-calculates grade; student/parent see results only once published; report card renders as PDF with real data; override tracked + audited; verification passes. |
| M9 Timetable | Not Started | Admin CRUD weekly timetable per class/term; teacher sees own schedule; student/parent see class schedule; verification passes. |
| M10 Fee Management | Not Started | Admin generates invoices and confirms/rejects payments; parent views invoices and submits a payment that starts PENDING; outstanding balance derived from CONFIRMED records only; overdue flagged; no double-pay; verification passes. |
| M11 Announcements | Not Started | Admin posts to any audience; teachers post to own classes; users see announcements targeted at them; email notification sent (console in dev); verification passes. |
| M12 Parent Portal | Not Started | A parent sees only their linked child's attendance/grades/invoices/timetable; cannot reach another student's data by editing an id; verification passes. |
| M13 Admin Analytics Dashboard | Not Started | Enrollment, attendance rate, fee collection, and performance numbers computed from the real database; verification passes. |
| M14 Settings | Not Started | School profile, academic year/terms, grading scale editable by admin; verification passes. |
| Phase 2 | Not Started | Library management, transport management, exam seat allocation — explicitly out of scope for this build. |
