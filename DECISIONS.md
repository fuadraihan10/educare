# Decisions

Append-only log of non-obvious choices and why. Newest last.

## M0 — Scaffold & infrastructure

1. **Project-local PostgreSQL dev cluster (port 5433, `.postgres/`)** instead of the
   machine's existing server on 5432 (superuser password unknown). Self-contained,
   reproducible via `scripts/db/*`; `.postgres/` is gitignored.

2. **HVCI/Memory Integrity breaks Postgres on this host.** Child processes fail to
   reserve the shared memory region (error 487 / 0xC0000142), the documented Windows
   ASLR+HVCI collision. Lowering `shared_buffers=16MB` and `max_connections=20`
   shrinks the region enough that it works reliably. Baked into `scripts/db/init.mjs`
   with a comment. (A permanent fix — disabling bottom-up ASLR for
   `pg_ctl.exe`/`postgres.exe` in Windows Exploit Protection — needs admin and is
   documented in DECISIONS as an alternative.)

3. **This Next.js major renamed `middleware.ts` → `proxy.ts`.** All route protection
   uses `src/proxy.ts`. `middleware` is deprecated.

4. **Prisma 7 layout:** `prisma-client` generator (ESM, Rust-free) with required
   `output` at `src/generated/prisma` (gitignored; regenerated via `prisma generate`
   in `postinstall`); `prisma.config.ts` required and holds `datasource.url` + seed
   command; runtime needs `@prisma/adapter-pg` + `PrismaPg`. `.env` is loaded
   explicitly in `prisma.config.ts` and in `prisma/seed.ts` (no auto-loading in v7).

5. **Auth.js v5 (beta) with JWT strategy**, credentials provider, bcrypt. In-memory
   login rate limiter (10 attempts / 15 min per IP+email). Documented as per-instance;
   swap for a DB/redis-backed limiter before horizontal scaling.

6. **Calendar dates stored as `DateTime @db.Date`; instants as `TIMESTAMP(3)`** to keep
   attendance/exam/fee semantics unambiguous. Display timezone = `School.timezone`.

7. **One active enrollment per student per year** enforced by a hand-added partial
   unique index (`Enrollment_active_unique`, added to the init migration) plus a
   transactional check in the enrollment service.

8. **Payment status enum (PENDING/CONFIRMED/REJECTED/REFUNDED)** — a parent claim is
   never "paid". Admin confirmation or an idempotent webhook (unique `providerTxnId`)
   moves it to CONFIRMED. No live payment provider in this build; the webhook endpoint
   is modeled and idempotent.

9. **Grading scale seeded as configurable `GradeScale`** (standard 10-point:
   A+ 90+, …, F <60), editable in Settings. Max marks per assessment are entered by
   the teacher; grades derive from percent against the scale.

10. **Email via Nodemailer, console transport by default** — no SMTP credentials
    required locally (`EMAIL_TRANSPORT=smtp` + SMTP_* vars turn on real delivery).
    Announcement email failure never fails the mutation.

11. **Uploads validated by magic bytes**, server-generated UUID filenames, stored in
    `storage/` (gitignored) outside `public/`, served only via
    `GET /api/uploads/[id]` after authorization. A storage service abstraction
    (`src/lib/storage.ts`) is where an S3/UploadThing backend would plug in.

12. **Grading/attendance auditability**: `Mark` carries createdBy/updatedBy/override
    fields; `Attendance` carries markedBy. Other sensitive actions write to
    `AuditLog`. AuditLog never contains passwords/secrets/PII.

## M1 — Auth & role-based dashboards

13. **Base-nova preset: base-ui `DropdownMenuLabel` (GroupLabel) requires a
    `Menu.Group` ancestor.** Using the label standalone throws production error #31
    ("MenuGroupContext is missing") and the menu silently never opens; symptoms
    looked like a trigger bug (SidebarMenuButton/native button both "failed") but the
    cause was the ungrouped label. Fix: wrap the label in `DropdownMenuGroup`. Any
    dropdown/label usage in later modules must keep this structure.

14. **shadcn `Button` renders non-native elements when given `render={<Link/>}`**
    (e.g. admin quick actions), producing a base-ui console warning about
    `nativeButton`. Cosmetic only; leave unless tests gate on clean console.

## M2 — Student information management

15. **Server-action forms require `name` attributes on every field.** `useActionState`
    + `<form action={formAction}>` serialize the form via the DOM; inputs with only
    `id` (as our first cut had) submit empty `FormData`, so the server saw every
    field as `undefined` and validation failed with a 200 (no redirect). Symptom:
    action returns `{status:'error'}` and the URL never changes. Every form built from
    now on must give fields both `id` (for labels/tests) and `name` (for submission).

16. **E2E suites run serially (`workers: 1`), not fully parallel.** The students suite
    mutates shared seeded rows (row 1 is edited/uploaded-to by multiple tests); running
    tests in parallel caused cross-test races and flaky failures. Keep DB-mutating e2e
    suites serial; parallelize only read-only suites (or make each test self-contained).

17. **Auto admission numbers: compute-then-retry on `P2002`.** `nextAdmissionNo()`
    derives the next sequence from the latest row (cheap, no lock); the `create`
    transaction wraps the insert in a 5-attempt retry loop so a concurrent insert
    that wins the unique key just recomputes the candidate instead of failing.

18. **Turbopack panicked with `generate_source_map was canceled` (same TaskId, twice)
    until `.next/` was deleted.** Stale incremental cache after many builds; `rm -rf
    .next` resolved it. Also `.next/dev/types/routes.d.ts` corrupted after aborted
    runs — same remedy. If Turbopack misbehaves mid-module, clean `.next` first.

## M3 — Staff/Teacher Management

19. **Linked login created in a single transaction.** `createStaff` wraps User (role
    TEACHER, same schoolId) + Teacher insert in `$transaction`. `employeeId` gets the
    same compute-then-retry loop as admission numbers (P2002, 5 attempts). Email
    uniqueness is checked as a separate branch of the P2002 handler so a duplicate
    email shows a clear message instead of a generic error.

20. **Status toggle updates both Teacher and User.** `setStaffStatus` flips
    `Teacher.status` and `User.status` in a single `$transaction`, keeping them
    always consistent. Deactivation blocks login (auth checks `user.status === 'ACTIVE'`);
    reactivation re-enables it.

21. **Teacher own-profile is un-addressable.** The `/teacher/profile` page reads the
    session user id, looks up the single Teacher record by `userId`, and renders it.
    No path parameter exists — a teacher cannot enumerate or request another teacher's
    profile by changing a URL segment.

22. **Employee ID format `EMP-###` continues the seed sequence.** The seed creates
    EMP-001 through EMP-010; `nextEmployeeId()` finds the max and increments, so the
    first E2E-created teacher gets EMP-011, and the format auto-widens if needed.

23. **Dev overlay `click({ force: true })` in e2e.** Production builds of this Next.js
    version still inject a `<script data-nextjs-dev-overlay>` whose portal intercepts
    pointer events on the sidebar menu and delete buttons. Tests that click through
    the affected areas use `force: true`; no user-visible impact.

## M4 — Class & Section Management

24. **No separate Section model — section is a plain string on Class.** The schema
    uses `name` (e.g. "Grade 6") + `section` (e.g. "A") + `code` (e.g. "G6-A") as
    three separate fields. A unique constraint on `(academicYearId, name, section)`
    prevents duplicate sections within the same year.

25. **Delete protected by enrollment count.** `deleteClass` checks
    `students + enrollments > 0` before deleting; if any exist, the action silently
    returns without deleting. Admin sees the delete button only when the counts are
    zero, so the UI stays consistent.

26. **Prisma `include` type inference failure on complex queries.** `getClass` uses
    nested includes (_count, enrollments with student, assignments with teacher+subject)
    and TypeScript infers just the base Class model. Fixed by adding an explicit
    return type (`ClassDetail`) and casting the result. Simple `getTeacher`-style
    includes work fine; the threshold appears to be ~3+ levels of nesting.
