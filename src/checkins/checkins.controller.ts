import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller('checkins')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  /**
   * Create or update today's checkin
   * CLIENT only
   */
  @Post('today')
  async upsertToday(@CurrentUser() user: AppUser, @Body() dto: CreateCheckinDto) {
    return this.checkinsService.upsertTodayCheckin(user.id, dto);
  }

  /**
   * Get all checkins with optional date range
   * CLIENT only
   */
  @Get()
  async findAll(
    @CurrentUser() user: AppUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.checkinsService.findAll(user.id, startDate, endDate);
  }
}
