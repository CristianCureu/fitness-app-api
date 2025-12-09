-- CreateTable
CREATE TABLE "program_recommendation_logs" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "recommendedProgramId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,
    "warnings" JSONB,
    "clientStats" JSONB NOT NULL,
    "trainerAccepted" BOOLEAN,
    "trainerSelectedProgramId" UUID,
    "trainerFeedback" TEXT,
    "actionTakenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_recommendation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_recommendation_logs_clientId_createdAt_idx" ON "program_recommendation_logs"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "program_recommendation_logs" ADD CONSTRAINT "program_recommendation_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_recommendation_logs" ADD CONSTRAINT "program_recommendation_logs_recommendedProgramId_fkey" FOREIGN KEY ("recommendedProgramId") REFERENCES "workout_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_recommendation_logs" ADD CONSTRAINT "program_recommendation_logs_trainerSelectedProgramId_fkey" FOREIGN KEY ("trainerSelectedProgramId") REFERENCES "workout_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
