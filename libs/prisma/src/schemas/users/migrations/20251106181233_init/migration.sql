-- CreateTable
CREATE TABLE "terms_of_use" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "terms_of_use_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_terms_acceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termsId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_terms_acceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terms_of_use_isActive_idx" ON "terms_of_use"("isActive");

-- CreateIndex
CREATE INDEX "terms_of_use_isLatest_idx" ON "terms_of_use"("isLatest");

-- CreateIndex
CREATE INDEX "terms_of_use_version_idx" ON "terms_of_use"("version");

-- CreateIndex
CREATE INDEX "terms_of_use_locale_idx" ON "terms_of_use"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "terms_of_use_version_locale_key" ON "terms_of_use"("version", "locale");

-- CreateIndex
CREATE INDEX "user_terms_acceptance_userId_idx" ON "user_terms_acceptance"("userId");

-- CreateIndex
CREATE INDEX "user_terms_acceptance_termsId_idx" ON "user_terms_acceptance"("termsId");

-- CreateIndex
CREATE INDEX "user_terms_acceptance_version_idx" ON "user_terms_acceptance"("version");

-- CreateIndex
CREATE INDEX "user_terms_acceptance_acceptedAt_idx" ON "user_terms_acceptance"("acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_terms_acceptance_userId_termsId_key" ON "user_terms_acceptance"("userId", "termsId");

-- AddForeignKey
ALTER TABLE "user_terms_acceptance" ADD CONSTRAINT "user_terms_acceptance_termsId_fkey" FOREIGN KEY ("termsId") REFERENCES "terms_of_use"("id") ON DELETE CASCADE ON UPDATE CASCADE;
