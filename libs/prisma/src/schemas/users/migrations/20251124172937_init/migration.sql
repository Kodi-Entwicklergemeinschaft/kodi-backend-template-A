-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "fcmToken" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "language" TEXT,
    "cityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_topic_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "cityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_topic_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_devices_userId_idx" ON "user_devices"("userId");

-- CreateIndex
CREATE INDEX "user_devices_userId_isActive_idx" ON "user_devices"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_devices_fcmToken_idx" ON "user_devices"("fcmToken");

-- CreateIndex
CREATE INDEX "user_devices_isActive_idx" ON "user_devices"("isActive");

-- CreateIndex
CREATE INDEX "user_devices_platform_idx" ON "user_devices"("platform");

-- CreateIndex
CREATE INDEX "user_devices_lastSeenAt_idx" ON "user_devices"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_fcmToken_key" ON "user_devices"("fcmToken");

-- CreateIndex
CREATE INDEX "user_topic_subscriptions_userId_idx" ON "user_topic_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_topic_subscriptions_userId_isActive_idx" ON "user_topic_subscriptions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_topic_subscriptions_topicKey_idx" ON "user_topic_subscriptions"("topicKey");

-- CreateIndex
CREATE INDEX "user_topic_subscriptions_cityId_idx" ON "user_topic_subscriptions"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "user_topic_subscriptions_userId_topicKey_key" ON "user_topic_subscriptions"("userId", "topicKey");
