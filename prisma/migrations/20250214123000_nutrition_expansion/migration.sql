-- CreateEnum
CREATE TYPE "NutritionTipScope" AS ENUM ('GLOBAL', 'CLIENT', 'OBJECTIVE');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateTable
CREATE TABLE "nutrition_settings" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "objective" TEXT,
    "proteinTargetPerDay" INTEGER NOT NULL,
    "waterTargetMlPerDay" INTEGER NOT NULL,
    "weeklyGoal1" TEXT,
    "weeklyGoal2" TEXT,
    "goalTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_tips" (
    "id" UUID NOT NULL,
    "scope" "NutritionTipScope" NOT NULL,
    "text" TEXT NOT NULL,
    "goalTag" TEXT,
    "clientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_ideas" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mealType" "MealType" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_settings_clientId_key" ON "nutrition_settings"("clientId");

-- CreateIndex
CREATE INDEX "nutrition_tips_scope_idx" ON "nutrition_tips"("scope");

-- CreateIndex
CREATE INDEX "nutrition_tips_clientId_idx" ON "nutrition_tips"("clientId");

-- CreateIndex
CREATE INDEX "nutrition_tips_goalTag_idx" ON "nutrition_tips"("goalTag");

-- CreateIndex
CREATE INDEX "meal_ideas_mealType_idx" ON "meal_ideas"("mealType");

-- AddForeignKey
ALTER TABLE "nutrition_settings" ADD CONSTRAINT "nutrition_settings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_tips" ADD CONSTRAINT "nutrition_tips_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
