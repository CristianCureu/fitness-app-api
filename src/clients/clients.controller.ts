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
import { PaginationDto } from '../common/dto/pagination.dto';
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
    @Query() pagination: PaginationDto,
  ) {
    return this.clientsService.findAll(user.id, pagination);
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
}
