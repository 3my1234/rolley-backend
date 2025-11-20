import { Controller, Get, Post, Body, UseGuards, Request, Query, SetMetadata, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import { PrivyAuthGuard, IS_PUBLIC_KEY } from '../auth/guards/privy-auth.guard';
import { ConvertTokenDto } from './dto/convert-token.dto';
import { TradeRolDto } from './dto/trade-rol.dto';
import { PrismaService } from '../prisma/prisma.service';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Tokens')
@Controller('tokens')
@UseGuards(PrivyAuthGuard)
@ApiBearerAuth()
export class TokensController {
  constructor(
    private tokensService: TokensService,
    private prisma: PrismaService,
  ) {}

  private async getUserIdFromRequest(req: any): Promise<string> {
    const privyUserId = req.user?.userId || req.user?.user?.id || req.user?.sub;
    
    if (!privyUserId) {
      throw new UnauthorizedException('User ID not found in token');
    }

    // Get database user by Privy ID
    const user = await this.prisma.user.findUnique({
      where: { privyId: privyUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found in database');
    }

    return user.id;
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user token balance' })
  @ApiResponse({ status: 200, description: 'Token balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTokenBalance(@Request() req) {
    const userId = await this.getUserIdFromRequest(req);
    return this.tokensService.getTokenBalance(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user token history' })
  @ApiResponse({ status: 200, description: 'Token history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTokenHistory(
    @Request() req,
    @Query('type') type?: string
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.tokensService.getTokenHistory(userId, type);
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert ROL to USDT' })
  @ApiResponse({ status: 200, description: 'Token conversion successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async convertRolToUsdt(@Request() req, @Body() convertTokenDto: ConvertTokenDto) {
    const userId = await this.getUserIdFromRequest(req);
    return this.tokensService.convertRolToUsdt(userId, convertTokenDto);
  }

  @Post('trade')
  @ApiOperation({ summary: 'Buy or sell ROL tokens' })
  @ApiResponse({ status: 200, description: 'Trade successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async tradeRol(@Request() req, @Body() tradeDto: any) {
    console.log('🔍 Full request object:', {
      body: req.body,
      rawBody: req.rawBody,
      headers: req.headers,
      method: req.method,
    });
    console.log('🔍 @Body() decorator value:', tradeDto);
    console.log('🔍 Body type:', typeof tradeDto);
    console.log('🔍 Body keys:', Object.keys(tradeDto || {}));
    console.log('🔍 Body JSON:', JSON.stringify(tradeDto));
    
    // Use req.body directly if @Body() is empty
    const bodyData = (tradeDto && Object.keys(tradeDto).length > 0) ? tradeDto : req.body;
    console.log('🔍 Using bodyData:', bodyData);
    
    // Validate manually
    if (!bodyData || !bodyData.type || !bodyData.currency || !bodyData.amount) {
      throw new BadRequestException('Missing required fields: type, currency, amount');
    }
    
    if (bodyData.type !== 'BUY' && bodyData.type !== 'SELL') {
      throw new BadRequestException('Invalid trade type. Must be BUY or SELL');
    }
    
    if (bodyData.currency !== 'USD' && bodyData.currency !== 'USDT') {
      throw new BadRequestException('Invalid currency. Must be USD or USDT');
    }
    
    const userId = await this.getUserIdFromRequest(req);
    return this.tokensService.tradeRol(userId, bodyData);
  }

  @Get('rates')
  @Public()
  @ApiOperation({ summary: 'Get ROL trading rates' })
  @ApiResponse({ status: 200, description: 'Rates retrieved successfully' })
  async getRates() {
    return {
      buyRate: 100, // $100 USD = 1 ROL
      sellRate: 95, // 1 ROL = $95 USD
      buyRateDescription: '$100 USD = 1 ROL',
      sellRateDescription: '1 ROL = $95 USD (5% discount)',
    };
  }
}
