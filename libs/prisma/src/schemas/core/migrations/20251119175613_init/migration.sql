-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "field" TEXT,
    "locale" TEXT NOT NULL,
    "sourceLocale" TEXT,
    "value" TEXT NOT NULL,
    "sourceHash" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translations_entityType_entityId_field_locale_idx" ON "translations"("entityType", "entityId", "field", "locale");

-- CreateIndex
CREATE INDEX "translations_key_locale_idx" ON "translations"("key", "locale");

-- CreateIndex
CREATE INDEX "translations_entityType_entityId_idx" ON "translations"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "translations_locale_idx" ON "translations"("locale");

-- CreateIndex
CREATE INDEX "translations_sourceHash_idx" ON "translations"("sourceHash");

-- CreateIndex
CREATE UNIQUE INDEX "translations_entityType_entityId_field_locale_key" ON "translations"("entityType", "entityId", "field", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_locale_key" ON "translations"("key", "locale");
