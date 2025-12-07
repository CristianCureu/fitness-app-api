import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create or update today's checkin (upsert)
   * CLIENT only
   */
  async upsertTodayCheckin(userId: string, dto: CreateCheckinDto) {
    // Get client profile
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
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
      // Update existing checkin
      return this.prisma.dailyCheckin.update({
        where: { id: existing.id },
        data: {
          nutritionScore: dto.nutritionScore,
          painAtTraining: dto.painAtTraining,
          note: dto.note,
        },
      });
    }

    // Create new checkin
    return this.prisma.dailyCheckin.create({
      data: {
        clientId: clientProfile.id,
        date: todayStart,
        nutritionScore: dto.nutritionScore,
        painAtTraining: dto.painAtTraining,
        note: dto.note,
      },
    });
  }

  /**
   * Get checkins for a client with optional date range
   */
  async findAll(userId: string, startDate?: string, endDate?: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
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
