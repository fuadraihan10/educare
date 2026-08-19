-- AlterTable: Add regNo and forcePasswordChange to User
ALTER TABLE "User" ADD COLUMN "regNo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastLoginIp" TEXT;

-- Backfill existing users with regNo based on role BEFORE adding unique constraint
UPDATE "User" SET "regNo" = 'ADM-0001' WHERE "id" = 'seed-admin-001';
UPDATE "User" SET "regNo" = 'TCH-0001' WHERE "id" = 'seed-teacher-user-001';
UPDATE "User" SET "regNo" = 'TCH-0002' WHERE "id" = 'seed-teacher-user-002';
UPDATE "User" SET "regNo" = 'STU-2026-0001' WHERE "id" = 'seed-student-user-001';
UPDATE "User" SET "regNo" = 'STU-2026-0002' WHERE "id" = 'seed-student-user-002';
UPDATE "User" SET "regNo" = 'STU-2026-0003' WHERE "id" = 'seed-student-user-003';
UPDATE "User" SET "regNo" = 'STU-2026-0004' WHERE "id" = 'seed-student-user-004';
UPDATE "User" SET "regNo" = 'STU-2026-0005' WHERE "id" = 'seed-student-user-005';
UPDATE "User" SET "regNo" = 'STU-2026-0006' WHERE "id" = 'seed-student-user-006';
UPDATE "User" SET "regNo" = 'STU-2026-0007' WHERE "id" = 'seed-student-user-007';
UPDATE "User" SET "regNo" = 'STU-2026-0008' WHERE "id" = 'seed-student-user-008';
UPDATE "User" SET "regNo" = 'STU-2026-0009' WHERE "id" = 'seed-student-user-009';
UPDATE "User" SET "regNo" = 'STU-2026-0010' WHERE "id" = 'seed-student-user-010';

-- Remove default and add unique constraint after backfill
ALTER TABLE "User" ALTER COLUMN "regNo" DROP DEFAULT;
CREATE UNIQUE INDEX "User_regNo_key" ON "User"("regNo");
