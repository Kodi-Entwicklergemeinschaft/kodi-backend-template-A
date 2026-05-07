-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER,
    "timezone" TEXT,
    "metadata" JSONB,
    "parentCityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cities_country_idx" ON "cities"("country");

-- CreateIndex
CREATE INDEX "cities_latitude_longitude_idx" ON "cities"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "cities_isActive_idx" ON "cities"("isActive");

-- CreateIndex
CREATE INDEX "cities_parentCityId_idx" ON "cities"("parentCityId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_country_state_key" ON "cities"("name", "country", "state");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_parentCityId_fkey" FOREIGN KEY ("parentCityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
