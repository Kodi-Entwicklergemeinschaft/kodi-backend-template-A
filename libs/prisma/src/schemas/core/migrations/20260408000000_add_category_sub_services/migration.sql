-- CreateEnum
CREATE TYPE "CategoryViewType" AS ENUM ('LISTINGS', 'SUB_SERVICES');

-- CreateEnum
CREATE TYPE "SubServiceItemType" AS ENUM ('TILE', 'CATEGORY');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "viewType" "CategoryViewType" NOT NULL DEFAULT 'LISTINGS';

-- CreateTable
CREATE TABLE "category_sub_services" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "itemType" "SubServiceItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_sub_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_sub_services_categoryId_isActive_displayOrder_idx" ON "category_sub_services"("categoryId", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "category_sub_services_categoryId_itemType_itemId_key" ON "category_sub_services"("categoryId", "itemType", "itemId");

-- AddForeignKey
ALTER TABLE "category_sub_services" ADD CONSTRAINT "category_sub_services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
