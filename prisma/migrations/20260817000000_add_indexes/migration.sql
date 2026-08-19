-- Performance indexes for common query patterns

-- User lookups
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_schoolId_idx" ON "User"("schoolId");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");

-- Student lookups
CREATE INDEX IF NOT EXISTS "Student_userId_idx" ON "Student"("userId");
CREATE INDEX IF NOT EXISTS "Student_admissionNo_idx" ON "Student"("admissionNo");
CREATE INDEX IF NOT EXISTS "Student_status_idx" ON "Student"("status");
CREATE INDEX IF NOT EXISTS "Student_classId_idx" ON "Student"("classId");

-- Teacher lookups
CREATE INDEX IF NOT EXISTS "Teacher_userId_idx" ON "Teacher"("userId");
CREATE INDEX IF NOT EXISTS "Teacher_employeeId_idx" ON "Teacher"("employeeId");
CREATE INDEX IF NOT EXISTS "Teacher_status_idx" ON "Teacher"("status");

-- Attendance composite indexes
CREATE INDEX IF NOT EXISTS "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");
CREATE INDEX IF NOT EXISTS "Attendance_classId_date_idx" ON "Attendance"("classId", "date");

-- Mark lookups
CREATE INDEX IF NOT EXISTS "Mark_assessmentId_idx" ON "Mark"("assessmentId");

-- Invoice lookups
CREATE INDEX IF NOT EXISTS "Invoice_termId_idx" ON "Invoice"("termId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_createdById_idx" ON "Invoice"("createdById");

-- Payment lookups
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- Announcement lookups
CREATE INDEX IF NOT EXISTS "Announcement_createdById_idx" ON "Announcement"("createdById");
CREATE INDEX IF NOT EXISTS "Announcement_classId_idx" ON "Announcement"("classId");

-- Assessment lookups
CREATE INDEX IF NOT EXISTS "Assessment_termId_idx" ON "Assessment"("termId");
CREATE INDEX IF NOT EXISTS "Assessment_teacherId_idx" ON "Assessment"("teacherId");
CREATE INDEX IF NOT EXISTS "Assessment_isPublished_idx" ON "Assessment"("isPublished");

-- Fee structure lookups
CREATE INDEX IF NOT EXISTS "FeeStructure_classId_idx" ON "FeeStructure"("classId");
CREATE INDEX IF NOT EXISTS "FeeStructure_termId_idx" ON "FeeStructure"("termId");

-- Academic year
CREATE INDEX IF NOT EXISTS "AcademicYear_isActive_idx" ON "AcademicYear"("isActive");

-- Audit log
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Timetable
CREATE INDEX IF NOT EXISTS "TimetableEntry_classId_idx" ON "TimetableEntry"("classId");
CREATE INDEX IF NOT EXISTS "TimetableEntry_termId_idx" ON "TimetableEntry"("termId");
