import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { differenceInWeeks, subWeeks } from 'date-fns';

export interface ProgramRecommendation {
  programId: string;
  programName: string;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  warnings: string[];
}

export interface ClientStats {
  completionRate: number;
  consistency: number;
  painFrequency: number;
  avgNutritionScore: number;
  weeksSinceStart: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
}

@Injectable()
export class ProgramRecommendationService {
  constructor(private prisma: PrismaService) { }

  private readonly SCORING_WEIGHTS = {
    completionRate: 0.35,
    consistency: 0.20,
    painFrequency: 0.15,
    goalAlignment: 0.15,
    timeInProgram: 0.10,
    nutritionScore: 0.05,
  };

  /**
   * Generate program recommendations for a client
   */
  async generateRecommendations(
    clientId: string,
  ): Promise<{
    recommendations: ProgramRecommendation[];
    currentProgram: any;
    clientStats: ClientStats;
  }> {
    // 1. Gather client data
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        activeProgram: {
          include: {
            program: {
              include: {
                sessions: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // 2. Calculate client stats
    const stats = await this.calculateClientStats(clientId);

    // 3. Get all available programs
    const allPrograms = await this.prisma.workoutProgram.findMany({
      where: {
        OR: [
          { isDefault: true },
          { trainerId: client.trainerId },
        ],
      },
      include: {
        sessions: true,
      },
    });

    // 4. Score each program
    const recommendations: ProgramRecommendation[] = [];

    for (const program of allPrograms) {
      // Skip current program from recommendations
      if (client.activeProgram?.programId === program.id) {
        continue;
      }

      const recommendation = await this.scoreProgram(
        program,
        client,
        stats,
      );

      recommendations.push(recommendation);
    }

    // 5. Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);

    // 6. Take top 3
    const topRecommendations = recommendations.slice(0, 3);

    // 7. Log the recommendation
    if (topRecommendations.length > 0) {
      await this.logRecommendation(
        clientId,
        topRecommendations[0],
        stats,
      );
    }

    return {
      recommendations: topRecommendations,
      currentProgram: client.activeProgram
        ? {
          programId: client.activeProgram.programId,
          programName: client.activeProgram.program.name,
          weeksSinceStart: stats.weeksSinceStart,
          completionRate: stats.completionRate,
          stats: {
            totalSessions: stats.totalSessions,
            completed: stats.completedSessions,
            cancelled: stats.cancelledSessions,
            noShow: stats.noShowSessions,
          },
        }
        : null,
      clientStats: stats,
    };
  }

  /**
   * Calculate client statistics
   */
  private async calculateClientStats(
    clientId: string,
  ): Promise<ClientStats> {
    const now = new Date();
    const fourWeeksAgo = subWeeks(now, 4);

    // Get client program
    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { clientId },
    });

    const weeksSinceStart = clientProgram
      ? differenceInWeeks(now, clientProgram.startDate)
      : 0;

    // Get sessions from last 4 weeks
    const recentSessions = await this.prisma.scheduledSession.findMany({
      where: {
        clientId,
        startAt: {
          gte: fourWeeksAgo,
          lte: now,
        },
      },
    });

    const totalSessions = recentSessions.length;
    const completedSessions = recentSessions.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    const cancelledSessions = recentSessions.filter(
      (s) => s.status === 'CANCELLED',
    ).length;
    const noShowSessions = recentSessions.filter(
      (s) => s.status === 'NO_SHOW',
    ).length;

    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate consistency (sessions per week)
    const consistency = totalSessions / 4; // avg sessions per week

    // Get check-ins from last 4 weeks
    const recentCheckins = await this.prisma.dailyCheckin.findMany({
      where: {
        clientId,
        date: {
          gte: fourWeeksAgo,
          lte: now,
        },
      },
    });

    const painFrequency =
      recentCheckins.length > 0
        ? (recentCheckins.filter((c) => c.painAtTraining).length /
          recentCheckins.length) *
        100
        : 0;

    const avgNutritionScore =
      recentCheckins.length > 0
        ? recentCheckins.reduce((sum, c) => sum + c.nutritionScore, 0) /
        recentCheckins.length
        : 0;

    return {
      completionRate,
      consistency,
      painFrequency,
      avgNutritionScore,
      weeksSinceStart,
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShowSessions,
    };
  }

  /**
   * Score a program for a client
   */
  private async scoreProgram(
    program: any,
    client: any,
    stats: ClientStats,
  ): Promise<ProgramRecommendation> {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let totalScore = 0;

    // 1. Completion Rate Score (0-35 points)
    const completionScore = this.scoreCompletionRate(
      stats.completionRate,
      program.sessionsPerWeek,
      reasons,
      warnings,
    );
    totalScore += completionScore * this.SCORING_WEIGHTS.completionRate * 100;

    // 2. Consistency Score (0-20 points)
    const consistencyScore = this.scoreConsistency(
      stats.consistency,
      program.sessionsPerWeek,
      reasons,
      warnings,
    );
    totalScore += consistencyScore * this.SCORING_WEIGHTS.consistency * 100;

    // 3. Pain Frequency Score (0-15 points) - inverse scoring
    const painScore = this.scorePainFrequency(
      stats.painFrequency,
      program.sessionsPerWeek,
      reasons,
      warnings,
    );
    totalScore += painScore * this.SCORING_WEIGHTS.painFrequency * 100;

    // 4. Goal Alignment Score (0-15 points)
    const goalScore = this.scoreGoalAlignment(
      client.goalDescription || '',
      program.name,
      program.description || '',
      reasons,
    );
    totalScore += goalScore * this.SCORING_WEIGHTS.goalAlignment * 100;

    // 5. Time in Program Score (0-10 points)
    const timeScore = this.scoreTimeInProgram(
      stats.weeksSinceStart,
      program.durationWeeks,
      reasons,
      warnings,
    );
    totalScore += timeScore * this.SCORING_WEIGHTS.timeInProgram * 100;

    // 6. Nutrition Score (0-5 points)
    const nutritionScore = this.scoreNutrition(
      stats.avgNutritionScore,
      program.name,
      reasons,
      warnings,
    );
    totalScore += nutritionScore * this.SCORING_WEIGHTS.nutritionScore * 100;

    // Determine confidence
    const confidence = this.determineConfidence(
      totalScore,
      stats.totalSessions,
      stats.weeksSinceStart,
    );

    return {
      programId: program.id,
      programName: program.name,
      score: Math.round(totalScore * 10) / 10, // round to 1 decimal
      confidence,
      reasons,
      warnings,
    };
  }

  private scoreCompletionRate(
    completionRate: number,
    programSessionsPerWeek: number,
    reasons: string[],
    warnings: string[],
  ): number {
    if (completionRate >= 85) {
      reasons.push(
        `Completion rate excelent: ${Math.round(completionRate)}%`,
      );
      return 1.0;
    } else if (completionRate >= 75) {
      reasons.push(
        `Completion rate foarte bun: ${Math.round(completionRate)}%`,
      );
      return 0.85;
    } else if (completionRate >= 60) {
      reasons.push(`Completion rate decent: ${Math.round(completionRate)}%`);
      if (programSessionsPerWeek >= 5) {
        warnings.push(
          'Completion rate ar putea fi insuficient pentru un program cu frecvență mare',
        );
      }
      return 0.6;
    } else {
      warnings.push(
        `Completion rate scăzut: ${Math.round(completionRate)}% - risc ridicat de abandon`,
      );
      if (programSessionsPerWeek >= 4) {
        warnings.push('Program cu prea multe sesiuni pentru consistency actuală');
      }
      return 0.3;
    }
  }

  private scoreConsistency(
    consistency: number,
    programSessionsPerWeek: number,
    reasons: string[],
    warnings: string[],
  ): number {
    const ratio = consistency / programSessionsPerWeek;

    if (ratio >= 0.9) {
      reasons.push(
        `Consistency excelentă: ${consistency.toFixed(1)} sesiuni/săptămână`,
      );
      return 1.0;
    } else if (ratio >= 0.75) {
      reasons.push(
        `Consistency bună: ${consistency.toFixed(1)} sesiuni/săptămână`,
      );
      return 0.85;
    } else if (ratio >= 0.6) {
      warnings.push(
        `Consistency moderată: ${consistency.toFixed(1)} sesiuni/săptămână - program ar putea fi prea intens`,
      );
      return 0.5;
    } else {
      warnings.push(
        `Consistency scăzută: ${consistency.toFixed(1)} sesiuni/săptămână - consideră un program mai puțin intens`,
      );
      return 0.2;
    }
  }

  private scorePainFrequency(
    painFrequency: number,
    programSessionsPerWeek: number,
    reasons: string[],
    warnings: string[],
  ): number {
    if (painFrequency === 0) {
      reasons.push('Nicio durere raportată - recovery excelent');
      return 1.0;
    } else if (painFrequency < 15) {
      reasons.push('Durere minimă - recovery bun');
      return 0.85;
    } else if (painFrequency < 30) {
      warnings.push(
        `Durere raportată în ${Math.round(painFrequency)}% din antrenamente`,
      );
      if (programSessionsPerWeek >= 5) {
        warnings.push('Program cu volum mare nu e recomandat cu durere frecventă');
      }
      return 0.5;
    } else {
      warnings.push(
        `Durere frecventă: ${Math.round(painFrequency)}% - prioritizează recovery`,
      );
      if (programSessionsPerWeek >= 3) {
        warnings.push(
          'Recomandare: program cu frecvență redusă până la îmbunătățirea recovery-ului',
        );
      }
      return 0.2;
    }
  }

  private scoreGoalAlignment(
    goalDescription: string,
    programName: string,
    programDescription: string,
    reasons: string[],
  ): number {
    const goal = goalDescription.toLowerCase();
    const progName = programName.toLowerCase();
    const progDesc = programDescription.toLowerCase();

    // Fat loss goals
    if (
      goal.includes('pierdere') ||
      goal.includes('slăbit') ||
      goal.includes('fat loss') ||
      goal.includes('grăsime')
    ) {
      if (progName.includes('fat loss') || progName.includes('circuit')) {
        reasons.push('Aliniere perfectă cu obiectivul de pierdere în greutate');
        return 1.0;
      } else if (progName.includes('beginner') || progName.includes('full body')) {
        reasons.push('Program compatibil cu obiectivul de pierdere în greutate');
        return 0.7;
      }
      return 0.4;
    }

    // Strength goals
    if (
      goal.includes('putere') ||
      goal.includes('forță') ||
      goal.includes('strength')
    ) {
      if (progName.includes('strength')) {
        reasons.push('Aliniere perfectă cu obiectivul de creștere a forței');
        return 1.0;
      } else if (progName.includes('upper/lower')) {
        reasons.push('Program compatibil cu obiectivul de strength');
        return 0.8;
      }
      return 0.5;
    }

    // Hypertrophy goals
    if (
      goal.includes('masă') ||
      goal.includes('volum') ||
      goal.includes('mușchi') ||
      goal.includes('hipertrofie')
    ) {
      if (progName.includes('ppl') || progName.includes('push/pull/legs')) {
        reasons.push('Volum maxim pentru hipertrofie');
        return 1.0;
      } else if (progName.includes('upper/lower')) {
        reasons.push('Echilibru bun între volum și recovery pentru hipertrofie');
        return 0.9;
      }
      return 0.6;
    }

    // Default - no strong goal alignment
    return 0.5;
  }

  private scoreTimeInProgram(
    weeksSinceStart: number,
    programDuration: number | null,
    reasons: string[],
    warnings: string[],
  ): number {
    if (weeksSinceStart === 0) {
      // No current program or just started
      reasons.push('Moment ideal pentru a începe un nou program');
      return 1.0;
    }

    const duration = programDuration || 12;

    if (weeksSinceStart < 4) {
      warnings.push(
        `Doar ${weeksSinceStart} săptămâni în programul curent - prea devreme pentru schimbare`,
      );
      return 0.2;
    } else if (weeksSinceStart >= duration - 2 && weeksSinceStart <= duration + 2) {
      reasons.push('Programul curent se apropie de final - moment ideal pentru tranziție');
      return 1.0;
    } else if (weeksSinceStart > duration + 4) {
      reasons.push(`Programul curent depășit (${weeksSinceStart}/${duration} săptămâni)`);
      return 0.9;
    } else if (weeksSinceStart >= 6) {
      reasons.push('Suficient timp în programul curent pentru evaluare');
      return 0.8;
    }

    return 0.5;
  }

  private scoreNutrition(
    avgNutritionScore: number,
    programName: string,
    reasons: string[],
    warnings: string[],
  ): number {
    const progName = programName.toLowerCase();

    if (avgNutritionScore >= 7) {
      reasons.push(`Nutriție foarte bună: ${avgNutritionScore.toFixed(1)}/10`);
      return 1.0;
    } else if (avgNutritionScore >= 6) {
      reasons.push(`Nutriție decentă: ${avgNutritionScore.toFixed(1)}/10`);
      return 0.7;
    } else if (avgNutritionScore > 0) {
      warnings.push(
        `Nutriție sub-optimă: ${avgNutritionScore.toFixed(1)}/10`,
      );
      if (progName.includes('fat loss')) {
        warnings.push('Programul de fat loss necesită nutriție mai bună pentru rezultate');
      } else if (progName.includes('ppl') || progName.includes('6x')) {
        warnings.push('Volumul mare de antrenament necesită nutriție mai bună');
      }
      return 0.4;
    }

    // No nutrition data
    return 0.5;
  }

  private determineConfidence(
    score: number,
    totalSessions: number,
    weeksSinceStart: number,
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Need sufficient data
    if (totalSessions < 4 || weeksSinceStart < 2) {
      return 'LOW';
    }

    if (score >= 80 && totalSessions >= 10) {
      return 'HIGH';
    } else if (score >= 60 && totalSessions >= 6) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private async logRecommendation(
    clientId: string,
    recommendation: ProgramRecommendation,
    stats: ClientStats,
  ): Promise<void> {
    await this.prisma.programRecommendationLog.create({
      data: {
        clientId,
        recommendedProgramId: recommendation.programId,
        score: recommendation.score,
        confidence: recommendation.confidence,
        reasons: recommendation.reasons,
        warnings: recommendation.warnings,
        clientStats: stats as any,
      },
    });
  }
}
