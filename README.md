# Educare SMS - Student Management System

A full-featured, role-based school management system built with **Next.js 16**, **TypeScript**, **Prisma 7**, **PostgreSQL**, and **Tailwind CSS**.

---

## Tech Stack

| Layer         | Technology                                    |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack)            |
| Language      | TypeScript 5.9 (strict mode)                  |
| UI            | Tailwind CSS v4, shadcn/ui, Lucide icons      |
| Database      | PostgreSQL 16 (Neon serverless)             |
| ORM           | Prisma 7 (driver adapter mode)                |
| Auth          | NextAuth v5 (JWT + credentials provider)      |
| Validation    | Zod 4 (shared client + server schemas)        |
| Testing       | Vitest (unit), Playwright (e2e)               |
| Charts        | Recharts                                      |
| Email         | Nodemailer (console transport in dev)          |
| Caching       | Redis (ioredis)                               |
| Container     | Docker + docker-compose                       |

---

## Getting Started

### Prerequisites

- **Node.js** v24+ (`node -v`)
- **npm** v11+ (`npm -v`)
- **Git**

### Clone and Install

```bash
git clone <repository-url>
cd student
npm install
```

> `npm install` automatically runs `prisma generate` via the postinstall script, so the Prisma client is ready to use immediately.

### Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

| Variable              | Required | Description                                                                 |
| --------------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`        | Yes      | Neon PostgreSQL connection string (used for local dev and deploy)           |
| `AUTH_SECRET`         | Yes      | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `UPLOAD_STORAGE_DIR`  | No       | Local file upload directory (default: `storage`)                            |
| `BLOB_READ_WRITE_TOKEN` | No    | Vercel Blob token for production file storage                               |

### Database Setup

This project uses **Neon** as the single database for both local development and deployment.

```bash
npm run db    # Reset, migrate, seed, and open Prisma Studio
```

This single command will:
1. **Drop** the existing database
2. **Re-create** and **migrate** the schema
3. **Seed** demo data (users, students, teachers, classes, etc.)
4. **Open Prisma Studio** in your browser

Individual commands for specific tasks:

```bash
npm run db:migrate   # Run pending migrations
npm run db:deploy    # Deploy migrations (production)
npm run db:seed      # Seed demo data (idempotent)
npm run db:studio    # Open Prisma Studio
```

---

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dev server uses **Turbopack** for fast hot-reloading. The app will be available at `localhost:3000` with the login page.

### Other Scripts

| Command              | Description                             |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Start development server (Turbopack)    |
| `npm run build`      | Production build                        |
| `npm run start`      | Start production server                 |
| `npm run lint`       | Run ESLint                              |
| `npm run typecheck`  | Run TypeScript type checking            |
| `npm run test`       | Run unit tests (Vitest)                 |
| `npm run test:watch` | Run tests in watch mode                 |
| `npm run e2e`        | Run end-to-end tests (Playwright)       |
| `npm run db`         | Reset + migrate + seed + open Studio    |
| `npm run db:studio`  | Open Prisma Studio (visual DB browser)  |

---

## Re-Seeding the Database

> **Warning: This will permanently delete all data in the Neon database and replace it with fresh demo data. Do NOT run this on a production database or any database with real user data.**

If you want to reset the database back to its initial demo state:

```bash
npm run db
```

This single command will:

1. **Drop** the existing database
2. **Re-run** all Prisma migrations from scratch
3. **Seed** the database with demo data (users, students, teachers, classes, subjects, attendance, exams, fees, announcements, etc.)
4. **Open** Prisma Studio so you can inspect the data

If you only want to re-run the seed script without dropping/migrating (e.g. after adding new seed data):

```bash
npm run db:seed
```

> `db:seed` is idempotent-safe for most models (uses `upsert`), but running `npm run db` is the cleanest way to get a known starting state.

---

## Demo Credentials

Login using **Registration Number** and **Password**:

| Role    | Reg No       |
| ------- | ------------ |
| Admin   | ADM-0001     |
| Teacher | TCH-0001     |
| Student | STU-2026-0001|
| Parent  | PAR-0001     |

passwards are private .. dm me for passwards

---

## Features

### 1. Authentication & Session Management

The authentication system is built on **NextAuth v5** with JWT-based sessions and a credentials provider.

- **Login** with registration number + password (no email required)
- Passwords are hashed with **bcrypt** (12 salt rounds) and are never logged or returned in API responses
- **Login rate limiting** prevents brute-force attacks
- **JWT sessions** with role validation on every request — if a user's role changes or their account is deactivated, their session is immediately invalidated
- **Force password change** flag for admin-created accounts or password resets
- **Session management** — users can view all their active sessions (device, browser, OS, IP, last active time) and revoke any session
- **Password reset workflow** — users request a reset, an admin reviews and generates a one-time PIN, the user enters the PIN to set a new password
- Full **audit logging** of authentication events (login, logout, failed attempts, password changes)

### 2. Role-Based Access Control (RBAC)

The system enforces a strict 5-role permission model:

| Role         | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |

| Admin        | Full school management access (students, staff, academics, finances)   |
| Teacher      | Access to assigned classes for attendance, exams, timetable            |
| Student      | Read-only access to own grades, attendance, fees, timetable            |
| Parent       | Read-only access to linked children's academic and fee information     |

Every page and server action is guarded by `requirePage()` (page-level) and `requireRole()` (action-level) checks. Unauthorized access results in a redirect to the appropriate dashboard or an `AuthorizationError`.

**RBAC Permission Matrix:**

| Feature        |  Admin | Teacher | Student | Parent |
| -------------- | :---: | :-----: | :-----: | :----: |
| Dashboard      | Full  | Own     | Own     | Own    |
| Students       | CRUD  | Read    | Read    | Read   |
| Staff          | CRUD  | -       | -       | -      |
| Classes        | CRUD  | Read    | -       | -      |
| Subjects       | CRUD  | Read    | Read    | Read   |
| Attendance     | Read/Write | Read/Write | Read | Read  |
| Exams           | CRUD+Publish | CRUD | Read  | Read   |
| Timetable      | CRUD  | Read    | Read    | Read   |
| Fees           | Full  | -       | Read    | Read   |
| Admissions     | Approve/Reject | -  | -     | -      |
| Announcements  | CRUD  | Create/Read | Read | Read  |
| Settings       | Read/Update | -  | -     | -      |
| Analytics      | Full  | Read    | -       | -      |
| User Mgmt      | -     | -       | -       | -      |
| Audit Logs     | -     | -       | -       | -      |

---

### 3. Admin Dashboard

The admin dashboard provides a bird's-eye view of the entire school:

- **Key metrics** — total students, total staff, today's attendance rate, total fee collection
- **Quick action links** — navigate directly to common tasks (add student, mark attendance, create exam, etc.)
- **Charts and analytics** — visual breakdowns of student enrollment, fee collection trends, attendance trends using Recharts
- **Recent activity** — latest admissions, payments, and announcements at a glance

---

### 4. Student Management

Complete student lifecycle management:

- **Student list** — searchable, filterable table with pagination; filter by class, status, name, or admission number
- **Create student** — full form capturing: first/middle/last name, date of birth, gender, blood group, religion, nationality, address, contact info, guardian details, and photo upload
- **Student profile** — detailed view showing personal info, class enrollment, attendance summary, exam results, fee invoices, and uploaded files
- **Edit student** — update any student detail; changes are audit-logged
- **Student status management** — mark students as Active, Inactive, Graduated, or Withdrawn
- **Photo upload** — with file type and size validation
- **File uploads** — upload and manage student documents, ID card scans, photos, and other files; categorized as Photo, Document, ID Card, or Other
- **ID card generation** — generate printable student ID cards with photo and details
- **Class enrollment** — assign students to classes within an academic year; track enrollment status (Active, Completed, Withdrawn)
- **Roll number** — assign roll numbers within a class

---

### 5. Staff / Teacher Management

Full teacher profile management:

- **Teacher list** — searchable table with employee ID, name, qualification, designation, specialization, status
- **Create teacher** — form capturing: employee ID, name, email, phone, gender, DOB, qualification, designation, specialization, join date
- **Edit / deactivate** — update profiles or set status to Inactive
- **Class teacher assignment** — designate a teacher as the class teacher for a specific class (responsible for attendance, parent communication, etc.)
- **Teacher-subject-class mapping** — assign which teacher teaches which subject in which class for a given academic year; this is the authorization boundary for attendance marking and grade entry

---

### 6. Class & Section Management

- **Create classes** — define class name (e.g. "Grade 6"), section (e.g. "A"), and a unique code (e.g. "G6-A")
- **Academic year scoping** — each class belongs to an academic year
- **Class teacher** — assign a class teacher to each section
- **Room assignment** — optional room/physical location for the class
- **Student count** — see how many students are enrolled in each class
- **CRUD** — create, edit, and manage classes with duplicate prevention

---

### 7. Subject Management

- **Subject catalog** — create subjects with name, unique code, and optional description
- **18 pre-seeded subjects** covering primary through SSC level (Bangla, English, Math, Science, ICT, Social Science, Religion, Bangladesh & Global Studies, Physics, Chemistry, Biology, Higher Math, Accounting, Business Entrepreneurship, Finance & Banking, Geography, History, Physical Education)
- **Teacher-subject-class assignments** — link a teacher to a subject for a specific class and academic year

---

### 8. Academic Year & Term Management

- **Academic years** — define start/end dates and set one as the active year
- **Terms** — each academic year contains multiple terms (e.g. Term 1, Term 2, Final); set one as the active term
- **School-level configuration** — the school profile points to a `currentAcademicYear` that drives the default views across the app
- All classes, assessments, timetables, enrollments, and fee structures are scoped to their academic year or term

---

### 9. Admission Workflow

A complete admissions pipeline:

- **Application form** — parents/students fill in applicant details (name, DOB, gender, contact, guardian info) and select the class they're applying for
- **Application list** — admins see all applications with status badges (Pending, Approved, Rejected)
- **Review application** — admin views full details and decides to Approve or Reject with optional remarks
- **Auto-account creation** — when an application is approved, the system automatically creates a Student record, a User account (with a registration number), and an Enrollment in the applied class
- **Status tracking** — applicants and admins can track the application status throughout the process
- **Academic year scoping** — applications are tied to a specific academic year

---

### 10. Attendance Management

- **Daily attendance marking** — class teachers select a class and date, then mark each student as Present, Absent, Late, or Leave
- **Bulk marking** — mark the entire class as Present by default, then adjust individual exceptions
- **Same-day editing** — teachers can edit attendance records for the current day only
- **Student/parent view** — students and parents see their own attendance history with a calendar view and statistics
- **Absence reports** — admins can generate absence reports filtered by class, date range, and status
- **Audit trail** — each attendance record tracks who marked it and when
- **Unique constraint** — one attendance record per student per class per date (no duplicates)

---

### 11. Exams & Grading

Full assessment lifecycle:

- **Create assessments** — define name, type (Quiz, Classwork, Homework, Midterm, Final, Other), max marks, weight, date, class, subject, and term
- **Assessment list** — view all assessments with publish status; filter by class, subject, or term
- **Marks entry** — enter marks for each student in the class; the interface shows all students with input fields for marks obtained
- **Grade computation** — automatic grade and grade point calculation using the school's configurable grade scale
- **Grade scale** — configurable grading system (A+ through F) with min/max percentages and grade points; pre-seeded with a standard scale
- **Publish results** — toggle assessment publish status; students/parents can only see published results
- **Report card generation** — compile all assessment marks for a student in a term into a report card view with totals and GPA
- **Mark overrides** — admins can override marks with an audit trail tracking who overrode and when
- **Audit logging** — every mark creation and update is tracked with created/updated by user references

---

### 12. Timetable Management

- **Weekly class schedules** — create timetable entries mapping a class, subject, teacher, day of week, period number, start/end time, and room
- **Grid view** — visual weekly timetable grid showing all periods for a class
- **Teacher view** — teachers see their own weekly schedule across all assigned classes
- **Student/parent view** — students and parents see their class timetable
- **Conflict prevention** — unique constraint on (class, term, day, period) prevents double-booking a slot
- **Term-scoped** — timetables are tied to a specific academic term

---

### 13. Fee Management

Complete financial management:

- **Fee structures** — define fee types (Tuition, Lab, Library, etc.) with amounts; optionally scoped to a specific class or term
- **Invoice generation** — create invoices for students with line items linked to fee structures; each invoice has an invoice number, issue date, due date, and total amount
- **Invoice statuses** — Draft, Issued, Partial, Paid, Overdue, Cancelled
- **Payment submission** — students/parents can submit payments against an invoice with amount, method (Cash, Card, Bank Transfer, UPI, Other), and reference number
- **Payment statuses** — Pending, Confirmed, Rejected, Refunded
- **Admin confirmation workflow** — admins review submitted payments and Confirm or Reject them; confirmation updates the invoice status automatically
- **Partial payments** — invoices support partial payments and track the remaining balance
- **Overdue detection** — invoices past their due date with unpaid amounts are automatically flagged as Overdue
- **Fee collection statistics** — admin dashboard shows total collection, pending amounts, and overdue counts
- **Payment webhook** — idempotent payment webhook endpoint for integrating with external payment providers

---

### 14. Announcements

School-wide communication:

- **Create announcements** — admins and teachers can create announcements with a title and body
- **Audience targeting** — choose who sees the announcement: All, Admin, Teacher, Student, or Parent
- **Class-specific** — optionally link an announcement to a specific class
- **Email notification** — optionally send an email to all targeted users when creating the announcement
- **Announcement feed** — each role sees announcements targeted to them; newest first
- **Author tracking** — shows who created each announcement and when

---

### 15. Parent Portal

A dedicated view for parents to monitor their children:

- **Linked children** — view all children linked to the parent's account (via the StudentGuardian relationship)
- **Children's attendance** — attendance records for each child with status breakdown
- **Children's grades** — exam results and report cards for each child
- **Children's timetable** — weekly class schedule for each child's class
- **Children's fees** — invoices and payment history for each child
- **Announcements** — school and class-specific announcements

---

### 16. Notifications

An in-app notification system:

- **Notification center** — bell icon in the header showing unread count; click to see all notifications
- **Notification types** — info, success, warning, error (with visual indicators)
- **Categories** — mapped to user preference keys: student updates, attendance alerts, fee alerts, exam results, admissions, staff updates, system, security, reports
- **Read/unread tracking** — users can mark individual notifications as read or mark all as read
- **Entity linking** — each notification can link to a specific entity (e.g. an invoice, an attendance record, an admission) for quick navigation
- **Email delivery** — notifications can be delivered via email with delivery tracking (pending, sent, failed, skipped)
- **User preferences** — each user can configure which notification categories they want to receive, plus in-app vs push notification preferences

**Triggered on:** invoice creation, payment submission/confirmation/rejection, attendance marking, exam result publishing, admission approval/rejection, new announcements.

---

### 17. File Upload & Management

- **Student file uploads** — upload documents, photos, ID card scans for any student
- **Categories** — Photo, Document, ID Card, Other
- **Storage** — supports local file storage (`UPLOAD_STORAGE_DIR`) or Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
- **Authorized download** — files are served through a protected API route that validates the requesting user's permissions
- **File metadata** — tracks original filename, MIME type, file size, storage key, uploader, and upload timestamp

---

### 18. User Management (Super Admin)

- **User list** — view all system users with their role, status, registration number, and email
- **Create users** — admins can create user accounts for teachers, students, and parents
- **Role assignment** — assign roles during creation or edit
- **Status toggle** — activate or deactivate user accounts
- **Force password change** — flag a user so they must change their password on next login

---

### 19. Password Reset Workflow

A secure, admin-mediated password reset process:

1. **User requests reset** — user submits a password reset request from their profile
2. **Admin reviews** — admin sees all pending requests with user details
3. **Admin generates PIN** — admin approves the request and a one-time PIN is generated (shown to admin once, then cleared)
4. **User enters PIN** — user enters the PIN to verify their identity and sets a new password
5. **Request expires** — PINs have an expiration time for security

---

### 20. Active Session Management

- **Session list** — users can see all active sessions across devices
- **Session details** — device type, browser, OS, IP address, last active time, creation time, expiration time
- **Current session indicator** — clearly marks which session is the current one
- **Revoke sessions** — users can terminate any session (except the current one) to log out that device

---

### 21. School Settings

Admin-accessible configuration:

- **School profile** — school name, short name, address, city, phone, email, logo URL, timezone
- **Academic year management** — create years, set active year
- **Term management** — create terms within years, set active term
- **Grade scale configuration** — configure the grading system (labels, min/max percentages, grade points)
- **System settings** — key-value settings store scoped to the school

---

### 22. Audit Logging

Comprehensive audit trail across the system:

- **Who** — tracks the acting user (actorId)
- **What** — action performed and entity type (e.g. "create", "Student", "Attendance")
- **Which** — specific entity ID
- **Details** — JSON payload with additional context (old/new values, IP address, etc.)
- **When** — timestamp of the action
- **Queryable** — audit logs are indexed by entity and actor for efficient querying
- **Super Admin only** — only Super Admins can view audit logs

---

### 23. User Preferences

Per-user customization:

- **Notification preferences** — toggle individual notification categories on/off
- **Theme** — system, light, or dark mode
- **Sidebar behavior** — expanded or collapsed
- **Density** — comfortable or compact layout
- **Date/time format** — configurable date format and 12h/24h time format

---

### 24. Analytics (Admin)

Data-driven insights:

- **Student enrollment trends** — enrollment numbers over time
- **Fee collection analytics** — revenue trends, pending vs collected
- **Attendance analytics** — class-wise and overall attendance rates
- **Exam performance** — grade distribution and subject-wise performance
- All powered by **Recharts** with responsive, interactive charts

---

## Project Structure

```
student/
  prisma/
    schema.prisma            # Database schema (models, enums, relations)
    seed.ts                  # Demo data seeder
    prisma.config.ts         # Prisma configuration (datasource URL from env)
    migrations/              # Migration files
  src/
    app/
      (auth)/login/          # Login page
      (dashboard)/
        admin/               # Admin pages
          page.tsx           #   Dashboard overview
          students/          #   Student CRUD, profile, ID card
          staff/             #   Teacher CRUD and management
          classes/           #   Class & section management
          subjects/          #   Subject management
          admissions/        #   Admission applications & review
          attendance/        #   Attendance reports
          exams/             #   Assessment CRUD, marks entry
          timetable/         #   Timetable management
          fees/              #   Invoices, payments, fee structures
          announcements/     #   Announcement management
          analytics/         #   Charts and analytics
          settings/          #   School settings, grade scales
          users/             #   User management (Super Admin)
          password-resets/   #   Password reset requests
          active-sessions/   #   Session management
        teacher/             # Teacher pages
          page.tsx           #   Teacher dashboard
          attendance/        #   Mark attendance for classes
          exams/             #   Create assessments, enter marks
          timetable/         #   View own timetable
          announcements/     #   View/create announcements
          profile/           #   Teacher profile
        student/             # Student pages
          page.tsx           #   Student dashboard
          grades/            #   View grades and report cards
          attendance/        #   View attendance history
          fees/              #   View invoices and make payments
          timetable/         #   View class timetable
          announcements/     #   View announcements
        parent/              # Parent pages
          page.tsx           #   Parent dashboard (linked children)
          grades/            #   Children's grades
          attendance/        #   Children's attendance
          fees/              #   Children's invoices and payments
          timetable/         #   Children's timetable
          announcements/     #   View announcements
        notifications/       # Notification center
        profile/             # User profile & preferences
      api/
        auth/                # NextAuth route handlers
        uploads/             # Authorized file download
        payments/webhook/    # Idempotent payment webhook
    components/
      ui/                    # shadcn/ui primitives (button, card, table, dialog, etc.)
      fees/                  # Fee and payment components
      layout/                # Sidebar, navigation, header
    lib/
      auth.ts                # NextAuth config (credentials provider, JWT strategy)
      db.ts                  # Prisma client singleton
      rbac.ts                # Role-permission mapping
      permissions.ts         # Page and action authorization guards
      audit.ts               # Audit logging helper
      fees.ts                # Fee data-fetching helpers
      fees/                  # Fee server actions and helpers
      notifications/         # Notification creation and delivery
      validations/           # Zod schemas (shared client + server)
    generated/prisma/        # Generated Prisma client (do not edit)
  scripts/
    db/
      reset.mjs                # Reset Neon database (drop, migrate, seed, open Studio)
  e2e/                       # Playwright end-to-end tests
  tests/                     # Additional unit tests
```

---

## License

Private project. All rights reserved.
