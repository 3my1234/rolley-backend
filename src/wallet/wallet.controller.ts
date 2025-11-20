import {
  Body,
  Controller,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { PrivyAuthGuard } from '../auth/guards/privy-auth.guard';
import { UsdtWebhookDto } from './dto/usdt-webhook.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deposit funds' })
  @ApiResponse({ status: 200, description: 'Deposit initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async depositFunds(@Request() req, @Body() depositData: any) {
    console.log('🔍 WalletController: Deposit request received');
    console.log('🔍 Raw request body:', req.body);
    console.log('🔍 Parsed depositData:', depositData);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Content-Type:', req.headers['content-type']);
    return this.walletService.depositFunds(req.user.userId, depositData);
  }

  @Post('withdraw')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw funds' })
  @ApiResponse({ status: 200, description: 'Withdrawal initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async withdrawFunds(@Request() req, @Body() withdrawData: any) {
    return this.walletService.withdrawFunds(req.user.userId, withdrawData);
  }

  @Post('verify-deposit')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify crypto deposit' })
  @ApiResponse({ status: 200, description: 'Deposit verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyCryptoDeposit(@Request() req, @Body() verifyData: any) {
    return this.walletService.verifyCryptoDeposit(req.user.userId, verifyData);
  }

  @Post('usdt/webhook')
  @ApiOperation({
    summary: 'USDT deposit webhook (Polygon)',
    description:
      'Endpoint for blockchain/webhook providers to confirm USDT deposits',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleUsdtWebhook(
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: UsdtWebhookDto,
  ) {
    await this.walletService.handleUsdtWebhook(secret, payload);
    return { status: 'ok' };
  }
}