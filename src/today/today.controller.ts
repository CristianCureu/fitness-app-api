import { Controller, Get, UseGuards } from '@nestjs/common';
import { TodayService } from './today.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller('today')
@UseGuards(AuthGuard, RolesGuard)
export class TodayController {
  constructor(private readonly todayService: TodayService) {}

  /**
   * Get today's complete view
   * CLIENT only
   */
  @Get()
  @Roles(UserRole.CLIENT)
  async getTodayView(@CurrentUser() user: AppUser) {
    return this.todayService.getTodayView(user.id);
  }
}
