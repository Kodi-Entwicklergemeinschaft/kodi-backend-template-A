-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "emailTemplate" TEXT,
ADD COLUMN     "firebaseProjectId" TEXT;

-- CreateTable
CREATE TABLE "firebase_projects" (
    "id" TEXT NOT NULL,
    "cityId" TEXT,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firebase_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "firebase_projects_cityId_idx" ON "firebase_projects"("cityId");

-- CreateIndex
CREATE INDEX "firebase_projects_isActive_idx" ON "firebase_projects"("isActive");

-- CreateIndex
CREATE INDEX "firebase_projects_isDefault_idx" ON "firebase_projects"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "firebase_projects_cityId_key" ON "firebase_projects"("cityId");

-- CreateIndex
CREATE INDEX "notifications_firebaseProjectId_idx" ON "notifications"("firebaseProjectId");
