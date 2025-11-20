import { Controller, Get, Put, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PrivyAuthGuard } from '../auth/guards/privy-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req) {
    return this.usersService.findByPrivyId(req.user.userId);
  }

  @Put('me')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCurrentUser(@Request() req, @Body() updateData: any) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    return this.usersService.update(user.id, updateData);
  }

  @Get('referral')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user referral stats' })
  @ApiResponse({ status: 200, description: 'Referral stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReferralStats(@Request() req) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    return this.usersService.getReferralStats(user.id);
  }
}