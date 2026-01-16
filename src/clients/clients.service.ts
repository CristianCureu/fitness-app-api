import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { GetClientsQueryDto } from './dto/get-clients-query.dto';
import { AssignProgramDto } from './dto/assign-program.dto';
import { UpdateTrainingDaysDto } from './dto/update-training-days.dto';
import type { AppUser } from '@prisma/client';
import { addDays, startOfDay, addWeeks } from 'date-fns';
import { ProgramRecommendationService } from '../programs/program-recommendation.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private programRecommendation: ProgramRecommendationService,
  ) { }

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
   * Update the authenticated client's own profile
   * CLIENT only
   */
  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      throw new NotFoundException('Client profile not found');
    }

    if (dto.status && dto.status !== 'COMPLETED') {
      throw new ForbiddenException('Client can only mark objective as completed');
    }

    return this.prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: dto,
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

  /**
   * Assign a workout program to a client
   * TRAINER only
   */
  async assignProgram(
    clientId: string,
    trainerId: string,
    dto: AssignProgramDto,
  ) {
    // Verify client exists and belongs to trainer
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only assign programs to your own clients');
    }

    // Verify program exists
    const program = await this.prisma.workoutProgram.findUnique({
      where: { id: dto.programId },
      include: {
        sessions: {
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Verify trainer can use this program (default or their own)
    if (!program.isDefault && program.trainerId !== trainerId) {
      throw new ForbiddenException('You can only assign default programs or your own programs');
    }

    // Validate training days count matches sessions per week
    if (dto.trainingDays.length !== program.sessionsPerWeek) {
      throw new BadRequestException(
        `Program requires ${program.sessionsPerWeek} training days, but ${dto.trainingDays.length} were provided`,
      );
    }

    let programToAssign = program;

    // If customize flag is true, clone the program
    if (dto.customize) {
      programToAssign = await this.prisma.workoutProgram.create({
        data: {
          trainerId,
          name: `${program.name} (Custom for ${client.firstName})`,
          description: program.description,
          sessionsPerWeek: program.sessionsPerWeek,
          durationWeeks: program.durationWeeks,
          isDefault: false,
          sessions: {
            create: program.sessions.map((session) => ({
              dayNumber: session.dayNumber,
              name: session.name,
              focus: session.focus,
              notes: session.notes,
            })),
          },
        },
        include: {
          sessions: {
            orderBy: {
              dayNumber: 'asc',
            },
          },
        },
      });
    }

    // Delete existing program assignment if any
    await this.prisma.clientProgram.deleteMany({
      where: { clientId },
    });

    // Create client program assignment
    const clientProgram = await this.prisma.clientProgram.create({
      data: {
        clientId,
        programId: programToAssign.id,
        startDate: new Date(dto.startDate),
        trainingDays: dto.trainingDays,
        isCustomized: dto.customize || false,
        active: true,
      },
      include: {
        program: {
          include: {
            sessions: {
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
        },
      },
    });

    // Generate scheduled sessions for the next X weeks
    await this.generateScheduledSessions(
      clientId,
      trainerId,
      clientProgram,
      new Date(dto.startDate),
    );

    // Record feedback against the latest recommendation (if any)
    await this.recordRecommendationFeedback(clientId, programToAssign.id);

    return clientProgram;
  }

  /**
   * Get client's active program
   */
  async getClientProgram(clientId: string, trainerId: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only view programs for your own clients');
    }

    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { clientId },
      include: {
        program: {
          include: {
            sessions: {
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
        },
      },
    });

    if (!clientProgram) {
      throw new NotFoundException('No active program found for this client');
    }
    
    return clientProgram;
  }

  /**
   * Remove program from client
   */
  async removeProgram(clientId: string, trainerId: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only modify programs for your own clients');
    }

    // Delete client program
    await this.prisma.clientProgram.deleteMany({
      where: { clientId },
    });

    // Optionally: delete future scheduled sessions related to this program
    // or mark them differently

    return { message: 'Program removed successfully' };
  }

  /**
   * Update training days for client's program
   */
  async updateTrainingDays(
    clientId: string,
    trainerId: string,
    dto: UpdateTrainingDaysDto,
  ) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only modify programs for your own clients');
    }

    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { clientId },
      include: {
        program: true,
      },
    });

    if (!clientProgram) {
      throw new NotFoundException('No active program found for this client');
    }

    // Validate training days count
    if (dto.trainingDays.length !== clientProgram.program.sessionsPerWeek) {
      throw new BadRequestException(
        `Program requires ${clientProgram.program.sessionsPerWeek} training days, but ${dto.trainingDays.length} were provided`,
      );
    }

    // Update training days
    const updated = await this.prisma.clientProgram.update({
      where: { clientId },
      data: {
        trainingDays: dto.trainingDays,
      },
      include: {
        program: {
          include: {
            sessions: {
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
        },
      },
    });

    // Regenerate future scheduled sessions
    // Delete future sessions (not completed)
    await this.prisma.scheduledSession.deleteMany({
      where: {
        clientId,
        status: 'SCHEDULED',
        startAt: {
          gte: new Date(),
        },
      },
    });

    // Generate new sessions
    await this.generateScheduledSessions(
      clientId,
      trainerId,
      updated,
      new Date(),
    );

    return updated;
  }

  /**
   * Helper: Generate scheduled sessions based on client program
   */
  private async generateScheduledSessions(
    clientId: string,
    trainerId: string,
    clientProgram: any,
    startDate: Date,
  ) {
    const { program, trainingDays } = clientProgram;
    const durationWeeks = program.durationWeeks || 12; // default 12 weeks

    const dayOfWeekMap: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0,
    };

    const sessions: any[] = [];
    const startOfWeek = startOfDay(startDate);

    for (let week = 0; week < durationWeeks; week++) {
      const weekStart = addWeeks(startOfWeek, week);

      trainingDays.forEach((dayName: string, index: number) => {
        const dayOfWeek = dayOfWeekMap[dayName];
        const sessionDate = addDays(weekStart, dayOfWeek);

        // Get the program session (rotate through sessions)
        const programSession = program.sessions[index % program.sessions.length];

        sessions.push({
          clientId,
          trainerId,
          sessionName: programSession.name,
          sessionType: programSession.focus,
          startAt: sessionDate,
          endAt: null,
          status: 'SCHEDULED',
          autoRecommended: true,
        });
      });
    }

    // Bulk create sessions
    await this.prisma.scheduledSession.createMany({
      data: sessions,
    });
  }

  /**
   * Get program recommendations for a client
   * TRAINER only
   */
  async getProgramRecommendations(clientId: string, trainerId: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only view recommendations for your own clients');
    }

    return this.programRecommendation.generateRecommendations(clientId);
  }

  /**
   * Get program history for a client
   * Shows all programs the client has been assigned
   */
  async getProgramHistory(clientId: string, userId: string, userRole: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Verify access
    if (userRole === 'TRAINER' && client.trainerId !== userId) {
      throw new ForbiddenException('You can only view history for your own clients');
    }

    if (userRole === 'CLIENT' && client.userId !== userId) {
      throw new ForbiddenException('You can only view your own history');
    }

    // Get recommendation logs (which track program changes)
    const history = await this.prisma.programRecommendationLog.findMany({
      where: {
        clientId,
        trainerAccepted: { not: null }, // Only show acted-upon recommendations
      },
      include: {
        recommendedProgram: {
          select: {
            id: true,
            name: true,
            description: true,
            sessionsPerWeek: true,
          },
        },
        trainerSelectedProgram: {
          select: {
            id: true,
            name: true,
            description: true,
            sessionsPerWeek: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      history: history.map((log) => ({
        date: log.createdAt,
        recommended: {
          programId: log.recommendedProgramId,
          programName: log.recommendedProgram.name,
          score: log.score,
          confidence: log.confidence,
        },
        selected: log.trainerSelectedProgram
          ? {
              programId: log.trainerSelectedProgramId!,
              programName: log.trainerSelectedProgram.name,
              wasRecommended: log.trainerAccepted,
            }
          : {
              programId: log.recommendedProgramId,
              programName: log.recommendedProgram.name,
              wasRecommended: true,
            },
        trainerFeedback: log.trainerFeedback,
        clientStats: log.clientStats,
      })),
    };
  }

  /**
   * Record trainer's decision on recommendation
   * Called when trainer assigns a program (from assignProgram method)
   */
  async recordRecommendationFeedback(
    clientId: string,
    selectedProgramId: string,
    trainerFeedback?: string,
  ) {
    // Find the most recent recommendation for this client
    const latestRecommendation = await this.prisma.programRecommendationLog.findFirst({
      where: {
        clientId,
        trainerAccepted: null, // Not yet acted upon
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (latestRecommendation) {
      const accepted = latestRecommendation.recommendedProgramId === selectedProgramId;

      await this.prisma.programRecommendationLog.update({
        where: { id: latestRecommendation.id },
        data: {
          trainerAccepted: accepted,
          trainerSelectedProgramId: accepted ? null : selectedProgramId,
          trainerFeedback,
          actionTakenAt: new Date(),
        },
      });
    }
  }
}
