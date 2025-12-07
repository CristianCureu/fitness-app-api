import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import dayjs from 'dayjs';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a daily recommendation
   * TRAINER only
   */
  async create(trainerId: string, dto: CreateRecommendationDto) {
    // Verify client belongs to trainer
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only create recommendations for your own clients');
    }

    const date = dayjs(dto.date).startOf('day').toDate();

    return this.prisma.dailyRecommendation.create({
      data: {
        clientId: dto.clientId,
        date,
        focusText: dto.focusText,
        tipsText: dto.tipsText,
        hasWorkoutToday: dto.hasWorkoutToday || false,
      },
    });
  }

  /**
   * Get all recommendations for a client
   * TRAINER only
   */
  async findAllForClient(trainerId: string, clientId: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client || client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only view recommendations for your own clients');
    }

    return this.prisma.dailyRecommendation.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Update a recommendation
   * TRAINER only
   */
  async update(id: string, trainerId: string, dto: UpdateRecommendationDto) {
    const recommendation = await this.prisma.dailyRecommendation.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }

    if (recommendation.client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only update recommendations for your own clients');
    }

    return this.prisma.dailyRecommendation.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a recommendation
   * TRAINER only
   */
  async remove(id: string, trainerId: string) {
    const recommendation = await this.prisma.dailyRecommendation.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }

    if (recommendation.client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only delete recommendations for your own clients');
    }

    await this.prisma.dailyRecommendation.delete({
      where: { id },
    });

    return { message: 'Recommendation deleted successfully' };
  }
}
