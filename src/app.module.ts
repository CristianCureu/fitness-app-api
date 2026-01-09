import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TodayModule } from './today/today.module';
import { CheckinsModule } from './checkins/checkins.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { InvitesModule } from './invites/invites.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ProgramsModule } from './programs/programs.module';
import { OnboardingCompletedGuard } from './common/guards/onboarding-completed.guard';
import { ExercisesModule } from './exercises/exercises.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ScheduleModule,
    TodayModule,
    CheckinsModule,
    RecommendationsModule,
    NutritionModule,
    InvitesModule,
    OnboardingModule,
    ProgramsModule,
    ExercisesModule,
    AiModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: OnboardingCompletedGuard,
    },
  ],
})
export class AppModule { }
