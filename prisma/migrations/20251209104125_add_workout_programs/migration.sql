-- CreateTable
CREATE TABLE "trainer_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_programs" (
    "id" UUID NOT NULL,
    "trainerId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sessionsPerWeek" INTEGER NOT NULL,
    "durationWeeks" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_sessions" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_programs" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trainingDays" JSONB NOT NULL,
    "isCustomized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainer_profiles_userId_key" ON "trainer_profiles"("userId");

-- CreateIndex
CREATE INDEX "workout_programs_trainerId_idx" ON "workout_programs"("trainerId");

-- CreateIndex
CREATE INDEX "workout_programs_isDefault_idx" ON "workout_programs"("isDefault");

-- CreateIndex
CREATE INDEX "program_sessions_programId_idx" ON "program_sessions"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "client_programs_clientId_key" ON "client_programs"("clientId");

-- CreateIndex
CREATE INDEX "client_programs_clientId_idx" ON "client_programs"("clientId");

-- CreateIndex
CREATE INDEX "client_programs_programId_idx" ON "client_programs"("programId");

-- AddForeignKey
ALTER TABLE "trainer_profiles" ADD CONSTRAINT "trainer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "workout_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_programs" ADD CONSTRAINT "client_programs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_programs" ADD CONSTRAINT "client_programs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "workout_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
