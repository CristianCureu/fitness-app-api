import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateClientSessionDto } from './dto/create-client-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import type { AppUser } from '@prisma/client';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private prisma: PrismaService) { }

  private readonly maxSessionsPerDay = 2;
  private readonly minIntervalHours = 2;

  private async enforceSessionLimits(clientId: string, startAt: Date) {
    const dayStart = new Date(startAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startAt);
    dayEnd.setHours(23, 59, 59, 999);

    const sameDaySessions = await this.prisma.scheduledSession.findMany({
      where: {
        clientId,
        status: 'SCHEDULED',
        startAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: { startAt: 'asc' },
    });

    if (sameDaySessions.length >= this.maxSessionsPerDay) {
      throw new BadRequestException('Max 2 sesiuni pe zi.');
    }

    const minIntervalMs = this.minIntervalHours * 60 * 60 * 1000;
    const hasConflict = sameDaySessions.some(
      (session) => Math.abs(session.startAt.getTime() - startAt.getTime()) < minIntervalMs,
    );

    if (hasConflict) {
      throw new BadRequestException(
        `Pastreaza un interval de minim ${this.minIntervalHours} ore intre sesiuni.`,
      );
    }
  }

  private async getRecommendedSession(clientId: string) {
    this.logger.log(`getRecommendedSession clientId=${clientId}`);
    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { clientId },
      include: {
        program: {
          include: {
            sessions: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!clientProgram || !clientProgram.program.sessions.length) {
      throw new NotFoundException('No active program sessions found');
    }

    const scheduledCount = await this.prisma.scheduledSession.count({
      where: {
        clientId,
        status: 'SCHEDULED',
      },
    });

    const sessions = clientProgram.program.sessions;
    const index = scheduledCount % sessions.length;
    return sessions[index];
  }

  /**
   * Create a new scheduled session
   * TRAINER only
   */
  async create(trainerId: string, dto: CreateSessionDto) {
    this.logger.log(`create session trainerId=${trainerId} clientId=${dto.clientId}`);
    const startAt = new Date(dto.startAt);

    await this.enforceSessionLimits(dto.clientId, startAt);
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
        startAt,
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
   * Create a new scheduled session as client
   * CLIENT only
   */
  async createForClient(userId: string, dto: CreateClientSessionDto) {
    this.logger.log(`createForClient userId=${userId} startAt=${dto.startAt}`);
    const startAt = new Date(dto.startAt);
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`createForClient missing client profile userId=${userId}`);
      throw new NotFoundException('Client profile not found');
    }

    await this.enforceSessionLimits(clientProfile.id, startAt);
    const recommendedSession = await this.getRecommendedSession(clientProfile.id);
    this.logger.log(
      `createForClient recommendation name=${recommendedSession.name} focus=${recommendedSession.focus}`,
    );

    return this.prisma.scheduledSession.create({
      data: {
        clientId: clientProfile.id,
        trainerId: clientProfile.trainerId,
        sessionName: recommendedSession.name,
        sessionType: recommendedSession.focus,
        startAt,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        autoRecommended: true,
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
   * Get recommended session for a client
   * CLIENT only
   */
  async getClientRecommendation(userId: string) {
    this.logger.log(`getClientRecommendation userId=${userId}`);
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`getClientRecommendation missing client profile userId=${userId}`);
      throw new NotFoundException('Client profile not found');
    }

    const recommendedSession = await this.getRecommendedSession(clientProfile.id);

    return {
      sessionName: recommendedSession.name,
      sessionType: recommendedSession.focus,
    };
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

    const [data, total] = await Promise.all([
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
      data,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single session by ID with exercises
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

    // Get exercises for this session
    const exercises = await this.getSessionExercises(session.client.id, session.sessionName);

    return {
      ...session,
      exercises,
    };
  }

  /**
   * Helper: Get exercises for a session based on client's program
   */
  private async getSessionExercises(clientId: string, sessionName: string) {
    // Get client's active program
    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { clientId },
      include: {
        program: {
          include: {
            sessions: {
              where: {
                name: sessionName,
              },
              include: {
                sessionExercises: {
                  include: {
                    exercise: true,
                  },
                  orderBy: {
                    orderInSession: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!clientProgram || !clientProgram.program.sessions.length) {
      return [];
    }

    const programSession = clientProgram.program.sessions[0];

    return programSession.sessionExercises.map((se) => ({
      id: se.exercise.id,
      name: se.exercise.name,
      description: se.exercise.description,
      category: se.exercise.category,
      difficulty: se.exercise.difficulty,
      howTo: se.exercise.howTo,
      cues: se.exercise.cues,
      mistakes: se.exercise.mistakes,
      equipment: se.exercise.equipment,
      sets: se.sets,
      reps: se.reps,
      restSeconds: se.restSeconds,
      tempo: se.tempo,
      notes: se.notes,
      orderInSession: se.orderInSession,
    }));
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
    const updateData: UpdateSessionDto = { ...dto };
    if ('startAt' in dto && dto.startAt) {
      updateData.startAt = new Date(dto.startAt).toISOString();
    }
    if ('endAt' in dto && dto.endAt) {
      updateData.endAt = new Date(dto.endAt).toISOString();
    }

    const updatedSession = await this.prisma.scheduledSession.update({
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

    return updatedSession;
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

  /**
   * Complete a session
   * CLIENT and TRAINER can mark sessions as complete
   */
  async completeSession(id: string, user: AppUser, notes?: string) {
    console.log('[Schedule][complete] start', {
      id,
      role: user.role,
      userId: user.id,
      hasNotes: !!notes,
    });
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
      console.warn('[Schedule][complete] not found', { id });
      throw new NotFoundException('Session not found');
    }

    // Verify access
    if (user.role === 'TRAINER' && session.trainerId !== user.id) {
      console.warn('[Schedule][complete] forbidden trainer', {
        id,
        trainerId: session.trainerId,
        userId: user.id,
      });
      throw new ForbiddenException('You can only complete your own sessions');
    }

    if (user.role === 'CLIENT' && session.client.userId !== user.id) {
      console.warn('[Schedule][complete] forbidden client', {
        id,
        clientUserId: session.client.userId,
        userId: user.id,
      });
      throw new ForbiddenException('You can only complete your own sessions');
    }

    // Update session
    const updated = await this.prisma.scheduledSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes,
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
    console.log('[Schedule][complete] updated', {
      id: updated.id,
      status: updated.status,
      completedAt: updated.completedAt?.toISOString(),
    });
    return updated;
  }

  /**
   * Get calendar view for a week
   * CLIENT sees their own, TRAINER sees all clients'
   */
  async getWeekCalendar(user: AppUser, date: string) {
    const targetDate = new Date(date);

    // Get start of week (Monday)
    const dayOfWeek = targetDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Build where clause based on role
    const where: any = {
      startAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    };

    if (user.role === 'CLIENT') {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!clientProfile) {
        throw new NotFoundException('Client profile not found');
      }
      where.clientId = clientProfile.id;
      where.status = 'SCHEDULED';
    } else {
      where.trainerId = user.id;
    }

    const sessions = await this.prisma.scheduledSession.findMany({
      where,
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
    });

    return {
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      sessions,
    };
  }

  /**
   * Get upcoming sessions
   * CLIENT sees their own, TRAINER sees all clients'
   */
  async getUpcoming(user: AppUser, limit: number = 5) {
    const where: any = {
      status: 'SCHEDULED',
      startAt: {
        gte: new Date(),
      },
    };

    if (user.role === 'CLIENT') {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!clientProfile) {
        throw new NotFoundException('Client profile not found');
      }
      where.clientId = clientProfile.id;
    } else {
      where.trainerId = user.id;
    }

    return this.prisma.scheduledSession.findMany({
      where,
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
    });
  }

  /**
   * Get session history (completed sessions)
   * CLIENT sees their own, TRAINER sees all clients'
   */
  async getHistory(user: AppUser, limit: number = 20, offset: number = 0) {
    const where: any = {
      status: 'COMPLETED',
    };

    if (user.role === 'CLIENT') {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!clientProfile) {
        console.warn('[Schedule][history] client profile missing', { userId: user.id });
        throw new NotFoundException('Client profile not found');
      }
      where.clientId = clientProfile.id;
    } else {
      where.trainerId = user.id;
    }

    console.log('[Schedule][history] query', {
      role: user.role,
      userId: user.id,
      limit,
      offset,
      where,
    });
    const [data, total] = await Promise.all([
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
          completedAt: 'desc',
        },
      }),
      this.prisma.scheduledSession.count({ where }),
    ]);

    console.log('[Schedule][history] result', {
      total,
      returned: data.length,
      firstId: data[0]?.id,
    });
    return {
      data,
      total,
      offset,
      limit,
    };
  }
}
