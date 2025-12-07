import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import type { AppUser } from '@prisma/client';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new scheduled session
   * TRAINER only
   */
  async create(trainerId: string, dto: CreateSessionDto) {
    // Verify client exists and belongs to this trainer
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only schedule sessions for your own clients');
    }

    return this.prisma.scheduledSession.create({
      data: {
        clientId: dto.clientId,
        trainerId,
        sessionName: dto.sessionName,
        sessionType: dto.sessionType,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        autoRecommended: dto.autoRecommended || false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Find all sessions with filtering
   * TRAINER sees their clients' sessions
   * CLIENT sees only their own sessions
   */
  async findAll(user: AppUser, query: QuerySessionsDto) {
    const { offset = 0, limit = 50, clientId, startDate, endDate, status } = query;

    // Build where clause based on role
    const where: any = {};

    if (user.role === 'TRAINER') {
      // Trainer can filter by clientId or see all their clients' sessions
      if (clientId) {
        // Verify client belongs to trainer
        const client = await this.prisma.clientProfile.findUnique({
          where: { id: clientId },
        });
        if (!client || client.trainerId !== user.id) {
          throw new ForbiddenException('You can only view sessions for your own clients');
        }
        where.clientId = clientId;
      } else {
        where.trainerId = user.id;
      }
    } else {
      // Client can only see their own sessions
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!clientProfile) {
        throw new NotFoundException('Client profile not found');
      }
      where.clientId = clientProfile.id;
    }

    // Add date range filter
    if (startDate || endDate) {
      where.startAt = {};
      if (startDate) {
        where.startAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.startAt.lte = new Date(endDate);
      }
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    const [sessions, total] = await Promise.all([
      this.prisma.scheduledSession.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          startAt: 'asc',
        },
      }),
      this.prisma.scheduledSession.count({ where }),
    ]);

    return {
      sessions,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single session by ID
   */
  async findOne(id: string, user: AppUser) {
    const session = await this.prisma.scheduledSession.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
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

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Verify access
    if (user.role === 'TRAINER' && session.trainerId !== user.id) {
      throw new ForbiddenException('You can only view sessions for your own clients');
    }

    if (user.role === 'CLIENT' && session.client.userId !== user.id) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return session;
  }

  /**
   * Update a session
   * TRAINER only
   */
  async update(id: string, trainerId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.scheduledSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('You can only update your own sessions');
    }

    // Handle date conversions
    const updateData: any = { ...dto };
    if ('startAt' in dto && dto.startAt) {
      updateData.startAt = new Date(dto.startAt as string);
    }
    if ('endAt' in dto && dto.endAt) {
      updateData.endAt = new Date(dto.endAt as string);
    }

    return this.prisma.scheduledSession.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Update session status
   * TRAINER and CLIENT can update (e.g., mark as completed)
   */
  async updateStatus(id: string, user: AppUser, dto: UpdateSessionStatusDto) {
    const session = await this.prisma.scheduledSession.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Verify access
    if (user.role === 'TRAINER' && session.trainerId !== user.id) {
      throw new ForbiddenException('You can only update your own sessions');
    }

    if (user.role === 'CLIENT' && session.client.userId !== user.id) {
      throw new ForbiddenException('You can only update your own sessions');
    }

    return this.prisma.scheduledSession.update({
      where: { id },
      data: { status: dto.status },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a session
   * TRAINER only
   */
  async remove(id: string, trainerId: string) {
    const session = await this.prisma.scheduledSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.trainerId !== trainerId) {
      throw new ForbiddenException('You can only delete your own sessions');
    }

    await this.prisma.scheduledSession.delete({
      where: { id },
    });

    return { message: 'Session deleted successfully' };
  }
}
