import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUser } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AppUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
