import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register or return existing user (upsert pattern)
   * Called by mobile app after successful Supabase login
   */
  async register(dto: RegisterUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.appUser.findUnique({
      where: { authId: dto.authId },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user with default CLIENT role
    return this.prisma.appUser.create({
      data: {
        authId: dto.authId,
        role: UserRole.CLIENT,
      },
    });
  }

  /**
   * Get user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.appUser.findUnique({
      where: { id },
      include: {
        clientProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * List all users (for trainers)
   */
  async findAll() {
    return this.prisma.appUser.findMany({
      include: {
        clientProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update user role (manual promotion to TRAINER)
   * Only accessible by existing trainers
   */
  async updateRole(id: string, dto: UpdateRoleDto) {
    const user = await this.prisma.appUser.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.appUser.update({
      where: { id },
      data: { role: dto.role },
    });
  }
}
