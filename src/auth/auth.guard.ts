import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Validate token with Supabase
      const { data, error } = await this.supabaseService
        .getAuthClient()
        .getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Load AppUser from database
      const appUser = await this.prismaService.appUser.findUnique({
        where: { authId: data.user.id },
      });

      if (!appUser) {
        throw new UnauthorizedException(
          'User not found in database. Please register first.',
        );
      }

      // Attach AppUser to request
      request.user = appUser;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
