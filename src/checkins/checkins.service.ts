import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class CheckinsService {
  private readonly logger = new Logger(CheckinsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create or update today's checkin (upsert)
   * CLIENT only
   */
  async upsertTodayCheckin(userId: string, dto: CreateCheckinDto) {
    this.logger.log(
      `upsertTodayCheckin userId=${userId} nutritionScore=${dto.nutritionScore ?? 'n/a'} painAtTraining=${dto.painAtTraining ?? 'n/a'}`,
    );
    // Get client profile
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`upsertTodayCheckin missing client profile userId=${userId}`);
      throw new NotFoundException('Client profile not found');
    }

    const clientTimezone = clientProfile.timezone || 'UTC';
    const now = dayjs().tz(clientTimezone);
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();

    // Check if checkin already exists for today
    const existing = await this.prisma.dailyCheckin.findFirst({
      where: {
        clientId: clientProfile.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (existing) {
      this.logger.log(`upsertTodayCheckin update checkinId=${existing.id}`);
      // Update existing checkin
      return this.prisma.dailyCheckin.update({
        where: { id: existing.id },
        data: {
          nutritionScore: dto.nutritionScore ?? existing.nutritionScore,
          painAtTraining: dto.painAtTraining ?? existing.painAtTraining,
          note: dto.note ?? existing.note,
        },
      });
    }

    this.logger.log(`upsertTodayCheckin create clientId=${clientProfile.id}`);
    // Create new checkin
    return this.prisma.dailyCheckin.create({
      data: {
        clientId: clientProfile.id,
        date: todayStart,
        nutritionScore: dto.nutritionScore ?? 0,
        painAtTraining: dto.painAtTraining ?? false,
        note: dto.note,
      },
    });
  }

  /**
   * Get checkins for a client with optional date range
   */
  async findAll(userId: string, startDate?: string, endDate?: string) {
    this.logger.log(`findAll userId=${userId} start=${startDate || '-'} end=${endDate || '-'}`);
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`findAll missing client profile userId=${userId}`);
      throw new NotFoundException('Client profile not found');
    }

    const where: any = {
      clientId: clientProfile.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    return this.prisma.dailyCheckin.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
  }
}
