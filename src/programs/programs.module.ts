import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramRecommendationService } from './program-recommendation.service';
import { ProgramsController } from './programs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramRecommendationService],
  exports: [ProgramsService, ProgramRecommendationService],
})
export class ProgramsModule {}
