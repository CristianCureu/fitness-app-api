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
import { NutritionService } from './nutrition.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto';
import { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller('nutrition')
@UseGuards(AuthGuard, RolesGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  /**
   * Create nutrition goal
   * TRAINER only
   */
  @Post('goals')
  @Roles(UserRole.TRAINER)
  async create(@CurrentUser() user: AppUser, @Body() dto: CreateNutritionGoalDto) {
    return this.nutritionService.create(user.id, dto);
  }

  /**
   * Get current week's nutrition goal
   * CLIENT only
   */
  @Get('goals/current')
  @Roles(UserRole.CLIENT)
  async getCurrentGoal(@CurrentUser() user: AppUser) {
    return this.nutritionService.getCurrentGoal(user.id);
  }

  /**
   * Get all nutrition goals
   * TRAINER and CLIENT
   */
  @Get('goals')
  async findAll(@CurrentUser() user: AppUser, @Query('clientId') clientId?: string) {
    return this.nutritionService.findAll(user.id, user.role === UserRole.TRAINER, clientId);
  }

  /**
   * Update nutrition goal
   * TRAINER only
   */
  @Patch('goals/:id')
  @Roles(UserRole.TRAINER)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateNutritionGoalDto,
  ) {
    return this.nutritionService.update(id, user.id, dto);
  }

  /**
   * Delete nutrition goal
   * TRAINER only
   */
  @Delete('goals/:id')
  @Roles(UserRole.TRAINER)
  async remove(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.nutritionService.remove(id, user.id);
  }
}
