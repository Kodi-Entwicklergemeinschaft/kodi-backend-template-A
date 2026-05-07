-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "scheduleRunId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_scheduleRunId_idx" ON "notifications"("scheduleRunId");
