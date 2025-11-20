import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StakesService } from './stakes.service';
import { PrivyAuthGuard } from '../auth/guards/privy-auth.guard';
import { CreateStakeDto } from './dto/create-stake.dto';
import { ParticipateStakeDto } from './dto/participate-stake.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Stakes')
@Controller('stakes')
@UseGuards(PrivyAuthGuard)
@ApiBearerAuth()
export class StakesController {
  constructor(
    private stakesService: StakesService,
    private usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stake' })
  @ApiResponse({ status: 201, description: 'Stake created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createStakeDto: CreateStakeDto) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    return this.stakesService.create(user.id, createStakeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user stakes' })
  @ApiResponse({ status: 200, description: 'Stakes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    const stakes = await this.stakesService.findAll(user.id);
    return { stakes };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get user active stakes' })
  @ApiResponse({ status: 200, description: 'Active stakes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findActive(@Request() req) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    const stakes = await this.stakesService.findActive(user.id);
    return { stakes };
  }

  @Post('participate')
  @ApiOperation({ summary: 'Participate in daily event' })
  @ApiResponse({ status: 200, description: 'Participation recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async participate(@Request() req, @Body() participateStakeDto: ParticipateStakeDto) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    return this.stakesService.participate(user.id, participateStakeDto);
  }
}
