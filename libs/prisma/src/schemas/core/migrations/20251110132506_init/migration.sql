-- CreateEnum
CREATE TYPE "CategoryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "city_categories" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedBy" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_requests" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "CategoryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledBy" TEXT,
    "handledAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "category_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "city_categories_cityId_idx" ON "city_categories"("cityId");

-- CreateIndex
CREATE INDEX "city_categories_categoryId_idx" ON "city_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "city_categories_cityId_categoryId_key" ON "city_categories"("cityId", "categoryId");

-- CreateIndex
CREATE INDEX "category_requests_cityId_status_idx" ON "category_requests"("cityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "category_requests_cityId_categoryId_requestedBy_status_key" ON "category_requests"("cityId", "categoryId", "requestedBy", "status");

-- AddForeignKey
ALTER TABLE "city_categories" ADD CONSTRAINT "city_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_requests" ADD CONSTRAINT "category_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
