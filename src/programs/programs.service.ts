import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { GetProgramsQueryDto } from './dto/get-programs-query.dto';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new workout program
   * TRAINER only
   */
  async create(trainerId: string, dto: CreateProgramDto) {
    // Validate sessions
    if (dto.sessions.length === 0) {
      throw new BadRequestException('Program must have at least one session');
    }

    // Check for duplicate day numbers
    const dayNumbers = dto.sessions.map((s) => s.dayNumber);
    const uniqueDayNumbers = new Set(dayNumbers);
    if (dayNumbers.length !== uniqueDayNumbers.size) {
      throw new BadRequestException('Session day numbers must be unique');
    }

    return this.prisma.workoutProgram.create({
      data: {
        trainerId,
        name: dto.name,
        description: dto.description,
        sessionsPerWeek: dto.sessionsPerWeek,
        durationWeeks: dto.durationWeeks,
        isDefault: false,
        sessions: {
          create: dto.sessions,
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

  /**
   * Find all programs
   * TRAINER sees default programs + their own custom programs
   */
  async findAll(trainerId: string, query: GetProgramsQueryDto) {
    const { includeDefault = true, onlyDefault = false } = query;

    const where: any = {};

    if (onlyDefault) {
      // Only default programs
      where.isDefault = true;
    } else if (includeDefault) {
      // Default programs + trainer's custom programs
      where.OR = [{ isDefault: true }, { trainerId }];
    } else {
      // Only trainer's custom programs
      where.trainerId = trainerId;
      where.isDefault = false;
    }

    const programs = await this.prisma.workoutProgram.findMany({
      where,
      include: {
        sessions: {
          orderBy: {
            dayNumber: 'asc',
          },
        },
        _count: {
          select: {
            clientPrograms: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return programs;
  }

  /**
   * Get a single program by ID
   */
  async findOne(id: string, trainerId: string) {
    const program = await this.prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: {
            dayNumber: 'asc',
          },
        },
        trainer: {
          select: {
            id: true,
            trainerProfile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            clientPrograms: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Verify access: can view if it's default OR if it's their own program
    if (!program.isDefault && program.trainerId !== trainerId) {
      throw new ForbiddenException('You can only view your own programs');
    }

    return program;
  }

  /**
   * Update a program
   * TRAINER only - can only update their own custom programs
   */
  async update(id: string, trainerId: string, dto: UpdateProgramDto) {
    const program = await this.prisma.workoutProgram.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (program.isDefault) {
      throw new ForbiddenException('Cannot modify default programs');
    }

    if (program.trainerId !== trainerId) {
      throw new ForbiddenException('You can only update your own programs');
    }

    // If updating sessions, delete old ones and create new ones
    const updateData: any = {
      name: dto.name,
      description: dto.description,
      sessionsPerWeek: dto.sessionsPerWeek,
      durationWeeks: dto.durationWeeks,
    };

    if (dto.sessions) {
      // Validate sessions
      if (dto.sessions.length === 0) {
        throw new BadRequestException('Program must have at least one session');
      }

      const dayNumbers = dto.sessions.map((s) => s.dayNumber);
      const uniqueDayNumbers = new Set(dayNumbers);
      if (dayNumbers.length !== uniqueDayNumbers.size) {
        throw new BadRequestException('Session day numbers must be unique');
      }

      // Delete old sessions and create new ones
      await this.prisma.programSession.deleteMany({
        where: { programId: id },
      });

      updateData.sessions = {
        create: dto.sessions,
      };
    }

    return this.prisma.workoutProgram.update({
      where: { id },
      data: updateData,
      include: {
        sessions: {
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    });
  }

  /**
   * Delete a program
   * TRAINER only - can only delete their own custom programs
   */
  async remove(id: string, trainerId: string) {
    const program = await this.prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clientPrograms: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (program.isDefault) {
      throw new ForbiddenException('Cannot delete default programs');
    }

    if (program.trainerId !== trainerId) {
      throw new ForbiddenException('You can only delete your own programs');
    }

    if (program._count.clientPrograms > 0) {
      throw new BadRequestException(
        'Cannot delete program that is assigned to clients',
      );
    }

    await this.prisma.workoutProgram.delete({
      where: { id },
    });

    return { message: 'Program deleted successfully' };
  }

  /**
   * Clone a program (for customization)
   * TRAINER only
   */
  async clone(id: string, trainerId: string, newName?: string) {
    const sourceProgram = await this.prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        sessions: true,
      },
    });

    if (!sourceProgram) {
      throw new NotFoundException('Program not found');
    }

    // Can clone default programs or own programs
    if (!sourceProgram.isDefault && sourceProgram.trainerId !== trainerId) {
      throw new ForbiddenException('You can only clone default or your own programs');
    }

    const clonedProgram = await this.prisma.workoutProgram.create({
      data: {
        trainerId,
        name: newName || `${sourceProgram.name} (Copy)`,
        description: sourceProgram.description,
        sessionsPerWeek: sourceProgram.sessionsPerWeek,
        durationWeeks: sourceProgram.durationWeeks,
        isDefault: false,
        sessions: {
          create: sourceProgram.sessions.map((session) => ({
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

    return clonedProgram;
  }
}
