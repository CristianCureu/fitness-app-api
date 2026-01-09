import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TodayService {
  private readonly logger = new Logger(TodayService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Get today's complete view for a client
   * Includes: next session, daily recommendation, checkin, nutrition goal
   * CLIENT only
   */
  async getTodayView(userId: string) {
    this.logger.log(`getTodayView userId=${userId}`);
    // Get client profile
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`getTodayView missing client profile userId=${userId}`);
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

    const todaySession = await this.prisma.scheduledSession.findFirst({
      where: {
        clientId: clientProfile.id,
        status: 'SCHEDULED',
        startAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { startAt: 'asc' },
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

    const hasWorkoutToday = Boolean(todaySession);

    // Generate default recommendation if missing
    if (!dailyRecommendation) {
      dailyRecommendation = {
        id: null,
        clientId: clientProfile.id,
        date: todayStart,
        focusText: hasWorkoutToday
          ? `Sesiune azi: ${todaySession?.sessionName || 'Program'}.`
          : 'Zi de recuperare - focus pe somn si hidratare',
        tipsText: hasWorkoutToday
          ? 'Inainte: carbohidrati usori + apa. Dupa: proteina + legume.'
          : 'Mentine mesele regulate si o plimbare usoara.',
        hasWorkoutToday,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    } else if (dailyRecommendation.hasWorkoutToday !== hasWorkoutToday) {
      dailyRecommendation = {
        ...dailyRecommendation,
        focusText: hasWorkoutToday
          ? `Sesiune azi: ${todaySession?.sessionName || 'Program'}.`
          : 'Zi de recuperare - focus pe somn si hidratare',
        tipsText: hasWorkoutToday
          ? 'Inainte: carbohidrati usori + apa. Dupa: proteina + legume.'
          : 'Mentine mesele regulate si o plimbare usoara.',
        hasWorkoutToday,
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

    const nutritionSettings = await this.prisma.nutritionSettings.findUnique({
      where: { clientId: clientProfile.id },
    });

    const pickRandom = <T>(items: T[]) =>
      items.length ? items[Math.floor(Math.random() * items.length)] : null;

    let nutritionTip: {
      id: string | null;
      createdAt: Date;
      updatedAt: Date;
      clientId: string | null;
      scope: string;
      text: string;
      goalTag: string | null;
    } | null = null;

    const clientTips = await this.prisma.nutritionTip.findMany({
      where: { scope: 'CLIENT', clientId: clientProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    nutritionTip = pickRandom(clientTips);

    if (!nutritionTip) {
      const objectiveTips = await this.prisma.nutritionTip.findMany({
        where: { scope: 'OBJECTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      nutritionTip = pickRandom(objectiveTips);
    }

    if (!nutritionTip) {
      const globalTips = await this.prisma.nutritionTip.findMany({
        where: { scope: 'GLOBAL' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      nutritionTip = pickRandom(globalTips);
    }

    if (!nutritionTip && nutritionSettings) {
      const generatedTips: Array<{ text: string }> = [];
      if (nutritionSettings.objective) {
        generatedTips.push({ text: nutritionSettings.objective });
      }
      if (nutritionSettings.weeklyGoal1) {
        generatedTips.push({ text: nutritionSettings.weeklyGoal1 });
      }
      if (nutritionSettings.proteinTargetPerDay > 0) {
        generatedTips.push({
          text: `Tine proteinele la ${nutritionSettings.proteinTargetPerDay}g pe zi.`,
        });
      }
      if (nutritionSettings.waterTargetMlPerDay > 0) {
        generatedTips.push({
          text: `Hidrateaza-te: tinta este ${nutritionSettings.waterTargetMlPerDay}ml pe zi.`,
        });
      }

      try {
        const aiTip = await this.aiService.generateNutritionTip({
          weeklyGoal1: nutritionSettings.weeklyGoal1,
          proteinTargetPerDay: nutritionSettings.proteinTargetPerDay,
          waterTargetMlPerDay: nutritionSettings.waterTargetMlPerDay,
        });
        if (aiTip.tip) {
          nutritionTip = {
            id: null,
            scope: 'GLOBAL',
            text: aiTip.tip,
            goalTag: null,
            clientId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      } catch (error) {
        this.logger.warn(
          `getTodayView aiTip failed: ${error instanceof Error ? error.message : error}`,
        );
      }

      if (!nutritionTip) {
        const generated = pickRandom(generatedTips);
        if (generated) {
          nutritionTip = {
            id: null,
            scope: 'GLOBAL',
            text: generated.text,
            goalTag: null,
            clientId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      }
    }

    if (!nutritionTip) {
      try {
        const aiTip = await this.aiService.generateNutritionTip({});
        if (aiTip.tip) {
          nutritionTip = {
            id: null,
            scope: 'GLOBAL',
            text: aiTip.tip,
            goalTag: null,
            clientId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      } catch (error) {
        this.logger.warn(
          `getTodayView aiTip fallback failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      `getTodayView clientId=${clientProfile.id} todaySession=${Boolean(todaySession)} nextSession=${Boolean(nextSession)} nutritionTip=${Boolean(nutritionTip)}`,
    );

    return {
      nextSession: todaySession || nextSession,
      dailyRecommendation,
      checkin,
      nutritionGoal,
      nutritionSettings,
      nutritionTip,
      clientInfo: {
        firstName: clientProfile.firstName,
        lastName: clientProfile.lastName,
        goalDescription: clientProfile.goalDescription,
      },
    };
  }
}
