/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'TRAINER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL,
    "authId" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "age" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "goalDescription" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "programStartDate" TIMESTAMP(3),
    "programWeeks" INTEGER,
    "recommendedSessionsPerWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_sessions" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "sessionName" TEXT NOT NULL,
    "sessionType" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "autoRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_recommendations" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "focusText" TEXT NOT NULL,
    "tipsText" TEXT,
    "hasWorkoutToday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nutritionScore" INTEGER NOT NULL,
    "painAtTraining" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_goals" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "proteinTargetPerDay" INTEGER NOT NULL,
    "waterTargetMlPerDay" INTEGER NOT NULL,
    "weeklyFocus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_authId_key" ON "app_users"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_userId_key" ON "client_profiles"("userId");

-- CreateIndex
CREATE INDEX "client_profiles_trainerId_idx" ON "client_profiles"("trainerId");

-- CreateIndex
CREATE INDEX "scheduled_sessions_clientId_startAt_idx" ON "scheduled_sessions"("clientId", "startAt");

-- CreateIndex
CREATE INDEX "daily_recommendations_date_idx" ON "daily_recommendations"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_recommendations_clientId_date_key" ON "daily_recommendations"("clientId", "date");

-- CreateIndex
CREATE INDEX "daily_checkins_date_idx" ON "daily_checkins"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_checkins_clientId_date_key" ON "daily_checkins"("clientId", "date");

-- CreateIndex
CREATE INDEX "nutrition_goals_clientId_weekStartDate_idx" ON "nutrition_goals"("clientId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_sessions" ADD CONSTRAINT "scheduled_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_sessions" ADD CONSTRAINT "scheduled_sessions_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_recommendations" ADD CONSTRAINT "daily_recommendations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
