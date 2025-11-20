import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { PrivyAuthGuard } from '../auth/guards/privy-auth.guard';
import { UsersService } from '../users/users.service';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(PrivyAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserTransactions(@Request() req) {
    const user = await this.usersService.findByPrivyId(req.user.userId);
    const transactions = await this.transactionsService.getUserTransactions(user.id);
    return { transactions };
  }
}
