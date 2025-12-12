/*
  Warnings:

  - The values [DEADLIFT,PUSH,PULL,CARRY,CARDIO,MOBILITY] on the enum `ExerciseCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExerciseCategory_new" AS ENUM ('SQUAT', 'LUNGE', 'HINGE', 'HORIZONTAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PUSH', 'VERTICAL_PULL', 'GLUTES_HAMSTRINGS', 'CORE', 'FULL_BODY_POWER', 'CARDIO_CONDITIONING', 'OTHER');
ALTER TABLE "exercises" ALTER COLUMN "category" TYPE "ExerciseCategory_new" USING ("category"::text::"ExerciseCategory_new");
ALTER TYPE "ExerciseCategory" RENAME TO "ExerciseCategory_old";
ALTER TYPE "ExerciseCategory_new" RENAME TO "ExerciseCategory";
DROP TYPE "public"."ExerciseCategory_old";
COMMIT;
