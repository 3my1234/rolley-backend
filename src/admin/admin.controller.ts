import { Controller, Get, UseGuards, Request, Query, ForbiddenException, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllUsers(@Request() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    
    const users = await this.adminService.getAllUsers();
    return { users };
  }

  @Get('stakes')
  @ApiOperation({ summary: 'Get all stakes (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stakes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllStakes(@Request() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    
    const stakes = await this.adminService.getAllStakes();
    return { stakes };
  }

  @Get('daily-events')
  @ApiOperation({ summary: 'Get all daily events (Admin only)' })
  @ApiResponse({ status: 200, description: 'Daily events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllDailyEvents(@Request() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    
    const dailyEvents = await this.adminService.getAllDailyEvents();
    return { dailyEvents };
  }

  @Get('review-event')
  @ApiOperation({ summary: 'Get daily events pending admin review' })
  @ApiResponse({ status: 200, description: 'Review events retrieved successfully' })
  async getPendingReviewEvents(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return this.adminService.getReviewEventLists();
  }

  @Post('review-event')
  @ApiOperation({ summary: 'Review or approve a daily event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Daily event review saved successfully' })
  async reviewDailyEvent(@Request() req, @Body() body: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const event = await this.adminService.reviewDailyEvent(body || {});
    return { event };
  }

  @Get('top-stakers')
  @ApiOperation({ summary: 'Get top stakers ranked by stake count (Admin only)' })
  @ApiResponse({ status: 200, description: 'Top stakers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTopStakers(@Request() req, @Query('limit') limit?: string) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const parsedLimit = Number(limit);
    const take = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    const topStakers = await this.adminService.getTopStakers(take);
    return { topStakers };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboardStats(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return this.adminService.getDashboardStats();
  }
}
