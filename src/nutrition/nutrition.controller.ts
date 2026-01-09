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
import { CreateNutritionSettingsDto } from './dto/create-nutrition-settings.dto';
import { UpdateNutritionSettingsDto } from './dto/update-nutrition-settings.dto';
import { CreateNutritionTipDto } from './dto/create-nutrition-tip.dto';
import { UpdateNutritionTipDto } from './dto/update-nutrition-tip.dto';
import { CreateMealIdeaDto } from './dto/create-meal-idea.dto';
import { UpdateMealIdeaDto } from './dto/update-meal-idea.dto';
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

  /**
   * Get nutrition settings
   * TRAINER: can query any client
   * CLIENT: only sees their own
   */
  @Get('settings')
  async getSettings(@CurrentUser() user: AppUser, @Query('clientId') clientId?: string) {
    return this.nutritionService.getSettings(user.id, user.role === UserRole.TRAINER, clientId);
  }

  /**
   * Upsert nutrition settings
   * TRAINER only
   */
  @Post('settings')
  @Roles(UserRole.TRAINER)
  async upsertSettings(@CurrentUser() user: AppUser, @Body() dto: CreateNutritionSettingsDto) {
    return this.nutritionService.upsertSettings(user.id, dto);
  }

  /**
   * Update nutrition settings
   * TRAINER only
   */
  @Patch('settings/:id')
  @Roles(UserRole.TRAINER)
  async updateSettings(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateNutritionSettingsDto,
  ) {
    return this.nutritionService.updateSettings(id, user.id, dto);
  }

  /**
   * Get today's nutrition tip
   * CLIENT only
   */
  @Get('tips/today')
  @Roles(UserRole.CLIENT)
  async getTodayTip(@CurrentUser() user: AppUser) {
    return this.nutritionService.getTodayTip(user.id);
  }

  /**
   * List nutrition tips
   * TRAINER only
   */
  @Get('tips')
  @Roles(UserRole.TRAINER)
  async listTips(
    @CurrentUser() user: AppUser,
    @Query('scope') scope?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.nutritionService.listTips(user.id, { scope, clientId });
  }

  /**
   * Create nutrition tip
   * TRAINER only
   */
  @Post('tips')
  @Roles(UserRole.TRAINER)
  async createTip(@CurrentUser() user: AppUser, @Body() dto: CreateNutritionTipDto) {
    return this.nutritionService.createTip(user.id, dto);
  }

  /**
   * Update nutrition tip
   * TRAINER only
   */
  @Patch('tips/:id')
  @Roles(UserRole.TRAINER)
  async updateTip(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateNutritionTipDto,
  ) {
    return this.nutritionService.updateTip(id, user.id, dto);
  }

  /**
   * Delete nutrition tip
   * TRAINER only
   */
  @Delete('tips/:id')
  @Roles(UserRole.TRAINER)
  async removeTip(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.nutritionService.removeTip(id, user.id);
  }

  /**
   * List meal ideas
   * CLIENT: auto-filtered by goal tags
   * TRAINER: can filter by tags/type
   */
  @Get('meals')
  async listMealIdeas(
    @CurrentUser() user: AppUser,
    @Query('type') type?: string,
    @Query('tags') tags?: string,
  ) {
    const tagList = tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    return this.nutritionService.listMealIdeas(user.id, user.role === UserRole.TRAINER, {
      type,
      tags: tagList,
    });
  }

  /**
   * Create meal idea
   * TRAINER only
   */
  @Post('meals')
  @Roles(UserRole.TRAINER)
  async createMealIdea(@CurrentUser() user: AppUser, @Body() dto: CreateMealIdeaDto) {
    return this.nutritionService.createMealIdea(user.id, dto);
  }

  /**
   * Update meal idea
   * TRAINER only
   */
  @Patch('meals/:id')
  @Roles(UserRole.TRAINER)
  async updateMealIdea(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateMealIdeaDto,
  ) {
    return this.nutritionService.updateMealIdea(id, user.id, dto);
  }

  /**
   * Delete meal idea
   * TRAINER only
   */
  @Delete('meals/:id')
  @Roles(UserRole.TRAINER)
  async removeMealIdea(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.nutritionService.removeMealIdea(id, user.id);
  }
}
