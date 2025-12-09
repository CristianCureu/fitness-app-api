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
import { ClientsService } from './clients.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { GetClientsQueryDto } from './dto/get-clients-query.dto';
import { AssignProgramDto } from './dto/assign-program.dto';
import { UpdateTrainingDaysDto } from './dto/update-training-days.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Create a new client profile
   * TRAINER only
   */
  @Post()
  @Roles(UserRole.TRAINER)
  async create(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateClientProfileDto,
  ) {
    return this.clientsService.create(user.id, dto);
  }

  /**
   * Get all clients for the authenticated trainer
   * TRAINER only
   */
  @Get()
  @Roles(UserRole.TRAINER)
  async findAll(
    @CurrentUser() user: AppUser,
    @Query() query: GetClientsQueryDto,
  ) {
    return this.clientsService.findAll(user.id, query);
  }

  /**
   * Get client's own profile
   * CLIENT only
   */
  @Get('me/profile')
  @Roles(UserRole.CLIENT)
  async getMyProfile(@CurrentUser() user: AppUser) {
    return this.clientsService.getMyProfile(user.id);
  }

  /**
   * Get a specific client profile
   * TRAINER can see their clients, CLIENT can see their own
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.clientsService.findOne(id, user);
  }

  /**
   * Update a client profile
   * TRAINER only
   */
  @Patch(':id')
  @Roles(UserRole.TRAINER)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateClientProfileDto,
  ) {
    return this.clientsService.update(id, user.id, dto);
  }

  /**
   * Delete a client profile
   * TRAINER only
   */
  @Delete(':id')
  @Roles(UserRole.TRAINER)
  async remove(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.clientsService.remove(id, user.id);
  }

  /**
   * Assign a workout program to a client
   * TRAINER only
   */
  @Post(':id/program/assign')
  @Roles(UserRole.TRAINER)
  async assignProgram(
    @Param('id') clientId: string,
    @CurrentUser() user: AppUser,
    @Body() dto: AssignProgramDto,
  ) {
    return this.clientsService.assignProgram(clientId, user.id, dto);
  }

  /**
   * Get client's active program
   * TRAINER only
   */
  @Get(':id/program')
  @Roles(UserRole.TRAINER)
  async getClientProgram(
    @Param('id') clientId: string,
    @CurrentUser() user: AppUser,
  ) {
    return this.clientsService.getClientProgram(clientId, user.id);
  }

  /**
   * Remove program from client
   * TRAINER only
   */
  @Delete(':id/program')
  @Roles(UserRole.TRAINER)
  async removeProgram(
    @Param('id') clientId: string,
    @CurrentUser() user: AppUser,
  ) {
    return this.clientsService.removeProgram(clientId, user.id);
  }

  /**
   * Update training days for client's program
   * TRAINER only
   */
  @Patch(':id/program/days')
  @Roles(UserRole.TRAINER)
  async updateTrainingDays(
    @Param('id') clientId: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateTrainingDaysDto,
  ) {
    return this.clientsService.updateTrainingDays(clientId, user.id, dto);
  }

  /**
   * Get AI program recommendations for a client
   * TRAINER only
   */
  @Get(':id/program/recommendations')
  @Roles(UserRole.TRAINER)
  async getProgramRecommendations(
    @Param('id') clientId: string,
    @CurrentUser() user: AppUser,
  ) {
    return this.clientsService.getProgramRecommendations(clientId, user.id);
  }

  /**
   * Get program history for a client
   * TRAINER can see their clients, CLIENT can see their own
   */
  @Get(':id/program/history')
  async getProgramHistory(
    @Param('id') clientId: string,
    @CurrentUser() user: AppUser,
  ) {
    return this.clientsService.getProgramHistory(clientId, user.id, user.role);
  }
}
