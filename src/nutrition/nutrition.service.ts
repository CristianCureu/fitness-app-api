import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto';
import { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto';
import { CreateNutritionSettingsDto } from './dto/create-nutrition-settings.dto';
import { UpdateNutritionSettingsDto } from './dto/update-nutrition-settings.dto';
import { CreateNutritionTipDto } from './dto/create-nutrition-tip.dto';
import { UpdateNutritionTipDto } from './dto/update-nutrition-tip.dto';
import { CreateMealIdeaDto } from './dto/create-meal-idea.dto';
import { UpdateMealIdeaDto } from './dto/update-meal-idea.dto';
import dayjs from 'dayjs';
import { MealType, NutritionTipScope } from '@prisma/client';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  private async getClientForTrainer(trainerId: string, clientId: string) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.trainerId !== trainerId) {
      throw new ForbiddenException('You can only access nutrition data for your own clients');
    }

    return client;
  }

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

  /**
   * Get nutrition settings for a client
   */
  async getSettings(userId: string, isTrainer: boolean, clientId?: string) {
    let targetClientId: string;

    if (isTrainer) {
      if (!clientId) {
        throw new BadRequestException('clientId is required for trainers');
      }

      await this.getClientForTrainer(userId, clientId);
      targetClientId = clientId;
    } else {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });

      if (!clientProfile) {
        throw new NotFoundException('Client profile not found');
      }

      targetClientId = clientProfile.id;
    }

    return this.prisma.nutritionSettings.findUnique({
      where: { clientId: targetClientId },
    });
  }

  /**
   * Upsert nutrition settings for a client
   * TRAINER only
   */
  async upsertSettings(trainerId: string, dto: CreateNutritionSettingsDto) {
    await this.getClientForTrainer(trainerId, dto.clientId);

    return this.prisma.nutritionSettings.upsert({
      where: { clientId: dto.clientId },
      create: {
        clientId: dto.clientId,
        objective: dto.objective,
        proteinTargetPerDay: dto.proteinTargetPerDay,
        waterTargetMlPerDay: dto.waterTargetMlPerDay,
        weeklyGoal1: dto.weeklyGoal1,
      },
      update: {
        objective: dto.objective,
        proteinTargetPerDay: dto.proteinTargetPerDay,
        waterTargetMlPerDay: dto.waterTargetMlPerDay,
        weeklyGoal1: dto.weeklyGoal1,
      },
    });
  }

  /**
   * Update nutrition settings
   * TRAINER only
   */
  async updateSettings(id: string, trainerId: string, dto: UpdateNutritionSettingsDto) {
    const settings = await this.prisma.nutritionSettings.findUnique({
      where: { id },
    });

    if (!settings) {
      throw new NotFoundException('Nutrition settings not found');
    }

    await this.getClientForTrainer(trainerId, settings.clientId);

    return this.prisma.nutritionSettings.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  /**
   * Get today's nutrition tip for a client
   * CLIENT only
   */
  async getTodayTip(userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      throw new NotFoundException('Client profile not found');
    }

    const settings = await this.prisma.nutritionSettings.findUnique({
      where: { clientId: clientProfile.id },
    });

    const pickRandom = <T>(items: T[]) =>
      items.length ? items[Math.floor(Math.random() * items.length)] : null;

    const clientTips = await this.prisma.nutritionTip.findMany({
      where: { scope: NutritionTipScope.CLIENT, clientId: clientProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const clientTip = pickRandom(clientTips);
    if (clientTip) {
      return clientTip;
    }

    const objectiveTips = await this.prisma.nutritionTip.findMany({
      where: { scope: NutritionTipScope.OBJECTIVE },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const objectiveTip = pickRandom(objectiveTips);
    if (objectiveTip) {
      return objectiveTip;
    }

    const globalTips = await this.prisma.nutritionTip.findMany({
      where: { scope: NutritionTipScope.GLOBAL },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const selectedTip = pickRandom(globalTips);
    if (selectedTip) {
      return selectedTip;
    }

    if (settings) {
      const generatedTips: Array<{ text: string }> = [];
      if (settings.objective) {
        generatedTips.push({ text: settings.objective });
      }
      if (settings.weeklyGoal1) {
        generatedTips.push({ text: settings.weeklyGoal1 });
      }
      if (settings.proteinTargetPerDay > 0) {
        generatedTips.push({
          text: `Tine proteinele la ${settings.proteinTargetPerDay}g pe zi.`,
        });
      }
      if (settings.waterTargetMlPerDay > 0) {
        generatedTips.push({
          text: `Hidrateaza-te: tinta este ${settings.waterTargetMlPerDay}ml pe zi.`,
        });
      }

      const generated = pickRandom(generatedTips);
      if (generated) {
        return {
          id: null,
          scope: NutritionTipScope.GLOBAL,
          text: generated.text,
          goalTag: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
    }

    return null;
  }

  /**
   * List nutrition tips
   * TRAINER only
   */
  async listTips(
    trainerId: string,
    filters: { scope?: string; clientId?: string; goalTag?: string },
  ) {
    if (filters.clientId) {
      await this.getClientForTrainer(trainerId, filters.clientId);
    }

    return this.prisma.nutritionTip.findMany({
      where: {
        scope: filters.scope as NutritionTipScope | undefined,
        clientId: filters.clientId,
        goalTag: filters.goalTag,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create nutrition tip
   * TRAINER only
   */
  async createTip(trainerId: string, dto: CreateNutritionTipDto) {
    if (dto.scope === NutritionTipScope.CLIENT) {
      if (!dto.clientId) {
        throw new BadRequestException('clientId is required for client tips');
      }
      await this.getClientForTrainer(trainerId, dto.clientId);
    }

    if (dto.scope === NutritionTipScope.GLOBAL) {
      return this.prisma.nutritionTip.create({
        data: {
          scope: dto.scope,
          text: dto.text,
        },
      });
    }

    return this.prisma.nutritionTip.create({
      data: {
        scope: dto.scope,
        text: dto.text,
        goalTag: dto.goalTag,
        clientId: dto.clientId,
      },
    });
  }

  /**
   * Update nutrition tip
   * TRAINER only
   */
  async updateTip(id: string, trainerId: string, dto: UpdateNutritionTipDto) {
    const tip = await this.prisma.nutritionTip.findUnique({
      where: { id },
    });

    if (!tip) {
      throw new NotFoundException('Nutrition tip not found');
    }

    if (tip.clientId) {
      await this.getClientForTrainer(trainerId, tip.clientId);
    }

    if (dto.scope === NutritionTipScope.CLIENT && !dto.clientId) {
      throw new BadRequestException('clientId is required for client tips');
    }

    return this.prisma.nutritionTip.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete nutrition tip
   * TRAINER only
   */
  async removeTip(id: string, trainerId: string) {
    const tip = await this.prisma.nutritionTip.findUnique({
      where: { id },
    });

    if (!tip) {
      throw new NotFoundException('Nutrition tip not found');
    }

    if (tip.clientId) {
      await this.getClientForTrainer(trainerId, tip.clientId);
    }

    await this.prisma.nutritionTip.delete({ where: { id } });

    return { message: 'Nutrition tip deleted successfully' };
  }

  /**
   * List meal ideas
   */
  async listMealIdeas(
    userId: string,
    isTrainer: boolean,
    filters: { type?: string; tags?: string[] },
  ) {
    const tagsFilter = filters.tags || [];
    return this.prisma.mealIdea.findMany({
      where: {
        mealType: (filters.type as MealType) || undefined,
        tags: tagsFilter.length ? { hasSome: tagsFilter } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create meal idea
   * TRAINER only
   */
  async createMealIdea(_trainerId: string, dto: CreateMealIdeaDto) {
    return this.prisma.mealIdea.create({
      data: {
        title: dto.title,
        description: dto.description,
        mealType: dto.mealType,
        tags: dto.tags || [],
      },
    });
  }

  /**
   * Update meal idea
   * TRAINER only
   */
  async updateMealIdea(id: string, _trainerId: string, dto: UpdateMealIdeaDto) {
    const meal = await this.prisma.mealIdea.findUnique({
      where: { id },
    });

    if (!meal) {
      throw new NotFoundException('Meal idea not found');
    }

    return this.prisma.mealIdea.update({
      where: { id },
      data: {
        ...dto,
        tags: dto.tags ?? undefined,
      },
    });
  }

  /**
   * Delete meal idea
   * TRAINER only
   */
  async removeMealIdea(id: string, _trainerId: string) {
    const meal = await this.prisma.mealIdea.findUnique({
      where: { id },
    });

    if (!meal) {
      throw new NotFoundException('Meal idea not found');
    }

    await this.prisma.mealIdea.delete({ where: { id } });

    return { message: 'Meal idea deleted successfully' };
  }
}
