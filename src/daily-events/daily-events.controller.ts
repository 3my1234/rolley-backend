import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DailyEventsService } from './daily-events.service';
import { PrivyAuthGuard } from '../auth/guards/privy-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@ApiTags('Daily Events')
@Controller('daily-events')
@UseGuards(PrivyAuthGuard)
@ApiBearerAuth()
export class DailyEventsController {
  constructor(
    private dailyEventsService: DailyEventsService,
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current daily event' })
  @ApiResponse({ status: 200, description: 'Current event retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentEvent(@Request() req) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    const dailyEvent = await this.dailyEventsService.getCurrentEvent();
    
    // Get user's active stakes for this event
    const activeStakes = await this.prisma.stake.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        dailyParticipations: {
          where: {
            dailyEventId: dailyEvent?.id,
          },
        },
      },
    });

    return {
      dailyEvent,
      activeStakes,
    };
  }
}
