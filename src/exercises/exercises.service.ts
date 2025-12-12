import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchExercisesQuery {
  search?: string;
  category?: string;
  difficulty?: string;
  equipment?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search exercises with filters
   * Returns default exercises + trainer's custom exercises
   */
  async searchExercises(trainerId: string, query: SearchExercisesQuery) {
    const {
      search,
      category,
      difficulty,
      equipment,
      limit = 50,
      offset = 0,
    } = query;

    const where: any = {
      OR: [
        { isDefault: true }, // Default exercises
        { trainerId }, // Trainer's custom exercises
      ],
    };

    // Search by name or description
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by difficulty
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Filter by equipment (array contains)
    if (equipment) {
      where.equipment = {
        array_contains: equipment,
      };
    }

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      exercises,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get recommended exercises for specific categories
   * Can pass multiple categories to get diverse recommendations
   */
  async getRecommendedExercises(
    trainerId: string,
    categories: string | string[],
    difficulty?: string,
  ) {
    const categoryArray = Array.isArray(categories) ? categories : [categories];

    const where: any = {
      OR: [
        { isDefault: true },
        { trainerId },
      ],
      category: { in: categoryArray },
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Group exercises by category for better organization in UI
    const exercises = await this.prisma.exercise.findMany({
      where,
      orderBy: [{ category: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });

    // Group by category
    const groupedByCategory: Record<string, any[]> = {};
    exercises.forEach((exercise) => {
      const cat = exercise.category;
      if (!groupedByCategory[cat]) {
        groupedByCategory[cat] = [];
      }
      groupedByCategory[cat].push(exercise);
    });

    return {
      categories: categoryArray,
      totalExercises: exercises.length,
      exercisesByCategory: groupedByCategory,
      allExercises: exercises,
    };
  }

  /**
   * Get a single exercise by ID
   */
  async findOne(id: string, trainerId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Verify access: can view if it's default OR if it's their own exercise
    if (!exercise.isDefault && exercise.trainerId !== trainerId) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }
}
