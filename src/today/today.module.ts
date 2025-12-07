import { Module } from '@nestjs/common';
import { TodayService } from './today.service';
import { TodayController } from './today.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [TodayService],
  controllers: [TodayController],
})
export class TodayModule {}
