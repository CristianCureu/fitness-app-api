import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller('schedule')
@UseGuards(AuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * Create a new session
   * TRAINER only
   */
  @Post('sessions')
  @Roles(UserRole.TRAINER)
  async create(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateSessionDto,
  ) {
    return this.scheduleService.create(user.id, dto);
  }

  /**
   * Get all sessions (filtered by role and query params)
   * TRAINER and CLIENT
   */
  @Get('sessions')
  async findAll(
    @CurrentUser() user: AppUser,
    @Query() query: QuerySessionsDto,
  ) {
    return this.scheduleService.findAll(user, query);
  }

  /**
   * Get a specific session
   * TRAINER and CLIENT
   */
  @Get('sessions/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.scheduleService.findOne(id, user);
  }

  /**
   * Update a session
   * TRAINER only
   */
  @Patch('sessions/:id')
  @Roles(UserRole.TRAINER)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.scheduleService.update(id, user.id, dto);
  }

  /**
   * Update session status
   * TRAINER and CLIENT
   */
  @Patch('sessions/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateSessionStatusDto,
  ) {
    return this.scheduleService.updateStatus(id, user, dto);
  }

  /**
   * Delete a session
   * TRAINER only
   */
  @Delete('sessions/:id')
  @Roles(UserRole.TRAINER)
  async remove(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.scheduleService.remove(id, user.id);
  }
}
