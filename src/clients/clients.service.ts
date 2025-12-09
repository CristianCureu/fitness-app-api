import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { GetClientsQueryDto } from './dto/get-clients-query.dto';
import type { AppUser } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a new client profile
   * Only trainers can create client profiles
   */
  async create(trainerId: string, dto: CreateClientProfileDto) {
    // Verify the user exists and is a CLIENT
    const user = await this.prisma.appUser.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'CLIENT') {
      throw new BadRequestException('User must have CLIENT role');
    }

    // Check if client profile already exists
    const existingProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Client profile already exists');
    }

    // Create client profile
    return this.prisma.clientProfile.create({
      data: {
        userId: dto.userId,
        trainerId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        timezone: dto.timezone || 'UTC',
        age: dto.age,
        height: dto.height,
        weight: dto.weight,
        goalDescription: dto.goalDescription,
        status: dto.status || 'ACTIVE',
        programStartDate: dto.programStartDate
          ? new Date(dto.programStartDate)
          : null,
        programWeeks: dto.programWeeks,
        recommendedSessionsPerWeek: dto.recommendedSessionsPerWeek,
      },
      include: {
        user: {
          select: {
            id: true,
            authId: true,
            role: true,
            createdAt: true,
          },
        },
        trainer: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get all clients for a trainer with pagination, filtering, and search
   */
  async findAll(trainerId: string, query: GetClientsQueryDto) {
    const { offset = 0, limit = 50, search, status, onboardingCompleted } = query;

    const where: any = { trainerId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (onboardingCompleted !== undefined) {
      where.onboardingCompleted = onboardingCompleted;
    }

    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              authId: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.clientProfile.count({
        where,
      }),
    ]);

    return {
      data,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single client profile by ID
   * Trainers can only see their own clients
   */
  async findOne(id: string, user: AppUser) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            authId: true,
            role: true,
            createdAt: true,
          },
        },
        trainer: {
          select: {
            id: true,
            role: true,
          },
        },
        scheduledSessions: {
          where: {
            status: 'SCHEDULED',
            startAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            startAt: 'asc',
          },
          take: 5,
        },
        nutritionGoals: {
          orderBy: {
            weekStartDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Verify trainer has access to this client
    if (user.role === 'TRAINER' && client.trainerId !== user.id) {
      throw new ForbiddenException('You can only access your own clients');
    }

    // Verify client has access to their own profile
    if (user.role === 'CLIENT' && client.userId !== user.id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return client;
  }

  /**
   * Get client's own profile
   * For CLIENT role users
   */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      include: {
        trainer: {
          select: {
            id: true,
            role: true,
          },
        },
        scheduledSessions: {
          where: {
            status: 'SCHEDULED',
            startAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            startAt: 'asc',
          },
          take: 5,
        },
        nutritionGoals: {
          orderBy: {
            weekStartDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }

    return profile;
  }

  /**
   * Update client profile
   * Only the assigned trainer can update
   */
  async update(
    id: string,
    trainerId: string,
    dto: UpdateClientProfileDto,
  ) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only update your own clients');
    }

    // Handle date conversion for programStartDate
    const updateData: any = { ...dto };
    if ('programStartDate' in dto && dto.programStartDate) {
      updateData.programStartDate = new Date(dto.programStartDate as string);
    }

    return this.prisma.clientProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            authId: true,
            role: true,
            createdAt: true,
          },
        },
        trainer: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Delete client profile
   * Only the assigned trainer can delete
   */
  async remove(id: string, trainerId: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only delete your own clients');
    }

    await this.prisma.clientProfile.delete({
      where: { id },
    });

    return { message: 'Client profile deleted successfully' };
  }
}
