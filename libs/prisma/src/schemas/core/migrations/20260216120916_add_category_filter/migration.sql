-- CreateTable
CREATE TABLE "category_filters" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "filterId" TEXT NOT NULL,
    "displayName" TEXT,
    "heading" TEXT NOT NULL,
    "group" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_filters_categoryId_idx" ON "category_filters"("categoryId");

-- CreateIndex
CREATE INDEX "category_filters_filterId_idx" ON "category_filters"("filterId");

-- CreateIndex
CREATE INDEX "category_filters_heading_idx" ON "category_filters"("heading");

-- CreateIndex
CREATE INDEX "category_filters_group_idx" ON "category_filters"("group");

-- CreateIndex
CREATE UNIQUE INDEX "category_filters_categoryId_filterId_key" ON "category_filters"("categoryId", "filterId");

-- AddForeignKey
ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "filters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
