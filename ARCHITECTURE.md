# Architecture

## Overview

Student Management System built with Next.js 16 (App Router), TypeScript (strict),
Tailwind CSS v4 + shadcn/ui, PostgreSQL, Prisma 7, Auth.js v5 (NextAuth) with
credentials + JWT, and Zod validation shared between client and server.

Layering: UI → Server Action / Route Handler → Zod validation → authorization
check → service/business logic → Prisma → PostgreSQL. Business rules and
authorization live on the server, never solely in a React component.

## Key decisions

- **Auth.js v5 (next-auth 5.0.0-beta.32)**, JWT session strategy, credentials
  provider, bcrypt password hashing, login rate limiting.
- **Prisma 7**: `prisma-client` generator (ESM, Rust-free) outputs to
  `src/generated/prisma`; `prisma.config.ts` holds `datasource.url` and the seed
  command; driver adapter `@prisma/adapter-pg` required at runtime.
- **This Next.js version renames `middleware.ts` → `proxy.ts`** (deprecated).
  Route protection runs in `src/proxy.ts` using the JWT cookie (optimistic
  only); every Server Action re-validates role and ownership server-side.
- Money is stored as `Decimal` (`@db.Decimal`); no floats in financial logic.
- Calendar dates use `DateTime @db.Date`; instants use `TIMESTAMP(3)`.
  Display timezone is the School.timezone setting.
- A parent-submitted payment starts `PENDING` and only becomes `CONFIRMED` via
  admin confirmation or an idempotent provider webhook (`providerTxnId` unique).
- One ACTIVE enrollment per student per academic year is enforced by a partial
  unique index (`Enrollment_active_unique`) plus a transactional check.
- Uploads are validated by magic bytes (not just extension), stored outside the
  public tree, and served only through an authorized download route.
- Email uses Nodemailer with a console transport in dev (no SMTP needed).

## Database schema

See `prisma/schema.prisma` (the ERD). Summary:

- **Tenancy**: `School` (single row; `timezone`, `currentAcademicYearId`),
  `Setting` KV. `User.schoolId` exists so a Super Admin / multi-school tier can
  be added later without a rewrite.
- **People**: `User` (email, passwordHash, role, status), `Student` (guardian
  info, admissionNo, classId, rollNo, createdBy not stored — actions are
  audited), `Teacher` (employeeId), `StudentGuardian` links a PARENT user to a
  student.
- **Academics**: `AcademicYear`, `Term`, `Class` (unique code),
  `Subject`, `TeacherAssignment` (class×subject×teacher = teaching boundary),
  `Enrollment`, `AdmissionApplication`.
- **Attendance**: per student per class per day, unique
  `(studentId, classId, date)`, with markedBy (actor).
- **Grading**: `Assessment` (class/subject/term/teacher, maxMarks, weight,
  isPublished), `Mark` (unique per assessment+student, grade stored, override
  tracking), `GradeScale` (configurable).
- **Timetable**: `TimetableEntry` (unique class/term/day/period, "HH:mm" times).
- **Fees**: `FeeStructure`, `Invoice` (status enum), `InvoiceItem`, `Payment`
  (status enum PENDING/CONFIRMED/REJECTED/REFUNDED, providerTxnId unique).
- **Communication**: `Announcement` (audience + optional class).
- **Files/Audit**: `StudentFile`, `AuditLog` (actor/action/entity/timestamp).

## Folder structure

```
app/(auth)/login/            login page
app/(dashboard)/             role-based shells:
  admin/  teacher/  student/  parent/
app/api/auth/[...nextauth]/  Auth.js route handlers
app/api/uploads/[id]/        authorized file download
app/api/payments/webhook/    idempotent provider webhook endpoint
components/ui/               shadcn/ui primitives
components/                  app components (layout, tables, forms, status)
lib/
  auth.ts                    NextAuth config (credentials, JWT)
  db.ts                      Prisma client (pg adapter)
  permissions.ts             RBAC: requirePage / requireRole / getCurrentUser
  audit.ts                   AuditLog writes
  email.ts                   Nodemailer (console transport in dev)
  storage.ts                 validated local file storage
  rate-limit.ts              in-memory login rate limiter
  validations/               Zod schemas (shared client+server)
  services/                  business logic (attendance, grading, fees, ...)
  actions/                   Server Actions per module
proxy.ts                     optimistic route + role guard
prisma/schema.prisma         schema
prisma/seed.ts               deterministic dev seed
scripts/db/                  project-local Postgres cluster scripts
src/generated/prisma/        generated Prisma client (gitignored)
```

## Server Actions / API routes by module

- **Auth**: `signIn` (credentials), `signOut`; routes `/api/auth/*`.
- **Students**: CRUD actions, photo/document upload, ID card generation, guardians.
- **Staff**: CRUD actions.
- **Classes/Sections**: CRUD, class-teacher assignment.
- **Subjects**: CRUD + teacher assignments.
- **Admission**: submit application, approve/reject (→ create student + enrollment).
- **Attendance**: bulk mark, edit same-day, history, absence report.
- **Grading**: assessment CRUD, marks entry, publish, report-card PDF.
- **Timetable**: CRUD.
- **Fees**: invoice generation, confirm/reject payment, receipt, overdue scan,
  webhook `POST /api/payments/webhook`.
- **Announcements**: create (audience-targeted), list, email notification.
- **Settings**: school profile, academic year/terms, grading scale.

## Security model

- Passwords hashed (bcrypt); never logged or returned.
- Role is re-validated in every mutation (never trusted from the client).
- Parents/students query only rows linked to their session user.
- Uploads validated by signature; server-generated filenames; authorized reads.
- Secrets only in env vars; `.env.example` documents all vars; `.env` ignored.
- Sensitive actions (role change, grade override, attendance correction,
  fee/payment status change, admission approval/rejection) write to `AuditLog`.
- Money in `Decimal`; payments idempotent via `providerTxnId` unique.
