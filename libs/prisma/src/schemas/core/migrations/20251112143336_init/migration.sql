-- CreateTable
CREATE TABLE "tiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "backgroundImageUrl" TEXT,
    "headerBackgroundColor" TEXT,
    "header" TEXT NOT NULL,
    "subheader" TEXT,
    "description" TEXT,
    "contentBackgroundColor" TEXT,
    "websiteUrl" TEXT,
    "openInExternalBrowser" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "lastEditedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tile_cities" (
    "id" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tile_cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tiles_slug_key" ON "tiles"("slug");

-- CreateIndex
CREATE INDEX "tiles_isActive_idx" ON "tiles"("isActive");

-- CreateIndex
CREATE INDEX "tiles_publishAt_idx" ON "tiles"("publishAt");

-- CreateIndex
CREATE INDEX "tiles_expireAt_idx" ON "tiles"("expireAt");

-- CreateIndex
CREATE INDEX "tiles_displayOrder_idx" ON "tiles"("displayOrder");

-- CreateIndex
CREATE INDEX "tile_cities_cityId_idx" ON "tile_cities"("cityId");

-- CreateIndex
CREATE INDEX "tile_cities_tileId_idx" ON "tile_cities"("tileId");

-- CreateIndex
CREATE UNIQUE INDEX "tile_cities_tileId_cityId_key" ON "tile_cities"("tileId", "cityId");

-- AddForeignKey
ALTER TABLE "tile_cities" ADD CONSTRAINT "tile_cities_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "tiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
