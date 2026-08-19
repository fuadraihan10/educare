# Production-Grade SMS — Full Codebase Audit Report

---

## A. Executive Summary

```
Backend:              6/10
Frontend/UI:          7/10
Database:             7/10
Security:             5/10
Performance:          5/10
Reliability:          4/10
Scalability:          4/10
Accessibility:        5/10
Testing:              4/10
DevOps:               5/10
Maintainability:      7/10
Production Readiness: 4/10
```

**Biggest problems:**
1. **In-memory rate limiting** — resets on restart, per-process, trivially bypassed
2. **No API rate limiting** — all REST endpoints unprotected beyond auth
3. **`x-forwarded-for` spoofable** — IP-based login rate limit trivially bypassed
4. **No CSP headers** — XSS risk from any user-generated content
5. **Queue system is in-memory** — jobs lost on restart, not shared across instances
6. **Invoice number race condition** — concurrent creates can produce duplicate `INV-` numbers
7. **Missing RBAC on object level** — any teacher can view any student's data via API
8. **No forgot-password flow** — dead "Forgot password?" link on login
9. **Missing DB indexes** — `User.schoolId`, `Announcement.createdAt` not indexed
10. **Weak test coverage** — only 7 unit test files, zero integration tests, e2e tests use different credentials than seed

---

## B. Critical Issues Table

| Priority | Issue | Location | Impact | Root Cause | Fix | Verification |
|----------|-------|----------|--------|------------|-----|-------------|
| P0 | In-memory rate limiting is per-process and resets on restart | `src/lib/rate-limit.ts:25` | Brute-force attacks trivially succeed after restart | `Map`-based store | Require Redis for production; fail-closed if unavailable | Run 11 rapid login attempts across restart |
| P0 | `x-forwarded-for` spoofable for rate limit bypass | `src/lib/auth.ts:34-35` | Rate limiting ineffective if reverse proxy not set | Trusts raw header | Use trusted proxy config; combine with session fingerprint | Attempt login with spoofed header |
| P1 | No rate limiting on ANY API endpoint | `src/app/api/v1/*/route.ts` | Data scraping, enumeration, DoS | No `apiRateLimit()` calls | Add rate limiting middleware or per-route | Hammer endpoints with rapid requests |
| P1 | No Content-Security-Policy header | `src/proxy.ts` | XSS amplification | CSP not implemented | Add strict CSP header | Attempt XSS via announcement body |
| P1 | Invoice number race condition | `src/lib/fees/actions.ts:71-74` | Duplicate invoice numbers under concurrency | `findFirst` + increment without lock | Use DB sequence or advisory lock | Create 10 invoices simultaneously |
| P1 | Object-level authorization missing on student API | `src/app/api/v1/students/[id]/route.ts:29-34` | Any authenticated user with `STUDENTS.READ` can view any student | Only checks role permission, not ownership | Add class-scoping for teachers, student-scoping for students | Teacher accesses unrelated student via API |
| P2 | No forgot-password implementation | `src/app/(auth)/login/login-form.tsx:42` | Users locked out forever if they forget password | Dead link | Implement password reset flow | Click forgot password link |
| P2 | `trustHost: true` disables host validation | `src/lib/auth.ts:21` | Host-header injection possible | Dev convenience vs security | Remove in production; use AUTH_URL | Test with spoofed Host header |
| P2 | JWT maxAge 7 days with no refresh rotation | `src/lib/auth.ts:19` | Stolen token valid for 7 days | Long-lived session | Reduce to 1 day + refresh token | Test stolen token validity |
| P2 | No password change/logout-all-sessions mechanism | — | Compromised credentials persist | No feature | Implement password change + session invalidation | Change password, verify old session invalid |
| P3 | Feature flags logged in debug mode | `src/lib/feature-flags.ts:92` | Configuration leak in logs | Debug logging | Remove from logs or use structured level | Check production logs |
| P3 | Audit log missing `actorRole`, `ipAddress`, `userAgent` in DB | `src/lib/audit.ts:46-55` | Insufficient audit trail | Fields merged into JSON `details` but not top-level columns | Add DB columns | Check audit log entries |

---

## C. Architecture Audit

### Current Architecture
```
Browser → Next.js Middleware (proxy.ts)
         → NextAuth session check
         → Role-based route guard
         → Next.js Server Components / Server Actions
         → Prisma Client (PostgreSQL via PrismaPg adapter)
         → Local filesystem storage
         → Nodemailer (console or SMTP)
         → Optional Redis (rate limit, cache, queue)
```

### What Works
- Clean separation: `lib/` for business logic, `components/` for UI, `app/` for routing
- Server Actions with Zod validation + proper RBAC guards
- Proper Prisma transactions for multi-step operations
- Comprehensive Prisma schema with good indexes
- Structured logging (pino) with secret redaction
- File storage with magic-byte validation and path traversal protection
- Feature flag system with env/DB overrides
- CI pipeline (lint + typecheck + test + build)

### What Is Fragile
- In-memory rate limiting, queue, and job system
- No job workers registered (queue infrastructure exists but no consumers)
- Email silently fails without notification to user
- No database migrations testing in CI
- No health-check endpoint that validates DB connection

### What Is Missing
- Background job processing (no workers registered)
- Distributed rate limiting (required for multi-instance)
- CSRF protection on server actions (relies on Next.js built-in)
- API versioning strategy
- Request timeout handling
- Database connection pool monitoring
- Graceful shutdown handling
- Database backup automation

---

## D. Backend/API Audit

### API Quality
- **Endpoints**: 5 REST endpoints + 1 upload + 2 health (public) + NextAuth
- **Validation**: Zod schemas on all inputs ✓
- **Authentication**: JWT via NextAuth ✓
- **Authorization**: RBAC permission checks ✓
- **Error handling**: Consistent error envelope ✓
- **Audit logging**: Present on mutations ✓

### Issues

1. **Missing DELETE endpoint** for students API (`src/app/api/v1/students/[id]/route.ts`)
   - RBAC defines `STUDENTS.DELETE` but no API route exercises it

2. **API rate limiting absent** — only login has rate limiting

3. **No request timeout** — long-running queries can hang

4. **Inconsistent error handling** — API routes use `fromError()` but server actions throw directly

5. **No idempotency** on POST/PUT operations — double-submit creates duplicates

6. **Admission number generation** (`ADM-{year}-{Date.now().slice(-4)}`) is predictable and enumerable

7. **Invoice number generation** (`INV-{year}-{seq}`) uses `findFirst` + increment — race condition under concurrency

### Server Actions Quality
- All actions properly call `requireRole()` ✓
- All mutations use `auditLog()` ✓
- All mutations call `revalidatePath()` ✓
- Zod validation on all inputs ✓
- Proper error boundaries with state patterns ✓

### Exact Fixes Needed

**Rate Limiting:**
```typescript
// Add to every API route:
const rateKey = `api:${session.user.id}:${pathname}`
if (await apiRateLimit(rateKey, 100, 60)) {
  return NextResponse.json(errorResponse('RATE_LIMITED', 'Too many requests'), { status: 429 })
}
```

**Invoice Number Race:**
```typescript
// Use DB advisory lock or sequence
const seq = await tx.$queryRaw`SELECT nextval('invoice_seq')`
// or use optimistic retry with unique constraint
```

---

## E. Database Audit

### Schema Quality
- **Good**: Proper enums, composite unique constraints, foreign keys, cascading rules
- **Good**: `@@index` on frequently queried columns (studentId, classId, etc.)
- **Good**: `@@unique` constraints prevent duplicates (attendance, marks, enrollments)

### Issues

1. **Missing Indexes**:
   - `User.schoolId` — no index (queried for school-scoped operations)
   - `Announcement.createdAt` — no index (sorted in list queries)
   - `TeacherAssignment.classId` — no index (queried when marking attendance)
   - `Invoice.createdAt` — no index

2. **N+1 Query Pattern**:
   - `getStudentAttendanceStats` (`src/lib/attendance.ts`) fires 5 sequential queries (1 total + 4 status counts) instead of a single `groupBy`

3. **No Soft Deletes**:
   - `Student`, `Teacher`, `Class` use hard status (`ACTIVE`/`INACTIVE`) but records are never deleted — this is correct but should be documented

4. **Enrollment Orphan Risk**:
   - When a student's class changes in `updateStudent`, old enrollments are set to `COMPLETED` but only for the active year — historical enrollments in other years are unaffected (correct)

5. **No Database-Level Validation**:
   - `maxMarks > 0` enforced in Zod but not in DB constraint
   - `dob < now()` not enforced anywhere

6. **Decimal Precision**:
   - `marksObtained` is `DECIMAL(5,2)` — max 999.99 marks, which is fine for individual assessments but could be limiting for aggregate calculations

### Recommended Schema Changes

```sql
-- Add missing indexes
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
CREATE INDEX "TeacherAssignment_classId_idx" ON "TeacherAssignment"("classId");
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- Add constraint for positive max marks
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_maxMarks_positive" CHECK ("maxMarks" > 0);
```

---

## F. Student/Academic Module Audit

### Student Lifecycle
```
Application → PENDING → APPROVED → creates Student + Enrollment → ACTIVE
                                                            → WITHDRAWN (deactivated)
                                                            → GRADUATED (manual)
```

**Issue**: No automated graduation or promotion flow. Class changes are manual per-student.

### Attendance
- **Bulk marking**: Uses `upsert` in transaction — correct ✓
- **Duplicate prevention**: `@@unique([studentId, classId, date])` — correct ✓
- **Teacher authorization**: Checks `teacherAssignment` for the class — correct ✓
- **Enrollment validation**: Verifies student is enrolled before marking — correct ✓
- **Bug**: Attendance stats fire 5 queries instead of 1 `groupBy`

### Exams & Marks
- **Grade calculation**: `computeGrade()` maps percentage to grade scale — correct ✓
- **Marks clamping**: `Math.min(marks, maxMarks)` — correct ✓
- **Teacher authorization**: Checks `assessment.teacherId === teacher.id` — correct ✓
- **Publish/unpublish**: Properly revalidates student/parent grade pages ✓
- **Bug**: No validation that `marksObtained >= 0` at API level (only Zod in server action)

### Fees
- **Invoice creation**: Selects fee structures, sums amounts, creates invoice + items in transaction — correct ✓
- **Payment confirmation**: Aggregates confirmed payments, auto-marks invoice as `PAID` when fully paid — correct ✓
- **Race condition**: Invoice number generation is not atomic

### Timetable
- **Conflict detection**: None — can create overlapping entries for same teacher/class/period
- **Fix needed**: Add check for teacher or class conflicts before insert

---

## G. Finance Audit

### Invoice Calculation
```
Total = SUM(FeeStructure.amount) for selected fees
Status transitions: DRAFT → ISSUED → PARTIAL → PAID / OVERDUE / CANCELLED
```

### Payment Flow
```
Parent submits payment → PENDING
Admin confirms → CONFIRMED → check if total confirmed ≥ invoice total → PAID
Admin rejects → REJECTED
```

### Issues

1. **No partial payment tracking**: Invoice status doesn't update to `PARTIAL` automatically when partial payment is confirmed
   - The `PARTIAL` status exists in the enum but `confirmPayment` only checks `>= totalAmount` for `PAID`
   - **Fix**: Add `PARTIAL` transition when `0 < confirmed < total`

2. **No refund flow**: `REFUNDED` payment status exists but no action implements refunds

3. **No duplicate payment prevention**: Same invoice can have unlimited pending payments created

4. **No overdue detection**: `OVERDUE` status exists but no mechanism transitions invoices to it

5. **Currency precision**: Using `Decimal(12,2)` — correct for most currencies ✓

6. **No receipt generation**: Payment confirmation has no receipt/invoice PDF

---

## H. UI/UX Audit

### Strengths
- Consistent glassmorphism design system ✓
- Light/dark/system theme support ✓
- Responsive mobile navigation ✓
- Command palette (⌘K) ✓
- Staggered animations ✓
- Print-friendly styles ✓
- `prefers-reduced-motion` support ✓
- Proper skeleton loading states ✓

### Issues

1. **No error boundary per-page** — errors crash entire layout
2. **Tables not responsive** on mobile — horizontal scroll but no card fallback
3. **Large forms have no progress indication** — student form is long
4. **No toast notifications** on server action success (only inline messages)
5. **Notification bell is decorative** — no real notification system
6. **Command palette search doesn't search entities** — only navigates pages
7. **No data tables with sorting/filtering** on list pages (pagination exists but no sort controls)
8. **Empty states** exist but aren't shown on every page
9. **Mobile sidebar** doesn't have gesture-to-close
10. **No keyboard shortcuts** beyond ⌘K

### Design System Quality
The glassmorphism design system in `globals.css` is well-implemented with:
- 9 glass utility variants (`.glass`, `.glass-strong`, `.glass-sidebar`, `.glass-card`, `.glass-input`, `.glass-header`, `.glass-table`, `.glass-gradient`, `.glass-modal`)
- Proper dark mode overrides for all glass utilities
- OKLCH color space throughout
- Subtle body background gradients
- Consistent animation system with stagger delays

---

## I. Security Audit

| Severity | Vulnerability | Location | Exploitation | Impact | Fix | Verification |
|----------|--------------|----------|-------------|--------|-----|-------------|
| CRITICAL | In-memory rate limiting bypassable | `src/lib/rate-limit.ts:25` | Restart server, brute-force login | Account takeover | Use Redis; fail-closed | Test across restarts |
| HIGH | Spoofable `x-forwarded-for` | `src/lib/auth.ts:34-35` | Send forged header, bypass IP rate limit | Rate limit useless | Trusted proxy config | Test with spoofed header |
| HIGH | No API rate limiting | All API routes | Rapid API calls | Data scraping, enumeration | Add per-route rate limiting | Hammer endpoints |
| HIGH | Missing CSP header | `src/proxy.ts` | Inject script via announcement body | XSS | Add Content-Security-Policy | Attempt XSS |
| HIGH | Object-level auth missing on student API | `src/app/api/v1/students/[id]/route.ts` | Teacher fetches any student by ID | Data breach | Class-scoping | Test cross-class access |
| MEDIUM | `trustHost: true` | `src/lib/auth.ts:21` | Host-header injection | Session fixation | Remove in production | Test with spoofed Host |
| MEDIUM | No forgot-password | `login-form.tsx:42` | — | Account lockout | Implement reset flow | — |
| MEDIUM | JWT 7-day without refresh | `src/lib/auth.ts:19` | Stolen token valid 7 days | Persistent access | Shorten + add rotation | Test stolen token |
| MEDIUM | No password change mechanism | — | Compromised credentials persist | Persistent access | Implement change flow | — |
| MEDIUM | Invoice number race condition | `src/lib/fees/actions.ts:71-74` | Concurrent creates | Duplicate invoices | DB sequence/lock | Concurrent test |
| LOW | Predictable admission numbers | `src/app/api/v1/students/route.ts:115` | Enumerate student IDs | Information disclosure | Use UUIDs or DB sequence | Check predictability |
| LOW | Feature flags in debug logs | `src/lib/feature-flags.ts:92` | Read debug logs | Config leak | Remove from logs | Check logs |
| LOW | No password max length | `src/lib/password.ts` | Very long passwords | Resource exhaustion | Add max length (128) | Test with 10KB password |

---

## J. Performance Audit

### Frontend
- **Bundle size**: Next.js 16.3.1 with Turbopack — generally good
- **Client components**: Login form, attendance mark form, marks entry form — reasonable
- **No dynamic imports** for heavy components (command palette loaded always)
- **Animations**: Respect `prefers-reduced-motion` ✓
- **No image optimization**: `unoptimized` flag on student photos

### Backend
- **N+1**: `getStudentAttendanceStats` fires 5 queries — should be 1 `groupBy`
- **Unbounded queries**: List queries have pagination ✓ but `getRosterForClass` loads all students unbounded
- **No connection pooling config**: Prisma uses default pool size

### Database
- **Missing indexes**: `User.schoolId`, `Announcement.createdAt`, `TeacherAssignment.classId`
- **Full text search**: Using Prisma `contains` with `mode: 'insensitive'` — fine for small datasets, won't scale
- **No query logging** in production

### Recommended Improvements

```
Current → Expected:
- 5 queries for attendance stats → 1 groupBy query
- In-memory rate limiting → Redis-backed (distributed)
- No pagination controls in UI → Server-side sortable tables
- No image optimization → next/image with blur placeholder
- No caching → Redis cache for dashboard stats, class lists
```

---

## K. Reliability Audit

### Failure Scenarios

| Scenario | Current Behavior | Required Behavior |
|----------|-----------------|-------------------|
| Database down | 500 error on every page | Graceful error page, health check fails |
| Redis down | Falls back to in-memory (rate limit, cache, queue) | ✅ Correct — graceful degradation |
| Email fails | Logged to console, mutation succeeds | ✅ Correct — non-blocking |
| File storage full | `StorageError` returned to user | Show clear error, suggest cleanup |
| Double form submit | Duplicate records possible (no idempotency) | Add idempotency keys |
| Browser refresh during submission | May create duplicate | Use POST-Redirect-GET pattern (partially done via `redirect()`) |
| Concurrent invoice creation | Duplicate invoice numbers possible | Use DB sequence |
| Large CSV import | Would block HTTP request (no workers registered) | Implement background workers |

### What's Missing
- **Graceful shutdown**: No handling of SIGTERM/SIGINT
- **Health check**: `/api/v1/health` exists but doesn't validate DB connection
- **Readiness check**: `/api/v1/ready` exists but same issue
- **Request timeouts**: No timeout on API routes or server actions
- **Retry logic**: Queue has retry with backoff but no workers are registered

---

## L. Production Readiness Gap

| Category | Status | What's Missing |
|----------|--------|---------------|
| Authentication | ✅ Solid | Forgot password, password change, session management |
| Authorization | ⚠️ Partial | Object-level auth, teacher class scoping |
| Rate Limiting | ❌ Inadequate | Distributed rate limiting, API rate limiting |
| Input Validation | ✅ Solid | Zod on all inputs |
| Error Handling | ⚠️ Partial | Error boundaries, graceful degradation |
| Logging | ✅ Good | Structured pino, secret redaction |
| Monitoring | ❌ Missing | APM, metrics, alerting |
| Backups | ❌ Missing | Automated DB backups |
| Testing | ⚠️ Weak | Only unit tests for utils; no integration tests |
| CI/CD | ⚠️ Basic | Lint + typecheck + test + build; no E2E in CI |
| Caching | ⚠️ Partial | Redis cache infrastructure exists but unused |
| Background Jobs | ❌ Non-functional | Queue infrastructure exists but no workers |
| Database Migrations | ✅ Working | Prisma migrate |
| Containerization | ⚠️ Partial | Dockerfile exists; no docker-compose production config |
| HTTPS | ❌ Missing | No TLS termination config |
| CORS | ❌ Missing | No CORS configuration |
| Security Headers | ⚠️ Partial | Missing CSP |

---

## M. Recommended Architecture

```
Current (Simplified):
  Browser → Next.js → PostgreSQL
                      → Local filesystem
                      → (Optional Redis)

Recommended:
  Browser → CDN → Reverse Proxy (nginx/Caddy)
                  → HTTPS termination
                  → Next.js (2+ instances)
                     → NextAuth session (JWT)
                     → RBAC middleware
                     → Rate limiter (Redis-backed)
                     → Server Components / Server Actions
                     → Prisma (connection pooled)
                     → PostgreSQL (with replicas for reads)
                     → Redis (sessions, cache, rate limit, queue)
                     → Object Storage (files — S3/local)
                     → Background Workers (email, imports, reports)
                     → Monitoring (structured logs → aggregator)
                     → Automated backups
```

**Only add what's justified:**
- Redis: Yes — required for distributed rate limiting and caching
- Object storage: Optional for single-server; recommended for scaling
- Background workers: Yes — queue infrastructure exists, just needs consumers
- CDN: Only for production with users > 100

---

## N. Recommended Design System

### Current State: Already Premium
The existing glassmorphism design system is well-crafted. The recommended changes are:

1. **Fix mobile table overflow** — use card layout on small screens
2. **Add page-level error boundaries** — wrap each page in `error.tsx`
3. **Improve form UX** — add sections/steps for long forms
4. **Real notification system** — replace decorative bell
5. **Improve command palette** — add entity search
6. **Data table controls** — add sort, filter, column visibility to list pages
7. **Micro-interaction polish** — add loading states on navigation

### Color System
Already well-defined in `globals.css` with OKLCH. No changes needed.

### Typography
Using Geist Sans — clean and modern. No changes needed.

---

## O. Implementation Roadmap

### Phase 1 — Critical Fixes (1-2 weeks)
| Change | Files | Priority | Risk |
|--------|-------|----------|------|
| Redis-backed rate limiting | `rate-limit.ts`, `auth.ts`, API routes | P0 | Low |
| Fix `x-forwarded-for` trust | `auth.ts` | P0 | Low |
| Add CSP header | `proxy.ts` | P1 | Low |
| Object-level auth on student API | `api/v1/students/[id]/route.ts` | P1 | Medium |
| Fix invoice number race condition | `fees/actions.ts` | P1 | Low |
| Add missing DB indexes | Prisma schema + migration | P1 | Low |

### Phase 2 — Database & Backend (1-2 weeks)
| Change | Files | Priority | Risk |
|--------|-------|----------|------|
| Fix N+1 attendance stats | `attendance.ts` | P2 | Low |
| Add timetable conflict detection | `timetable/actions.ts` | P2 | Low |
| Add API rate limiting to all routes | All API routes | P1 | Low |
| Add password max length | `password.ts` | P3 | Low |
| Add missing audit fields to DB | Schema migration | P3 | Medium |
| Fix partial payment status | `fees/actions.ts` | P2 | Medium |

### Phase 3 — Features (2-3 weeks)
| Change | Files | Priority | Risk |
|--------|-------|----------|------|
| Implement forgot-password | New reset flow | P2 | Medium |
| Implement password change | Settings page | P2 | Low |
| Real notification system | New models + UI | P3 | High |
| Background job workers | `queue.ts` + workers | P3 | Medium |
| Dashboard statistics caching | Redis cache layer | P2 | Low |

### Phase 4 — UI/UX (2-3 weeks)
| Change | Files | Priority | Risk |
|--------|-------|----------|------|
| Page-level error boundaries | `error.tsx` files | P2 | Low |
| Responsive table → card | All list pages | P2 | Medium |
| Sort/filter controls on tables | List pages | P3 | Medium |
| Real entity search in command palette | `command-palette.tsx` | P3 | Medium |
| Form progress for long forms | `student-form.tsx`, etc. | P3 | Low |
| Keyboard navigation improvements | All pages | P3 | Low |

### Phase 5 — Production Hardening (1-2 weeks)
| Change | Files | Priority | Risk |
|--------|-------|----------|------|
| Add health check DB validation | `api/v1/health/route.ts` | P2 | Low |
| Graceful shutdown handling | `next.config.ts` | P2 | Low |
| Request timeout middleware | `proxy.ts` | P2 | Low |
| CORS configuration | `next.config.ts` | P2 | Low |
| Automated DB backups | Cron/script | P2 | Low |
| E2E tests in CI | `.github/workflows/ci.yml` | P2 | Medium |

---

## P. File-by-File Action Plan

### Critical Security Files
| Path | Current Role | Problems | Recommended Changes | Priority |
|------|-------------|----------|-------------------|----------|
| `src/lib/rate-limit.ts` | Login rate limiting | In-memory only, per-process | Require Redis, fail-closed | P0 |
| `src/lib/auth.ts` | NextAuth config | `trustHost: true`, spoofable IP | Remove trustHost, fix IP resolution | P0 |
| `src/proxy.ts` | Middleware security | Missing CSP, no API coverage | Add CSP header | P1 |

### Business Logic Files
| Path | Current Role | Problems | Recommended Changes | Priority |
|------|-------------|----------|-------------------|----------|
| `src/lib/fees/actions.ts` | Invoice/payment CRUD | Race condition on invoice numbers | Use DB sequence | P1 |
| `src/lib/attendance.ts` | Attendance queries | N+1 stats queries | Single groupBy | P2 |
| `src/lib/timetable/actions.ts` | Timetable CRUD | No conflict detection | Add conflict check | P2 |

### Frontend Files
| Path | Current Role | Problems | Recommended Changes | Priority |
|------|-------------|----------|-------------------|----------|
| All list pages | Data display | No sort/filter | Add table controls | P3 |
| All pages | Error handling | No error boundaries | Add `error.tsx` | P2 |
| `student-form.tsx` | Student creation | Long form, no sections | Add progress/steps | P3 |

---

## Q. Verification Plan

### After Phase 1
- [ ] Rate limiting works across server restarts (Redis)
- [ ] `x-forwarded-for` spoofing doesn't bypass rate limit
- [ ] CSP header blocks inline script injection
- [ ] Teacher cannot access student from different class via API
- [ ] Concurrent invoice creation doesn't produce duplicates
- [ ] All missing indexes created and verified with `EXPLAIN`

### After Phase 2
- [ ] Attendance stats computed in single query
- [ ] Timetable rejects conflicting entries
- [ ] API endpoints all have rate limiting
- [ ] Password max length enforced
- [ ] Partial payment correctly sets `PARTIAL` status

### After Phase 3
- [ ] Forgot password flow works end-to-end
- [ ] Password change invalidates old sessions
- [ ] Notifications appear in real-time
- [ ] Background jobs process without blocking HTTP
- [ ] Dashboard stats cached and fast

### After Phase 4
- [ ] No unhandled errors crash pages
- [ ] Tables collapse to cards on mobile
- [ ] Sort and filter work on all list pages
- [ ] Command palette finds students, teachers, classes
- [ ] Long forms have visual progress

### After Phase 5
- [ ] Health check validates DB connection
- [ ] Graceful shutdown handles in-flight requests
- [ ] CORS properly configured
- [ ] Backups automated and tested
- [ ] E2E tests run in CI

---

## R. Final Prioritized Checklist

```
[ ] Fix in-memory rate limiting (use Redis, fail-closed)
[ ] Fix x-forwarded-for spoofing
[ ] Add CSP security header
[ ] Add object-level authorization on student API
[ ] Fix invoice number race condition
[ ] Add missing database indexes
[ ] Add API rate limiting to all endpoints
[ ] Add forgot-password flow
[ ] Add password change mechanism
[ ] Fix N+1 attendance stats query
[ ] Add timetable conflict detection
[ ] Add partial payment status transition
[ ] Add page-level error boundaries
[ ] Make tables responsive (card fallback on mobile)
[ ] Add sort/filter controls to list pages
[ ] Implement background job workers
[ ] Add dashboard statistics caching
[ ] Add health check DB validation
[ ] Add graceful shutdown handling
[ ] Add CORS configuration
[ ] Add automated database backups
[ ] Add E2E tests to CI pipeline
[ ] Add password max length validation
[ ] Improve command palette with entity search
[ ] Add form progress for long forms
[ ] Add keyboard navigation improvements
[ ] Add request timeout middleware
[ ] Fix predictable admission numbers
[ ] Remove feature flags from debug logs
[ ] Add missing audit fields to database
```

---

*Report generated from full codebase inspection. All findings are supported by actual code references.*
