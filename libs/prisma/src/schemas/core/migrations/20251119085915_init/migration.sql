-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "contentBackgroundColor" TEXT,
ADD COLUMN     "headerBackgroundColor" TEXT;

-- AlterTable
ALTER TABLE "city_categories" ADD COLUMN     "contentBackgroundColor" TEXT,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "headerBackgroundColor" TEXT;

-- CreateIndex
CREATE INDEX "city_categories_displayOrder_idx" ON "city_categories"("displayOrder");
