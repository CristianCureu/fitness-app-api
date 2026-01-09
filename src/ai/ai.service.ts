import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

interface AiResponse {
  ideas?: string[];
  answer?: string;
  summary?: string;
  tip?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly weeklyFeedbackCache = new Map<string, { date: string; summary: string }>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getApiKey() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is missing');
    }
    return apiKey;
  }

  private getModel() {
    return this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  private async callOpenAi(systemPrompt: string, userPrompt: string): Promise<AiResponse> {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    this.logger.log(
      `OpenAI request model=${model} systemLen=${systemPrompt.length} userLen=${userPrompt.length}`,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      this.logger.error(`OpenAI request failed: ${error instanceof Error ? error.message : error}`);
      throw new InternalServerErrorException('OpenAI request failed');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`OpenAI error status=${response.status} body=${text.slice(0, 500)}`);
      throw new InternalServerErrorException(`OpenAI error: ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    this.logger.log(`OpenAI response length=${content.length}`);

    try {
      return JSON.parse(content);
    } catch {
      this.logger.warn('OpenAI response is not valid JSON, returning raw answer');
      return { answer: content };
    }
  }

  private buildContext(clientId: string, extras?: { includeCheckins?: boolean }) {
    return this.prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        nutritionSettings: true,
        dailyRecommendations: {
          orderBy: { date: 'desc' },
          take: 3,
        },
        checkins: extras?.includeCheckins
          ? {
              orderBy: { date: 'desc' },
              take: 7,
            }
          : false,
      },
    });
  }

  async askToday(userId: string, question: string) {
    this.logger.log(`askToday userId=${userId} questionLen=${question.length}`);
    const normalized = question.trim().toLowerCase();
    if (normalized.length < 6 || normalized === 'test') {
      return {
        ideas: [
          'Spune-mi unde esti azi si ce optiuni ai la indemana.',
          'Vrei o recomandare pentru mic dejun, pranz sau cina?',
          'Ai vreo restrictie alimentara (lactate, porc, gluten)?',
        ],
        answer: 'Am nevoie de un pic mai mult context ca sa-ti dau 2-3 idei clare.',
      };
    }
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`askToday missing client profile userId=${userId}`);
      throw new InternalServerErrorException('Client profile not found');
    }

    const context = await this.buildContext(clientProfile.id);
    this.logger.log(`askToday context clientId=${clientProfile.id}`);

    const systemPrompt =
      'Esti Cristian, antrenor si nutritionist. Raspunzi scurt, direct, maxim 3 idei. Fara paragrafe lungi. Foloseste doar contextul. Raspunde in romana. Returneaza STRICT JSON: {"ideas":["..."],"answer":"..."} fara text extra.';

    const contextLines = [
      `Tip nutritie: ${context?.nutritionSettings?.objective || 'nesetat'}`,
      `Tinte: proteine ${context?.nutritionSettings?.proteinTargetPerDay || 0}g, apa ${context?.nutritionSettings?.waterTargetMlPerDay || 0}ml`,
      `Obiectiv sapt: ${context?.nutritionSettings?.weeklyGoal1 || '-'}`,
      `Focus recent: ${context?.dailyRecommendations?.[0]?.focusText || '-'}`,
    ];

    const userPrompt = `Context\n${contextLines.join('\n')}\n\nIntrebare: ${question}`;

    const response = await this.callOpenAi(systemPrompt, userPrompt);
    this.logger.log(`askToday response ideas=${response.ideas?.length || 0}`);

    return {
      ideas: response.ideas?.slice(0, 3) || [],
      answer: response.answer || '',
    };
  }

  async generateMealIdeas(userId: string, preferences?: string[], mealsPerDay?: number) {
    this.logger.log(
      `generateMealIdeas userId=${userId} preferences=${preferences?.length || 0} mealsPerDay=${mealsPerDay || 0}`,
    );
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`generateMealIdeas missing client profile userId=${userId}`);
      throw new InternalServerErrorException('Client profile not found');
    }

    const context = await this.buildContext(clientProfile.id);
    this.logger.log(`generateMealIdeas context clientId=${clientProfile.id}`);

    const systemPrompt =
      'Esti Cristian, nutritionist. Genereaza 3-5 idei simple de mese (mic dejun / pranz / cina). Foloseste doar contextul. Returneaza JSON: {"ideas": ["Mic dejun: ...", "Pranz: ..."]}.';

    const userPrompt = `Context\nTip nutritie: ${
      context?.nutritionSettings?.objective || 'nesetat'
    }\nPreferinte: ${preferences?.join(', ') || 'n/a'}\nMese pe zi: ${
      mealsPerDay || 3
    }\n`;

    const response = await this.callOpenAi(systemPrompt, userPrompt);
    this.logger.log(`generateMealIdeas response ideas=${response.ideas?.length || 0}`);

    return {
      ideas: response.ideas?.slice(0, 5) || [],
    };
  }

  async weeklyFeedback(userId: string) {
    this.logger.log(`weeklyFeedback userId=${userId}`);
    const todayKey = dayjs().format('YYYY-MM-DD');
    const cached = this.weeklyFeedbackCache.get(userId);
    if (cached?.date === todayKey) {
      this.logger.log(`weeklyFeedback cache hit userId=${userId}`);
      return { summary: cached.summary };
    }
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      this.logger.warn(`weeklyFeedback missing client profile userId=${userId}`);
      throw new InternalServerErrorException('Client profile not found');
    }

    const context = await this.buildContext(clientProfile.id, { includeCheckins: true });
    const since = dayjs().subtract(7, 'day').toDate();

    const sessions = await this.prisma.scheduledSession.findMany({
      where: {
        clientId: clientProfile.id,
        completedAt: { not: null, gte: since },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    const systemPrompt =
      'Esti Cristian. Ofera feedback saptamanal in 1-2 fraze scurte, cald si incurajator. Include 1 apreciere si 1 focus pentru saptamana urmatoare. Evita tonul critic. Nu mentiona "checkin", "check-in", "check in" sau completari zilnice. Returneaza STRICT JSON: {"summary":"..."}.'; 

    const userPrompt = `Context\nSesiuni finalizate: ${sessions.length}\nTip nutritie: ${context?.nutritionSettings?.objective || 'nesetat'}\nTon: scurt, politicos, incurajator.\n`;

    const response = await this.callOpenAi(systemPrompt, userPrompt);
    const raw = response.summary || response.answer || '';
    this.logger.log(`weeklyFeedback response length=${raw.length}`);

    const cleaned = raw
      .replace(/check[ -]?in(uri|uri)?/gi, '')
      .replace(/completari zilnice/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const forbidden = /check[ -]?in|completari zilnice/i.test(raw);

    if (!cleaned || forbidden) {
      const summary =
        sessions.length > 0
          ? 'Saptamana asta ai fost constant, foarte bine. Saptamana viitoare, pastreaza ritmul si pune putin focus pe nutritie si odihna.'
          : 'Saptamana asta a fost mai linistita, ceea ce e ok. Saptamana viitoare, incepe cu o sesiune planificata si pasii mici vor conta.';
      this.weeklyFeedbackCache.set(userId, { date: todayKey, summary });
      return { summary };
    }

    this.weeklyFeedbackCache.set(userId, { date: todayKey, summary: cleaned });
    return { summary: cleaned };
  }

  async generateNutritionTip(input: {
    weeklyGoal1?: string | null;
    proteinTargetPerDay?: number | null;
    waterTargetMlPerDay?: number | null;
  }) {
    const systemPrompt =
      'Esti Cristian. Ofera un singur tip de nutritie pentru azi, 1 fraza scurta, practica si pozitiva. Nu mentiona "obiectiv". Nu folosi liste. Returneaza STRICT JSON: {"tip":"..."}.'; 
    const userPrompt = `Context\nTinte: proteine ${input.proteinTargetPerDay || 0}g, apa ${input.waterTargetMlPerDay || 0}ml\nObiectiv saptamanal: ${input.weeklyGoal1 || 'n/a'}\n`;

    const response = await this.callOpenAi(systemPrompt, userPrompt);
    const raw = response.tip || response.answer || '';
    const cleaned = raw.replace(/obiectiv/gi, '').replace(/\s{2,}/g, ' ').trim();

    return cleaned ? { tip: cleaned } : { tip: '' };
  }
}
