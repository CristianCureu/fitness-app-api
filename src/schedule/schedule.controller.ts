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
import { CreateClientSessionDto } from './dto/create-client-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';
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
   * Create a new session as client
   * CLIENT only
   */
  @Post('sessions/client')
  @Roles(UserRole.CLIENT)
  async createClientSession(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateClientSessionDto,
  ) {
    return this.scheduleService.createForClient(user.id, dto);
  }

  /**
   * Get recommended session for client
   * CLIENT only
   */
  @Get('recommendation')
  @Roles(UserRole.CLIENT)
  async getClientRecommendation(@CurrentUser() user: AppUser) {
    return this.scheduleService.getClientRecommendation(user.id);
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
   * Get upcoming sessions
   * TRAINER and CLIENT
   */
  @Get('sessions/upcoming')
  async getUpcoming(
    @CurrentUser() user: AppUser,
    @Query('limit') limit?: string,
  ) {
    return this.scheduleService.getUpcoming(user, limit ? parseInt(limit) : 5);
  }

  /**
   * Get session history (completed)
   * TRAINER and CLIENT
   */
  @Get('sessions/history')
  async getHistory(
    @CurrentUser() user: AppUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.scheduleService.getHistory(
      user,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
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

  /**
   * Complete a session
   * TRAINER and CLIENT
   */
  @Post('sessions/:id/complete')
  async completeSession(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.scheduleService.completeSession(id, user, dto.notes);
  }

  /**
   * Get calendar view for a week
   * TRAINER and CLIENT
   */
  @Get('calendar/week')
  async getWeekCalendar(
    @CurrentUser() user: AppUser,
    @Query() query: QueryCalendarDto,
  ) {
    return this.scheduleService.getWeekCalendar(user, query.date);
  }
}
