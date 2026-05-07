-- CreateTable
CREATE TABLE "schedule_run_logs" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "runSummary" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_run_logs_scheduleId_idx" ON "schedule_run_logs"("scheduleId");

-- CreateIndex
CREATE INDEX "schedule_run_logs_scheduleId_createdAt_idx" ON "schedule_run_logs"("scheduleId", "createdAt");

-- CreateIndex
CREATE INDEX "schedule_run_logs_status_idx" ON "schedule_run_logs"("status");

-- CreateIndex
CREATE INDEX "schedule_run_logs_startedAt_idx" ON "schedule_run_logs"("startedAt");
