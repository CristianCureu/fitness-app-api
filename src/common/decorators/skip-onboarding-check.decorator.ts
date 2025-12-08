import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to skip onboarding completion check
 * Use this on routes that should be accessible even if onboarding is not completed
 * Example: onboarding endpoints, auth endpoints
 */
export const SkipOnboardingCheck = () => SetMetadata('skipOnboardingCheck', true);
