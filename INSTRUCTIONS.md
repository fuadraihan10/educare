# Database Reset & Reseed Instructions

## Quick Reset (Full)

Run these commands in order from the project root:

```bash
# 1. Reset database (drops all tables, re-applies migrations)
npx prisma migrate reset --force

# 2. Main seed (school, admin, subjects, classes, grades, etc.)
npm run db:seed

# 3. Extra seeders (teachers, students, parents)
npx tsx prisma/seed-teachers.ts
npx tsx prisma/seed-students.ts
npx tsx prisma/seed-parents.ts
```

Or as a one-liner:

```bash
npx prisma migrate reset --force && npm run db:seed && npx tsx prisma/seed-teachers.ts && npx tsx prisma/seed-students.ts && npx tsx prisma/seed-parents.ts
```

## What Each Script Does

| Script | Description |
|--------|-------------|
| `prisma migrate reset` | Drops all tables and re-runs all migrations from scratch |
| `npm run db:seed` | Creates school, academic year, terms, classes, subjects, admin, 1 test teacher/student/parent, grade scales, sample assessments, marks, attendance, fees, announcements, timetable, notifications |
| `seed-teachers.ts` | Creates 101 teachers |
| `seed-students.ts` | Creates 300 students across 30 class sections (Class 1-10, Sections A-C) with enrollments |
| `seed-parents.ts` | Creates 99 parents linked to students via StudentGuardian |

## Default Credentials

| Role | Reg No | Email | Password |
|------|--------|-------|----------|
| Admin | ADM-0001 | admin@educare.edu.bd | Admin@12345 |
| Teacher | TCH-0001 | teacher@educare.edu.bd | Teacher@12345 |
| Student | STU-2026-0001 | student@educare.edu.bd | Student@12345 |
| Parent | PAR-0001 | parent@educare.edu.bd | Parent@12345 |

All seeded teachers/students/parents have `forcePasswordChange: true`.

## Seeded Users Summary

| Role | Count |
|------|-------|
| Admin | 1 |
| Teachers | 101 |
| Students | 301 |
| Parents | 99 |
| **Total** | **502** |

## Running Individual Seeders

The extra seeders (teachers, students, parents) are **idempotent** — safe to run multiple times. They use `upsert` so they won't create duplicates.

```bash
# Just teachers
npx tsx prisma/seed-teachers.ts

# Just students
npx tsx prisma/seed-students.ts

# Just parents
npx tsx prisma/seed-parents.ts

# All three at once
npx tsx prisma/seed-teachers.ts && npx tsx prisma/seed-students.ts && npx tsx prisma/seed-parents.ts
```

## Schema Changes

If you've updated `prisma/schema.prisma` and need to sync without a full reset:

```bash
npx prisma db push --accept-data-loss
```

Or create a proper migration:

```bash
npx prisma migrate dev --name <migration_name>
```

## Other Useful Commands

```bash
# Open Prisma Studio (visual DB browser)
npm run db:studio

# Generate Prisma client after schema changes
npx prisma generate

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```
