import { Controller, Get, Post, Body, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private configService: ConfigService,
  ) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint to verify AI module is loaded' })
  async test() {
    return { message: 'AI module is working!', timestamp: new Date().toISOString() };
  }

  @Get('test-connection')
  @ApiOperation({ summary: 'Test connectivity to Football AI service' })
  async testConnection() {
    return this.aiService.testConnection();
  }

  @Get('safe-picks')
  @ApiOperation({ summary: 'Get today\'s safe picks from Football AI' })
  @ApiResponse({ status: 200, description: 'Safe picks retrieved successfully' })
  async getSafePicks() {
    return this.aiService.getSafePicks();
  }

  @Get('raw-predictions')
  @ApiOperation({ summary: 'Get raw ML predictions before filtering' })
  @ApiResponse({ status: 200, description: 'Raw predictions retrieved successfully' })
  async getRawPredictions() {
    return this.aiService.getRawPredictions();
  }

  @Get('matches/today')
  @ApiOperation({ summary: 'Get today\'s matches being considered' })
  @ApiResponse({ status: 200, description: 'Matches retrieved successfully' })
  async getTodayMatches() {
    return this.aiService.getTodayMatches();
  }

  @Post('generate-daily-picks')
  @ApiOperation({ summary: 'Generate daily AI picks and save for admin review. Can be called by admin (JWT) or n8n (API key + Football AI data).' })
  @ApiHeader({ name: 'X-API-Key', description: 'API key for n8n calls (optional if using JWT)', required: false })
  @ApiResponse({ status: 200, description: 'Daily picks generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateDailyPicks(
    @Request() req: any,
    @Headers('x-api-key') apiKey?: string,
    @Headers('authorization') authHeader?: string,
    @Body() body?: { footballAiData?: any }
  ) {
    // Check authentication: Either JWT (admin) or API key (n8n)
    let isAuthorized = false;
    
    // Try JWT auth first (for admin dashboard)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // This will be validated by the guard if present
        // For now, allow if user context exists
        if (req.user?.role === 'ADMIN') {
          isAuthorized = true;
        }
      } catch (e) {
        // JWT invalid, continue to API key check
      }
    }
    
    // Try API key auth (for n8n)
    if (!isAuthorized) {
      const expectedApiKey = this.configService.get<string>('n8n')?.webhookSecret || process.env.N8N_WEBHOOK_SECRET;
      if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
        isAuthorized = true;
      }
    }
    
    // If Football AI data is provided, allow without strict auth (n8n bridge mode)
    // This is a temporary workaround - in production, require API key
    if (!isAuthorized && body?.footballAiData) {
      console.log('⚠️ Allowing n8n call with Football AI data (no auth check)');
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      throw new UnauthorizedException('Valid JWT token (admin) or API key (n8n) required');
    }
    
    // If Football AI data is provided (e.g., from n8n), use it directly
    // Otherwise, try to fetch from Football AI service
    return this.aiService.generateDailyPicks(body?.footballAiData);
  }

  @Post('analyze-matches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze matches with Gemini AI (optional text generation)' })
  @ApiResponse({ status: 200, description: 'Matches analyzed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeMatches(@Request() req, @Body() body: { matches: any[] }) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    
    return this.aiService.analyzeMatches(body.matches);
  }
}
