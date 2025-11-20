import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze-matches')
  @ApiOperation({ summary: 'Analyze matches with AI' })
  @ApiResponse({ status: 200, description: 'Matches analyzed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeMatches(@Request() req, @Body() body: { matches: any[] }) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    
    return this.aiService.analyzeMatches(body.matches);
  }
}
