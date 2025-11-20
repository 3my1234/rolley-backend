import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TokensModule } from '../tokens/tokens.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [TokensModule, BlockchainModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
