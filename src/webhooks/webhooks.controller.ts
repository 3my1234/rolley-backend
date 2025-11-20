import { Controller, Post, Body, Headers, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('n8n')
  @ApiOperation({ summary: 'Handle n8n webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handleN8nWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader: string
  ) {
    // Verify webhook secret
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
    if (authHeader !== `Bearer ${expectedSecret}`) {
      throw new Error('Unauthorized');
    }

    return this.webhooksService.handleN8nWebhook(body);
  }

  @Post('flutterwave')
  @ApiOperation({ summary: 'Handle Flutterwave webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleFlutterwaveWebhook(@Body() body: any) {
    return this.webhooksService.handleFlutterwaveWebhook(body);
  }

  @Get('flutterwave/verify')
  @ApiOperation({ summary: 'Verify Flutterwave payment' })
  @ApiResponse({ status: 200, description: 'Payment verification completed' })
  async verifyFlutterwavePayment(
    @Query('transaction_id') transactionId: string,
    @Query('tx_ref') txRef: string,
    @Query('status') status: string
  ) {
    return this.webhooksService.verifyFlutterwavePayment(transactionId, txRef, status);
  }
}
