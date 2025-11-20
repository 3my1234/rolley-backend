import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrivyAuthGuard } from './guards/privy-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sync')
  @UseGuards(PrivyAuthGuard)
  @ApiOperation({ summary: 'Sync user from Privy to database' })
  @ApiResponse({ status: 200, description: 'User synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async syncUser(@Request() req, @Body() body: { referralCode?: string }) {
    const privyUserId =
      req.user?.userId ||
      req.user?.user?.id ||
      req.user?.sub ||
      req.user?.user?.privyId;

    if (!privyUserId) {
      throw new UnauthorizedException('Privy user id not found in token claims');
    }

    const user = await this.authService.syncUser(
      privyUserId,
      body.referralCode
    );
    
    return {
      user,
      synced: true,
    };
  }

  @Post('user')
  @UseGuards(PrivyAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req) {
    const privyUserId =
      req.user?.userId ||
      req.user?.user?.id ||
      req.user?.sub ||
      req.user?.user?.privyId;

    if (!privyUserId) {
      throw new UnauthorizedException('Privy user id not found in token claims');
    }

    const user = await this.authService.syncUser(privyUserId);
    return { user };
  }
}