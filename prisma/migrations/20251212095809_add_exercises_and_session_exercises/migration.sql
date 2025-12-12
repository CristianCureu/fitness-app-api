-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('SQUAT', 'DEADLIFT', 'PUSH', 'PULL', 'LUNGE', 'HINGE', 'CARRY', 'CORE', 'CARDIO', 'MOBILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "howTo" JSONB NOT NULL,
    "cues" JSONB NOT NULL,
    "mistakes" JSONB NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "equipment" JSONB NOT NULL,
    "difficulty" "ExerciseDifficulty" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "trainerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "orderInSession" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT,
    "restSeconds" INTEGER,
    "tempo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercises_category_difficulty_idx" ON "exercises"("category", "difficulty");

-- CreateIndex
CREATE INDEX "exercises_trainerId_idx" ON "exercises"("trainerId");

-- CreateIndex
CREATE INDEX "exercises_isDefault_idx" ON "exercises"("isDefault");

-- CreateIndex
CREATE INDEX "session_exercises_sessionId_idx" ON "session_exercises"("sessionId");

-- CreateIndex
CREATE INDEX "session_exercises_exerciseId_idx" ON "session_exercises"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "session_exercises_sessionId_exerciseId_orderInSession_key" ON "session_exercises"("sessionId", "exerciseId", "orderInSession");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
