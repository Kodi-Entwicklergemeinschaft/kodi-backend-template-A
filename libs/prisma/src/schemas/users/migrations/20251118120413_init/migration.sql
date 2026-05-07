-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferredLanguage" TEXT;

-- CreateIndex
CREATE INDEX "users_preferredLanguage_idx" ON "users"("preferredLanguage");
