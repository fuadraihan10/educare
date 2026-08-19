-- AlterTable: Add profile fields to User
ALTER TABLE "User" ADD COLUMN "displayName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "designation" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable: UserPreference
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "inAppNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "notifStudentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifAttendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "notifFeeAlerts" BOOLEAN NOT NULL DEFAULT true,
    "notifExamResults" BOOLEAN NOT NULL DEFAULT true,
    "notifAdmissions" BOOLEAN NOT NULL DEFAULT true,
    "notifStaffUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifSystem" BOOLEAN NOT NULL DEFAULT true,
    "notifSecurity" BOOLEAN NOT NULL DEFAULT true,
    "notifReports" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "sidebarBehavior" TEXT NOT NULL DEFAULT 'expanded',
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserSession
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipAddress" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserActivityLog
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "details" JSONB,
    "ipAddress" TEXT,
    "device" TEXT,
    "result" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserActivityLog_userId_createdAt_idx" ON "UserActivityLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
