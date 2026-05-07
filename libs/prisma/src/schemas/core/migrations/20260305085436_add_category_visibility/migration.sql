-- CreateEnum
CREATE TYPE "CategoryVisibility" AS ENUM ('PUBLIC', 'CITIZEN');

-- AlterTable
ALTER TABLE "city_categories" ADD COLUMN     "visibility" "CategoryVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "city_categories_visibility_idx" ON "city_categories"("visibility");
