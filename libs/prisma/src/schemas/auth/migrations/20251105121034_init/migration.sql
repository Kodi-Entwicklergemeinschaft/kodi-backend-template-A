-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "devicePlatform" TEXT;

-- CreateIndex
CREATE INDEX "sessions_deviceId_idx" ON "sessions"("deviceId");
