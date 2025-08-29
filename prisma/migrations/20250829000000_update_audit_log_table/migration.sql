-- AlterTable
ALTER TABLE "audit_logs" RENAME COLUMN "createdAt" TO "timestamp";
ALTER TABLE "audit_logs" RENAME COLUMN "resource" TO "tableName";
ALTER TABLE "audit_logs" RENAME COLUMN "resourceId" TO "recordId";
ALTER TABLE "audit_logs" ADD COLUMN "userRole" TEXT;
ALTER TABLE "audit_logs" DROP COLUMN "ipAddress";
ALTER TABLE "audit_logs" DROP COLUMN "userAgent";
ALTER TABLE "audit_logs" ALTER COLUMN "tableName" DROP NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE TEXT;
ALTER TABLE "audit_logs" ALTER COLUMN "userId" TYPE TEXT;
