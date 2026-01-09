import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AskAiDto } from './dto/ask-ai.dto';
import { MealIdeasDto } from './dto/meal-ideas.dto';
import { UserRole } from '@prisma/client';
import type { AppUser } from '@prisma/client';
import { AiRateLimiter } from './ai.rate-limiter';

@Controller('ai')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class AiController {
  private readonly limiter = new AiRateLimiter({ windowMs: 60_000, max: 5 });

  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  async askToday(@CurrentUser() user: AppUser, @Body() dto: AskAiDto) {
    this.limiter.enforce(`${user.id}:ask`);
    return this.aiService.askToday(user.id, dto.question);
  }

  @Post('meal-ideas')
  async mealIdeas(@CurrentUser() user: AppUser, @Body() dto: MealIdeasDto) {
    this.limiter.enforce(`${user.id}:meal-ideas`);
    return this.aiService.generateMealIdeas(user.id, dto.preferences, dto.mealsPerDay);
  }

  @Post('weekly-feedback')
  async weeklyFeedback(@CurrentUser() user: AppUser) {
    this.limiter.enforce(`${user.id}:weekly-feedback`);
    return this.aiService.weeklyFeedback(user.id);
  }
}
