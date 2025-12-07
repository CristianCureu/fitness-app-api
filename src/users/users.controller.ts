import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register new user or return existing
   * Public endpoint - called after Supabase login
   */
  @Post('auth/register')
  async register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  /**
   * Get current user's profile
   * Requires authentication
   */
  @Get('users/me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AppUser) {
    return this.usersService.findOne(user.id);
  }

  /**
   * List all users
   * TRAINER only
   */
  @Get('users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER)
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Update user role
   * TRAINER only
   */
  @Patch('users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto);
  }
}
