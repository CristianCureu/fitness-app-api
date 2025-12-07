import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto';
import { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto';
import dayjs from 'dayjs';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a weekly nutrition goal
   * TRAINER only
   */
  async create(trainerId: string, dto: CreateNutritionGoalDto) {
    // Verify client belongs to trainer
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only create nutrition goals for your own clients');
    }

    // Ensure weekStartDate is a Monday
    const weekStart = dayjs(dto.weekStartDate).startOf('week').toDate();

    return this.prisma.nutritionGoal.create({
      data: {
        clientId: dto.clientId,
        weekStartDate: weekStart,
        proteinTargetPerDay: dto.proteinTargetPerDay,
        waterTargetMlPerDay: dto.waterTargetMlPerDay,
        weeklyFocus: dto.weeklyFocus,
      },
    });
  }

  /**
   * Get current nutrition goal for a client
   * CLIENT can get their own, TRAINER can get for their clients
   */
  async getCurrentGoal(userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      throw new NotFoundException('Client profile not found');
    }

    const today = new Date();

    return this.prisma.nutritionGoal.findFirst({
      where: {
        clientId: clientProfile.id,
        weekStartDate: {
          lte: today,
        },
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });
  }

  /**
   * Get all nutrition goals for a client
   * TRAINER and CLIENT
   */
  async findAll(userId: string, isTrainer: boolean, clientId?: string) {
    let targetClientId: string;

    if (isTrainer && clientId) {
      // Verify client belongs to trainer
      const client = await this.prisma.clientProfile.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const trainer = await this.prisma.appUser.findUnique({
        where: { id: userId },
      });

      if (!trainer || client.trainerId !== trainer.id) {
        throw new ForbiddenException('You can only view nutrition goals for your own clients');
      }

      targetClientId = clientId;
    } else {
      // Client viewing their own
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });

      if (!clientProfile) {
        throw new NotFoundException('Client profile not found');
      }

      targetClientId = clientProfile.id;
    }

    return this.prisma.nutritionGoal.findMany({
      where: { clientId: targetClientId },
      orderBy: { weekStartDate: 'desc' },
    });
  }

  /**
   * Update a nutrition goal
   * TRAINER only
   */
  async update(id: string, trainerId: string, dto: UpdateNutritionGoalDto) {
    const goal = await this.prisma.nutritionGoal.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!goal) {
      throw new NotFoundException('Nutrition goal not found');
    }

    if (goal.client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only update nutrition goals for your own clients');
    }

    return this.prisma.nutritionGoal.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a nutrition goal
   * TRAINER only
   */
  async remove(id: string, trainerId: string) {
    const goal = await this.prisma.nutritionGoal.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!goal) {
      throw new NotFoundException('Nutrition goal not found');
    }

    if (goal.client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only delete nutrition goals for your own clients');
    }

    await this.prisma.nutritionGoal.delete({
      where: { id },
    });

    return { message: 'Nutrition goal deleted successfully' };
  }
}
