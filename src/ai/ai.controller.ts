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
  @UseGuards(JwtAuthGuard)  // Use same guard as other admin endpoints
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate daily AI picks and save for admin review. Can be called by admin (JWT) or n8n (API key + Football AI data).' })
  @ApiHeader({ name: 'X-API-Key', description: 'API key for n8n calls (optional if using JWT)', required: false })
  @ApiResponse({ status: 200, description: 'Daily picks generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateDailyPicks(
    @Request() req: any,
    @Headers('x-api-key') apiKey?: string,
    @Body() body?: { footballAiData?: any }
  ) {
    // Check if user is admin (JWT auth from guard)
    if (req.user?.role === 'ADMIN') {
      // Admin authenticated via JWT - proceed
      return this.aiService.generateDailyPicks(body?.footballAiData);
    }
    
    // Fallback: Try API key auth (for n8n)
    const expectedApiKey = process.env.N8N_WEBHOOK_SECRET;
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      return this.aiService.generateDailyPicks(body?.footballAiData);
    }
    
    // If Football AI data is provided, allow without strict auth (n8n bridge mode)
    // This is a temporary workaround - in production, require API key
    if (body?.footballAiData) {
      console.log('⚠️ Allowing n8n call with Football AI data (no auth check)');
      return this.aiService.generateDailyPicks(body?.footballAiData);
    }
    
    throw new UnauthorizedException('Admin access required (JWT token) or valid API key (n8n)');
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
