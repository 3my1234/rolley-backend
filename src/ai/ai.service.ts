import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import aiConfig from '../config/ai.config';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private footballAiUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const config = this.configService.get('ai') as { geminiApiKey?: string; footballAiUrl?: string } | undefined;
    this.genAI = new GoogleGenerativeAI(config?.geminiApiKey || '');
    
    // Use configured URL or default
    const configuredUrl = config?.footballAiUrl || 'https://f4c4o880s8go0co48kkwsw00.useguidr.com';
    
    // For internal Docker network, try using HTTP instead of HTTPS
    // Remove https:// and use http:// for internal communication
    this.footballAiUrl = configuredUrl.replace(/^https:\/\//, 'http://');
    
    console.log(`🔧 Football AI Service URL: ${this.footballAiUrl}`);
  }

  /**
   * Get today's safe picks from Football AI service
   */
  async getSafePicks(): Promise<any> {
    try {
      const response = await fetch(`${this.footballAiUrl}/safe-picks/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout - increased to 60 seconds
        signal: AbortSignal.timeout(60000), // 60 seconds
      });

      if (!response.ok) {
        throw new Error(`Football AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching safe picks from Football AI:', error);
      
      // Return a more informative error response instead of throwing
      // This allows the frontend to handle it gracefully
      return {
        error: true,
        message: 'Football AI service is currently unavailable',
        details: error.message || 'Connection timeout',
        footballAiUrl: this.footballAiUrl,
        suggestion: 'Please check if the Football AI service is running and accessible',
        // Return empty picks so frontend can handle gracefully
        combo_odds: null,
        games_used: 0,
        picks: [],
        reason: 'Service unavailable',
        confidence: 0,
      };
    }
  }

  /**
   * Get raw predictions from Football AI service
   */
  async getRawPredictions(): Promise<any> {
    try {
      const response = await fetch(`${this.footballAiUrl}/safe-picks/raw`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`Football AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching raw predictions:', error);
      return {
        error: true,
        message: 'Football AI service is currently unavailable',
        details: error.message || 'Connection timeout',
        raw_predictions: [],
      };
    }
  }

  /**
   * Get today's matches from Football AI service
   */
  async getTodayMatches(): Promise<any> {
    try {
      const response = await fetch(`${this.footballAiUrl}/matches/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`Football AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching today\'s matches:', error);
      return {
        error: true,
        message: 'Football AI service is currently unavailable',
        details: error.message || 'Connection timeout',
        matches: [],
        count: 0,
      };
    }
  }

  /**
   * Generate daily AI picks and save to DailyEvent for admin review
   * This is the main workflow: AI generates picks -> Admin reviews -> Users see approved picks
   */
  async generateDailyPicks(): Promise<any> {
    try {
      // Step 1: Get safe picks from Football AI service
      const safePicks = await this.getSafePicks();
      
      if (!safePicks || !safePicks.picks || safePicks.picks.length === 0) {
        return {
          success: false,
          message: 'No safe picks found for today',
          data: null,
        };
      }

      // Step 2: Format picks into DailyEvent matches format
      const matches = safePicks.picks.map((pick: any) => {
        // Parse match string (e.g., "Arsenal vs Sheffield United")
        const matchParts = pick.match.split(' vs ');
        const homeTeam = matchParts[0]?.trim() || '';
        const awayTeam = matchParts[1]?.trim() || '';

        return {
          id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sport: 'football',
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          prediction: pick.market || 'over_0.5_goals',
          odds: pick.odds || 1.05,
          autoSelected: true, // Mark as AI-generated
          predictedOdds: pick.odds || 1.05,
          confidence: pick.confidence || 0.95,
          worstCaseSafe: pick.worstCaseSafe || false,
          safety_score: pick.safety_score || 0,
        };
      });

      // Step 3: Check if event for today already exists
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingEvent = await this.prisma.dailyEvent.findFirst({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          adminReviewed: false, // Only update pending events
        },
      });

      // Step 4: Calculate total odds
      const totalOdds = safePicks.combo_odds || matches.reduce((acc: number, match: any) => acc * (match.odds || 1), 1);

      // Step 5: Save or update DailyEvent
      const eventData = {
        date: today,
        sport: 'FOOTBALL',
        matches: matches,
        totalOdds: Number(totalOdds.toFixed(4)),
        status: 'PENDING' as const,
        aiPredictions: matches, // Store AI predictions
        adminReviewed: false, // Admin needs to review
        adminPredictions: null,
        adminComments: null,
      };

      let dailyEvent;
      if (existingEvent) {
        // Update existing event
        dailyEvent = await this.prisma.dailyEvent.update({
          where: { id: existingEvent.id },
          data: eventData,
        });
      } else {
        // Create new event
        dailyEvent = await this.prisma.dailyEvent.create({
          data: eventData,
        });
      }

      return {
        success: true,
        message: 'Daily AI picks generated and saved for admin review',
        data: {
          eventId: dailyEvent.id,
          matches: matches.length,
          totalOdds: totalOdds,
          confidence: safePicks.confidence,
          reason: safePicks.reason,
          picks: safePicks.picks,
        },
      };
    } catch (error: any) {
      console.error('Error generating daily picks:', error);
      throw new Error(`Failed to generate daily picks: ${error.message}`);
    }
  }

  /**
   * Generate human-readable analysis using Gemini (optional enhancement)
   */
  async analyzeMatches(matches: any[]) {
    if (!this.genAI) {
      return { analysis: 'Gemini AI not configured' };
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Analyze these football matches and provide safe betting recommendations:
    ${JSON.stringify(matches, null, 2)}
    
    Focus on:
    1. Ultra-safe markets (1.03-1.10 odds)
    2. Recent form analysis
    3. Head-to-head records
    4. Key player availability
    5. Home advantage factors
    
    Return JSON format with your analysis.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch (error) {
        return { analysis: text };
      }
    } catch (error: any) {
      console.error('Gemini AI error:', error);
      return { analysis: 'Analysis generation failed', error: error.message };
    }
  }
}
