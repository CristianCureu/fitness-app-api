import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';

@Controller('recommendations')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  async create(@CurrentUser() user: AppUser, @Body() dto: CreateRecommendationDto) {
    return this.recommendationsService.create(user.id, dto);
  }

  @Get('client/:clientId')
  async findAllForClient(@CurrentUser() user: AppUser, @Param('clientId') clientId: string) {
    return this.recommendationsService.findAllForClient(user.id, clientId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateRecommendationDto,
  ) {
    return this.recommendationsService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.recommendationsService.remove(id, user.id);
  }
}
