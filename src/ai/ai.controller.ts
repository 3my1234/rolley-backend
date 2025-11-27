import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate daily AI picks and save for admin review (Admin only)' })
  @ApiResponse({ status: 200, description: 'Daily picks generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateDailyPicks(@Request() req) {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    
    return this.aiService.generateDailyPicks();
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
