import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TodayService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get today's complete view for a client
   * Includes: next session, daily recommendation, checkin, nutrition goal
   * CLIENT only
   */
  async getTodayView(userId: string) {
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

    // Find next upcoming session
    const nextSession = await this.prisma.scheduledSession.findFirst({
      where: {
        clientId: clientProfile.id,
        status: 'SCHEDULED',
        startAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    // Find today's recommendation
    let dailyRecommendation = await this.prisma.dailyRecommendation.findFirst({
      where: {
        clientId: clientProfile.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Generate default recommendation if missing
    if (!dailyRecommendation) {
      dailyRecommendation = {
        id: null,
        clientId: clientProfile.id,
        date: todayStart,
        focusText: 'Rest day - Focus on recovery',
        tipsText: null,
        hasWorkoutToday: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    // Find today's checkin
    const checkin = await this.prisma.dailyCheckin.findFirst({
      where: {
        clientId: clientProfile.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Find current week's nutrition goal
    const nutritionGoal = await this.prisma.nutritionGoal.findFirst({
      where: {
        clientId: clientProfile.id,
        weekStartDate: {
          lte: todayStart,
        },
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });

    return {
      nextSession,
      dailyRecommendation,
      checkin,
      nutritionGoal,
      clientInfo: {
        firstName: clientProfile.firstName,
        lastName: clientProfile.lastName,
        goalDescription: clientProfile.goalDescription,
      },
    };
  }
}
