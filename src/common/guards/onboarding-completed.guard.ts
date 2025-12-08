import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard to ensure client has completed onboarding
 * Only applies to CLIENT role users
 * Trainers are not affected by this guard
 */
@Injectable()
export class OnboardingCompletedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, let AuthGuard handle it
    if (!user) {
      return true;
    }

    // Only apply to CLIENT role
    if (user.role !== 'CLIENT') {
      return true;
    }

    // Check if route is exempted from onboarding check
    const skipOnboardingCheck = this.reflector.getAllAndOverride<boolean>(
      'skipOnboardingCheck',
      [context.getHandler(), context.getClass()],
    );

    if (skipOnboardingCheck) {
      return true;
    }

    // Check if client has completed onboarding
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: user.id },
      select: { onboardingCompleted: true },
    });

    if (!clientProfile || !clientProfile.onboardingCompleted) {
      throw new ForbiddenException(
        'Please complete onboarding before accessing this resource',
      );
    }

    return true;
  }
}
