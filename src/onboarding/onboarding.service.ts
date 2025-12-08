import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { OnboardingStatusDto } from './dto/onboarding-status.dto';
import { ValidateInviteDto } from './dto/validate-invite.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private invitesService: InvitesService,
  ) {}

  /**
   * Get onboarding status for a user
   */
  async getStatus(userId: string): Promise<OnboardingStatusDto> {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: {
        onboardingCompleted: true,
        onboardingCompletedAt: true,
      },
    });

    if (!profile) {
      return {
        completed: false,
        profileExists: false,
      };
    }

    return {
      completed: profile.onboardingCompleted,
      completedAt: profile.onboardingCompletedAt?.toISOString(),
      profileExists: true,
    };
  }

  /**
   * Validate invite code without completing onboarding
   */
  async validateInviteCode(dto: ValidateInviteDto) {
    const invite = await this.invitesService.validateInviteCode(
      dto.inviteCode,
    );

    return {
      valid: true,
      message: 'Invite code is valid',
      trainerInfo: {
        trainerId: invite.trainerId,
      },
      prefillData: {
        clientEmail: invite.clientEmail,
        clientFirstName: invite.clientFirstName,
        clientLastName: invite.clientLastName,
      },
    };
  }

  /**
   * Complete onboarding for a client
   * Creates ClientProfile and marks onboarding as complete
   */
  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    // 1. Verify user exists and is a CLIENT
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new BadRequestException('Only clients can complete onboarding');
    }

    // 2. Check if profile already exists
    if (user.clientProfile) {
      if (user.clientProfile.onboardingCompleted) {
        throw new BadRequestException('Onboarding already completed');
      }
      // If profile exists but onboarding not completed, allow update
    }

    // 3. Validate invite code
    const invite = await this.invitesService.validateInviteCode(
      dto.inviteCode,
    );

    // 4. Create or update client profile
    const profileData = {
      userId,
      trainerId: invite.trainerId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      timezone: dto.timezone || 'UTC',
      age: dto.age,
      height: dto.height,
      weight: dto.weight,
      goalDescription: dto.goalDescription,
      status: 'ACTIVE' as const,
      programStartDate: dto.programStartDate
        ? new Date(dto.programStartDate)
        : null,
      recommendedSessionsPerWeek: dto.preferredSessionsPerWeek,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    };

    const profile = await this.prisma.clientProfile.upsert({
      where: { userId },
      create: profileData,
      update: profileData,
      include: {
        trainer: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    // 5. Mark invite code as used
    await this.invitesService.markAsUsed(dto.inviteCode, userId);

    return {
      message: 'Onboarding completed successfully',
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        onboardingCompleted: profile.onboardingCompleted,
        trainer: profile.trainer,
      },
    };
  }
}
