import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { ValidateInviteDto } from './dto/validate-invite.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipOnboardingCheck } from '../common/decorators/skip-onboarding-check.decorator';
import { UserRole, type AppUser } from '@prisma/client';

@Controller('onboarding')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
@SkipOnboardingCheck() // Allow access to onboarding endpoints even if not completed
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@CurrentUser() user: AppUser) {
    return this.onboardingService.getStatus(user.id);
  }

  @Post('validate-invite')
  validateInvite(@Body() dto: ValidateInviteDto) {
    console.log(dto)
    return this.onboardingService.validateInviteCode(dto);
  }

  @Post('complete')
  completeOnboarding(
    @CurrentUser() user: AppUser,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.onboardingService.completeOnboarding(user.id, dto);
  }
}
