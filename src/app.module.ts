import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
