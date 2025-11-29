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
    
    // Use configured URL from config, but always use public HTTPS URL (Docker internal networking doesn't work)
    let configuredUrl = config?.footballAiUrl || 'https://f4c4o880s8go0co48kkwsw00.useguidr.com';
    
    // Force public HTTPS URL if internal hostname detected
    if (configuredUrl.includes(':8000') || configuredUrl.startsWith('http://f4c4o')) {
      console.log(`⚠️ Detected internal hostname in FOOTBALL_AI_URL, switching to public URL`);
      configuredUrl = 'https://f4c4o880s8go0co48kkwsw00.useguidr.com';
    }
    
    this.footballAiUrl = configuredUrl;
    console.log(`🔧 Football AI Service URL configured: ${this.footballAiUrl}`);
  }

  /**
   * Get today's safe picks from Football AI service
   */
  async getSafePicks(): Promise<any> {
    const url = `${this.footballAiUrl}/safe-picks/today`;
    console.log(`🌐 Fetching safe picks from: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout - increased to 60 seconds
        signal: AbortSignal.timeout(60000), // 60 seconds
      });

      console.log(`✅ Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error response: ${response.status} ${response.statusText}`);
        throw new Error(`Football AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched safe picks: ${data.games_used || 0} games`);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching safe picks from Football AI:', error);
      console.error(`   URL attempted: ${url}`);
      console.error(`   Error type: ${error.name || 'Unknown'}`);
      console.error(`   Error message: ${error.message || 'No message'}`);
      
      // Return a more informative error response instead of throwing
      // This allows the frontend to handle it gracefully
      return {
        error: true,
        message: 'Football AI service is currently unavailable',
        details: error.message || 'Connection timeout',
        errorType: error.name || 'Unknown',
        errorCode: error.cause?.code || error.code || 'UNKNOWN',
        footballAiUrl: this.footballAiUrl,
        attemptedUrl: url,
        suggestion: 'Check backend logs for detailed connection error. Verify Football AI service is accessible.',
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
   * @param footballAiData Optional pre-fetched Football AI data (from n8n)
   */
  async generateDailyPicks(footballAiData?: any): Promise<any> {
    try {
      // Step 1: Get safe picks from Football AI service
      // If data is provided (e.g., from n8n), use it directly to avoid network issues
      let safePicks;
      if (footballAiData && !footballAiData.error) {
        console.log('✅ Using pre-fetched Football AI data from n8n');
        safePicks = footballAiData;
      } else {
        console.log('🌐 Fetching Football AI data directly...');
        safePicks = await this.getSafePicks();
        
        // Check if we got an error response
        if (safePicks?.error) {
          return {
            success: false,
            message: safePicks.message || 'Football AI service unavailable',
            data: null,
            error: safePicks.details || safePicks.errorType,
          };
        }
      }
      
      if (!safePicks || !safePicks.picks || safePicks.picks.length === 0) {
        return {
          success: false,
          message: 'No safe picks found for today',
          data: null,
          reason: safePicks?.reason || 'No picks available',
        };
      }

      // Step 2: Format picks into DailyEvent matches format
      const matches = safePicks.picks.map((pick: any) => {
        // Parse match string (e.g., "Arsenal vs Sheffield United")
        const matchParts = pick.match?.split(' vs ') || [];
        const homeTeam = matchParts[0]?.trim() || pick.home_team || 'Unknown';
        const awayTeam = matchParts[1]?.trim() || pick.away_team || 'Unknown';

        // Extract match_data if available (contains enriched statistics)
        const matchData = pick.match_data || {};
        
        return {
          id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sport: 'football',
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          prediction: pick.market || pick.market_type || 'over_0.5_goals',
          odds: pick.odds || 1.05,
          autoSelected: true, // Mark as AI-generated
          predictedOdds: pick.odds || 1.05,
          confidence: pick.confidence || 0.95,
          worstCaseSafe: pick.worstCaseSafe || false,
          safety_score: pick.safety_score || 0,
          reasoning: pick.reasoning || pick.reason || 'High confidence pick with strong safety metrics.',
          // Store detailed statistics for potential future display or analysis
          // These fields are stored in the JSON and available for display/analysis
          stats: {
            home_xg: matchData.home_xg,
            away_xg: matchData.away_xg,
            home_form: matchData.home_form,
            away_form: matchData.away_form,
            h2h: matchData.h2h,
            stats_source: matchData._stats_source || 'default',
            enrichment_status: matchData._enrichment_status,
            league: matchData.league,
          },
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
          confidence: safePicks.confidence || 0,
          reason: safePicks.reason || 'AI picks generated successfully',
          picks: safePicks.picks || [],
        },
      };
    } catch (error: any) {
      console.error('❌ Error generating daily picks:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
      });
      // Return a proper error response instead of throwing
      return {
        success: false,
        message: `Failed to generate daily picks: ${error.message}`,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Test connectivity to Football AI service
   */
  async testConnection(): Promise<any> {
    const testUrls = [
      'https://f4c4o880s8go0co48kkwsw00.useguidr.com/health',
      'http://f4c4o880s8go0co48kkwsw00:8000/health',
      'http://f4c4o880s8go0co48kkwsw00/health',
    ];

    const results = [];
    
    for (const url of testUrls) {
      try {
        console.log(`🧪 Testing: ${url}`);
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            url,
            success: true,
            status: response.status,
            duration: `${duration}ms`,
            data,
          });
          console.log(`✅ ${url} - SUCCESS (${duration}ms)`);
        } else {
          results.push({
            url,
            success: false,
            status: response.status,
            duration: `${duration}ms`,
            error: `HTTP ${response.status}`,
          });
          console.log(`❌ ${url} - Failed: HTTP ${response.status}`);
        }
      } catch (error: any) {
        results.push({
          url,
          success: false,
          error: error.message || error.code || 'Unknown error',
          errorCode: error.code,
        });
        console.log(`❌ ${url} - Error: ${error.message || error.code}`);
      }
    }

    return {
      testedUrls: results,
      configuredUrl: this.footballAiUrl,
      recommendation: results.find(r => r.success)?.url || 'None of the URLs are accessible',
    };
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
