-- AlterTable
ALTER TABLE "scheduled_sessions" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;
